# Changelog

## 1.0.7 — 2026-09-12

- Ignore malformed RGB styles without throwing.
- Ignore inherited object property names in style lookups.
- Restore outer colors and effects after nested styled text ends.
- Apply named and RGB styles in input order so the last color wins.
- Recognize `FORCE_COLOR=true` as enabling TrueColor, as documented.
- Add regression tests for these fixes, available through `npm test`.
