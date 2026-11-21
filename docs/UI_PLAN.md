# Arka Design System & UI Overhaul Plan

This document defines the architecture, tokens, and components for the complete redesign of Arka — transforming it into an industrial-grade, restrained, high-performance B2B SaaS platform for Indian solar installation enterprises.

---

## 1. Design Direction & Palette

### Philosophy
- **Restraint Over Spectacle**: No glassmorphism, no rainbow/neon gradients, no floating particles, no emojis.
- **Paper-Like Tactility**: Crisp 1px borders, subtle warm-grey surfaces, micro-elevation only on popovers/drawers.
- **Operational Clarity**: High readability, minimum 14px text desktop (16px mobile), tabular numerals for all quantities, money, and serial numbers.

### Brand Accent
- **Deep Solar Teal (`#0F766E`)**
  - Primary button, active sidebar indicator, link highlights, and focus ring.
  - Dark Theme: `#14B8A6` (calibrated for WCAG AAA contrast against dark surfaces).

### Colour Tokens (Light & Dark)

| Token | Light Value | Dark Value | Purpose |
|---|---|---|---|
| `--surface-bg` | `#FAFAF9` (warm paper) | `#0C0A09` (true neutral dark) | Main application backdrop |
| `--surface-card` | `#FFFFFF` | `#1C1917` | Standard surface cards & tables |
| `--surface-subtle` | `#F5F5F4` | `#292524` | Table headers, muted panels |
| `--border-subtle` | `#E7E5E4` | `#292524` | 1px clean gridlines & structural borders |
| `--border-strong` | `#D6D3D1` | `#44403C` | Input borders, active outlines |
| `--text-primary` | `#1C1917` (Stone 900) | `#FAFAF9` (Stone 50) | High-contrast body & headers (≥ 7:1) |
| `--text-secondary` | `#57534E` (Stone 600) | `#A8A29E` (Stone 400) | Readable metadata & labels (≥ 4.5:1) |
| `--text-tertiary` | `#78716C` (Stone 500) | `#78716C` (Stone 500) | Captions & minor timestamps |
| `--accent` | `#0F766E` (Teal 700) | `#14B8A6` (Teal 500) | Primary operational action & active nav |
| `--accent-hover` | `#115E59` (Teal 800) | `#0D9488` (Teal 600) | Hover state |
| `--accent-subtle` | `#F0FDFA` (Teal 50) | `#134E4A` (Teal 900) | Selected row & badge background |
| `--success` | `#15803D` (Green 700) | `#22C55E` (Green 500) | Verified status, approved, in-warranty |
| `--warning` | `#B45309` (Amber 700) | `#F59E0B` (Amber 500) | Pending approval, upcoming SLA, sun path |
| `--danger` | `#B91C1C` (Red 700) | `#EF4444` (Red 500) | Hard gates, overdue tickets, rejected |

---

## 2. Typography Scale

Fonts loaded via `next/font/google`:
- **Primary / UI / Body**: `Inter` with `font-feature-settings: "cv11", "ss01"` and `font-variant-numeric: tabular-nums`.
- **Monospace**: `Geist Mono` / `JetBrains Mono` for serial numbers, quote IDs, and barcode scan tokens.

### Scale Mapping
- `text-display`: `2rem` (32px) / `2.5rem` (40px) line-height, weight 600
- `text-title`: `1.5rem` (24px) / `2rem` (32px), weight 600
- `text-heading`: `1.125rem` (18px) / `1.75rem` (28px), weight 600
- `text-body`: `1rem` (16px) / `1.5rem` (24px), weight 400
- `text-body-sm`: `0.875rem` (14px) / `1.25rem` (20px), weight 400–500 (absolute minimum reading size)
- `text-label`: `0.875rem` (14px) / `1.25rem` (20px), weight 500 (sentence case)
- `text-caption`: `0.8125rem` (13px) / `1.125rem` (18px) (footnotes and timestamps only)

### User Text-Size Scaling
Controlled via `--text-scale` on root (`html`):
- Normal (Default): `100%` (16px root base)
- Large: `112.5%` (18px root base)
- Extra Large: `125%` (20px root base)

---

## 3. Indian Operations Formatting

1. **Currency**: Integer paise formatted using `Intl.NumberFormat('en-IN')`:
   - Exact: `₹1,85,000`
   - Shorthand (Dashboard KPIs): `₹1.85 L`, `₹1.2 Cr` (hover tooltip displays exact rupees)
