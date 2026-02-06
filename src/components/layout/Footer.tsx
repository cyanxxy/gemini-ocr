import type React from 'react';
import { Github, Linkedin, Mail, Code2, ExternalLink } from 'lucide-react';
import { cn, theme, editorial } from '../../design/theme';

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand section */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-stone-900 dark:bg-stone-100 flex items-center justify-center shrink-0 shadow-sm">
              <Code2 className="w-3 h-3 text-stone-100 dark:text-stone-900" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold text-stone-900 dark:text-stone-100 tracking-tight"
                style={{ fontFamily: editorial.fonts.heading }}
              >
                Gemini <em className="font-normal">OCR</em>
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium border border-stone-200 dark:border-stone-700"
                style={{ fontFamily: editorial.fonts.body }}
              >
                Gemini 3
              </span>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <FooterLink
              href="https://github.com/cyanxxy"
              label="GitHub"
              icon={<Github className="w-3.5 h-3.5" />}
            />
            <FooterLink
              href="https://www.linkedin.com/in/mansour-damanpak/"
              label="LinkedIn"
              icon={<Linkedin className="w-3.5 h-3.5" />}
            />
            <FooterLink
              href="mailto:mansoor.damanpak@gmail.com"
              label="Email"
              icon={<Mail className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Copyright */}
          <div
            className="text-xs text-stone-400 dark:text-stone-500"
            style={{ fontFamily: editorial.fonts.body }}
          >
            <span>© {new Date().getFullYear()} All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function FooterLink({ href, label, icon }: FooterLinkProps) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "group flex items-center gap-1.5 text-xs font-medium rounded-md",
        "text-stone-500 dark:text-stone-400",
        "hover:text-stone-900 dark:hover:text-stone-100",
        "transition-colors duration-200",
        theme.focus.link
      )}
      style={{ fontFamily: editorial.fonts.body }}
      aria-label={isExternal ? `${label} (opens in new tab)` : label}
    >
      <span className="transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
      {isExternal && !href.startsWith('mailto:') && (
        <ExternalLink className="w-2.5 h-2.5 opacity-50 hidden sm:inline" aria-hidden="true" />
      )}
    </a>
  );
}
