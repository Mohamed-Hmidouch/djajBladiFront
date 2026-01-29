# DjajBladi Design System - Agent Skill

## CRITICAL WARNING - NO EMOJIS POLICY

**ABSOLUTE PROHIBITION:** NEVER use emojis in any code, comments, class names, variable names, component names, CSS properties, or any part of the codebase. Emojis in code are DANGEROUS and cause:
- Encoding issues and build failures
- Font rendering problems across platforms
- Database storage corruption
- API serialization errors
- Accessibility screen reader confusion
- Git diff/merge conflicts

**VIOLATION EXAMPLES (NEVER DO THIS):**
```tsx
// BAD - FORBIDDEN
const message = "Welcome! 🎉"
// className="hero-section 🚀"
// /* This is a great feature ✨ */
```

**CORRECT APPROACH:**
```tsx
// GOOD - APPROVED
const message = "Welcome!"
// className="hero-section"
// /* This is a great feature */
```

---

## Role & Context

You are an Expert UI/UX Designer and Senior Frontend Developer implementing the design system for "DjajBladi" - a professional agri-food/poultry company website.

**Brand Ambiance:** Professional, Clean, Reliable, Modern.

---

## 1. COLOR TOKENS (Semantic Palette)

Never use raw hex values directly. Always use CSS variables or Tailwind config tokens.

```css
:root {
  /* Primary - Trust & Corporate */
  --color-primary: #1B2A41;        /* Deep Navy - Headers, Footer, Main titles */
  --color-primary-hover: #152233;  /* Darker variant */
  
  /* Brand Accent - Action & Energy */
  --color-brand: #C84630;          /* Terracotta Red - CTAs, Active links, Key icons */
  --color-brand-hover: #A63A28;    /* Darker variant for hover states */
  
  /* Surfaces */
  --color-surface-1: #FFFFFF;      /* White - Cards, Page background */
  --color-surface-2: #F4F6F8;      /* Cool Grey - Alternating sections */
  --color-surface-3: #E0E6ED;      /* Light Grey-Blue - Card hover states */
  
  /* Borders & Dividers */
  --color-border: #E2E8F0;         /* Subtle separation lines */
  
  /* Text */
  --color-text-primary: #1B2A41;   /* Headings */
  --color-text-body: #4A5568;      /* Body text - Never pure black */
  --color-text-muted: #718096;     /* Secondary text */
  --color-text-inverse: #FFFFFF;   /* Text on dark backgrounds */
  --color-text-inverse-muted: rgba(255, 255, 255, 0.8); /* Footer text */
}
```

### Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B2A41',
          hover: '#152233',
        },
        brand: {
          DEFAULT: '#C84630',
          hover: '#A63A28',
        },
        surface: {
          1: '#FFFFFF',
          2: '#F4F6F8',
          3: '#E0E6ED',
        },
        border: '#E2E8F0',
        text: {
          primary: '#1B2A41',
          body: '#4A5568',
          muted: '#718096',
        },
      },
    },
  },
}
```

---

## 2. SPATIAL SYSTEM (8-Point Grid)

**RULE:** All spacing values MUST be multiples of 4 or 8. No arbitrary values allowed.

```css
:root {
  /* Base Unit */
  --space-unit: 4px;  /* 0.25rem */
  
  /* Spacing Scale */
  --space-xs: 4px;    /* 0.25rem - Immediate proximity */
  --space-sm: 8px;    /* 0.5rem  - Related elements */
  --space-md: 16px;   /* 1rem    - Standard separation */
  --space-lg: 24px;   /* 1.5rem  - Component separation */
  --space-xl: 32px;   /* 2rem    */
  --space-2xl: 48px;  /* 3rem    */
  --space-3xl: 64px;  /* 4rem    - Major sections */
  --space-section: 80px;  /* 5rem - Desktop vertical breathing */
  --space-section-lg: 120px; /* 7.5rem - Large section gaps */
}
```

### Layout Constraints

```css
:root {
  --container-max: 1280px;     /* Main container width */
  --content-max: 65ch;         /* Optimal text line length */
  --navbar-height: 80px;       /* Fixed navigation height */
}
```

### Tailwind Spacing Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        'section': '80px',
        'section-lg': '120px',
      },
      maxWidth: {
        'container': '1280px',
        'content': '65ch',
      },
    },
  },
}
```