2. **Dates & Times**: `DD MMM YYYY`, 12-hour format with `IST` indicator (`14 Nov 2026, 02:30 PM IST`).
3. **Phone Numbers**: Normalised to E.164 (`+919876543210`) with one-tap Call and WhatsApp links.
4. **Language Scaffold**: English default with Hindi (`हिन्दी`) and Punjabi (`ਪੰਜਾਬੀ`) localization keys.

---

## 4. Reusable Core Component Inventory

Located in `src/components/ui/` and `src/components/shared/`:

| Component | Path | Purpose |
|---|---|---|
| `DataTable` | `src/components/shared/DataTable.tsx` | Dense tabular grid with sorting, column filters, search, and CSV export |
| `PageHeader` | `src/components/shared/PageHeader.tsx` | Clean title, operational metadata, breadcrumbs, and primary CTA |
| `StatCard` | `src/components/shared/StatCard.tsx` | Honest KPI card (32px tabular value, honest trendline, label) |
| `StatusPill` | `src/components/shared/StatusPill.tsx` | Unified status indicator (dot + tinted background + AA text) |
| `EntityHeader` | `src/components/shared/EntityHeader.tsx` | Lead / Project / Order / Ticket identity strip with key stage info |
| `StepperTracker`| `src/components/shared/StepperTracker.tsx`| Golden-thread horizontal stage progress tracker (8 stages) |
| `CommandPalette`| `src/components/shared/CommandPalette.tsx`| Global `Cmd+K` keyboard navigator (search, jump to route, quick create) |
| `MoneyInput` | `src/components/ui/MoneyInput.tsx` | Rupees input automatically converting to/from integer paise |
| `PhoneInput` | `src/components/ui/PhoneInput.tsx` | Indian phone input with automatic +91 prefix and validation |
| `ScanInput` | `src/components/ui/ScanInput.tsx` | Industrial barcode scanner with audio tone & tactile feedback |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | Explanatory state with specific action button |

---

## 5. 3D Architecture (Restrained, Procedural, High-Performance)

1. **Hero Solar House (`HeroHouse3D.tsx`)**:
   - Modern architectural pitched-roof house on a minimal matte plinth.
   - Live sun position calculated via `SunCalc` based on Indian latitude (31° N Punjab default).
   - Clean HTML floating badges with live kW values (Solar, Home, Grid, Battery).
2. **Roof Survey Visualizer (`RoofSurvey3D.tsx`)**:
   - Interactive procedural roof plane reacting live to azimuth, tilt, usable area.
   - Instanced solar panel layout with shadow hatching, sun arc, and DC/AC cable run line.
3. **Quote System Viewer (`SystemViewer3D.tsx`)**:
   - Exploded view of components (Panels, Inverter, Inverter Rack, Junction Box, Battery).
   - Interactive explosion slider with bidirectional row hover highlighting.
4. **Serial Asset Digital-Twin Card (`DigitalTwinCard.tsx`)**:
   - Quiet, slowly rotating 3D asset model alongside mono serial number, customer name, and SVG warranty progress ring.

---

## 6. Implementation Sequence

1. **Step 1 — Foundation**:
   - Implement `src/styles/tokens.css` with full light/dark scales and CSS custom properties.
   - Configure typography in `app/layout.tsx` (Inter + Geist Mono).
   - Build `src/lib/ui/status.ts` as the single source of truth for status pills.
   - Create `/design` route for visual QA.
2. **Step 2 — App Shell & Navigation**:
   - Solid 260px sidebar with custom "Arka" wordmark and role groupings.
   - 64px slim topbar with Command Palette (`Cmd+K`), notification bell, theme toggle, and text-size selector.
   - Mobile bottom tab bar + high-contrast outdoor `/field` layout.
3. **Step 3 — Core Patterns**:
   - `DataTable`, `PageHeader`, `StatCard`, `StatusPill`, `StepperTracker`, `EntityHeader`.
4. **Step 4 — Screens Overhaul**:
   - Leads split view → Survey & Gate → Quote Builder → Orders & Payments → Warehouse Scan Station → Field PWA → Service Desk → Finance → Director Dashboard.
5. **Step 5 — 3D Visualizers**:
   - Hero House, Roof Survey Visualizer, Exploded System Viewer, Asset Digital Twin.
6. **Step 6 — Polish & Quality Assurance**:
   - Keyboard shortcuts, responsive checks, accessibility audit (contrast, font size checks).
