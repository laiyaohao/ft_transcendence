# Skill · The personalised-learning cycle

The product is one loop, not eleven screens. Every screen exists to move the tutor around it.

```
Monitor learning → Identify weakness → Generate personalised practice →
Upload student work → AI marks → Tutor approves → Update learning profile →
Generate better future practice ↺
```

The loop must **close**: approving marking changes the profile, and the changed profile
changes the next worksheet the AI proposes. A prototype that only navigates between mockups
demonstrates screens; a prototype that closes the loop demonstrates the product.

## Screen inventory

```
Dashboard          triage — what needs me today
My Classes         grid of classes with mastery and attention counts
Class view         mastery chart · AI insights · student progress · recent worksheets
Students           roster across all classes, filterable and sortable
Student profile    summary cards · learning profile · topic map · AI insight · mistakes
Worksheet wizard   Select → Configure → AI Preview → Edit → Export
Upload             drag-drop, multi-page, submission details
OCR review         split screen, confidence states, per-answer confirmation
AI marking         question · analysis · tutor decision · save gate
Worksheets         central index with status filters
Reports            class level and student level
Question Bank      searchable, taggable source for the editor
Settings           AI behaviour and guardrails
```

## Flow A · Monitor a class

```Dashboard → My Classes → Class → Student → Student profile```

Progressive disclosure: counts → class mastery → per-student status → full profile. Each
level answers "who needs me" one notch more precisely. Every metric card and insight action
is a shortcut into this chain.

## Flow B · Generate a class worksheet

```Class → Generate Worksheet → Configure → AI Preview → Edit → Approve → Export```

Launching from a class **skips Select** and pre-fills subject, level and the two weakest
topics. AI Preview justifies the structure before any question is written — question mix,
per-topic counts, and why. Editing is full control: reorder, edit, replace, remove, add from
bank, generate another.

## Flow C · Generate a personalised worksheet

```Student profile → Generate Worksheet → AI Recommendation → Preview → Edit → Approve → Export```

Same wizard, different reasoning. The AI panel must cite **that student's** data: weakest
topic and its percentage, their repeated mistake, their learning profile. The question mix
shifts (more foundation for a student who fails on phrasing rather than knowledge), and the
personal note names what was added and why.

If a student worksheet and a class worksheet produce identical reasoning, the personalisation
is fake.

## Flow D · Upload and mark

```Upload → OCR Review → Confirm → AI Marking → Tutor Review → Save & Update Learning Profile```

The long flow, and the product's proof. Gates in order:

1. Continue is disabled until pages are attached.
2. Confirm OCR is blocked until every low-confidence answer is verified.
3. Save is blocked until every question is approved.
4. Saving recomputes mastery, topic map, weak areas, mistake history and pending count, then
   lands on the profile with ```UPDATED ±n``` badges on the topics that moved.

## Flow E · Review pending marking

```Dashboard → Pending Reviews → AI Review → Review → Approve → Next → Save```

The express lane into step 3 of Flow D. The dashboard's Pending Review metric, the topbar
bell, and the sidebar AI Review badge all land here — a pending count that isn't clickable is
just decoration.

## Connection rules

Every one of these must resolve:

- Metric cards → the screen that resolves the number
- AI insight actions → the pre-filled work, not a blank form
- Student name, anywhere → their profile
- Class name, anywhere → that class
- Worksheet status → the action that state needs
- Pending badges (bell, sidebar, metric) → AI Review

Deep links carry context. "Generate Keyword Drill" from a profile opens the wizard at
Configure with that student, their weakest topic, 12 questions and Keyword Drill selected —
not the first step of an empty form.

## State that must be real

```
mastery per topic          recomputed from approved marking
overall mastery            mean of topic mastery
improvement delta          signed, derived from the change
weak topic                 lowest-mastery topic, computed everywhere it appears
worksheets completed       incremented on save
mistake history            prepended on save
pending review count       decremented on save, drives three separate badges
```

Never hardcode a number that another screen derives. A dashboard reading "5 need attention"
against a roster of 2 is the fastest way to lose a demo.

## Prototype honesty

Unbuilt branches respond with a toast describing what would happen. A click that does
nothing reads as broken; a click that explains itself reads as scoped.
