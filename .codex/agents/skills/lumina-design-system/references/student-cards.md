# Skill · Student cards, rosters & avatars

Students appear in four densities: activity line, class progress row, roster row, and
profile header. All share one avatar system and one status vocabulary.

## Avatars

Initials only, never photos. Colour cycles a fixed six-tone palette **by roster index** so a
student keeps the same colour everywhere:

```js
const AVA = ['#D8B384','#C6D0C4','#E3C3B4','#CFC0D6','#D9CBA8','#BFD0D6'];
const bg = AVA[index % AVA.length];   // text always #3A332C
```

```
28px  activity line      10.5px/700
30px  table row          11px/700
34px  roster row         11.5px/700
66px  profile header     Playfair 24px/600
```

The tutor's own avatar is the exception: ```#9E3A24``` ground with ```#FBF9F5``` initials in
the sidebar, ```#D8B384``` with ```#4A4038``` in the topbar. Never rust for a student.

## Class progress row

Four columns — student, status, latest assessment, weak topic:

```html
<button style="width:100%;text-align:left;background:none;border:none;
  border-bottom:1px solid #F3EDE4;cursor:pointer;display:grid;
  grid-template-columns:1fr 130px 150px 130px;gap:10px;align-items:center;padding:13px 24px"
  style-hover="background:#FBF7F1">
  <span style="display:flex;align-items:center;gap:11px;min-width:0">
    <span style="width:30px;height:30px;border-radius:50%;background:#D8B384;color:#3A332C;
      display:grid;place-items:center;font-size:11px;font-weight:700;flex:0 0 auto">BT</span>
    <span style="font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;
      text-overflow:ellipsis">Bella Tan</span>
  </span>
  <span><!-- status badge --></span>
  <span style="font-size:13px;color:#4A443D"><b style="font-weight:600">61%</b>
    <span style="color:#A09488;font-size:11.5px">(Adaptation)</span></span>
  <span style="font-size:12px;color:#8B837A">Adaptation</span>
</button>
```

Header row above it: ```10.5px/600```, ```.09em``` tracking, ```#A09488```, uppercase,
```border-bottom:1px solid #EFE8DE```, **the same ```grid-template-columns``` string** as the
rows. Share one variable between head and body or they will drift.

Every row is a ```<button>``` or a click-handled ```<div>``` — whole-row target, no "view" link.
Cap an embedded list at five with a "View all N students" footer button.

## Roster row (Students index)

Denser, with mastery bar, signed trend, weak topic and a row action. Six columns at
```minmax(210px,1fr) 130px 140px 92px 118px 112px```. Always put a ```minmax()``` floor on the
name column so it can never collapse.

```html
<span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;
  color:#5C7A63">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" style="flex:0 0 auto">
    <path d="M7 17 17 7m0 0h-7m7 0v7"></path>
  </svg>
  +12%
</span>
```

Trend arrow up ```M7 17 17 7m0 0h-7m7 0v7``` at ```#5C7A63```; down
```M17 7 7 17m0 0h7m-7 0v-7``` at ```#B4573F```. Derive the sign from the value — never
hardcode the colour.

Row actions use ```e.stopPropagation()``` and pre-fill context (that student, their weakest
topic) rather than opening a blank form.

## Profile header

66px avatar, Playfair 34px/500 name, then a metadata row of a class pill
(```11.5px``` ```#6F675E``` on ```#F4EFE6```, pill), the status badge, and a join date at
```#A09488```. Actions right-aligned and wrapping: one rust primary, then secondaries.

## Activity line

Compact list, no card: 28px avatar, name + detail stack, trailing tag, ```border-bottom
1px #F0EAE0```, ```padding:11px 4px```. Five entries maximum.

## Learning profile columns

Strengths and growth as two flex columns (```flex:1 1 200px```, ```gap:26px```), each item a
13px line with ```padding-left:14px``` and a 2px left border — ```#DCE4DC``` for strengths,
```#EDD9D2``` for growth. Three items each; prose sentences, not fragments.

## Rules

- Never a photo, never a generated illustration, never an emoji avatar.
- Name truncates with ellipsis; status and percentages never truncate.
- The weak topic shown must be computed as the lowest-mastery topic, not stored — it has to
  change when marking changes it.
