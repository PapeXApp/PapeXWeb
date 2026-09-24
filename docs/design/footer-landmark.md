# Footer landmark: out of `<main>`, still in the flow

Web 2.1, task S1, 2026-09-24. Applies to the two path homes (`/customers`, `/business`) and any later page built on `FlowGround`.

## Problem

On the path homes the footer was mounted as the last child of `FlowGround`, wrapped in a navy `FlowSection`. `SiteShell` wrapped everything in `<main>`, so the page's `<footer>` sat inside both `<main>` and a `<section>`. That causes two a11y problems:

- A `<footer>` whose ancestors include `<main>` or a `<section>` is not a `contentinfo` landmark (HTML-AAM).
- A footer inside `<main>` fails axe's `landmark-contentinfo-is-top-level` check.

The footer has to stay inside `FlowGround`, though. That is how it joins the page-colour crossfade, since the `--flow-*` ink and the `.flow` background both come from that wrapper.

## Design (shipped on `web-2.1/s1-nav-footer`)

1. **`FlowGround` owns `<main>`, and takes a `footer` slot.** (`components/paths/shared/FlowGround.tsx`)

   ```
   .flow > .content > main                                  ← children (the sections)
                    > div[data-ground="navy"][data-nav-theme="dark"] > footer.rd-footer
   ```

   The wrapper is a plain `div`, not a `FlowSection`, because a `<section>` ancestor would cancel the landmark. It still carries `data-ground="navy"`, so the IntersectionObserver treats it like any other section and the last light section crossfades into it, as before.

2. **`SiteShell` renders `<main>` only for the fork.** (`components/brand/site-shell.tsx`)
   - There is a new optional `main` prop, which defaults to `path === 'fork'`.
   - `/customers` and `/business` get their `<main>` from `FlowGround`, so there is never a nested `<main>`.
   - A future `SiteShell` page that does not use `FlowGround` must pass `main`.

3. **Backward compatible.** Without the index change below, a path home still renders its footer, in the flow, exactly as before. The footer is simply still inside `<main>` (now FlowGround's `<main>`, not the shell's). The page never has zero or two `<main>`s.

## The change each `index.tsx` needs (for the merge agent)

It is one line on the `FlowGround` opening tag, plus deleting the old footer block. Do it in each file below.

### `components/paths/customer/index.tsx`

Replace

```tsx
      <FlowGround initial="light">
```

with

```tsx
      <FlowGround initial="light" footer={<SiteFooter inFlow />}>
```

Then delete the old tail block just above `</FlowGround>`: the `{/* The footer is the page's navy tail … */}` comment and the three lines below it.

```tsx
        <FlowSection ground="navy">
          <SiteFooter inFlow />
        </FlowSection>
```

### `components/paths/business/index.tsx`

Replace

```tsx
    <FlowGround initial="navy">
```

with

```tsx
    <FlowGround initial="navy" footer={<SiteFooter inFlow />}>
```

Then delete the same comment and the three-line `<FlowSection ground="navy"><SiteFooter inFlow /></FlowSection>` block above `</FlowGround>`.

### In both files

If nothing else in the file uses `FlowSection` afterwards (true at `1c2b427`), drop its import, `import { FlowSection } from "../shared/FlowSection"`, or `next lint` flags it as unused. Keep the `SiteFooter` import.

### Blog (S3) or any other page moving onto the shell

Use `<SiteShell path="page">` + `<FlowGround initial="light" footer={<SiteFooter inFlow />}>`.

Do not put a `FlowGround` inside `FramerPageShell`. That shell already renders `<main className="framer-subpage">`, so the page would get two nested `<main>`s.

## Check after applying

In the browser console on `/customers` and `/business`:

```js
document.querySelectorAll('main').length               // 1
!!document.querySelector('main .rd-footer')            // false
!!document.querySelector('section .rd-footer')         // false
document.querySelector('.rd-footer').closest('[data-ground]').dataset.ground  // "navy"
```

Scroll to the bottom. The page should turn navy into the footer the same way as before.
