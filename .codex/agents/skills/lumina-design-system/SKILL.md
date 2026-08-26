````markdown
---
name: lumina-design-system
description: >
  Use when building, modifying, reviewing, or debugging tutor-facing
  Lumina Academy UI, layouts, components, workflows, AI surfaces,
  marking screens, OCR screens, student views, worksheet views,
  reports, navigation, responsive behaviour, or product copy.
  Use for frontend work that must follow the Lumina visual language
  and interaction model. Do not use for backend-only work unless
  frontend behaviour or human/AI state semantics are directly affected.
---

# Lumina Academy — Design System

A warm, editorial design system for AI-assisted education tooling.

Built for tutor-facing desktop web applications where AI produces
suggestions and a human reviews, approves, or overrides them.

This skill defines:

- visual language
- component behaviour
- interaction hierarchy
- responsive behaviour
- AI-versus-human surface semantics
- tutor-facing content style
- workflow presentation
- state presentation

It does **not** define backend architecture, persistence mechanisms,
API architecture, authentication, or database design.

Those concerns belong to their respective engineering skills.

---

# 1. Core Principle

The most important rule in the entire system is:

> **Light surfaces represent human-authored, factual, or tutor-approved
> content. Near-black surfaces represent machine interpretation,
> recommendation, generation, or analysis.**

A tutor must be able to tell at a glance:

- what the system knows;
- what the AI suggests;
- what the tutor has approved.

Never blur those categories merely for visual consistency.

## Light surfaces

Use light surfaces for:

- factual student information
- tutor decisions
- approved marks
- persisted learning state
- forms
- navigation
- tables
- worksheet content
- student profiles
- class information
- confirmed results

## Dark surfaces

Use near-black AI surfaces for:

- AI insight
- AI recommendation
- AI-generated reasoning
- OCR interpretation
- AI marking analysis
- generated suggestions
- machine confidence
- AI-generated previews

Dark does **not** automatically mean warning or error.

It means:

> **This information is produced or interpreted by the machine and has
> not necessarily become authoritative state.**

---

# 2. Human-in-the-Loop Meaning

Visual hierarchy must reinforce the application's human approval model.

The basic semantic sequence is:

```text
AI proposes
    ↓
Tutor reviews
    ↓
Tutor approves / edits / rejects
    ↓
Approved state becomes authoritative
````

Do not design UI that implies machine output is already a confirmed
student record.

Examples:

```text
AI suggested score
→ dark surface

Tutor-approved score
→ light surface
```

```text
AI recommends a worksheet topic
→ dark surface / coral AI action

