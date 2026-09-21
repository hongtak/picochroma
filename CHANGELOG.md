# Changelog

## 1.1.2 — 2026-09-21

- Avoid splitting and joining styled text when it contains no full ANSI reset, while preserving nested style restoration.
- Add `npm run bench` with optional baseline comparisons for direct calls, reusable styles, RGB palettes, nested text, long text, and disabled output.

## 1.1.1 — 2026-09-18

- Skip 16-color palette searches when formatting RGB colors for TrueColor or 256-color output.
- Limit published files to the runtime, TypeScript declarations, changelog, README, license, and package metadata.
- Require complete decimal integer components and an optional leading-only `#` for hex colors. Malformed RGB and background RGB styles are ignored; signed integers and clamping remain supported.

## 1.1.0 — 2026-09-12

- Add `createColors({ level, stream })` for independent color configuration and stdout/stderr detection. Explicit levels override environment detection.
- Add `.style(format)` to default and configured functions for reusable formatters that parse styles once.
- Include TypeScript declarations and consumer type checks for NodeNext and bundler resolution.
- Detect color capabilities from `TERM`, including plain output for `TERM=dumb` in automatic mode.
- Choose the nearest fixed xterm cube or grayscale color for 256-color output, preserving exact black and white.
- Expand runtime coverage to 23 test groups and add CI across Linux, macOS, Windows, and Node 22/24/26.
- Preserve the existing default function signature and documented `FORCE_COLOR` values. No runtime dependencies added.

## 1.0.7 — 2026-09-12

- Ignore malformed RGB styles without throwing.
- Ignore inherited object property names in style lookups.
- Restore outer colors and effects after nested styled text ends.
- Apply named and RGB styles in input order so the last color wins.
- Recognize `FORCE_COLOR=true` as enabling TrueColor, as documented.
- Add regression tests for these fixes, available through `npm test`.
