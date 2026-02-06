import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from './useCopyToClipboard';

// Mock navigator.clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide copyToClipboard function', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(typeof result.current.copyToClipboard).toBe('function');
  });

  it('should provide isCopied state', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.isCopied).toBe(false);
  });

  it('should provide reset function', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(typeof result.current.reset).toBe('function');
  });

  it('should copy text to clipboard successfully', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const testText = 'Hello, World!';

    await act(async () => {
      await result.current.copyToClipboard(testText);
    });

    expect(mockWriteText).toHaveBeenCalledWith(testText);
  });

  it('should copy empty string', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard('');
    });

    expect(mockWriteText).toHaveBeenCalledWith('');
  });

  it('should copy multi-line text', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const multiLineText = 'Line 1\nLine 2\nLine 3';

    await act(async () => {
      await result.current.copyToClipboard(multiLineText);
    });

    expect(mockWriteText).toHaveBeenCalledWith(multiLineText);
  });

  it('should copy text with special characters', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const specialText = 'Text with émojis 🎉 and spécial chârs!';

    await act(async () => {
      await result.current.copyToClipboard(specialText);
    });

    expect(mockWriteText).toHaveBeenCalledWith(specialText);
  });

  it('should handle clipboard write failures gracefully', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const testText = 'Test text';

    mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));

    await act(async () => {
      // Should return false if clipboard fails
      await expect(result.current.copyToClipboard(testText)).resolves.toBe(
        false
      );
    });

    expect(mockWriteText).toHaveBeenCalledWith(testText);
    expect(result.current.isCopied).toBe(false);
  });

  it('should set isCopied to true after successful copy', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.isCopied).toBe(false);

    await act(async () => {
      await result.current.copyToClipboard('test');
    });

    expect(result.current.isCopied).toBe(true);
  });

  it('should reset isCopied state using reset function', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard('test');
    });

    expect(result.current.isCopied).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isCopied).toBe(false);
  });

  it('should auto-reset isCopied after resetInterval', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copyToClipboard('test');
    });

    expect(result.current.isCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isCopied).toBe(false);
  });

  it('should return true on successful copy', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    let copyResult: boolean | undefined;
    await act(async () => {
      copyResult = await result.current.copyToClipboard('test');
    });

    expect(copyResult).toBe(true);
  });

  it('should handle very long text', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const longText = 'a'.repeat(100000);

    await act(async () => {
      await result.current.copyToClipboard(longText);
    });

    expect(mockWriteText).toHaveBeenCalledWith(longText);
  });

  it('should handle null or undefined input gracefully', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard(null as unknown as string);
    });

    expect(mockWriteText).toHaveBeenCalledWith('');

    await act(async () => {
      await result.current.copyToClipboard(undefined as unknown as string);
    });

    expect(mockWriteText).toHaveBeenCalledWith('');
  });

  it('should handle non-string input by converting to string', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard(123 as unknown as string);
    });

    expect(mockWriteText).toHaveBeenCalledWith('123');

    await act(async () => {
      await result.current.copyToClipboard({ key: 'value' } as unknown as string);
    });

    expect(mockWriteText).toHaveBeenCalledWith('[object Object]');
  });

  it('should be stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useCopyToClipboard());

    const firstFunction = result.current.copyToClipboard;

    rerender();

    const secondFunction = result.current.copyToClipboard;

    expect(firstFunction).toBe(secondFunction);
  });

  it('should work with concurrent copy operations', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    const promises = [
      result.current.copyToClipboard('Text 1'),
      result.current.copyToClipboard('Text 2'),
      result.current.copyToClipboard('Text 3'),
    ];

    await act(async () => {
      await Promise.all(promises);
    });

    expect(mockWriteText).toHaveBeenCalledTimes(3);
    expect(mockWriteText).toHaveBeenNthCalledWith(1, 'Text 1');
    expect(mockWriteText).toHaveBeenNthCalledWith(2, 'Text 2');
    expect(mockWriteText).toHaveBeenNthCalledWith(3, 'Text 3');
  });
});