Tutor confirms and creates the worksheet
→ tutor commitment / rust action
```

Where a generated value could be confused with an approved decision,
explicitly label it.

Examples:

```text
Suggestion only — not saved
AI recommendation
AI marking analysis
AI-generated
```

---

# 3. How to Use This Skill

Do **not** read every reference document for every UI task.

Always:

1. read this `SKILL.md`;
2. identify the screen or component being changed;
3. load only the relevant files from `references/`;
4. inspect existing repository components before implementing;
5. preserve existing application architecture unless the task explicitly
   requires an architectural change.

The reference files are design specifications, not independent
architectural systems.

---

# 4. Reference Routing

Use the following reference files depending on the task.

## Application shell / routing / navigation

Read:

```text
references/navigation.md
references/layout-responsive.md
```

Use when implementing:

* sidebar
* topbar
* route navigation
* responsive navigation
* breadcrumbs / back links
* shell layout

---

## Buttons and actions

Read:

```text
references/buttons.md
```

Use when implementing:

* primary actions
* AI actions
* secondary actions
* destructive actions
* icon buttons
* create affordances
* disabled actions

Remember:

```text
RUST  = tutor commits / decides
CORAL = AI acts or machine work is accepted
```

Do not swap those meanings.

---

## Dashboard

Read:

```text
references/metric-cards.md
references/ai-insight-panels.md
references/mastery-bars-charts.md
references/layout-responsive.md
references/content-voice.md
```

Add:

```text
references/status-badges.md
```

when dashboard state labels are involved.

---

## Class screens

Read:

```text
references/student-cards.md
references/mastery-bars-charts.md
references/worksheet-cards.md
references/ai-insight-panels.md
references/status-badges.md
references/layout-responsive.md
```

---

## Student profile

Read:

```text
references/student-cards.md
references/mastery-bars-charts.md
references/ai-insight-panels.md
references/status-badges.md
references/content-voice.md
references/layout-responsive.md
```

---

## Student roster

Read:

```text
references/student-cards.md
references/status-badges.md
references/filters-controls.md
references/layout-responsive.md
```

---

## Worksheet index

Read:

```text
references/worksheet-cards.md
references/status-badges.md
references/filters-controls.md
references/layout-responsive.md
```

---

## Worksheet generation

Read:

```text
references/flows.md
references/steppers.md
references/question-cards.md
references/filters-controls.md
references/buttons.md
references/feedback-states.md
references/content-voice.md
references/layout-responsive.md
```

Add:

```text
references/ai-insight-panels.md
```

when AI Preview or AI Recommendation is shown.

---

## Question Bank

Read:

```text
references/question-cards.md
references/filters-controls.md
references/status-badges.md
references/layout-responsive.md
```

---

## Worksheet upload

Read:

```text
references/flows.md
references/steppers.md
references/feedback-states.md
references/buttons.md
references/layout-responsive.md
```

---

## OCR review

Read:

```text
references/flows.md
references/ocr-confidence.md
references/steppers.md
references/buttons.md
references/feedback-states.md
references/layout-responsive.md
```

---

## AI marking

Read:

```text
references/flows.md
references/ai-marking-panels.md
references/question-cards.md
references/buttons.md
references/status-badges.md
references/feedback-states.md
references/content-voice.md
references/layout-responsive.md
```

---

## Reports and analytics

Read:

```text
references/mastery-bars-charts.md
references/metric-cards.md
references/status-badges.md
references/filters-controls.md
references/content-voice.md
references/layout-responsive.md
```

---

## Empty / loading / error / success states

Read:

```text
references/feedback-states.md
references/buttons.md
references/content-voice.md
```

---

## Product flow or cross-screen behaviour

Read first:

```text
references/flows.md
```

Then load the component references involved in that flow.

---

# 5. Foundations

## Colour

Warm neutrals only.

Avoid:

* pure white
* pure black
* cool blue-grey surfaces
* arbitrary accent colours

### Ground and surfaces

```text
--bg-canvas        #F7F4EF
--bg-surface       #FFFDFA
--bg-raised        #FBF9F5
--bg-sunken        #F4EFE6
--bg-scan          #F0EBE3
```

### Borders

```text
--line-soft        #F3EDE4
--line-subtle      #F0EAE0
--line-inner       #EFE8DE
--line-default     #EBE4D9
--line-control     #E4DCD0
--line-nav         #EDE6DB
--line-strong      #DCCFBE
```

### Ink

```text
--ink-strong       #2A2622
--ink-body         #4A443D
--ink-mid          #5A544C
--ink-secondary    #6F675E
--ink-muted        #8B837A
--ink-tertiary     #A09488
--ink-faint        #BCB1A3
```

### Brand colours

```text
--rust-900         #9E3A24
--rust-900-hover   #8A3120

--rust-600         #B4573F
--rust-600-hover   #8E4230

--coral-500        #E08A72
--coral-500-hover  #D2795F
--coral-400        #EC9A82
```

Rust represents:

```text
human commitment
primary decision
selected human-controlled state
attention / needs-focus state
```

Coral represents:

```text
AI action
AI generation
machine work
accepting machine-produced work
```

Do not use coral as a generic secondary brand colour.

---

# 6. AI Surface Tokens

```text
--panel            #1B1917
--panel-card       #232120
--panel-fill       #282522
--panel-fill-2     #2C2926
--panel-line       #2C2925
--panel-line-2     #3A362F

--panel-heading    #FBF9F5
--panel-body       #CFC7BC
--panel-dim        #A8A096
--panel-muted      #8F877D
--panel-faint      #6E665D
```

On-panel semantic colours:

```text
positive
text        #9FC0A2
background  #22301F
border      #3E5540

