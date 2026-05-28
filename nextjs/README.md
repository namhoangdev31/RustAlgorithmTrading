# RustAlgorithmTrading Frontend

Next.js + shadcn/ui + TypeScript + Tailwind landing page for the
RustAlgorithmTrading project.

This implementation is adapted from the MIT-licensed reference template:
<https://github.com/nobruf/shadcn-landing-page>

## Sections

- Navbar with mobile sheet navigation
- Hero with a code-native trading dashboard preview
- Stack marquee
- Benefits
- Features
- Template sections
- Proof carousel
- Plans
- Contact form
- FAQ
- Footer

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Notes

- shadcn source components live in `components/ui`.
- Landing sections live in `components/layout/sections`.
- Theme tokens are configured in `tailwind.config.ts` and mapped to HSL values in `app/globals.css` based on `DESIGN.md`.

### Design Tokens (Warp Inspired)

- **Palette**:
  - `canvas` (`--background`): `#2b2622` (Warm near-charcoal canvas)
  - `canvas-soft` (`--card` / `--popover`): `#383330` (Lighter warm-dark card fill)
  - `hairline` (`--border` / `--input`): `#3f3a36` (Subtle warm 1px divider)
  - `ink` / `primary` (`--foreground` / `--primary`): `#f7f5f0` (Warm off-white)
  - `body-strong`: `#dad2c1` (Mid-emphasis body)
  - `body` (`--muted-foreground`): `#c9c0ad` (Secondary body / captions)
  - `mute` (`--muted-foreground` / `text-mute`): `#aea69c` (Lowest-priority timestamps/fine print)
- **Border Radius**:
  - `rounded-sm`: `3px` (Tight button radius)
  - `rounded-md`: `4px` (Base card radius)
  - Full scale: `none` (0px), `xxs` (1px), `xs` (2px), `sm` (3px), `md` (4px), `lg` (6px), `pill` (9999px), `full` (9999px)
- **Typography Families**:
  - `font-sans`: `Inter` (narrative, labels, buttons)
  - `font-mono`: `DM Mono` (code, terminal mockups)
  - `font-serif`: `Instrument Serif` (editorial italic moments)
- **Typography Sizes (Custom Utility Classes)**:
  - `text-display-xl` (64px, tracking `-1.6px`), `text-display-lg` (48px, tracking `-1.2px`), `text-display-md` (32px, tracking `-0.8px`)
  - `text-body-lg` (18px), `text-body-md` (16px), `text-body-sm` (14px)
  - `text-caption` (12px), `text-code` (13px), `text-code-md` (14px)
- **Spacing**:
  - Custom tokens: `xxs` (2px), `xs` (4px), `sm` (8px), `md` (10px), `lg` (16px), `xl` (24px), `2xl` (32px), `3xl` (48px), `4xl` (64px), `5xl` (96px)
