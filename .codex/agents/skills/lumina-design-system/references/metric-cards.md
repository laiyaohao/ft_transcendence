# Skill · Metric cards

The dashboard's top row and every summary strip. A metric card is a **link to the work**,
not a readout — if a number has no destination, it doesn't earn a card.

## Anatomy

```html
<button style="text-align:left;background:#FFFDFA;border:1px solid #EBE4D9;border-radius:12px;
  padding:16px 18px 18px;cursor:pointer;transition:border-color .18s,transform .18s"
  style-hover="border-color:#DCCFBE;transform:translateY(-2px)">
  <div style="font-size:11.5px;font-weight:500;color:#6F675E;letter-spacing:.02em;
    margin-bottom:10px">Pending Review</div>
  <div style="font-family:'Playfair Display',serif;font-size:34px;font-weight:500;
    line-height:1;color:#B4573F">12</div>
  <div style="font-size:11px;color:#A09488;margin-top:8px">AI marking awaiting you</div>
</button>
```

Three tiers, always in this order: **label → figure → context**. The context line is not
optional; a bare number invites the wrong conclusion.

## Grid

```css
display:grid; grid-template-columns:repeat(auto-fit,minmax(168px,1fr)); gap:14px;
```

```auto-fit``` + ```minmax``` means five cards reflow to 3+2 then 2+2+1 with no breakpoints.
Use ```minmax(190px,1fr)``` for four-card summary strips, ```minmax(200px,1fr)``` for reports.

## Figure colour

```
#2A2622   neutral count — classes, students, worksheets
#B4573F   a number the tutor must act on — pending reviews, students at risk
#5C7A63   a positive delta — improvement, gain
```

Only red the figure when it represents outstanding work or risk. A large neutral count in
rust reads as an alarm and burns the signal.

## Variants

**Progress metric** — add a 5px track under the figure:
```html
<div style="height:5px;background:#F0EAE0;border-radius:20px;overflow:hidden">
  <div style="height:100%;width:68%;background:#B4573F;border-radius:20px;
    transition:width .6s ease"></div>
</div>
```

**Iconed metric** — 14px stroke icon top-right at ```#BCB1A3``` (neutral), ```#7E9A83```
(positive), or ```#C68A78``` (attention). Decorative only; the icon never carries meaning
the label doesn't already state.

**Text metric** — when the value is a name not a number (Current Weak Area), drop to
Playfair 21px/500 with ```line-height:1.15``` and add a rust 11px status line beneath.

## Rules

- Figures come from live state, never hardcoded. A card reading 5 while the roster holds 2
  destroys trust in every other number on the screen.
- Card element is a ```<button>``` — the whole card is the hit target, not a "view" link.
- Never stack more than five in a row; six metrics means two of them belong elsewhere.
- No sparklines, no percentage rings, no comparison bars inside a metric card.
