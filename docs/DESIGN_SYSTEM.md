# EpiSafe AI - UI/UX Design System

## Design Philosophy

EpiSafe AI employs a **human-centered, healthcare-focused design** that emphasizes:

1. **Clarity:** Medical information presented without jargon
2. **Trust:** Professional aesthetics with attention to detail
3. **Accessibility:** High contrast, readable typography, semantic HTML
4. **Inclusivity:** Dark/light theme support for different visual preferences
5. **Responsiveness:** Works seamlessly on mobile, tablet, and desktop

## Color Palette

### Light Theme (Default)

| Color | Usage | Hex | RGB |
|-------|-------|-----|-----|
| **Primary Surface** | Background, cards | `#f7f9fc` | 247, 249, 252 |
| **Secondary Surface** | Sidebar, panels | `#fff` | 255, 255, 255 |
| **Ink (Primary Text)** | Headings, main text | `#252b39` | 37, 43, 57 |
| **Muted (Secondary Text)** | Captions, help text | `#8c92a1` | 140, 146, 161 |
| **Borders** | Lines, dividers | `#ecedf3` | 236, 237, 243 |
| **Lavender (Brand)** | Buttons, highlights | `#7659db` | 118, 89, 219 |
| **Purple** | Accent variations | `#7358d2` | 115, 88, 210 |
| **Mint (Success)** | Green indicators | `#2e9b80` | 46, 155, 128 |
| **Red (Alert)** | Seizure events, danger | `#d76668` | 215, 102, 104 |
| **Amber (Warning)** | Caution indicators | `#ad781d` | 173, 120, 29 |

### Dark Theme

| Color | Usage | Hex | RGB |
|-------|-------|-----|-----|
| **Primary Surface** | Background | `#0f0f14` | 15, 15, 20 |
| **Secondary Surface** | Cards, panels | `#1a1a25` | 26, 26, 37 |
| **Ink (Primary Text)** | Main text | `#e0e0e0` | 224, 224, 224 |
| **Muted (Secondary Text)** | Captions | `#888888` | 136, 136, 136 |
| **Borders** | Lines | `#333333` | 51, 51, 51 |
| **Lavender (Brand)** | Buttons (adjusted) | `#9d7ce6` | 157, 124, 230 |
| **Mint (Success)** | Green (adjusted) | `#3db89b` | 61, 184, 155 |

### Implementation

```css
:root {
  /* Light theme (default) */
  --ink: #252b39;
  --muted: #8c92a1;
  --line: #ecedf3;
  --lavender: #7659db;
  --purple: #7358d2;
  --mint: #2e9b80;
  --red: #d76668;
  --amber: #ad781d;
  --surface: #fff;
  --shadow: 0 11px 35px rgba(37, 43, 57, .045);
}

:root[data-theme="dark"] {
  /* Dark theme */
  --ink: #e0e0e0;
  --muted: #888888;
  --line: #333333;
  --lavender: #9d7ce6;
  --purple: #a587f0;
  --mint: #3db89b;
  --red: #ff6b6b;
  --amber: #f9b233;
  --surface: #1a1a25;
  --shadow: 0 11px 35px rgba(0, 0, 0, .4);
}

body {
  color: var(--ink);
  background: var(--surface);
}

button, .card {
  box-shadow: var(--shadow);
}
```

## Typography

### Font Families

```css
/* Headlines & branding */
font-family: "Manrope", sans-serif;
font-weight: 700;
letter-spacing: -0.7px;

/* Body text & UI */
font-family: "DM Sans", sans-serif;
font-weight: 400;
font-size: 10px - 16px;
```

### Type Scale

| Level | Size | Weight | Use | Example |
|-------|------|--------|-----|---------|
| **Headline 1** | 31px | 700 | Page titles | "Check in with yourself" |
| **Headline 2** | 18px | 700 | Section titles | "Recent events" |
| **Subtitle** | 14px | 600 | Descriptive text | "Your wellbeing is a journey..." |
| **Body** | 12px | 400 | Main content | Daily log entries, descriptions |
| **Caption** | 9px | 600 | Labels, metadata | "YESTERDAY AT 10:34 AM" |
| **Eyebrow** | 8px | 700 | Section labels | "YOUR CARE JOURNAL" |

### Line Heights

- Headlines: 1.2 (tighter)
- Body: 1.55 (relaxed)
- Captions: 1.6 (spacious)

## Component Styles

### Buttons

#### Primary Button
- **Background:** Lavender gradient
- **Text:** White, bold
- **Size:** 37-44px height
- **Padding:** 0 15px
- **Border Radius:** 8px
- **Shadow:** `0 4px 10px rgba(106, 84, 195, .14)`
- **Hover:** Slightly darker, lift up (translateY)
- **Disabled:** Reduced opacity, wait cursor

```css
.primary-button {
  display: inline-flex;
  min-height: 37px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 15px;
  color: #fff;
  border: 0;
  border-radius: 8px;
  background: #725ccf;
  box-shadow: 0 4px 10px rgba(106, 84, 195, .14);
  cursor: pointer;
  font-size: 9px;
  font-weight: 700;
  transition: background .17s, transform .17s;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #604bbd;
}
```

