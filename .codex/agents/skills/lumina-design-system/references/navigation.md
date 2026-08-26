# Skill · Navigation

Persistent left sidebar on desktop, horizontal chip rail below 880px. The sidebar is the
product's spine: it never scrolls away and never changes order.

## Anatomy

```
246px fixed rail, bg #FBF9F5, border-right #EDE6DB, position sticky, height 100vh
  brand block      22px pad · Playfair 19/600 name · 12px #A09488 role
  primary action   full-width rust button, 14px side pad
  nav list         12px side pad, 2px gap
  account footer   32px avatar + name/role, border-top #EDE6DB
```

Order is fixed and reflects the workflow, not the alphabet:
**Dashboard · My Classes · Students · Worksheets · Question Bank · AI Review · Reports · Settings**

## Nav item

```html
<button style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;
  border:none;cursor:pointer;padding:9px 12px;border-radius:8px;font-size:13.5px;
  font-weight:500;background:#F4E4DE;color:#9E3A24">
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto">
    <path d="..."></path>
  </svg>
  <span style="flex:1">My Classes</span>
  <span style="background:#F1D9D1;color:#9E3A24;font-size:10.5px;font-weight:700;
    padding:2px 6px;border-radius:20px;line-height:1.4">12</span>
</button>
```

| State | background | color |
|---|---|---|
| default | ```transparent``` | ```#5A544C``` |
| active | ```#F4E4DE``` | ```#9E3A24``` |

Only the count badge is ever coloured beyond that — ```#F1D9D1``` on ```#9E3A24```, and only
when the number is actionable (pending reviews). Never badge a zero.

## Route grouping

Detail routes light their parent nav item. Maintain an explicit map — never infer from the
URL, and never let two items light at once:

```js
const routeGroup = {
  class: 'classes', student: 'students', gen: 'worksheets',
  upload: 'worksheets', ocr: 'marking', reports: 'reports'
};
const activeNav = routeGroup[route] || route;
```

Sibling index and detail screens must be **separate routes with separate content**. A list
tab and a detail tab that render the same page is a bug — Students is a roster, My Classes
is a grid of classes.

## Topbar

```
sticky, z 30, bg rgba(250,247,242,.92), backdrop-filter blur(10px), border-bottom #EDE6DB
padding 12px 30px, gap 16px
  wordmark  Playfair 16/500
  search    max 380px, pill, bg #FFFDFA, border #EBE4D9, 14px magnifier #A09488
  spacer    flex 1
  bell      34px icon button + 7px #E08A72 dot, animation pulseDot 2s infinite
  avatar    34px circle
```

The bell dot appears only when work is pending, and clicking the bell goes to AI Review —
a notification that does not resolve to the work is decoration.

## Breadcrumb

Detail screens open with an uppercase back link, not a chevron trail:

```html
<button style="background:none;border:none;padding:0;cursor:pointer;display:flex;
  align-items:center;gap:7px;font-size:10.5px;letter-spacing:.13em;font-weight:600;
  color:#A09488">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round"><path d="M19 12H5m7-7-7 7 7 7"></path></svg>
  ALL CLASSES
</button>
```

Label it with the destination, uppercased — ```ALL CLASSES```, ```PRIMARY 5 SCIENCE``` — so
the tutor knows where back goes before they press it.

## Narrow rail (< 880px)

Sidebar is replaced by a horizontally scrolling chip row under the topbar: ```bg #FBF9F5```,
```border-bottom #EDE6DB```, 10px/16px padding, 6px gap, pill buttons at 12.5px. Same items,
same order, same active colours, no icons.

## Rules

- Never reorder, hide, or collapse nav items per role — every tutor sees all eight.
- Never nest a second level of navigation in the rail; use in-page tabs or filters.
- The primary action ("New Worksheet") lives above the nav list, not inside it.
