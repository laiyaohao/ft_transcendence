# Skill · Toasts, modals, empty, loading & error states

Feedback is brief and never blocks. The product's rhythm is: the tutor acts, the system
confirms in one line, the tutor keeps working.

## Toast — the default confirmation

```html
<div style="position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:90;
  background:#1B1917;color:#F4EFE6;border-radius:11px;padding:14px 22px;display:flex;
  align-items:center;gap:12px;box-shadow:0 12px 34px rgba(42,38,34,.28);
  animation:toastIn .3s cubic-bezier(.2,.8,.3,1) both;max-width:92vw">
  <span style="width:20px;height:20px;border-radius:50%;background:#7E9A83;display:grid;
    place-items:center;flex:0 0 auto">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B1917"
      stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"></path></svg>
  </span>
  <span style="font-size:13.5px;line-height:1.45">Question 2 approved at 2.0/2.0.</span>
</div>
```

Bottom-centre, dark, 3.6s auto-dismiss, one at a time (clear the previous timer). No close
button — it leaves on its own.

Copy states **what changed, with the specifics**: "Question 2 approved at 2.0/2.0", not
"Saved". Blocked actions explain the block and the remedy: *"2 answers still need verifying
— tick each one to confirm."*

Toast is also the honest answer for an unbuilt branch in a prototype: describe what would
happen ("Filter menu — narrows the list by class") rather than a dead click.

## Modals

Used sparingly — almost every flow in this system is a full screen instead. When required:
```#FFFDFA``` panel, ```radius 14px```, ```padding 24px```, max-width 520px, on a
```rgba(27,25,23,.4)``` scrim; ghost cancel left, rust confirm right; ```fadeUp``` entry.

Destructive confirmations name the object: "Remove question 3 from this worksheet?" Never a
modal to show information a card could hold.

## Empty states

```
inside a card    dashed #DCCFBE affordance, icon well, title, one explanatory line
whole screen     centred, 46px icon well on #F4EFE6, Playfair 21px title, 13px #8B837A line,
                 one primary action
```

An empty state always offers the action that fills it, and the sub-line says what the system
will do with the tutor's data: *"Generate worksheets targeted at this class's weak areas."*
Never "No data available."

## Loading

Skeletons in system tokens, never spinners on content:

```
skeleton block   bg #F0EAE0 · radius matching the real element · no shimmer
inline spinner   14px, 2px border, #E4DCD0 track, #9E3A24 head, animation spin .7s linear infinite
AI working       dark panel, coral AI mark at animation pulseDot 2s infinite,
                 plus a line naming the work: "Reading 3 pages…"
```

AI work gets a **named** progress line. "Loading" is anxiety; "Extracting handwriting from
page 2 of 3" is progress. Keep skeleton blocks to the shape of what's coming so layout
doesn't jump.

## Errors

```
inline field    border #B4573F · 11.5px #B4573F message below, no icon
callout         bg #F6EFE6 · border-left 3px #B4573F · radius 0 10px 10px 0 · 13px #5A544C
blocking        card with a 46px #F7E3DC icon well, what failed, what to do, retry secondary
```

Same left-accent callout as the marking guardrail — a warm caution, not a red alarm. Errors
name the cause and the next step: *"Page 3 could not be read — the scan is too dark. Re-scan
that page or upload a photo."* Never a code, never "Something went wrong".

Rust ```#B4573F``` is the strongest negative colour in the system. There is no red.

## Rules

- Never a toast for navigation — arriving somewhere is its own feedback.
- Never stack toasts, never queue more than one.
- Never block the screen for anything the tutor can undo.
- Every state — empty, loading, error — keeps the sidebar and topbar. The tutor is never
  trapped in a state.
