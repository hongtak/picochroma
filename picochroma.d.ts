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
