# Skill · Filters, chips & form controls

Controls are quiet: no shadows, no focus rings beyond a border change, no custom-drawn
widgets. Selection is shown by a rust tint, never by a checkmark or a heavier border.

## The chip — the system's universal selector

```html
<!-- active -->
<button style="background:#F4E4DE;border:1px solid #E0B9AC;color:#9E3A24;border-radius:20px;
  padding:8px 15px;font-size:12.5px;font-weight:500;cursor:pointer">All students</button>
<!-- inactive -->
<button style="background:#FBF9F5;border:1px solid #E4DCD0;color:#5A544C;border-radius:20px;
  padding:8px 15px;font-size:12.5px;font-weight:500;cursor:pointer">Primary 5 Maths</button>
```

```js
const chip = active => active
  ? { bg:'#F4E4DE', border:'#E0B9AC', color:'#9E3A24' }
  : { bg:'#FBF9F5', border:'#E4DCD0', color:'#5A544C' };
```

One helper for filter chips, topic multi-selects, subject/level pickers, question-count
choices, score quick-sets, and difficulty toggles. Same tokens everywhere so "selected"
never needs relearning.

Radius: ```20px``` for filters and multi-select topics, ```8px``` for compact grouped
choices (level, count, score) laid out as ```flex:1``` siblings.

Chips can carry an inline badge — an ```AI PICK``` tag inside a topic chip at
```9px/700 #9E3A24 on #F1D9D1``` — so the AI's recommendation is visible in the control
itself rather than in a legend.

## Filter bars

Primary status chips left, secondary dropdowns right, spacer between:

```html
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;align-items:center">
  <!-- chips -->
  <div style="flex:1"></div>
  <!-- selects -->
</div>
```

First chip is always the unfiltered default ("All", "All students", "All topics"). Selects:
```bg #FFFDFA```, ```border #EBE4D9```, ```radius 8px```, ```8px 13px```, 12.5px, with a 12px
chevron at ```#A09488```.

## Segmented control

Two to three exclusive views (Class level / Student level):

```
track   bg #F4EFE6 · radius 9px · padding 4px · gap 7px
item    radius 7px · padding 9px 18px · 12.5px/500
active  bg #FFFDFA · text #2A2622 · shadow 0 1px 2px rgba(42,38,34,.08)
idle    bg transparent · text #8B837A
```

The active item is *raised out of* the track — the only place a shadow does semantic work.

## Toggle

```html
<span style="width:36px;height:20px;border-radius:20px;background:#9E3A24;position:relative;
  flex:0 0 auto;transition:background .2s">
  <span style="position:absolute;top:2px;left:18px;width:16px;height:16px;border-radius:50%;
    background:#FFFDFA;transition:left .2s"></span>
</span>
```

Track ```#9E3A24``` on, ```#DED5C8``` off; knob ```left:18px``` / ```2px```. Always inside a
labelled row where the whole row is the hit target, and always with a sub-line explaining
the consequence — for AI settings, what it means for tutor control.

## Text inputs

```
light   bg #FBF9F5 · border 1px #E4DCD0 · radius 8-9px · padding 11px 13px · 13px #2A2622
dark    bg #2C2926 · border 1px #3A362F · radius 7px · text #F4EFE6
focus   border-color #E08A72, no ring, no glow
search  pill, bg #FFFDFA, border #EBE4D9, 14px magnifier #A09488, borderless input inside
```

Field labels: ```11.5px/600 #6F675E```, ```margin-bottom:7-9px```. Group labels:
```10.5px/600 #A09488``` at ```.13em```, uppercase.

Textareas: ```rows="8"```, ```line-height:1.7```, ```resize:vertical```. Never disable resize
on a field a tutor writes prose into.

## Selection cards

Large mutually exclusive choices (class vs student) as bordered cards with a radio dot:

```
selected    bg #FDF6F3 · border 1.5px #9E3A24 · dot filled #9E3A24
unselected  bg #FFFDFA · border 1.5px #EBE4D9 · dot transparent
```

1.5px border, not 2px — heavy enough to read as chosen, light enough to stay in the system.
Each card gets a 22px rust icon, a Playfair 19px title, and a 12.5px explanation of *why*
you would pick it.

## Rules

- No native ```<select>``` styling, no custom scrollbars beyond the ```#DED5C8``` thumb.
- Never a colour picker, slider, or stepper — the system has no use for them.
- A multi-select must refuse to empty itself; keep at least one topic or type chosen.
- Changing a filter never navigates. Changing a target in a wizard resets downstream state.
