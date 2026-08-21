# Lab 2 UI Specification — TokTickIT Zen Green Theme

---

## 1. Color Tokens

| CSS Variable | Hex | Usage |
|---|---|---|
| `--color-primary` | `#006B3C` | Header, primary buttons, strong emphasis |
| `--color-secondary` | `#0B7A46` | Active tabs, links, hover states |
| `--color-pale` | `#EAF6EF` | Selected, success, subtle sections |
| `--color-bg` | `#F5F7F6` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, form surfaces |
| `--color-error` | `#B91C1C` | Error text and border |
| `--color-warning` | `#D97706` | Warning badges |
| `--color-readonly-bg` | `#F0F4F2` | Read-only field background |

---

## 2. Responsive Breakpoints

| Viewport | Behavior |
|---|---|
| Desktop ≥ 992 px | Multi-column layout, max-width 1200 px centered |
| Tablet 768–991 px | Two-column where practical |
| Mobile < 768 px | Single column stacked, no horizontal scroll |

---

## 3. Screens

### Requester Selection Screen
> TODO: Layout, elements, states (loading / empty / API failure).

### Create Ticket Screen
> TODO: Field layout, validation placement, success/failure states.

### My Tickets Screen
> TODO: Table (desktop) / card (mobile), search/filter/sort/pagination, empty & no-results states.

### Ticket Detail Screen (View Mode)
> TODO: Read-only layout, attachment section, soft-removal dialog.

---

## 4. Visual Checklist

> To be completed with screenshots in `artifacts/lab-02/screenshots/` during testing.

- [ ] No horizontal scroll at any breakpoint
- [ ] No label clipping or overlap
- [ ] Error messages below correct field
- [ ] Read-only fields visually distinct from editable
- [ ] Priority and Status badges consistent
- [ ] Requester name visible in header
