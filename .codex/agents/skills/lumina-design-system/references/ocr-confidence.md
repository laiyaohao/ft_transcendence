# Skill · OCR review & confidence states

The split-screen where handwriting becomes text. Its whole purpose is letting a tutor catch
extraction errors *before* marking, so confidence must be visible and correction must be
one field away.

## Layout

Two flexible halves, ```flex:1 1 400px``` each, ```gap:16px```, ```align-items:flex-start```.

```
LEFT   light card — the artefact (the student's actual paper)
RIGHT  dark panel — the machine's reading of it
```

Left is evidence, right is interpretation. The surface tokens say so without a caption.

## Scan viewer

```
header   13px title + zoom out / zoom in / percentage (min-width 46px)
body     bg #F0EBE3, padding 22px, grid place-items center, min-height 440px, overflow auto
paper    bg #FDFAF4, shadow 0 4px 16px rgba(42,38,34,.13), radius 3px, padding 26px 24px
         width = 330px × zoom/100, transition width .25s
footer   Prev · page chips · Next
```

Paper details that make it read as paper: a ```#EBC9C4``` margin rule at ```left:44px```, a
```DM Sans 9px``` right-aligned header stamp, and a centred "Page 1 of 3" at ```#BCB1A3```.

Handwriting is **Caveat 16px in ```#3A4A6B```** — blue-black ink on cream, never the UI's
warm ink colour. Ruled-paper thumbnails use
```repeating-linear-gradient(#FDFAF4 0 8px,#F2ECE1 8px 9px)```.

## Detected regions

Each answer region is highlighted **on the scan** and colour-matched to its confidence:

```
high confidence   bg rgba(147,168,150,.10)  border rgba(147,168,150,.3)
low confidence    bg rgba(180,87,63,.09)    border rgba(180,87,63,.35)
                  + floating "LOW CONFIDENCE" tag, bg #B4573F, text #FDFAF4, 8.5px/700
```

Region highlights use ```rgba``` so the paper texture stays visible underneath. The tutor
must be able to see the actual handwriting through the overlay.

Page chips: 24px squares, radius 6px — active ```#9E3A24``` on ```#9E3A24``` border with
```#FBF9F5``` text; inactive ```#FBF9F5``` / ```#EBE4D9``` / ```#6F675E```.

## Extracted-data card

```html
<div style="background:#232120;border:1px solid #4A2C21;border-left:3px solid #B4573F;
  border-radius:10px;padding:15px 17px">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;
    margin-bottom:13px">
    <span style="font-size:12.5px;font-weight:600;color:#E8E2D9">Question 2</span>
    <span style="font-size:9.5px;font-weight:700;letter-spacing:.04em;padding:4px 9px;
      border-radius:20px;background:#3A2119;color:#E0A692;white-space:nowrap">
      Needs Review · 68%</span>
  </div>

  <div style="font-size:10px;letter-spacing:.1em;font-weight:600;color:#6E665D;
    margin-bottom:7px">EXTRACTED QUESTION</div>
  <div style="background:#2C2926;border-radius:7px;padding:10px 12px;font-size:12.5px;
    line-height:1.6;color:#B5ADA2;margin-bottom:14px">…</div>

  <div style="font-size:10px;letter-spacing:.1em;font-weight:600;color:#6E665D;
    margin-bottom:7px">STUDENT ANSWER (MANUAL CORRECTION REQUIRED)</div>
  <div style="display:flex;gap:9px;align-items:flex-start">
    <input value="…" style="flex:1;min-width:0;background:#332420;border:1px solid #7A4232;
      border-radius:7px;padding:11px 13px;font-size:13.5px;color:#F4EFE6">
    <button style="background:#2C2926;border:1px solid #3A362F;border-radius:7px;width:38px;
      height:38px;display:grid;place-items:center;cursor:pointer;color:#6E665D;
      flex:0 0 auto"><!-- check --></button>
  </div>

  <div style="font-size:11px;line-height:1.55;color:#D89B87;margin-top:10px;display:flex;
    gap:7px;align-items:flex-start"><!-- warn icon + reason --></div>
</div>
```

## Confidence state tokens

```
                  HIGH (≥90% or confirmed)   NEEDS REVIEW (<90%)
left accent       #5C7A63                    #B4573F
card border       #2F2C28                    #4A2C21
input bg          #2C2926                    #332420
input border      #3A362F                    #7A4232
tag               #9FC0A2 on #22301F         #E0A692 on #3A2119
label suffix      —                          "(MANUAL CORRECTION REQUIRED)"
confirm button    #9FC0A2 on #22301F once ticked, else #6E665D on #2C2926
```

**The warning must name the cause**: "Confidence 68% — the word after 'green' is ambiguous.
Check the highlighted region on the scan." A bare percentage tells the tutor there is a
problem but not where to look.

The question text is read-only fill; only the **answer** is editable. Ticking confirm
promotes the item to the high-confidence treatment and updates the scan highlight in the
same beat.

## Gate

```Confirm OCR Results``` is coral (accepting machine work). Blocked while any item is
unconfirmed, with a toast naming the count: *"2 answers still need verifying — tick each one
to confirm."* Never let unverified text reach marking; the whole flow's credibility rests on
this gate.

## Rules

- Never auto-accept low confidence, even above a threshold. A human ticks every flagged item.
- Never show OCR confidence as a progress bar — it is a state, not a quantity.
- Scan panel scrolls independently; the extracted list caps at ```max-height:640px``` with
  its own overflow so both halves stay on screen.
