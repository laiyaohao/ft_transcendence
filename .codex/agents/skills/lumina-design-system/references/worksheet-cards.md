# Skill · Worksheet cards & lists

Worksheets appear as compact cards in class sidebars and as rows in the Worksheets index.
Both carry the same four-state status vocabulary and lead to state-appropriate actions.

## Sidebar card

Left border encodes state at a glance:

```html
<div style="background:#FFFDFA;border:1px solid #EBE4D9;border-radius:12px;padding:14px 16px;
  border-left:3px solid #93A896">
  <div style="font-size:13.5px;font-weight:500;margin-bottom:7px;line-height:1.35">
    Plant Transport Revision Exercise
  </div>
  <div style="display:flex;align-items:center;gap:14px;font-size:11.5px;color:#8B837A">
    <span>Oct 05</span>
    <span style="display:flex;align-items:center;gap:5px;color:#5C7A63">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"></path></svg>
      15/15 graded
    </span>
  </div>
</div>
```

```
graded / marked   left border #93A896 · status text #5C7A63
awaiting tutor    left border #E08A72 · status text #B4573F
```

Show submission counts as ```n/total```, not a percentage — a tutor needs to know *who* is
missing, and the fraction implies that.

## Index row

Five columns: ```1fr 130px 110px 120px 190px``` — worksheet, class, date, status, actions.
Title 13.5px/500 with an 11px ```#A09488``` meta line beneath ("20 questions · 28 marks").

Actions are per-state and never more than two:

```
Generated   Edit · Export
Assigned    Upload · Edit
Submitted   Review marking · View
Marked      View · Export
```

The state-advancing action gets the tinted treatment
(```bg #F4E4DE```, ```border #E0B9AC```, ```color #9E3A24```); the rest stay neutral
(```#FBF9F5``` / ```#E4DCD0``` / ```#5A544C```). One tinted action per row, so the eye lands
on the next step.

## Filters

Status chips left, dropdown selects right, separated by ```<div style="flex:1"></div>```.
Chips are the primary filter and default to "All"; selects (class, topic, term) are
secondary. See [filters-controls.md](filters-controls.md).

## Create affordance

Closing card in any worksheet list — dashed, centred, with an icon well:

```html
<button style="background:#FFFDFA;border:1px dashed #DCCFBE;border-radius:12px;
  padding:22px 16px;cursor:pointer;text-align:center" style-hover="background:#F9F4EC">
  <span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;
    background:#F4EFE6;margin:0 auto 10px">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4573F"
      stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
  </span>
  <span style="display:block;font-size:13.5px;font-weight:500;margin-bottom:5px">
    Create New Material</span>
  <span style="display:block;font-size:11.5px;color:#8B837A;line-height:1.5">
    Generate worksheets targeted at this class's weak areas.</span>
</button>
```

The sub-line states *what the AI will use* — the affordance sells the personalisation.

## Export card

Post-approval confirmation: a 38×48px page glyph (```#F4EFE6``` ground, ```#E4DCD0``` border,
rust document icon), title, ```11.5px #A09488``` spec line ("PDF · answer key included · 20
questions"), divider, then three equal secondary buttons at ```flex:1 1 150px``` —
Download PDF · Assign to students · Print.

## Rules

- Title worksheets as a tutor would name them: level, subject, topic, type —
  "P5 Science — Adaptation Mini Test". Never "Worksheet #4".
- Personalised sheets name the student first: "Bella Tan — Adaptation Keyword Drill".
- Always show marks alongside question count; PSLE tutors think in marks.
- Never a thumbnail preview of the worksheet in a list row.
