# QuantTrain — Design System

## Philosophy

**"Bloomberg Terminal meets Duolingo structure, refined by Impeccable's Neo Kinpaku"**

A premium, dark, quantitative research house aesthetic. The site should feel like a trading floor terminal meets a crafted object — professional, data-driven, restrained, with deliberate gold accents.

## Color Palette

All colors use OKLCH for perceptual consistency. No hex except for third-party fallbacks.

### Surfaces

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `oklch(7% 0.006 95)` | Page background (lacquer black) |
| `--bg-panel` | `oklch(11% 0.006 95)` | Cards, panels, raised UI (raised lacquer) |
| `--bg-deep` | `oklch(4% 0.004 95)` | Deepest inset, footer, code blocks |
| `--bg-hover` | `oklch(15% 0.008 95)` | Hover state on panels |
| `--bg-input` | `oklch(15% 0.008 95)` | Input fields |

### Gold Family (Primary Accent)

| Token | Value | Usage |
|---|---|---|
| `--gold` | `oklch(84% 0.19 80.46)` | Primary accent, CTAs, active nodes, brand |
| `--gold-rich` | `oklch(77% 0.13 82)` | Active CTA fill, hover on gold elements |
| `--gold-deep` | `oklch(61% 0.085 78)` | Subdued gold, borders on dark, secondary icons |
| `--gold-pale` | `oklch(86% 0.07 84)` | Hover lift on gold elements, pale fills |

### Patina Family (Secondary Accent)

| Token | Value | Usage |
|---|---|---|
| `--patina` | `oklch(70% 0.12 188)` | Secondary accent, in-progress state, correct answers |
| `--patina-deep` | `oklch(49% 0.08 188)` | Deep oxide, dark variants, borders |
| `--patina-pale` | `oklch(82% 0.07 188)` | Hover on patina elements |

### Text

| Token | Value | Usage |
|---|---|---|
| `--text-heading` | `oklch(91% 0 0)` | Headlines, important labels (champagne) |
| `--text-body` | `oklch(88% 0 0)` | Body copy, paragraphs |
| `--text-muted` | `oklch(72% 0 0)` | Secondary labels, metadata, captions |
| `--text-faint` | `oklch(62% 0 0)` | Subdued, placeholder text |
| `--text-disabled` | `oklch(52% 0 0)` | Disabled state |

### Borders & Dividers

| Token | Value | Usage |
|---|---|---|
| `--hairline` | `oklch(78% 0 0 / 0.16)` | Default border, neutral rule |
| `--hairline-gold` | `oklch(74% 0.09 82 / 0.6)` | Active border, focus outline, structural anchors |

### State Colors

| Token | Value | Usage |
|---|---|---|
| `--error` | `oklch(58% 0.15 35)` | Wrong answer, destructive actions (vermilion) |
| `--success` | `oklch(45% 0.18 145)` | Success messages, positive signals |

## Typography

### Font Stack

| Role | Stack | Usage |
|---|---|---|
| Display | `'Alumni Sans', system-ui, sans-serif` | h1, h2 headings — thin, elegant |
| Body | `'Albert Sans', 'Avenir Next', system-ui, sans-serif` | Body text, UI labels, navigation |
| Mono | `'SFMono-Regular', 'Roboto Mono', 'Consolas', monospace` | Code blocks, metrics, eyebrow labels |

### Type Scale

| Element | Family | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| Brand wordmark | Display | `1.3rem` | 400 | 1 | `0.15em` uppercase |
| h1 (display) | Display | `clamp(2.4rem, 5vw, 4rem)` | 100 | 1.02 | `-0.01em` |
| h2 (headline) | Display | `clamp(1.8rem, 3.5vw, 2.8rem)` | 300 | 1.04 | 0 |
| h3 (title) | Body | `1.18rem` | 500 | 1.35 | 0 |
| Body | Body | `1rem` | 400 | 1.65–1.8 | 0 |
| Small / caption | Body | `0.85rem` | 400 | 1.4 | 0 |
| Eyebrow | Mono | `0.7rem` | 500 | 1 | `0.18em` uppercase |
| Code | Mono | `0.82rem` | 400 | 1.6 | `0` |

### Typography Rules

