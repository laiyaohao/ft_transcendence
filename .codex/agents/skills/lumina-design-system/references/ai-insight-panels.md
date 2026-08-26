# Skill · AI Insight panels

The signature component. A near-black panel is the machine's voice — it appears wherever
AI interprets data, and nowhere else.

## Why dark

The tutor must never confuse a suggestion with a fact. Surface colour does that work
pre-attentively, before any label is read. This is the system's core promise; do not put AI
output on a light card "for consistency."

## Standard panel

```html
<div style="background:#1B1917;border-radius:14px;padding:24px 26px;color:#E8E2D9">
  <div style="display:flex;align-items:center;gap:9px;margin-bottom:14px">
    <span style="width:20px;height:20px;border-radius:50%;background:#E08A72;
      display:grid;place-items:center;flex:0 0 auto">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#1B1917">
        <path d="M12 2l2.2 6.4L21 10.5l-5.4 4L17 21l-5-3.4L7 21l1.4-6.5L3 10.5l6.8-2.1z"></path>
      </svg>
    </span>
    <span style="font-family:'Playfair Display',serif;font-size:19px;font-weight:500;
      color:#FBF9F5">AI Insight</span>
  </div>
  <p style="margin:0 0 8px;font-size:14.5px;line-height:1.65;color:#CFC7BC;max-width:52ch">
    Six students may need keyword-focused practice this week.
  </p>
  <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#8F877D;max-width:52ch">
    Adaptation and Energy Conversion are driving it. A 12-question drill covers both.
  </p>
  <button style="background:none;border:none;padding:0;cursor:pointer;color:#E08A72;
    font-size:13.5px;font-weight:500;display:flex;align-items:center;gap:7px"
    style-hover="gap:11px">
    Review these students
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"><path d="M5 12h13M12 5l7 7-7 7"></path></svg>
  </button>
</div>
```

The coral disc with a black sparkle is the AI mark. It is the only place coral appears as a
fill on dark. ```max-width:52ch``` keeps insight prose readable — never let it run the full
panel width.

**Every insight ends in an action.** An observation the tutor cannot act on is noise. The
link hover widens its ```gap``` rather than moving the whole button.

## Eyebrow variant

For sidebar stacks, replace the serif heading with an eyebrow above the panel group:

```html
<div style="display:flex;align-items:center;gap:8px;font-size:10.5px;letter-spacing:.13em;
  font-weight:600;color:#A09488">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#E08A72"><path d="M12 2l1.9 5.6..."/></svg>
  AI INSIGHT
</div>
```

## Stacked insight card

Multiple findings, each with a priority tag and a "why it matters" footer:

```html
<div style="background:#1B1917;border-radius:12px;padding:16px 18px">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;
    margin-bottom:9px">
    <span style="font-size:13.5px;font-weight:600;color:#FBF9F5">Adaptation Keywords</span>
    <span style="font-size:9.5px;font-weight:700;letter-spacing:.05em;padding:3px 8px;
      border-radius:20px;background:#5E2418;color:#F0BCAB;flex:0 0 auto;
      white-space:nowrap">HIGH PRIORITY</span>
  </div>
  <p style="margin:0 0 10px;font-size:12.5px;line-height:1.6;color:#A8A096">
    60% of students struggle connecting structural adaptations to survival advantage.
  </p>
  <div style="font-size:11px;color:#7A7268;border-top:1px solid #2C2925;padding-top:9px">
    Worth 6–8 marks in Booklet B every paper.
  </div>
</div>
```

Priority tags: ```HIGH PRIORITY``` ```#F0BCAB``` on ```#5E2418``` · ```MONITOR```
```#B5ADA2``` on ```#33302A``` · ```WATCH``` ```#B5ADA2``` on ```#2C2A26```.
Max three insights per stack — a fourth means the ranking isn't working.

The footer line answers "why does this matter to me today". Tie it to marks, exams, or
frequency — never restate the finding.

## Suggested-actions variant

Insight prose ```flex:1```, then an eyebrow ```SUGGESTED ACTIONS``` at ```#7A7268```, then
stacked panel buttons with a coral trailing arrow. Two to three actions; each must deep-link
with context pre-filled, never dump the tutor on a blank form.

## Rules

- Dark panels never nest inside dark panels. Use ```#232120``` or ```#282522``` cards instead.
- Never a shadow on a dark panel — the value contrast is the elevation.
- Never a chart inside an insight panel. Insight is prose plus an action.
- Label machine output explicitly where a number could be mistaken for a decision:
  "Suggestion only — not saved" at ```10px #6E665D```.
