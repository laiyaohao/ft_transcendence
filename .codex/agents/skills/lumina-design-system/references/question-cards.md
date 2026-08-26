# Skill · Question cards

Used in the worksheet editor and the question bank. A question card must show enough to
judge a question without opening it.

## Editor row

```html
<div style="background:#FFFDFA;border:1px solid #EBE4D9;border-radius:12px;padding:16px 18px;
  display:flex;gap:16px;align-items:flex-start">

  <!-- reorder column -->
  <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto">
    <button style="background:none;border:none;cursor:pointer;color:#BCB1A3;padding:2px"
      style-hover="color:#6F675E">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.2" stroke-linecap="round"><path d="m6 15 6-6 6 6"></path></svg>
    </button>
    <span style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;
      color:#6F675E;width:20px;text-align:center">3</span>
    <button><!-- chevron down --></button>
  </div>

  <!-- body -->
  <div style="flex:1;min-width:0">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-bottom:9px">
      <span><!-- type badge --></span>
      <span><!-- difficulty badge --></span>
      <span style="font-size:11px;color:#A09488">Interactions &amp; Adaptation</span>
    </div>
    <p style="margin:0 0 5px;font-size:13.5px;line-height:1.6;color:#2A2622">
      The desert fox has large ears. Explain how this feature helps it survive.
    </p>
    <div style="font-size:11.5px;color:#A09488">2 marks · targets structure → survival advantage</div>
  </div>

  <!-- actions -->
  <div style="display:flex;gap:5px;flex:0 0 auto">
    <!-- 30px icon buttons: edit · replace · remove -->
  </div>
</div>
```

The number is serif — it is the question's identity in the paper, and it renumbers on
reorder. The ```targets``` line is what makes the card reviewable: it states the pedagogical
purpose ("targets mark-scheme keywords"), not a restatement of the question.

## Metadata badges

```
type         bg #F0EAE0  text #6F675E     MCQ · OEQ · Structured · Keyword Drill
difficulty   Foundation #E9EEE8/#4A6B50 · Application #F3EBDD/#7A6238 · Challenge #F7E3DC/#9E3A24
AI ADDED     bg #F1D9D1  text #9E3A24     appended by AI this session
```

## Row actions

Three 30px icon buttons, ```gap:5px```, ```radius 7px```, ```bg #FBF9F5```, ```border #EBE4D9```:

```
edit      M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z     icon #6F675E
replace   M21 12a9 9 0 1 1-3-6.7M21 4v5h-5                        icon #6F675E
remove    M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3      icon #B4573F, hover bg #F7E3DC
```

Replace pulls the next unused bank question in the same topic; when the pool is empty, say
so in a toast rather than silently doing nothing. Remove is guarded at one remaining question.

## Question bank row

Same card, no reorder column, single "Add" secondary button right. Metadata line gains usage
frequency: ```Adaptation · used 26×```. Adding jumps to the editor with the question appended
and confirms by toast — never add silently in place.

## Editor footer

```
bg #FFFDFA · border 1px #EBE4D9 · radius 12px · padding 16px 20px
left:  "8 questions · 19 marks total" at 12.5px #8B837A
right: ghost "Back to preview" + rust "Approve & Export Worksheet"
```

Toolbar above the list holds two secondaries: "Add from Question Bank" and "Generate another
AI question" (sparkle icon, coral fill).

## Rules

- Never truncate question text — a tutor cannot judge half a question. Let cards grow.
- Marks always shown; PSLE tutors balance papers by marks, not question count.
- Reorder is arrow buttons, not drag — reliable under a demo and keyboard-reachable.
- Question text is prose in the mark scheme's register. Never lorem, never "Question text here".