- **Weight inversion**: h1 uses weight 100 (thin), h2 uses weight 300 (slightly heavier). Do not normalize.
- **Two-face rule**: Display sizes use Alumni Sans. Anything below `1.2rem` uses Albert Sans.
- **Dark type needs air**: Body text uses `line-height: 1.65` minimum, max width 65-75ch.
- **Tracked labels are short**: Uppercase tracked mono labels are for short markers only. No full sentences in tracked caps.

## Spacing

| Token | Value |
|---|---|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |
| `--space-3xl` | `64px` |
| `--space-4xl` | `96px` |

## Border Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | `2px` | Buttons |
| `--radius-sm` | `4px` | Panels, cards |
| `--radius-md` | `6px` | Larger containers |
| `--radius-lg` | `8px` | Modals, dropdowns |
| `--radius-pill` | `999px` | Badges, tags |

## Component Styles

### Buttons

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `--gold` | `--bg-deep` | 1px `--gold` | `--gold-pale` |
| Secondary | transparent | `--gold` | 1px `--hairline-gold` | `--bg-hover` |
| Ghost | transparent | `--text-muted` | none | `--text-heading` |
| Disabled | `--bg-hover` | `--text-disabled` | `--hairline` | none |

Height: `48px`. Padding: `0 32px`. Radius: `--radius-xs`.

### Cards / Panels

- Background: `--bg-panel`
- Border: 1px `--hairline`
- Radius: `--radius-sm`
- Padding: `--space-lg`
- No box-shadow

### Code Blocks

- Background: `--bg-deep`
- Left border: 2px solid `--gold`
- Font: Mono at `0.82rem`
- Padding: `--space-lg`
- Radius: `--radius-sm`
- Line numbers: `--text-faint` on the left gutter

### Form Inputs

- Background: `--bg-input`
- Border: 1px `--hairline`
- Focus: 1px `--hairline-gold`
- Text: `--text-body`
- Placeholder: `--text-faint`
- Radius: `--radius-sm`
- Padding: `12px 16px`

### Progress Bars

- Track: `--bg-hover`
- Fill (global): `--gold`
- Fill (per-world): `--patina`
- Height: `6px`
- Radius: `999px`

### Skill Tree Nodes

| State | Fill | Border | Extra |
|---|---|---|---|
| Completed | `--gold` | none | White checkmark SVG overlay |
| In progress | `--patina-pale` | 2px `--patina` | Subtle CSS pulse animation |
| Not started | transparent | 2px `--text-faint` | dimmed |
| Hover (any) | — | — | `translateY(-2px)` lift |

### Quiz Options

- Default: dark panel, `--text-body`, `--hairline` border
- Selected: `--hairline-gold` border
- Correct: `--patina` border + `--patina-pale` background
- Wrong: `--error` border + light error background

## Animations

| Use | Duration | Easing | Effect |
|---|---|---|---|
| Node completion | 400ms | ease-out | Gold fill sweep |
| In-progress pulse | 2s infinite | ease-in-out | Subtle patina opacity pulse |
| Hover lift | 200ms | ease-out | `translateY(-2px)` |
| Page transition | 300ms | ease-out | Fade in |
| XP counter | 600ms | ease-out | Count-up with step increments |

**No bounce, no elastic, no spring easing.** The site is professional, not playful.

## Iconography

- All icons as inline SVGs or SVG files in `assets/icons/`
- Default icon color: `--text-muted`
- Active icon color: `--gold`
- Use clean, minimal stroke-based icons (feather-style)
- No filled/duotone icons unless specified

## Dark Mode

The site is **dark-first** by default. No light mode toggle needed unless explicitly requested. The design system assumes a dark background at all times.

## Anti-Patterns (DO NOT USE)

- ❌ Inter font (most overused AI-generated font)
- ❌ Purple gradients or neon cyan
- ❌ Glassmorphism (`backdrop-filter: blur`, translucent panels)
- ❌ Cards nested inside cards
- ❌ Bounce, elastic, or spring animations (`cubic-bezier` with overshoot)
- ❌ Pure black (`#000`) or pure white (`#fff`)
- ❌ Default box-shadow on cards
- ❌ Rounded-square icon tile above every heading (AI tell)
- ❌ Gray text on colored backgrounds
- ❌ 3D charts, excessive gradients, or decorative flourishes