risk
text        #E0A692
background  #3A2119
border      #4A2C21

high priority
text        #F0BCAB
background  #5E2418
```

Do not nest a full dark AI panel inside another dark AI panel.

Use:

```text
#232120
#282522
```

for nested cards or controls instead.

---

# 7. Semantic Learning Colours

```text
SECURE / POSITIVE
text        #5C7A63
bar         #93A896
background  #E4EDE4
on-bg       #4A6B50

DEVELOPING
text        #7A6238
bar         #D8B384
background  #F3EBDD

NEEDS FOCUS / RISK
text        #9E3A24
bar         #B4573F
background  #F7E3DC

NEUTRAL / INACTIVE
text        #6F675E
background  #F0EAE0
```

Where mastery thresholds are used, follow the canonical thresholds in:

```text
references/mastery-bars-charts.md
```

Do not create a second mastery scale.

---

# 8. Accent Tints

```text
--tint-rust        #F4E4DE
--tint-rust-line   #E0B9AC
--tint-rust-soft   #F1D9D1
--tint-rust-page   #FDF6F3
--tint-rust-edge   #F0DCD4
```

Use these for:

* active navigation
* selected chips
* selected cards
* actionable count badges
* focus areas
* AI PICK / AI ADDED states where specified

---

# 9. Background Discipline

Default maximum:

```text
two major background families per screen
```

Usually:

```text
warm canvas
+
near-black AI surface where AI speaks
```

Do not turn every section into a differently coloured block.

Structure should primarily come from:

* spacing
* borders
* hierarchy
* typography
* surface elevation

not decorative background variety.

---

# 10. Typography

Use:

```text
Playfair Display
→ display headings and important figures

DM Sans
→ interface text

Caveat
→ student handwriting simulation only
```

Never use Caveat for interface text.

## Canonical roles

```text
page-title-hero
Playfair · 38px · 500 · -.02em

page-title
Playfair · 34px · 500 · -.02em

step-title
Playfair · 31px · 500 · -.02em

section-title
Playfair · 20–21px · 500

metric-value
Playfair · 31–34px · 500

metric-value-lg
Playfair · 44px · 600

quote / insight headline
Playfair · 21px · 500

body
DM Sans · 14.5px · 400

body-sm
DM Sans · 13.5px · 400/500

body-xs
DM Sans · 12.5–13px · 400

meta
DM Sans · 11.5px · 400/500

meta-sm
DM Sans · 11px · 400

eyebrow
DM Sans · 10.5px · 600 · .13em

column-head
DM Sans · 10.5px · 600 · .09em

badge
DM Sans · 9.5px · 700 · .05em
```

Use serif type for:

* page names
* section names
* major figures
* insight headlines

Do not use serif type for:

* buttons
* badges
* navigation labels
* field labels
* table labels
* controls

---

# 11. Text Rhythm

Body prose:

```text
line-height 1.6–1.7
```

Dense metadata:

```text
line-height 1.35–1.45
```

Display values:

```text
line-height 1.0–1.15
```

Use:

```css
text-wrap: pretty;
```

for prose where supported.

Keep UI copy concise enough that the tutor can scan the screen during
active teaching.

---

# 12. Spacing

Canonical spacing scale:

```text
4
6
8
10
12
14
16
18
20
22
24
26
30
34
```

Typical usage:

```text
page padding      30px
card padding      20–24px
section gap       20–22px
card gap          14–16px
```

Avoid arbitrary one-off spacing values unless matching an existing
component.

Use `gap` for sibling spacing wherever practical.

---

# 13. Radius

```text
20px+  pills, badges, chips, progress tracks

14px   major card / panel

12px   inner card / nested card / callout

10px   primary button / secondary button

9px    control / select / 34px icon button

8px    compact control / segmented item

7px    28–30px icon button

5px    progress bar fill

50%    avatar / AI mark

3px    scanned paper
```

Do not introduce random radius values merely to differentiate
components.

---

# 14. Elevation

Borders carry most structural hierarchy.

Shadows are limited.

Canonical examples:

```text
button
0 1px 2px rgba(42,38,34,.12)