---

## 3. TYPOGRAPHY SYSTEM (Modular Scale 1.25)

### Font Families

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap');

:root {
  --font-heading: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}
```

### Type Scale

```css
:root {
  /* H1 - Hero Headlines */
  --text-h1-size: 48px;       /* 3rem */
  --text-h1-line: 1.1;
  --text-h1-tracking: -0.02em;
  --text-h1-weight: 700;
  
  /* H2 - Section Titles */
  --text-h2-size: 32px;       /* 2rem */
  --text-h2-line: 1.2;
  --text-h2-weight: 600;
  
  /* H3 - Card Titles */
  --text-h3-size: 20px;       /* 1.25rem */
  --text-h3-line: 1.4;
  --text-h3-weight: 600;
  
  /* Body Text */
  --text-body-size: 16px;     /* 1rem */
  --text-body-line: 1.6;      /* Very airy for readability */
  --text-body-weight: 400;
  
  /* Caption/Label */
  --text-caption-size: 12px;  /* 0.75rem */
  --text-caption-tracking: 0.05em;
  --text-caption-weight: 700;
  --text-caption-transform: uppercase;
}
```

### Typography Classes

```css
.heading-1 {
  font-family: var(--font-heading);
  font-size: var(--text-h1-size);
  line-height: var(--text-h1-line);
  letter-spacing: var(--text-h1-tracking);
  font-weight: var(--text-h1-weight);
  color: var(--color-text-primary);
}

.heading-2 {
  font-family: var(--font-heading);
  font-size: var(--text-h2-size);
  line-height: var(--text-h2-line);
  font-weight: var(--text-h2-weight);
  color: var(--color-text-primary);
}

.heading-3 {
  font-family: var(--font-heading);
  font-size: var(--text-h3-size);
  line-height: var(--text-h3-line);
  font-weight: var(--text-h3-weight);
  color: var(--color-text-primary);
}

.body-text {
  font-family: var(--font-body);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: var(--text-body-weight);
  color: var(--color-text-body);
}

