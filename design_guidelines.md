# Transaction Calendar - Design Guidelines

## Design Approach
**Reference-Based Design**: Inspired by "Subscription Monster" aesthetic - minimalist, data-driven, trustworthy interface with clean layouts and soft color palette. Focus on clarity and calm analytical experience.

## Core Design Principles
- Minimalist data visualization prioritizing readability
- Generous whitespace and breathing room
- Soft, approachable color system
- Consistent component styling across all views

## Color Palette

**Base Colors:**
- Background: #FAFAFB (off-white)
- Card Background: #FFFFFF (white with soft shadow or 1px border)
- Primary Text: Dark gray (#1F2937)
- Secondary Text: Muted gray (#6B7280)

**Transaction Categories:**
- Income: Green/Teal accent (168 76% 42% for primary, 10-15% opacity tints for tags)
- Expense: Soft Red accent (0 72% 60% for primary, 10-15% opacity tints for tags)
- Transfer: Neutral Gray (220 9% 46%)

**Interactive States:**
- Active filters: Highlighted with category color
- Hover states: Subtle lift effect on cards
- Focus states: 2px accent color outline

## Typography
- **Font Family**: Inter or SF Pro (modern sans-serif)
- **Headings**: Medium weight (500-600)
- **Body**: Regular weight (400)
- **Labels**: Medium weight for emphasis
- **Sizes**: Hierarchical scale from 12px (small labels) to 24px (page titles)

## Layout System

**Desktop (two-column):**
- Left: Full calendar grid (70% width)
- Right: Sidebar summary and filters (30% width)
- Generous padding: 24-32px sections

**Mobile (single column):**
- Stacked layout with scrollable calendar
- Filters/insights as bottom sheets
- Condensed day cards or simplified grid

**Spacing**: Consistent 8px base unit (p-2, p-4, p-6, p-8 in Tailwind)

## Component Library

**Navigation Bar:**
- Clean top bar with app logo/name left-aligned
- Center: Simple nav items (Calendar, List, Accounts)
- Right: User avatar
- Background: White with subtle bottom border

**Calendar Grid:**
- Subtle grid lines separating days
- Rounded day cells with minimal borders
- Small transaction cards nested inside cells
- Month navigation with arrow controls
- Smooth transitions between months

**Transaction Cards:**
- White background with soft shadow
- Rounded corners (6-8px)
- Category color dot indicator
- Amount prominently displayed
- Description in secondary text
- Recurring icon (loop) when applicable
- Hover: Slight lift effect

**Sidebar Panel:**
- White card container
- Sections: Monthly totals, Income vs Expense, Category breakdown
- Color-coded category dots with labels
- Clean dividers between sections

**Filter Controls:**
- Pill-style toggles for Calendar/List view
- Category filters with color dots
- Amount range slider
- Search input with icon
- Active state: Filled with category color

**Upload Interface:**
- Drag-and-drop zone with dashed border
- "Load Demo Data" button (secondary style)
- Upload button (primary style)
- Clear instructions and file format guidance

## Responsive Behavior
- **Mobile**: Hamburger menu, bottom sheet filters, simplified calendar grid, vertical stacking
- **Tablet**: Hybrid layout with collapsible sidebar
- **Desktop**: Full two-column layout with persistent filters

## Micro-Interactions
- Hover lift on transaction cards (2-4px translate)
- Smooth month transitions (300ms ease)
- Filter pill color transitions
- Bottom sheet slide animations on mobile
- Active state feedback on all interactive elements

## Images
No hero images required. This is a utility-focused financial app prioritizing data visualization and clarity over marketing imagery.