raised element
0 1px 3px rgba(42,38,34,.12)

paper
0 4px 16px rgba(42,38,34,.13)

toast
0 12px 34px rgba(42,38,34,.28)

segmented active item
0 1px 2px rgba(42,38,34,.08)
```

Do not:

* glow controls
* apply large decorative shadows
* shadow every card
* use shadows on dark AI panels

Dark AI panels rely on value contrast, not elevation shadows.

---

# 15. Hover Behaviour

Cards:

```text
border → #DCCFBE
translateY(-2px)
transition ≈ .18s
```

Rows:

```text
background → #FBF7F1
```

Do not:

* scale cards
* glow cards
* rotate icons decoratively
* use exaggerated motion

---

# 16. Motion

Canonical motion:

```text
fadeUp
.35s ease both

toastIn
.3s cubic-bezier(.2,.8,.3,1)

chart grow
.5s cubic-bezier(.2,.8,.3,1)

notification pulse
2s infinite

mastery bar
width .6–.7s cubic-bezier(.2,.8,.3,1)
```

Motion must communicate:

* arrival
* progress
* state change
* completion
* attention

Do not add motion purely as decoration.

Respect reduced-motion preferences when implemented in production.

---

# 17. Icons

Use inline SVG or the repository's established icon system where it
can faithfully reproduce this visual language.

Desired visual character:

```text
24px source grid
1.7–1.8 stroke
round line caps
round joins
currentColor
13–17px typical rendered size
```

Do not use:

* emoji as interface icons
* decorative illustration as a substitute for student work
* inconsistent icon families on the same screen

Student scans are the primary imagery of the product.

---

# 18. Data Presentation

Numbers shown in different parts of the interface must represent the
same underlying state.

Do not hardcode values independently in different components.

Examples:

```text
pending review count
student mastery
weak topic
worksheet submission count
improvement delta
```

should be derived from the same authoritative application state.

Use tabular numerals for columns or groups of numeric values where
alignment improves scanning.

---

# 19. Tutor Workflow Principle

The product is one connected learning cycle:

```text
Monitor learning
    ↓
Identify weakness
    ↓
Generate personalised practice
    ↓
Upload student work
    ↓
OCR / extract
    ↓
AI marking suggestion
    ↓
Tutor approval
    ↓
Update learning profile
    ↓
Generate better future practice
    ↺
```

Read:

```text
references/flows.md
```

whenever work changes more than one screen or affects navigation
between stages.

A flow is incomplete if the UI merely navigates between mock states
without propagating meaningful state.

---

# 20. Connection Rules

Interactive summaries must lead to the work they summarize.

Examples:

```text
metric card
→ screen that resolves that metric

AI insight action
→ relevant task with useful context already filled

student name
→ student profile

class name
→ class view

worksheet status
→ action appropriate to that status

pending review badge
→ AI Review
```

Do not build decorative metrics or dead-end insights.

Deep links should preserve useful context.

If the tutor already selected:

```text
student
class
subject
topic
worksheet
```

do not force them to re-enter the same information unless the workflow
requires confirmation.

---

# 21. Content and Voice

Read:

```text
references/content-voice.md
```

for user-visible copy.

Default tone:

```text
plain
factual
specific
professional
actionable
```

Prefer:

```text
Bella's mastery rose 4% after this worksheet.
```

over:

```text
Great news! Bella is making awesome progress!
```

Avoid:

```text
AI-powered
seamlessly
empower
leverage
insights at your fingertips
```

Do not use exclamation marks or emoji in product UI.

AI copy should normally establish:

```text
finding
+
evidence
+
stake / next implication
```

Where practical, every AI insight should end in an actionable next step.

---

# 22. Curriculum Language

Use genuine product-domain vocabulary.

Examples:

```text
OEQ
MCQ
Structured

Booklet A
Booklet B

Primary 4
Primary 5
Primary 6
PSLE Prep

