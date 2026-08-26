# Skill · Topic mastery bars & charts

Data visualisation is deliberately minimal: bars and columns only, in three semantic
colours, with the number always shown as text beside the graphic.

## The mastery scale

```js
const barColorFor = pct => pct < 55 ? '#B4573F' : pct < 72 ? '#D8B384' : '#93A896';
```

```
< 55%    #B4573F   needs focus
55-71%   #D8B384   developing
72%+     #93A896   secure
```

These thresholds are pedagogical, not cosmetic. Use this one function everywhere — a topic
at 54% must be the same colour in a chart, a table, a report, and a profile.

## Inline bar

```html
<span style="display:flex;justify-content:space-between;font-size:11.5px;color:#6F675E;
  margin-bottom:6px">
  <span>Class mastery</span><span style="font-weight:600;color:#2A2622">68%</span>
</span>
<span style="display:block;height:5px;background:#F0EAE0;border-radius:20px;overflow:hidden">
  <span style="display:block;height:100%;width:68%;background:#93A896;border-radius:20px"></span>
</span>
```

Track ```#F0EAE0```, height 4–8px, pill radius, ```overflow:hidden``` on the track. Always
pair with the numeral — a bar alone cannot be read precisely, and tutors quote percentages
to parents.

## Topic mastery row

The profile pattern: percentage left, name and bar right, focus rows tinted.

```html
<div style="border:1px solid #F0DCD4;background:#FDF6F3;border-radius:10px;padding:13px 16px;
  display:flex;align-items:center;gap:16px">
  <span style="font-size:14px;font-weight:600;color:#9E3A24;width:44px;flex:0 0 auto;
    font-variant-numeric:tabular-nums">45%</span>
  <span style="flex:1;min-width:0">
    <span style="display:flex;align-items:center;gap:9px;margin-bottom:7px">
      <span style="font-size:13px;font-weight:500">Living Things &amp; Environment</span>
      <span style="font-size:9.5px;font-weight:700;letter-spacing:.05em;padding:3px 8px;
        border-radius:20px;background:#F1D9D1;color:#9E3A24">FOCUS AREA</span>
    </span>
    <span style="display:block;height:4px;background:#F0EAE0;border-radius:20px;overflow:hidden">
      <span style="display:block;height:100%;width:45%;background:#B4573F;border-radius:20px;
        transition:width .7s cubic-bezier(.2,.8,.3,1)"></span>
    </span>
  </span>
</div>
```

Below 55%: row ground ```#FDF6F3```, border ```#F0DCD4```, figure ```#9E3A24```, plus the
FOCUS AREA badge. At or above: ```#FFFDFA``` / ```#EFE8DE``` / ```#4A443D```.
```font-variant-numeric:tabular-nums``` on every percentage column so digits align.

Sort descending by mastery. The weakest topic lands last, next to the actions that fix it.

## Column chart

```html
<div style="display:flex;align-items:flex-end;gap:12px;height:190px;padding-bottom:2px">
  <!-- per column -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:9px;
    height:100%;justify-content:flex-end">
    <span style="font-size:11.5px;font-weight:600;color:#6F675E">78%</span>
    <div style="width:100%;height:121px;background:#93A896;border-radius:5px 5px 2px 2px;
      transform-origin:bottom;animation:grow .5s cubic-bezier(.2,.8,.3,1) both"></div>
  </div>
</div>
<!-- labels in a separate row, border-top #F0EAE0, padding-top 11px -->
```

Height in px = ```mastery × 1.55``` against a 190px plot. Value labels sit **above** each
column; category labels live in a separate bordered row beneath, at 10.5px ```#8B837A```,
```line-height:1.35``` so two-word topics wrap cleanly. Six columns maximum.

No axes, no gridlines, no y-scale, no tooltips. The label and the value are already there.

## Report bar row

Horizontal variant for reports — fixed 96px label, flexible 8px bar, 34px right-aligned value:

```html
<div style="display:flex;align-items:center;gap:14px">
  <span style="font-size:12.5px;width:96px;flex:0 0 auto;color:#4A443D">Adaptation</span>
  <span style="flex:1;height:8px;background:#F0EAE0;border-radius:20px;overflow:hidden">
    <span style="display:block;height:100%;width:52%;background:#B4573F;border-radius:20px"></span>
  </span>
  <span style="font-size:12.5px;font-weight:600;width:34px;text-align:right;
    flex:0 0 auto">52%</span>
</div>
```

## Legend

Only where thresholds need stating — reports, not profiles. 9px squares at ```border-radius:2px```,
11.5px ```#8B837A``` labels, ```border-top #F0EAE0``` above:

```
■ Secure (72%+)   ■ Developing   ■ Needs focus (<55%)
```

## Rules

- Three colours, no gradients, no opacity ramps, no per-topic hues.
- Never a pie, donut, radar, or stacked bar. Question-mix proportions use stacked
  **rows** of individual bars, not a stacked bar.
- Animate ```width``` on change so approved marking visibly moves the bar.
- Round to whole percentages. No decimals in mastery figures anywhere.
