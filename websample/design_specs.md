# Cybersecurity Risk Assessment Platform - Design Specification

## Design Direction

**Aesthetic**: Enterprise Futuristic - Dark professional with accent colors

- Dark navy/slate backgrounds (#0F172A, #1E293B)
- Cyan/electric blue accents (#06B6D4, #0EA5E9) for security/active states
- Red accents (#EF4444) for high-priority risks
- Yellow accents (#FBBF24) for medium-priority risks
- Minimal neon glow effects, no excessive futurism
- Clean typography, data-focused visualizations
- Subtle grid backgrounds and geometric accents

## Color Palette

- **Background**: #0F172A (Darkest), #1E293B (Dark), #334155 (Medium)
- **Primary Accent**: #06B6D4 (Cyan) - Security/locked states
- **Secondary Accent**: #0EA5E9 (Blue) - Interactive elements
- **High Priority**: #EF4444 (Red)
- **Medium Priority**: #FBBF24 (Yellow)
- **Success**: #10B981 (Green)
- **Text Primary**: #F1F5F9 (Near white)
- **Text Secondary**: #CBD5E1 (Light gray)

## Typography

- **Headings**: Inter Tight (Bold/SemiBold) - Modern, geometric
- **Body**: Inter (Regular/Medium) - Clean readability
- **Monospace**: JetBrains Mono - Data/metrics display
- **Logo/Brand**: Clash Grotesk (Bold) - Tech-forward

## Layout & Spacing

- **Rhythm**: 8px base unit (8, 16, 24, 32, 40, 48, 64px)
- **Max Container**: 1280px
- **Card Padding**: 24px - 32px
- **Section Spacing**: 48px - 64px vertical
- **Grid**: 12-column responsive

## Pages to Design

1. **Homepage** - Lock entrance with hover/click animations
2. **Login/Signup** - Modal/keyhole zoom view
3. **Pre-Questionnaire** - Organization type/size selection
4. **Questionnaire** - Single question flow with progress
5. **User Dashboard** - Risk score, categories, recommendations
6. **Recommendations Detail** - Accordion cards with AI chat interface

## Visual Elements

- **Lock**: SVG with animatable elements (shackle, keyhole, key)
- **Charts**: Semi-circle gauge (risk score), pie chart (categories)
- **Progress**: Dynamic bar with question counter
- **Status Badges**: Color-coded priority indicators
- **Accordions**: Collapsible recommendation cards
- **Chat Interface**: Message area + preset suggestion pills
- **Buttons**: Pill-shaped with smooth hover states
- **Icons**: Feather or custom security-themed icons

## Animation Principles

- **Lock Interaction**: Smooth easing on hover (closes partially), click zooms to keyhole
- **Transitions**: 300ms-400ms ease-out for state changes
- **Loading**: Security-themed spinner or rotating key animation
- **Question Flow**: Fade in/slide up for new questions
- **Progress Bar**: Smooth width transition as questions progress
- **Chart Animations**: Staggered reveals on dashboard load
- **Accordion**: Smooth height expansion with icon rotation

## Interaction Patterns

- Hover states on all interactive elements (subtle glow/shadow)
- Click feedback with brief scale or color transition
- Loading states for API calls
- Empty states with helpful guidance
- Error states with clear messaging
- Confirmation dialogs for critical actions
