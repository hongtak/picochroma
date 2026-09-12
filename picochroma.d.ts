/**
 * Style terminal text using space- or comma-separated modifiers.
 *
 * @param text Text to style.
 * @param format Named colors, backgrounds, effects, or rgb()/bgrgb() colors.
 * Styles apply left to right; the last conflicting color wins.
 * @returns Styled text, or the original text when styling is disabled or unrecognized.
 * @example
 * c('Success', 'green bold')
 * c('Custom color', 'rgb(#ff8800) bg-black')
 */
export default function c(text: string, format?: string): string;

/** Automatic detection, disabled styling, or an explicit palette. */
export type ColorLevel = 'auto' | 0 | 16 | 256 | 'truecolor';

export interface ColorOptions {
  /** Explicit levels override environment variables and TTY detection. Default: 'auto'. */
  level?: ColorLevel;
  /** Output stream used for automatic detection. Default: 'stdout'. Does not write output. */
  stream?: 'stdout' | 'stderr';
}

/**
 * Create an independent styling function with the same signature as the default export.
 * Automatic detection is captured when this function is called.
 * @example
 * const errorColor = createColors({ stream: 'stderr' });
 * const plain = createColors({ level: 0 });
 */
export function createColors(options?: ColorOptions): typeof c;
