# Sekeyity - Design System & Components

## Color Palette

- **Background**: #010409 (Darkest), #0d1117 (Card), #1e293b (Alternate)
- **Primary Accent**: #06b6d4 (Cyan) - Main interactive/security states
- **Secondary Accent**: #0EA5E9 (Blue) - Secondary interactions
- **Status Colors**:
  - Critical/High Risk: #EF4444 (Red)
  - Medium Risk: #FBBF24 (Yellow)
  - Low Risk/Success: #10B981 (Green)
  - Info: #06B6D4 (Cyan)
- **Text**: #F1F5F9 (Primary), #CBD5E1 (Secondary), #64748B (Tertiary)
- **Borders**: rgba(255,255,255,0.05) to rgba(255,255,255,0.1)

## Typography

- **Headings**: Cabinet Grotesk (Bold/Extrabold) - Tech-forward, geometric
- **Body**: Satoshi (Regular/Medium) - Clean readability
- **Monospace**: JetBrains Mono - Data display, technical labels
- **Font Import**: https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&f[]=satoshi@700,500,400&f[]=jet-brains-mono@500&display=swap

## Spacing & Layout

- **Base Unit**: 8px
- **Container Max**: 1440px (7xl)
- **Card Padding**: 24px-32px
- **Section Spacing**: 48px-64px
- **Border Radius**: Rounded-2xl to rounded-3xl (typically 24-32px)

## Visual Patterns

### Background Grid

```css
.grid-bg {
  background-image:
    linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

### Card Glass Effect

```css
.card-glass {
  background: rgba(13, 17, 23, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Glow Effects

```css
.neon-pulse {
  animation: neon-pulse 2s infinite ease-in-out;
}
@keyframes neon-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 5px #06b6d4);
  }
  50% {
    filter: drop-shadow(0 0 15px #06b6d4);
  }
}
```

### Gauge/Progress Chart

- Circular stroke-dasharray animations
- Gradient fills from green (low) → yellow (medium) → red (high)
- Shadow effects with appropriate color glows

## Reusable Component

### Header (Component ID: 01116cfd-d9d2-4713-a8f2-0829702c258d)

- **Props**: activeItem, dashboardHref, resourcesHref, missionHref, ctaHref
- Full HTML:

```html
<header
  class="w-full px-8 py-6 flex justify-between items-center z-50 bg-[#010409]/60 backdrop-blur-xl border-b border-white/5"
>
  <div class="flex items-center gap-3">
    <div
      class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]"
    >
      <iconify-icon
        icon="lucide:shield-check"
        class="text-cyan-400 text-2xl"
      ></iconify-icon>
    </div>
    <span
      class="text-xl font-bold tracking-tight text-white font-['Cabinet_Grotesk']"
      >NEURAL<span class="text-cyan-400">SEC_</span></span
    >
  </div>

  <nav class="hidden md:flex items-center gap-10">
    <a
      :href="dashboardHref"
      class="text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
      :class="activeItem === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'"
      >System_Dashboard</a
    >
    <a
      :href="resourcesHref"
      class="text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
      :class="activeItem === 'resources' ? 'text-white' : 'text-slate-400 hover:text-white'"
      >Knowledge_Base</a
    >
    <a
      :href="missionHref"
      class="text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
      :class="activeItem === 'mission' ? 'text-white' : 'text-slate-400 hover:text-white'"
      >Security_Mission</a
    >
  </nav>

  <div>
    <a
      :href="ctaHref"
      class="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
      >Initialize_Assessment</a
    >
  </div>
</header>
```

## Animation Principles

- **Transitions**: 300-400ms ease-out for state changes
- **Hover Effects**: Subtle glow (box-shadow), border color shift, minor scale/translate
- **Entrance**: Staggered fade-up animations (0.6s-0.8s) with animation-delay
- **Gauge Fills**: 1.5-2s cubic-bezier animations
- **Floating Elements**: 6s ease-in-out infinite for decorative elements

## Pages Generated

1. **Homepage** - Lock entrance with keyhole zoom interaction
2. **Security Assessment** - Vulnerability audit report with gauge chart
3. **Account Registration** - Multi-step onboarding form
4. **Executive Dashboard** - Risk metrics, live alerts, action cards
5. **Knowledge Base** - Searchable resource library with categorization
6. **Security Mission** - Task/objective tracker with progress bars

## Interactive Elements

- All links use :href prop binding for dynamic navigation
- Navigation items highlight based on activeItem prop
- Buttons have hover states (color shift, shadow enhancement)
- Forms include focus states with cyan ring effects
- Progress bars animate on load with CSS keyframes
- Status indicators pulse with animation for real-time feel