mark scheme
marking points
keyword
phrasing
technique
mastery
weak topic
```

Do not mix unrelated educational contexts in a single demo.

Student answers should look plausibly student-written when demonstrating
marking or OCR.

Do not use lorem ipsum or placeholder phrases such as:

```text
Question text here
Sample student
Sample text
```

when realistic domain content is expected.

---

# 23. Responsive Behaviour

Read:

```text
references/layout-responsive.md
```

for responsive screens.

The product is desktop-first but narrow layouts must remain fully
functional.

Canonical breakpoints:

```text
< 1280px
compact table / information treatment

< 880px
narrow navigation treatment
```

Do not remove information merely because the viewport is smaller.

Fold lower-priority values into secondary text when specified rather
than hiding meaning completely.

---

# 24. Accessibility

Visual fidelity must not override usability or accessibility.

When this skill is used together with an `accessibility` skill:

> **Accessibility requirements override purely cosmetic design rules
> where a conflict exists.**

Preserve the Lumina visual identity while maintaining keyboard,
focus, semantic, and assistive-technology usability.

Examples:

* interactive elements must be keyboard reachable;
* icons cannot be the sole source of meaning when text is required;
* focus must remain visibly identifiable;
* colour must not be the only way critical information is conveyed;
* disabled controls must explain what unlocks them where appropriate;
* generated updates should be communicated appropriately to assistive
  technology where relevant.

Do not remove an accessible interaction solely to reproduce a prototype
more literally.

---

# 25. Production Implementation Rules

The values and behaviours in this skill are authoritative.

The example HTML and inline styles in the reference files communicate:

* visual appearance
* component anatomy
* interaction semantics
* spacing
* state behaviour

They do **not** automatically dictate the application's production
implementation technique.

Before implementing UI:

1. inspect the repository's existing frontend architecture;
2. inspect existing components;
3. inspect styling conventions;
4. inspect existing design tokens or theme structures;
5. identify reusable behaviour;
6. identify nearby tests.

Then implement using the repository's established architecture.

## If the repository uses reusable components

Prefer:

```text
existing Button
existing Badge
existing Card
existing Input
existing Table
existing Modal
existing layout primitives
```

when they can be adapted without violating this design system.

Do not create duplicate primitives merely because a reference file
contains raw HTML.

## If the repository uses CSS modules

Use CSS modules.

## If the repository uses Tailwind

Use the established Tailwind approach.

## If the repository uses styled-components or equivalent

Follow the existing pattern.

## If the repository already uses inline styles

Inline styles may continue to be appropriate.

Do not introduce a new styling technology merely to implement this
skill.

---

# 26. Prototype vs Production

The reference files may contain prototype-oriented implementation
examples.

For prototypes, a direct literal implementation is acceptable when
requested.

For production code:

```text
design semantics are authoritative;
example implementation syntax is illustrative.
```

Production concerns such as:

* reuse
* type safety
* maintainability
* accessibility
* performance
* testability

must be handled using the relevant engineering skills and repository
conventions.

---

# 27. State Ownership

This design skill may specify **what state should visibly change**.

It does not decide:

* database schema
* transaction boundaries
* backend source of truth
* API ownership
* persistence strategy

If UI work involves changing authoritative learning state, load the
appropriate engineering skills such as:

```text
data-integrity
ai-human-approval
api-contracts
database-and-migrations
```

Do not invent backend behaviour from a visual example.

---

# 28. AI Approval Boundary

When implementing AI-related UI, preserve the distinction:

```text
suggested
≠
approved
```

An AI recommendation becoming visually available must not be treated as
proof that it has been persisted.

Where the tutor must approve machine work:

* show that approval is required;
* show what remains unapproved;
* keep the machine suggestion visible if the tutor overrides it;
* communicate when the change becomes authoritative.

Read:

```text
references/ai-marking-panels.md
references/ocr-confidence.md
references/flows.md
```

for the specific interaction.

---

# 29. Feedback States

Every meaningful asynchronous or destructive interaction should have an
appropriate state.

Read:

```text
references/feedback-states.md
```

for:

* toast
* loading
* empty
* error
* modal
* blocked action

General principle:

> Tell the tutor what happened and what to do next.

Prefer:

```text
Question 2 approved at 2.0/2.0.
```

over:

```text
Saved.
```

Prefer:

```text
Page 3 could not be read — the scan is too dark.
Re-scan that page or upload a photo.
```

over:

```text
Something went wrong.
```

---

# 30. Loading Behaviour

Content loading should generally preserve the expected screen shape.

Use skeletons where specified.

Machine work should name what it is doing.

Prefer:

```text
Reading page 2 of 3…
```

or:

```text
Extracting handwriting…
```

over:

```text
Loading…
```

Do not imply deterministic progress when actual progress is unknown.

---

# 31. Empty States

Empty states should help the tutor create or resolve the missing state.

Avoid:

```text
No data available.
```

Prefer:

```text
No worksheets yet.

