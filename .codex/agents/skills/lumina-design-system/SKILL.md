---
name: lumina-design-system
description: >
  Use when building, modifying, reviewing, or debugging tutor-facing
  Lumina Academy UI, layouts, components, workflows, AI surfaces,
  marking screens, OCR screens, student views, worksheet views, or
  product copy. Do not use for backend-only work.
---

# Lumina Academy — Design System Skill

A warm, editorial design system for AI-assisted education tooling. Built for tutor-facing
desktop web applications where AI produces suggestions and a human approves them.

**Use this skill when** building any screen for the Lumina tutor platform, or any product
that needs the same character: warm neutral ground, serif display headings, clean sans
interface text, coral/rust accents, and near-black panels reserved for machine output.

## How this skill is organised

Each part of the system is its own skill file. Read the foundations below, then the
individual skill for the component you are building.

| Skill | Covers |
|---|---|
| [Foundations](#foundations) | Colour, type, spacing, radius, elevation, motion |
| [skills/navigation.md](skills/navigation.md) | Sidebar, topbar, chip rail, active states |
| [skills/buttons.md](skills/buttons.md) | Primary, coral, secondary, ghost, icon, dashed |
| [skills/metric-cards.md](skills/metric-cards.md) | Dashboard KPI cards, summary cards |
| [skills/ai-insight-panels.md](skills/ai-insight-panels.md) | Dark AI panels — the system's signature |
| [skills/status-badges.md](skills/status-badges.md) | Learning status, worksheet status, tags |
| [skills/mastery-bars-charts.md](skills/mastery-bars-charts.md) | Topic bars, column charts, legends |
| [skills/student-cards.md](skills/student-cards.md) | Rosters, progress tables, avatars |
| [skills/worksheet-cards.md](skills/worksheet-cards.md) | Worksheet list rows and cards |
| [skills/question-cards.md](skills/question-cards.md) | Editor rows, question bank rows |
| [skills/ocr-confidence.md](skills/ocr-confidence.md) | Split-screen review, confidence states, scan paper |
| [skills/ai-marking-panels.md](skills/ai-marking-panels.md) | Marking analysis, tutor decision, approval gate |
| [skills/filters-controls.md](skills/filters-controls.md) | Chips, segments, toggles, selects, inputs |
| [skills/steppers.md](skills/steppers.md) | Multi-step workflow progress |
| [skills/feedback-states.md](skills/feedback-states.md) | Toasts, modals, empty, loading, error |
| [skills/layout-responsive.md](skills/layout-responsive.md) | Page frame, breakpoints, column folding |
| [skills/content-voice.md](skills/content-voice.md) | Copy rules, AI tone, PSLE vocabulary |
| [skills/flows.md](skills/flows.md) | The personalised-learning cycle and its five flows |

---

## Foundations

### The one rule that shapes everything

**Light surfaces are for human-authored and tutor-approved content. Near-black panels are
for machine output.** A tutor can tell at a glance what the AI thinks versus what has been
agreed. Never put AI suggestions on a light card, and never put approved results on a dark one.

### Colour

Warm neutrals only — every grey has a yellow-red bias. No pure white, no pure black, no cool greys.

```
GROUND & SURFACE
--bg-canvas        #F7F4EF   page background
--bg-surface       #FFFDFA   cards, tables, panels
--bg-raised        #FBF9F5   sidebar, inputs, nested fills, secondary buttons
--bg-sunken        #F4EFE6   segment tracks, icon wells, time pills
--bg-scan          #F0EBE3   scan viewer backdrop

BORDER (light → strong)
--line-soft        #F3EDE4   table row dividers
--line-subtle      #F0EAE0   in-card rules, progress track
--line-inner       #EFE8DE   header/section dividers
--line-default     #EBE4D9   card border
--line-control     #E4DCD0   input and secondary-button border
--line-nav         #EDE6DB   sidebar and topbar border
--line-strong      #DCCFBE   card hover border, dashed affordance

INK
--ink-strong       #2A2622   headings, primary values
--ink-body         #4A443D   body copy in cards
--ink-mid          #5A544C   nav labels, callout body
--ink-secondary    #6F675E   field labels, table cells
--ink-muted        #8B837A   descriptions, meta
--ink-tertiary     #A09488   eyebrow labels, timestamps
--ink-faint        #BCB1A3   disabled icons, chart tick text

BRAND — coral / rust
--rust-900         #9E3A24   primary button, active nav text, focus-area figures
--rust-900-hover   #8A3120
--rust-600         #B4573F   accent text, links, needs-focus bars
--rust-600-hover   #8E4230   link hover
--coral-500        #E08A72   AI actions, secondary CTA, AI Insight mark
--coral-500-hover  #D2795F
--coral-400        #EC9A82   coral button hover on dark

DARK PANEL (AI surface)
--panel            #1B1917   panel background
--panel-card       #232120   card nested in a panel
--panel-fill       #282522   button / quote fill on panel
--panel-fill-2     #2C2926   input and read-only fill on panel
--panel-line       #2C2925   divider on panel
--panel-line-2     #3A362F   control border on panel
--panel-heading    #FBF9F5
--panel-body       #CFC7BC
--panel-dim        #A8A096
--panel-muted      #8F877D
--panel-faint      #6E665D

SEMANTIC — mastery and status
secure / positive   #5C7A63 text · #93A896 bar · #E4EDE4 bg · #4A6B50 on-bg
developing          #7A6238 text · #D8B384 bar · #F3EBDD bg
needs focus / risk  #9E3A24 text · #B4573F bar · #F7E3DC bg
neutral / inactive  #6F675E text · #F0EAE0 bg

ON-PANEL SEMANTIC (for dark surfaces)
positive            #9FC0A2 on #22301F   border #3E5540
risk                #E0A692 on #3A2119   border #4A2C21
high priority tag   #F0BCAB on #5E2418

ACCENT TINTS (light)
--tint-rust        #F4E4DE   active chip, active nav pill
--tint-rust-line   #E0B9AC   active chip border
--tint-rust-soft   #F1D9D1   count badge, AI PICK badge
--tint-rust-page   #FDF6F3   selected card ground, focus-area row
--tint-rust-edge   #F0DCD4   focus-area row border

AVATAR ROTATION (cycle in order, never random)
#D8B384  #C6D0C4  #E3C3B4  #CFC0D6  #D9CBA8  #BFD0D6   text always #3A332C

SUBJECT
Science  bg #EAEDE7  text #4A6B50
Maths    bg #E6EAEF  text #4E5C6E

HANDWRITING SIMULATION (scan viewer only)
paper #FDFAF4 · rule #F2ECE1 · margin #EBC9C4 · ink #3A4A6B
```

**Ceiling: two background colours per screen.** The warm canvas and, where AI speaks, the
near-black panel. Everything else is a surface or a border on those two.

### Type

```
Playfair Display   display headings only — 400/500/600/700
DM Sans            all interface text — 400/500/700
Caveat             student handwriting simulation ONLY, never UI
```

```
ROLE                      FAMILY      SIZE    WEIGHT  TRACKING   USE
page-title-hero           Playfair    38px    500     -.02em     dashboard, class name
page-title                Playfair    34px    500     -.02em     index pages
step-title                Playfair    31px    500     -.02em     wizard steps
section-title             Playfair    20-21px 500     normal     card headings
metric-value              Playfair    31-34px 500     normal     KPI figures
metric-value-lg           Playfair    44px    600     normal     AI suggested score
quote                     Playfair    21px    500     normal     AI insight headline
body                      DM Sans     14.5px  400     normal     panel body, question text
body-sm                   DM Sans     13.5px  400/500 normal     default UI text
body-xs                   DM Sans     12.5-13px 400   normal     table cells, descriptions
meta                      DM Sans     11.5px  400/500 normal     secondary meta
meta-sm                   DM Sans     11px    400     normal     timestamps, sub-meta
eyebrow                   DM Sans     10.5px  600     .13em      SECTION LABELS (uppercase)
column-head               DM Sans     10.5px  600     .09em      TABLE HEADS (uppercase)
badge                     DM Sans     9.5px   700     .05em      STATUS BADGES (uppercase)
```

Line-height: 1.6–1.7 for body prose, 1.35–1.45 for dense meta, 1.0–1.15 for display figures.
Always set ```text-wrap: pretty``` on prose. Serif is for nouns — page and section names,
figures. Never set a serif label, button, or badge.

### Spacing, radius, elevation

```
SPACING     4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 26 · 30 · 34
page padding 30px · card padding 20-24px · section gap 20-22px · card gap 14-16px

RADIUS
20px+  pill — badges, chips, progress tracks
14px   card, panel
12px   inner card, nested card, callout
10px   primary/secondary button, dark-panel button
9px    control, icon button (34px), select
8px    small control, segment item
7px    icon button (28-30px), micro button
5px    progress bar fill
50%    avatar, AI mark dot
3px    scan paper

ELEVATION — sparingly; borders carry structure, not shadows
button    0 1px 2px rgba(42,38,34,.12)
raised    0 1px 3px rgba(42,38,34,.12)
paper     0 4px 16px rgba(42,38,34,.13)
toast     0 12px 34px rgba(42,38,34,.28)
segment   0 1px 2px rgba(42,38,34,.08)
```

Hover on a card = ```border-color``` to ```#DCCFBE``` plus ```translateY(-2px)```, transition
```.18s```. Hover on a row = ```background:#FBF7F1```. Never scale, never glow.

### Motion

```
fadeUp    .35s ease both              screen entry — every route
toastIn   .3s cubic-bezier(.2,.8,.3,1) toast
grow      .5s cubic-bezier(.2,.8,.3,1) chart column, transform-origin bottom
pulseDot  2s infinite                  unread notification dot
bar fill  width .6-.7s cubic-bezier(.2,.8,.3,1)  mastery change after approval
```

Motion exists to show change, never to decorate. The bar transition matters: when a tutor
approves marking, they must *see* mastery move.

### Implementation constraints

- **Inline styles only.** No stylesheets, no classes, no token files. Repeat literals.
- ```<helmet>``` carries only font links, ```@keyframes```, and body resets.
- Layout is flex/grid with ```gap``` — never margin-spaced inline siblings.
- Icons are inline 1.7–1.8 stroke-width SVG on a 24px grid, ```stroke="currentColor"```,
  round caps and joins. 13–17px rendered. Never emoji, never an icon font.
- No illustration. Imagery is the student's own scanned work.
