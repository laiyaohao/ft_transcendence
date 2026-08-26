# Skill · Page layout & responsive behaviour

Desktop-first: a tutor works on a laptop with a class in front of them. Narrow layouts stay
fully functional, never a cut-down product.

## Page frame

```
body            display flex, min-height 100vh, bg #F7F4EF
sidebar         246px fixed (flex 0 0 246px), sticky, height 100vh
main            flex 1, min-width 0, flex column
  topbar        sticky, z 30
  content       flex 1, padding 30px, max-width 1420px
```

```min-width:0``` on ```main``` is load-bearing — without it, a wide table forces the whole
page to overflow instead of shrinking.

## The two-column content pattern

Almost every screen: a primary work area and a supporting rail.

```html
<div style="display:flex;flex-wrap:wrap;gap:20px">
  <div style="flex:1 1 460px"><!-- primary --></div>
  <div style="flex:0 1 320px"><!-- rail: AI insight, actions, secondary lists --></div>
</div>
```

```flex:1 1 460px``` + ```flex:0 1 320px``` + ```flex-wrap``` gives a two-column desktop and a
stacked narrow layout with no media query. The rail is 300–330px throughout. Use
```flex:1 1 400px``` on both halves for a true split screen (OCR review).

## Card grids

```
metrics        repeat(auto-fit,minmax(168px,1fr))  gap 14px
summary (4)    repeat(auto-fit,minmax(190px,1fr))  gap 14px
class cards    repeat(auto-fill,minmax(310px,1fr)) gap 16px
picker options repeat(auto-fill,minmax(215px,1fr)) gap 10px
```

```auto-fit``` when items should stretch to fill; ```auto-fill``` when they should hold their
size and leave a gap.

## Breakpoints

Only two, both in JS state (the layout otherwise flows):

```js
const narrow  = window.innerWidth < 880;    // sidebar → chip rail
const compact = window.innerWidth < 1280;   // tables fold columns
```

Attach one resize listener, compare before ```setState```, remove on unmount.

## Column folding

Wide tables must not squeeze — they **drop columns and fold the values into the row's
subtitle**:

```js
stuGrid: compact
  ? 'minmax(150px,1fr) 116px 118px'
  : 'minmax(210px,1fr) 130px 140px 92px 118px 112px'

rowMeta: compact
  ? className + ' · ' + weakTopic + ' ' + weakPct + '% · ' + improvement
  : className + ' · ' + completed + ' sheets'
```

Three rules that make this safe:

1. **Header and rows share one ```grid-template-columns``` string** from a single variable —
   two copies always drift.
2. **The name column always has a ```minmax()``` floor** so it can never collapse to nothing.
3. **No information is lost** — folded values move into the subtitle line, they don't vanish.

Wrap folded cells in the same conditional as their header cell so the grid never
mismatches its columns.

## Truncation

```
names, titles   min-width:0 + white-space:nowrap + overflow:hidden + text-overflow:ellipsis
badges, values  never truncate — fold the column instead
prose           never truncate — let the card grow
```

```min-width:0``` on every flex child that contains truncatable text; ellipsis silently fails
without it.

## Narrow layout

- Sidebar → horizontal scrolling chip rail under the topbar.
- Two-column sections stack; the rail follows the primary content.
- Page padding stays 30px; card padding may drop to 18–20px.
- Split screens (OCR) stack scan above extracted data.
- Hit targets stay ≥ 34px; on touch widths, ≥ 44px.

## Rules

- Never a horizontal page scrollbar. If content overflows, fold or wrap.
- Never fixed heights on content containers; ```min-height``` only (e.g. 440px scan viewer).
- ```max-width:1420px``` on content so wide monitors don't stretch tables into unreadable rows.
- ```max-width:52ch``` on insight prose regardless of container width.