#### Google OAuth Button
- **Background:** White (light), card background (dark)
- **Border:** 1px solid light gray
- **Icon:** Blue "G" (Google brand)
- **Size:** Full width, 39px height
- **Hover:** Slightly darker border, subtle background change

```css
.google-auth-button {
  display: flex;
  width: 100%;
  min-height: 39px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--paper);
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  transition: background .18s, border-color .18s;
}

.google-auth-button:hover {
  border-color: var(--brand);
  background: var(--paper-soft);
}

.google-mark {
  color: #4285f4;
  font-weight: 800;
}
```

#### Secondary Button (Links)
- **Background:** Transparent
- **Text:** Brand color
- **Underline:** On hover
- **Example:** "View history", "Sign out"

### Cards & Panels

All cards follow a consistent pattern:

```css
.panel {
  padding: 22px 18px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.panel-heading h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 9px 0 5px;
  color: var(--ink);
}
```

### Input Fields

```css
.field-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.field-label input,
.field-label textarea {
  padding: 9px 12px;
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  font-size: 11px;
  transition: border-color .18s, box-shadow .18s;
}

.field-label input:focus,
.field-label textarea:focus {
  outline: 3px solid rgba(118, 89, 219, .3);
  outline-offset: 2px;
  border-color: var(--lavender);
}
```

### Icons

- **Source:** Lucide Icons (19-24px)
- **Color:** Inherit from text color
- **Accessibility:** All icons paired with text labels or aria-labels

## Layout

### Responsive Breakpoints

```css
/* Mobile (default) */
/* min-width: 360px */

/* Tablet */
@media (min-width: 768px) {
  /* Adjust spacing, font sizes */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Sidebar visible, wider panels */
}
```

### Sidebar Navigation

- **Width:** 252px (fixed, left side)
- **Padding:** 30px 19px
- **Background:** White (light), dark card (dark)
- **Fixed Position:** `position: fixed; inset: 0 auto 0 0; z-index: 5`

### Main Content Area

- **Margin-left:** 252px (accommodates sidebar)
- **Padding:** 31px 43px
- **Max-width:** 1440px (centered)

## Accessibility

### Contrast Ratios

- **Normal text (body):** 4.5:1 minimum (WCAG AA)
- **Large text (18pt+):** 3:1 minimum
- **UI components:** 3:1 minimum

### Keyboard Navigation

- **Tab order:** Logical (top-to-bottom, left-to-right)
- **Focus indicators:** Visible outline (3px, brand color)
- **Skip links:** (Future) Navigation shortcuts

### Color Blindness

- Avoid red/green combinations alone
- Use icons + color for important distinctions
- Test with color blindness simulators

### Screen Readers

```html
<!-- Semantic HTML -->
<button type="button" aria-label="Add daily check-in">
  <AddIcon /> New Check-in
</button>

<!-- ARIA labels for complex interactions -->
<div role="img" aria-label="Sleep hours from recent check-ins">
  {/* Chart component */}
</div>
```

## Animation & Transitions

### Timing

- **Fast interactions (hover, focus):** 0.15-0.18s
- **Page transitions:** 0.3-0.5s
- **Loading spinners:** Continuous, smooth rotation

### Examples

```css
/* Hover lift effect */
.button:hover {
  transform: translateY(-1px);
  transition: transform .17s;
}

/* Color smooth transition */
.nav-item {
  background: transparent;
  transition: background .18s, color .18s;
}

.nav-item:hover {
  background: #f7f5fe;
}

/* Panel slide-in (future) */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel {
  animation: slideInUp 0.3s ease-out;
}
```

## Theme Toggle Implementation

```typescript
// frontend/src/App.tsx
const [theme, setTheme] = useState<ColorTheme>("light");

const toggleTheme = () => {
  const newTheme = theme === "light" ? "dark" : "light";
  setTheme(newTheme);
  localStorage.setItem("episafe-theme", newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
};

useEffect(() => {
  const savedTheme = localStorage.getItem("episafe-theme") as ColorTheme || "light";
  setTheme(savedTheme);
  document.documentElement.setAttribute("data-theme", savedTheme);
}, []);
```

## Mobile-First Design

All components start with mobile layout, then enhance for larger screens:

```css
/* Mobile (default) */
.page-content {
  padding: 20px 15px;
}

.sidebar {
  display: none; /* Hidden on mobile */
}

.main-area {
  margin-left: 0; /* Full width */
}

/* Desktop */
@media (min-width: 1024px) {
  .sidebar {
    display: flex; /* Visible */
  }

  .main-area {
    margin-left: 252px;
  }
}
```

## Design System Documentation

- All colors use CSS variables for easy theme switching
- All spacing uses rem units for consistent scaling
- All shadows use semi-transparent black for theme compatibility
- All transitions are hardware-accelerated (transform, opacity)

## Future Enhancements

- [ ] Custom theme creation (users can adjust colors)
- [ ] High contrast mode (WCAG AAA)
- [ ] Reduced motion mode (respects `prefers-reduced-motion`)
- [ ] Custom font sizes (user preference)
- [ ] Voice navigation support
