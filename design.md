# HealthNet AI — Design Engineering Reference

> A living document codifying the design language, interaction patterns, and motion principles for the HealthNet AI web application.

---

## 1. Design Tokens (CSS Custom Properties)

All tokens live in `src/index.css` under `:root`. Components must reference these tokens — never use hardcoded values.

### Motion & Easing
| Token | Value | Use Case |
|:------|:------|:---------|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy entrances, button press release |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Panel reveals, content slides |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Card entrances, data transitions |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Subtle hover background shifts |
| `--duration-fast` | `150ms` | Hovers, active states, color shifts |
| `--duration-normal` | `250ms` | Panel reveals, badge transitions |
| `--duration-slow` | `400ms` | Page transitions, orchestrated sequences |
| `--stagger` | `40ms` | Delay between staggered list items |

### Glassmorphism
| Token | Value |
|:------|:------|
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` |
| `--glass-border` | `rgba(255, 255, 255, 0.5)` |
| `--glass-shadow` | `0 8px 32px 0 rgba(31, 38, 135, 0.07)` |

### Layout
| Token | Value |
|:------|:------|
| `--card-max-height` | `520px` |
| `--card-max-height-mobile` | `85vh` |

---

## 2. Motion Principles

### Entry Animations
- **Cards / Panels**: `opacity: 0 → 1`, `y: 16px → 0`, eased with `--ease-out-quart`, duration `400ms`.
- **List Items**: Stagger by `--stagger` (40ms). Use `i * 0.04` in Framer Motion.
- **Modals / Overlays**: `scale: 0.96 → 1` + `opacity: 0 → 1`, spring physics (stiffness: 400, damping: 30).

### Exit Animations
- **Rule**: Exit duration = 60–75% of entry duration.
- **Cards**: `opacity → 0`, `scale → 0.96`, duration `200ms`.
- **Messages**: `opacity → 0`, no positional shift.

### Interactive Feedback
| Interaction | Response |
|:------------|:---------|
| **Hover** | Slight `translateY(-2px)`, shadow elevation, `150ms ease-out` |
| **Active / Press** | `scale(0.97)`, darken/deepen shadow, `100ms` |
| **Focus** | `ring-4 ring-primary/10`, visible outline offset |
| **Disabled** | `opacity: 0.5`, `cursor: not-allowed`, no hover effects |

### Haptics (via `web-haptics`)
| Action | Preset |
|:-------|:-------|
| Button tap, toggle | `"nudge"` |
| Form success, confirmation | `"success"` |
| Validation error | `"error"` |
| Long-press, destructive | `"buzz"` |

---

## 3. Component Patterns

### Chat Messages
- Spring entry: `stiffness: 400, damping: 30`, stagger `50ms`.
- User bubbles: dark (`bg-slate-900`), right-aligned, `rounded-tr-none`.
- AI bubbles: light glass (`bg-white`), left-aligned, `rounded-tl-none`.
- Reasoning button: appears on hover with `opacity 0 → 1`, `scale 0.9 → 1.1`.

### Cards (`.card-premium`)
- Hover: `translateY(-4px)`, elevated shadow.
- Active: `scale(0.98)`, `150ms`.
- Glass background with `backdrop-blur-xl`.
- Max height constrained by `--card-max-height`.

### Loading States
- **Chat**: Three pulsing dots with staggered shimmer animation.
- **Imaging**: Spinner with `border-t-primary animate-spin`.
- **Dashboard**: Skeleton placeholders matching content shape (pulse animation).
- **Never** use a full-page spinner.

### Buttons
- Primary: `bg-slate-900`, `rounded-2xl`, `active:scale-95`.
- Ghost: `bg-transparent`, hover `bg-white/50`, `rounded-full`.
- All buttons: `font-black uppercase tracking-widest text-[10px]`.

---

## 4. Accessibility

- **Reduced Motion**: All animations wrapped in `prefers-reduced-motion` checks. Framer Motion's `useReducedMotion()` is used in every component.
- **Touch Targets**: Minimum `44×44px` interactive areas.
- **Focus Management**: Visible focus rings on all interactive elements.
- **ARIA**: `role="log"` on chat, `aria-live="polite"` on dynamic regions, `aria-label` on all inputs.
- **Color**: Never rely on color alone to convey meaning; always pair with text or icon.

---

## 5. Color System

Defined in `src/theme.css` using HSL values from Material Design 3 token export.

- **Primary**: `hsl(180, 100%, 25%)` — Teal
- **Secondary**: `hsl(141, 13%, 35%)` — Sage green
- **Tertiary**: `hsl(39, 100%, 25%)` — Amber
- **Error**: `hsl(359, 87%, 50%)` — Red
- **Surface hierarchy**: 5-level surface container system (lowest → highest)

Dark mode is supported via both `prefers-color-scheme` media query and `.dark` class toggle.

---

## 6. Typography

- **Font**: Geist Variable (sans-serif)
- **Headings**: `font-black tracking-tight`, balanced text wrap
- **Body**: `leading-relaxed`, pretty text wrap
- **Labels**: `text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]`
- **Data**: `tabular-nums` for numeric displays

---

## 7. File Reference

| File | Purpose |
|:-----|:--------|
| `src/index.css` | Global tokens, base styles, utility components |
| `src/theme.css` | Color palette and theme role definitions |
| `src/components/chat/ChatInterface.tsx` | Chat with medical engine + feedback loop |
| `src/components/dashboard/PatientDashboard.tsx` | Vitals, conditions, medications |
| `src/components/herbal/HerbalGuide.tsx` | Herbal remedy catalog with filters |
| `src/components/imaging/ImagingAnalysis.tsx` | Medical image upload and analysis |
