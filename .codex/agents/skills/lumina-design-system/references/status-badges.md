# Skill · Status badges

One badge shape across the product. Meaning comes from the token pair, never from size,
border, icon, or position.

## Base

```html
<span style="font-size:9.5px;font-weight:700;letter-spacing:.05em;padding:4px 9px;
  border-radius:20px;background:#F7E3DC;color:#9E3A24;white-space:nowrap">NEEDS PRACTICE</span>
```

Uppercase, 9.5px/700, ```.05em``` tracking, pill radius, ```white-space:nowrap```, and
```flex:0 0 auto``` when in a flex row. Inside dense tables drop padding to ```3px 8px```.

## Learning status — the canonical set

```
IMPROVING        bg #E4EDE4  text #4A6B50
CONSISTENT       bg #F0EAE0  text #6F675E
NEEDS PRACTICE   bg #F7E3DC  text #9E3A24
```

Exactly three. A student is on the way up, holding steady, or needs help — a fourth state
makes the roster unscannable. "Consistent" is deliberately neutral grey, not green: steady
is not the same as improving.

## Worksheet status

```
GENERATED   bg #F0EAE0  text #6F675E    created, not yet assigned
ASSIGNED    bg #F3EBDD  text #7A6238    with students
SUBMITTED   bg #F7E3DC  text #9E3A24    back, needs the tutor
MARKED      bg #E4EDE4  text #4A6B50    approved and closed
```

Rust on SUBMITTED is intentional — that is the state demanding tutor time.

## Contextual tags

```
FOCUS AREA    bg #F1D9D1  text #9E3A24   topic below 55%
UPDATED +4    bg #E4EDE4  text #4A6B50   changed by the last approval
AI PICK       bg #F1D9D1  text #9E3A24   AI-recommended option
AI ADDED      bg #F1D9D1  text #9E3A24   AI-inserted item
```

**```UPDATED``` badges are earned, not decorative.** Show one only where a value actually
moved in this session, with its signed delta. It is the receipt for the tutor's approval.

## Difficulty

```
Foundation    bg #E9EEE8  text #4A6B50
Application   bg #F3EBDD  text #7A6238
Challenge     bg #F7E3DC  text #9E3A24
```

## Subject

Larger tracking (```.06em```), used on class cards:
```
SCIENCE  bg #EAEDE7  text #4A6B50
MATHS    bg #E6EAEF  text #4E5C6E
```

## On dark panels

```
positive   bg #22301F  text #9FC0A2
risk       bg #3A2119  text #E0A692
neutral    bg #33302A  text #B5ADA2
```

## Rules

- Never a dot, icon, or border on a badge — fill and text carry the state.
- Never invent a status outside these sets. Map new concepts onto the existing four
  worksheet states or three learning states.
- Status text never wraps. If it would, the column is too narrow — fold the column
  (see [layout-responsive.md](layout-responsive.md)), don't shrink the badge.
- A badge is never interactive. Wrap the row, not the badge.
