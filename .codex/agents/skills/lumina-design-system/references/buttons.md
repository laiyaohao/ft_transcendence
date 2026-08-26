# Skill · Buttons

Six roles, each with exactly one meaning. If a button doesn't fit a role, the hierarchy is
wrong — don't invent a seventh.

## Roles

```
1  RUST PRIMARY    committing an action that changes state
   bg #9E3A24 · text #FBF9F5 · hover #8A3120 · radius 10px · 13px 24px · 13.5/500
   shadow 0 1px 2px rgba(42,38,34,.12)

2  CORAL AI        starting or accepting machine work
   bg #E08A72 · text #FFFDFA · hover #D2795F · radius 10px · 12px 20px · 13.5/500

3  SECONDARY       alternative, non-destructive
   bg #FFFDFA or #FBF9F5 · border 1px #E4DCD0 · text #2A2622 · hover bg #F4EFE6

4  GHOST           tertiary, in-card, cancel
   bg none · border none or 1px #E4DCD0 · text #6F675E or #B4573F

5  ICON            28 / 30 / 34px square, radius 7-9px
   bg #FBF9F5 · border 1px #EBE4D9 · icon #6F675E · hover bg #F4EFE6
   destructive variant: icon #B4573F · hover bg #F7E3DC

6  DASHED CREATE   an empty affordance inviting new content
   bg #FFFDFA · border 1px dashed #DCCFBE · text #B4573F · hover bg #F9F4EC
```

**Rust vs coral is the system's most important button distinction.** Rust = the tutor
decides. Coral = the AI acts, or the tutor accepts what the AI produced. "Approve & Next
Question" is rust. "Confirm OCR Results" is coral. Getting this backwards erases the
human-in-the-loop story the product is built on.

## On dark panels

```
panel button     bg #282522 · border 1px #35312C · text #E8E2D9 · hover #332F2A · radius 9px
panel coral      bg #E08A72 · text #1B1917 (not white) · hover #EC9A82 · weight 600
panel ghost      bg none · border 1px #3A362F · text #A8A096 · hover bg #282522
```

Coral on near-black takes **dark text**. White on coral fails contrast at that size.

## Disabled

Never grey out with opacity. Swap to inert tokens and keep the label readable:

```
bg #EDE6DB · text #B5AA9C · cursor not-allowed
```

A disabled primary must be paired with adjacent copy stating what unlocks it — see
[ai-marking-panels.md](ai-marking-panels.md) for the approval gate pattern.

## Composition

```html
<button style="display:flex;align-items:center;gap:9px;background:#9E3A24;color:#FBF9F5;
  border:none;border-radius:10px;padding:13px 24px;font-size:13.5px;font-weight:500;
  cursor:pointer;box-shadow:0 1px 2px rgba(42,38,34,.12)" style-hover="background:#8A3120">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"></path></svg>
  Approve &amp; Export Worksheet
</button>
```

Icon 15–16px, ```gap:9px```, icon before label. Trailing arrow (```M5 12h13M12 5l7 7-7 7```)
only for forward navigation in a flow. A four-pointed sparkle
(```M12 2l1.9 5.6L19.5 9.5l-4.7 3.5L16 19l-4-2.8L8 19l1.2-6L4.5 9.5l5.6-1.9z```) marks
AI generation and nothing else.

## Rules

- Sentence case with an explicit object: "Generate Worksheet", not "Generate" or "GENERATE".
- One rust button per view. Two competing primaries means the screen has two purposes.
- Never a full-width button wider than ~340px except inside a sidebar column or a modal.
- Buttons in a group are flex siblings with ```gap```, never margin-spaced.