Generate a worksheet targeted at this class's weak areas.
```

An empty state should normally contain:

```text
what is absent
why it matters
what action fills it
```

---

# 32. Component Consistency

Before creating a new variant, check whether the concept already maps to:

```text
button role
status badge
mastery state
worksheet status
chip
metric
AI panel
feedback state
```

Do not create new visual vocabulary for an existing semantic concept.

Examples:

* do not invent a fourth learning-status badge unless product logic
  genuinely gains a fourth state;
* do not invent a new primary-button colour;
* do not invent another AI-panel treatment;
* do not create another mastery colour scale.

Consistency has higher priority than local novelty.

---

# 33. Review Checklist

Before declaring Lumina UI work complete, verify:

## Design

* [ ] Correct light-versus-dark semantic surface
* [ ] Correct rust-versus-coral action meaning
* [ ] Correct typography hierarchy
* [ ] Correct spacing and radius family
* [ ] No unnecessary shadows
* [ ] No decorative colour drift
* [ ] Correct component reference followed

## Content

* [ ] Copy is factual and concise
* [ ] No lorem ipsum
* [ ] No unnecessary marketing language
* [ ] AI suggestions are clearly identified
* [ ] Numbers agree with visible application state
* [ ] Domain vocabulary is realistic

## Behaviour

* [ ] Action leads somewhere useful
* [ ] Existing context is carried forward
* [ ] Loading behaviour exists where necessary
* [ ] Error behaviour exists where necessary
* [ ] Empty behaviour exists where necessary
* [ ] Disabled actions explain their requirements where appropriate
* [ ] Tutor approval boundaries remain intact

## Responsive

* [ ] Desktop layout works
* [ ] Compact layout remains legible
* [ ] Narrow layout remains functional
* [ ] Important information is folded rather than silently discarded

## Accessibility

* [ ] Keyboard interaction works
* [ ] Focus remains visible
* [ ] Controls have meaningful labels
* [ ] Colour is not the sole carrier of critical meaning
* [ ] Motion does not prevent use
* [ ] Relevant accessible semantics are preserved

## Engineering

* [ ] Existing components were reused where appropriate
* [ ] Existing styling architecture was respected
* [ ] No duplicate design primitive was introduced unnecessarily
* [ ] No backend behaviour was invented from design examples
* [ ] Relevant automated tests were run

---

# 34. Reference Index

Component specifications live under:

```text
references/
```

Available references:

```text
navigation.md
buttons.md
metric-cards.md
ai-insight-panels.md
status-badges.md
mastery-bars-charts.md
student-cards.md
worksheet-cards.md
question-cards.md
ocr-confidence.md
ai-marking-panels.md
filters-controls.md
steppers.md
feedback-states.md
layout-responsive.md
content-voice.md
flows.md
```

Load only what the task requires.

When multiple references apply, treat this `SKILL.md` as the global
foundation and the component reference as the specific implementation
contract.

If two component references appear to conflict:

1. preserve the Core Principle;
2. preserve human-versus-AI semantics;
3. preserve product flow correctness;
4. follow the more task-specific component reference;
5. report unresolved ambiguity instead of inventing a third pattern.

---

# 35. Final Principle

Lumina should feel calm even when the underlying system is complex.

The visual hierarchy exists so the tutor can answer three questions
without thinking about the interface:

```text
What happened?

What needs my attention?

What should I do next?
```

Every screen, component, AI suggestion, status and action should make
those answers easier to see.

```
```
