import { getModelClient, applyThinkingConfig, isGemini3Model } from './client';
import { logger } from '../logger';
import type { UrlResult } from '../../store/useWebOcrStore';
import type { GeminiModel, ThinkingConfig } from './types';

/**
 * Simple URL extraction without the URL context tool
 * This version just includes URLs in the prompt and asks Gemini to analyze them
 *
 * @param urls - Array of URLs to analyze
 * @param apiKey - The Gemini API key
 * @param analysisMode - How to analyze the URLs
 * @param model - The Gemini model to use
 * @param thinkingConfig - Optional thinking configuration
 * @internal Used only as fallback by extractTextFromUrlsProgressive
 */
async function extractTextFromUrlsSimple(
  urls: string[],
  apiKey: string,
  analysisMode: 'individual' | 'combined' | 'comparison',
  model: GeminiModel,
  thinkingConfig?: ThinkingConfig,
  abortSignal?: AbortSignal
): Promise<{
  results?: UrlResult[];
  combinedContent?: string;
  comparisonAnalysis?: string;
}> {
  try {
    const modelClient = getModelClient(apiKey, model);
    
    logger.info(`Processing ${urls.length} URLs with simple mode: ${analysisMode}`);
    
    // Build a simpler prompt without expecting actual URL fetching
    let prompt = '';
    
    if (analysisMode === 'individual') {
      prompt = `I have the following URLs that need to be analyzed. Please provide guidance on what these URLs likely contain based on their structure:

${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

For each URL, analyze:
1. The domain and path structure
2. What type of content it likely contains
3. Common text patterns for this type of content

Note: Direct URL content extraction requires manual fetching or using the URL context feature with compatible models.`;
    } else if (analysisMode === 'combined') {
      prompt = `These URLs need their content combined:

${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Please provide guidance on:
1. What these URLs likely contain based on their structure
2. How to effectively combine content from these sources
3. Best practices for merging web content`;
    } else if (analysisMode === 'comparison') {
      prompt = `Compare these URLs:

${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Provide analysis on:
1. Similarities in URL structure and likely content
2. Potential differences based on domains
3. How to compare content from these sources`;
    }
    
    // Configure generation parameters with model-specific defaults (Gemini 3 defaults to temperature 1.0)
    let generationConfig: Record<string, unknown> = {
      temperature: isGemini3Model(model) ? 1.0 : 0.3,
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 40
    };

    // Apply thinking config based on model type
    generationConfig = applyThinkingConfig(generationConfig, model, thinkingConfig);
    
    // Safety settings to disable all content filtering
    const safetySettings = [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ];
    
    // Simple API call without URL context tool
  const result = await modelClient.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig,
    safetySettings,
    config: abortSignal ? { abortSignal } : undefined
  });
    
    const responseText = result.response.text();
    
    // Return formatted results
    if (analysisMode === 'individual') {
      const results: UrlResult[] = urls.map(url => ({
        url,
        type: 'unknown' as const,
        content: responseText,
        title: 'URL Analysis'
      }));
      return { results };
    } else if (analysisMode === 'combined') {
      return { combinedContent: responseText };
    } else {
      return { 
        comparisonAnalysis: responseText,
        results: urls.map(url => ({
          url,
          type: 'unknown' as const,
          content: 'See comparison analysis'
        }))
      };
    }
  } catch (error) {
    logger.error('Simple URL extraction failed:', error);
    throw error;
  }
}

/**
 * Try URL extraction with progressive fallback
 * 
 * @param urls - Array of URLs to extract from
 * @param apiKey - The Gemini API key
 * @param analysisMode - How to analyze the URLs
 * @param model - The Gemini model to use
 * @param thinkingConfig - Optional thinking configuration
 */
export async function extractTextFromUrlsProgressive(
  urls: string[],
  apiKey: string,
  analysisMode: 'individual' | 'combined' | 'comparison',
  model: GeminiModel,
  thinkingConfig?: ThinkingConfig,
  abortSignal?: AbortSignal
): Promise<{
  results?: UrlResult[];
  combinedContent?: string;
  comparisonAnalysis?: string;
}> {
  // First, try with URL context tool (the proper way)
  try {
    logger.info('Attempting URL extraction with URL context tool');
    const { extractTextFromUrls } = await import('./operations');
    return await extractTextFromUrls(urls, apiKey, analysisMode, model, thinkingConfig, abortSignal);
  } catch (error) {
    logger.warn('URL context tool failed, trying direct prompt approach', error);
    
    // Second attempt: Try asking Gemini to extract content directly
    try {
      logger.info('Attempting direct URL content extraction via prompt');
      return await extractTextFromUrlsDirect(urls, apiKey, analysisMode, model, thinkingConfig, abortSignal);
    } catch (error2) {
      logger.warn('Direct extraction failed, falling back to simple analysis', error2);
      
      // Final fallback: Simple URL analysis
      try {
        return await extractTextFromUrlsSimple(urls, apiKey, analysisMode, model, thinkingConfig, abortSignal);
      } catch (error3) {
        logger.error('All extraction methods failed:', error3);
        
        // Return a helpful error message
        const errorMessage = `Unable to extract content from URLs. 

This feature requires:
• A model that supports URL context (Gemini 3.1 Pro / Gemini 3 Flash or Gemini 2.5 Pro/Flash/Flash-Lite)
• API key with URL context permissions
• Valid, publicly accessible URLs

Note: This app currently exposes Gemini 3.1 Pro and Gemini 3 Flash preview models.
The URL context feature may not be available in your region or with your current API key.`;
        
        if (analysisMode === 'individual') {
          return {
            results: urls.map(url => ({
              url,
              type: 'unknown' as const,
              content: '',
              error: errorMessage
            }))
          };
        } else {
          return {
            combinedContent: errorMessage
          };
        }
      }
    }
  }
}

