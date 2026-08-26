# Skill · AI marking panels & the approval gate

The product's ethical centre: AI proposes a score, a human decides it, and only the decision
touches the student's record.

## Screen structure

```
context strip   AI REVIEW REQUIRED badge · worksheet name · student link
title           "Review AI Marking Suggestions" — Playfair 31/500
guardrail       left-accent callout stating nothing is saved yet
progress        per-question pills
body            flex 1 1 520px  → question card (light) + marking analysis (dark)
sidebar         flex 0 1 330px  → tutor decision + save gate
```

## Guardrail callout

```html
<div style="display:flex;gap:13px;align-items:flex-start;background:#F6EFE6;
  border-left:3px solid #B4573F;border-radius:0 10px 10px 0;padding:15px 20px">
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B4573F"
    stroke-width="1.8" stroke-linecap="round" style="flex:0 0 auto;margin-top:1px">
    <circle cx="12" cy="12" r="9"></circle><path d="M12 16v-5M12 8h.01"></path>
  </svg>
  <p style="margin:0;font-size:13px;line-height:1.65;color:#5A544C">
    AI suggestions require tutor approval before they affect the student profile. Nothing
    below is saved to Bella's mastery scores until you approve it.
  </p>
</div>
```

Name the student. "The student profile" is policy; "Bella's mastery scores" is a promise.
Square left corners, rounded right — a flat left edge reads as annotation, not a card.

## Question card (light)

Question text 16px, max score as a serif figure with a two-line "Max Score" label above,
topic line at ```11.5px #A09488```. Below a ```#F0EAE0``` rule, two columns at
```flex:1 1 220px```:

- **Student Answer** — ```#FBF9F5``` fill, ```#EFE8DE``` border, 13.5px, ```line-height:1.7```
- **Model Answer Elements** — checklist, ```#5C7A63``` tick for matched elements,
  ```#CFC4B4``` for missed

The tick colours are the whole diagnosis: the tutor sees which mark-scheme points landed
before reading a word of AI prose.

## Marking analysis (dark)

```
eyebrow    AI MARKING ANALYSIS + right-aligned "Suggestion only — not saved" (10px #6E665D)
score      Playfair 44px/600 in #E08A72, with "/2.0" at 15px #6E665D
feedback   13px #B5ADA2, line-height 1.7
footer     three columns above a #2C2925 rule, flex 1 1 210px each
```

The three footer columns are non-negotiable — they are the audit trail:

```
MISSING CONCEPTS   pill chips, #E0A692 on #3A2119
KEYWORD ISSUE      12px #8F877D — the exact phrase used vs the phrase required
REASONING          12px #8F877D — which model elements scored and which didn't
```

Write reasoning as mark-scheme logic: *"One of three model elements present. The answer
states the effect but not the mechanism, which the mark scheme requires for the second
mark."* A tutor has to be able to defend the score to a parent.

Scores display to one decimal (```1.0```, ```2.0```) — half marks are real in PSLE marking.

## Tutor decision

```
Final Score      78px numeric input + "out of 2.0" + quick-set chips at every half/whole step
Final Feedback   textarea rows=8, prefilled with the AI text, resize vertical
Reset to AI      ghost link, rust, refresh icon — restores both score and feedback
Approve & Next   rust primary, full width  ("Approve Final Question" on the last one)
Flag for Later   secondary, full width
```

Feedback is **prefilled and editable**, never blank and never locked. The AI drafts; the
tutor owns the words that reach the student. "Reset to AI" makes editing safe by making it
reversible.

## Progress pills

```
current    bg #F4E4DE  border #E0B9AC  text #9E3A24  dot #9E3A24 / #FBF9F5
approved   bg #E9EEE8  border #D5E0D5  text #4A6B50  dot #5C7A63 / #FBF9F5  mark ✓
pending    bg #FFFDFA  border #EBE4D9  text #6F675E  dot #F0EAE0 / #A09488
```

Freely clickable — a tutor revisits decisions. Trailing count: "2 of 3 approved".

## The save gate

```
LOCKED    card bg #FBF9F5 · border #EBE4D9 · note #8B837A
          button bg #EDE6DB · text #B5AA9C · cursor not-allowed
          note: "Approve all 3 questions to unlock. 2 of 3 done — nothing has been
                 written to the profile yet."

UNLOCKED  card bg #1B1917 · note #A8A096
          button bg #E08A72 · text #1B1917 · weight 600
          note: "All 3 questions approved. Saving writes these scores to Bella's mastery,
                 topic map, weak areas and future worksheet recommendations."
```

The card **turns dark when it unlocks** — the moment the machine's proposal becomes
committable is the moment the surface changes. The locked note always states the count
remaining and re-asserts that nothing has been written.

## What saving must actually do

The gate is theatre unless approval changes real state. On save:

```js
// weighted blend, not replacement — one worksheet is evidence, not a verdict
const next = Math.round(topic.pct * 0.85 + scoredPct * 0.15);
```

Then recompute overall mastery from topics, set the signed improvement delta, increment
worksheets completed, prepend to mistake history, decrement the pending count, tag every
changed topic with an ```UPDATED ±n``` badge, and land the tutor **on the student profile**
so they see what their approval did.

## Rules

- Never write to a profile without an explicit tutor action. No autosave, no "AI confident
  enough" bypass.
- Never hide the AI's suggested score after the tutor overrides it — both must stay visible.
- Never let an approved score exceed the max, and never accept a non-numeric score.
- Marking one question never navigates away; only Save leaves the screen.