.caption {
  font-family: var(--font-body);
  font-size: var(--text-caption-size);
  letter-spacing: var(--text-caption-tracking);
  font-weight: var(--text-caption-weight);
  text-transform: var(--text-caption-transform);
  color: var(--color-text-muted);
}
```

---

## 4. COMPONENT PHYSICS (Micro-Interactions)

### Buttons

```css
/* Primary CTA Button */
.btn-primary {
  /* Structure */
  padding: 12px 24px;           /* 1:2 vertical:horizontal ratio */
  border-radius: 6px;           /* Professional, not pill-shaped */
  border: none;
  
  /* Appearance */
  background-color: var(--color-brand);
  color: var(--color-text-inverse);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  
  /* Animation */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.btn-primary:hover {
  background-color: var(--color-brand-hover);
}

.btn-primary:active {
  transform: scale(0.98);       /* Subtle press effect */
}

/* Secondary Ghost Button */
.btn-secondary {
  /* Structure */
  padding: 12px 24px;
  border-radius: 6px;
  border: 2px solid var(--color-primary);
  
  /* Appearance */
  background-color: transparent;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  
  /* Animation */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.btn-secondary:active {
  transform: scale(0.98);
}
```

### Cards & Surfaces

```css
.card {
  /* Structure */
  border-radius: 8px;
  padding: var(--space-lg);     /* 24px */
  
  /* Appearance */
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-border);
  
  /* Depth - Elevation 1 */
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  
  /* Animation */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-2px);
  
  /* Depth - Elevation 2 */
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
```

---

## 5. LAYOUT COMPONENTS

### Navbar

```css
.navbar {
  /* Structure */
  height: var(--navbar-height);  /* 80px */
  padding: 0 var(--space-lg);    /* 24px horizontal */
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  /* Appearance */
  background-color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);   /* Frosted glass effect */
  -webkit-backdrop-filter: blur(10px);
  
  /* Behavior */
  position: sticky;
  top: 0;
  z-index: 100;
}
```

### Hero Section

```css
.hero {
  /* Structure */
  padding: var(--space-section-lg) 0;  /* 120px vertical */
  min-height: calc(100vh - var(--navbar-height));
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  /* Appearance - Option A: Solid color */
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.hero-content {
  max-width: var(--content-max);  /* 65ch */
  padding: 0 var(--space-lg);
}
```

### Footer

```css
.footer {
  /* Structure */
  padding: var(--space-3xl) 0;   /* 64px vertical */
  
  /* Appearance */
  background-color: var(--color-primary);
  color: var(--color-text-inverse-muted);  /* 80% opacity white */
}

.footer-heading {
  color: var(--color-text-inverse);
  margin-bottom: var(--space-md);
}

.footer-link {
  color: var(--color-text-inverse-muted);
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--color-text-inverse);
}
```

### Container

```css
.container {
  width: 100%;
  max-width: var(--container-max);  /* 1280px */
  margin: 0 auto;
  padding: 0 var(--space-lg);       /* 24px horizontal */
}
```

### Section Spacing

```css
.section {
  padding: var(--space-section) 0;  /* 80px vertical */
}

.section-alt {
  padding: var(--space-section) 0;
  background-color: var(--color-surface-2);
}

.section-large {
  padding: var(--space-section-lg) 0;  /* 120px vertical */
}
```

---

## 6. TAILWIND COMPONENT CLASSES

```jsx
// Button Components
const buttonPrimary = "px-6 py-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-md transition-all duration-200 ease-out active:scale-[0.98]"

const buttonSecondary = "px-6 py-3 bg-transparent border-2 border-primary text-primary font-semibold rounded-md transition-all duration-200 ease-out hover:bg-primary hover:text-white active:scale-[0.98]"

// Card Component
const card = "bg-surface-1 border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out"

// Typography
const h1 = "font-heading text-5xl font-bold leading-tight tracking-tight text-primary"
const h2 = "font-heading text-3xl font-semibold leading-snug text-primary"
const h3 = "font-heading text-xl font-semibold leading-normal text-primary"
const bodyText = "font-body text-base leading-relaxed text-text-body"
const caption = "font-body text-xs font-bold uppercase tracking-wider text-text-muted"
```

---

## 7. RESPONSIVE BREAKPOINTS

```css
/* Mobile First Approach */
:root {
  /* Breakpoints */
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
}

/* Typography Responsive Adjustments */
@media (max-width: 768px) {
  :root {
    --text-h1-size: 36px;
    --text-h2-size: 28px;
    --space-section: 64px;
    --space-section-lg: 80px;
  }
}
```

---

## IMPLEMENTATION CHECKLIST

When building any component or page:

1. **NO EMOJIS** - Never use emojis anywhere in code, comments, or strings
2. **Use CSS Variables** - Never hardcode colors or spacing values
3. **8-Point Grid** - All spacing must be multiples of 4 or 8
4. **Semantic Colors** - Use token names, not raw hex values
5. **Typography Scale** - Follow the modular scale, no arbitrary sizes
6. **Transitions** - Use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth animations
7. **Elevation** - Use defined shadow levels for depth
8. **Container Width** - Max 1280px, centered
9. **Text Width** - Max 65ch for body content readability
10. **Whitespace** - Generous padding between sections (80px+)
