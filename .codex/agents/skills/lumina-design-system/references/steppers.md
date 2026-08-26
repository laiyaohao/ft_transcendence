# Skill · Workflow steppers

Multi-step flows always show all steps up front. A tutor uploading a worksheet needs to know
that marking comes after review before they start.

## Markup

```html
<div style="display:flex;align-items:center;gap:0;margin-bottom:34px;padding:0 6px">
  <!-- per step -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;position:relative">
    <div style="position:absolute;top:14px;left:0;right:0;height:2px;background:#9E3A24"></div>
    <button style="position:relative;width:29px;height:29px;border-radius:50%;
      border:2px solid #9E3A24;background:#9E3A24;color:#FBF9F5;font-size:11.5px;
      font-weight:700;display:grid;place-items:center;cursor:pointer;z-index:2">✓</button>
    <div style="font-size:11.5px;font-weight:600;color:#2A2622;margin-top:9px;
      white-space:nowrap">Configure</div>
  </div>
</div>
```

The connector is absolutely positioned at ```top:14px``` (the dot's vertical centre) behind a
```z-index:2``` dot, so it reads as one continuous track.

## States

```
COMPLETE   dot bg #9E3A24 · text #FBF9F5 · ring #9E3A24 · line #9E3A24 · label #2A2622/400 · mark ✓
CURRENT    dot bg #FFFDFA · text #9E3A24 · ring #9E3A24 · line #E4DCD0 · label #2A2622/600 · mark n
UPCOMING   dot bg #F4EFE6 · text #BCB1A3 · ring #E4DCD0 · line #E4DCD0 · label #A09488/400 · mark n
```

Weight, not colour, marks the current step — 600 on the label. Completed steps show a tick
and drop back to 400: done is not the same as here.

## Behaviour

```js
onClick: i => { if (i <= activeIndex) goToStep(i); }   // back only
```

Completed steps are clickable, upcoming ones are not — forward movement must go through the
flow's own action so validation and generation actually run. Reuse one builder:

```js
stepper(labels, activeIndex, onJump)
```

## The two flows

```
Worksheet   Select → Configure → AI Preview → Edit → Export
Marking     Upload → OCR Review → Confirm → AI Marking
```

Five steps is the ceiling. Both flows enter mid-stepper when launched with context — "Generate
Worksheet" from a class opens at **Configure** with subject, level and weak topics pre-filled,
because the Select step is already answered.

## Rules

- Never hide future steps, never add a step count ("Step 2 of 5") — the stepper *is* the count.
- Labels are one or two words, ```white-space:nowrap```, never truncated.
- Step titles below the stepper are Playfair 31px/500 and phrased as the tutor's task
  ("Who is this worksheet for?"), not the system's ("Target selection").
- The final step is a confirmation screen, not a sixth form: centred 58px green tick well,
  what was made, and where to go next.