/**
 * Direct URL content extraction - asks Gemini to fetch and extract content
 * 
 * @param urls - Array of URLs to extract from
 * @param apiKey - The Gemini API key
 * @param analysisMode - How to analyze the URLs
 * @param model - The Gemini model to use
 * @param thinkingConfig - Optional thinking configuration
 */
async function extractTextFromUrlsDirect(
  urls: string[],
  apiKey: string,
  analysisMode: 'individual' | 'combined' | 'comparison',
  model: GeminiModel,
  thinkingConfig?: ThinkingConfig,
  abortSignal?: AbortSignal
): Promise<{
  results?: UrlResult[];
  combinedContent?: string;
  comparisonAnalysis?: string;
}> {
  const modelClient = getModelClient(apiKey, model);
  
  logger.info(`Direct extraction of ${urls.length} URLs in ${analysisMode} mode`);
  
  // Build a direct extraction prompt
  let prompt = '';
  
  if (analysisMode === 'individual') {
    prompt = `Please extract and analyze the text content from each of these URLs:

${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

For each URL:
1. Extract ALL the text content from the page
2. Identify the type of content (webpage, PDF, image with text)
3. Provide the main title or heading
4. Extract the complete text content

Format your response as JSON:
{
  "results": [
    {
      "url": "the complete URL",
      "type": "webpage|image|pdf",
      "title": "the page title",
      "content": "the complete extracted text content from the page"
    }
  ]
}

IMPORTANT: Extract the ACTUAL CONTENT from each URL, not just an analysis.`;
  } else if (analysisMode === 'combined') {
    prompt = `Extract and combine ALL text content from these URLs into a single document:

${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Instructions:
1. Extract the complete text from each URL
2. Combine all content intelligently
3. Remove duplicates but preserve unique information
4. Organize the content logically
5. Include source attribution

Provide the combined content as a comprehensive markdown document with the actual extracted text.`;
  } else if (analysisMode === 'comparison') {
    prompt = `Extract and compare the content from these URLs:

${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Instructions:
1. Extract the complete text from each URL
2. Provide a summary of each document's actual content
3. Identify similarities in the extracted content
4. Highlight differences between the documents
5. Note common themes and unique insights

Provide a detailed comparison based on the ACTUAL EXTRACTED CONTENT from each URL.`;
  }
  
  // Configure generation parameters with model-specific defaults (Gemini 3 defaults to temperature 1.0)
  let generationConfig: Record<string, unknown> = {
    temperature: isGemini3Model(model) ? 1.0 : 0.1,
    maxOutputTokens: 8192,
    topP: 0.95,
    topK: 40
  };

  // Apply thinking config based on model type
  generationConfig = applyThinkingConfig(generationConfig, model, thinkingConfig);
  
  // Safety settings to disable all content filtering
  const safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
  ];
  
  // Try direct extraction
  const result = await modelClient.generateContent({
    contents: [prompt],
    generationConfig,
    safetySettings,
    config: abortSignal ? { abortSignal } : undefined
  });
  
  const responseText = result.response.text();
  
  // Parse response based on mode
  if (analysisMode === 'individual') {
    try {
      // Try to parse as JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.results && Array.isArray(parsed.results)) {
          return { results: parsed.results };
        }
      }
    } catch {
      logger.warn('Failed to parse JSON response');
    }
    
    // Fallback: treat as single result
    const results: UrlResult[] = urls.map((url, i) => {
      // Try to extract content for each URL from the response
      const urlPattern = new RegExp(`${i + 1}\\.\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\d+\\.|$)`, 'i');
      const match = responseText.match(urlPattern);
      
      return {
        url,
        type: 'webpage' as const,
        content: match ? match[0] : responseText,
        title: `Content from ${new URL(url).hostname}`
      };
    });
    
    return { results };
  } else if (analysisMode === 'combined') {
    return { combinedContent: responseText };
  } else {
    return { 
      comparisonAnalysis: responseText,
      results: urls.map(url => ({
        url,
        type: 'webpage' as const,
        content: 'See comparison analysis'
      }))
    };
  }
}
