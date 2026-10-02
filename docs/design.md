# Journal du Cuistot — visual language

This is the public site’s design source of truth (`journalducuistot.fr`, French, FR-FR).
Read it before changing homepage blocks, listings, or content pages.

The CMS admin (`apps/cms`) is a different product. Do not copy admin chrome onto the journal.

**Mode:** redesign, preserve the brand. Modernise. Do not start from a new aesthetic.

---

## Design read

A French cooking journal for home cooks who follow Julius: African food at the pace of the seasons, written from a home kitchen, not from a recipe factory.

The visual family is **editorial publication**, not SaaS, not luxury cookware DTC, not a restaurant menu.

Photography carries the page. Type names the sections. Chrome stays quiet.

| Dial (current site) | Value | Why |
|---|---|---|
| Variance | 5 | Left-aligned, 2-column grids, overlay hero. Still a lot of even columns. |
| Motion | 3 | Hover colour and image scale. Almost no entrance motion. |
| Density | 3 | Airy section padding, photo-first cards, short copy. |

Raise motion by 1 on a redesign. Keep density. Push variance only where photography or type can do the work.

---

## Concept

The homepage seed says the brand out loud:

> Un journal de cuistot, pas une usine à recettes.

That sentence is the brief.

- **Journal:** dated notes, seasons, coulisses, a person who cooks and writes.
- **Not a factory:** no endless catalogue UI, no filter-first supermarket grid as the hero story, no icon feature tiles that could sit on any food app.

Voice is French tutoiement, spoken, slightly stubborn. Labels stay short. Headlines stay sentence case. The author is Julius (portrait in `/img/author.jpg`). The mark is the circular logo wordmark in `/img/logo.webp`.

If a layout could be swapped onto a project-management landing page and still make sense, it is the wrong layout.

---

## What the page is actually made of

The public site is not a component library first. It is this stack, in this order of visual weight:

1. **Food photographs** (covers, hero, 3:4 recipe crops, 13:9 article crops)
2. **Merriweather** for titles
3. **Catamaran** for body and UI
4. **Cream canvas** (`bg-neutral-50`)
5. **One mustard accent** (`yellow-600` fill, `yellow-800` hover type)
6. **Hairline rules** next to section titles
7. **Sharp corners** on editorial surfaces

Everything else is secondary.

---

## Tokens (as coded today)

### Type

| Role | Face | Typical size | Weight |
|---|---|---|---|
| Display / H1 | Merriweather (`font-serif`, `.jdc-serif`) | `text-4xl` → `text-5xl` / `3.25rem` on the hero | Bold on the hero, normal on recipe titles |
| Section title | Merriweather | `text-2xl` leading-8 | 400 |
| Card title | Merriweather | `text-2xl` | 400 |
| Body | Catamaran (`font-sans`) | `text-base` / `text-lg`, max ~40–65ch | 400 |
| Meta / labels | Catamaran | `text-xs` + `tracking-widest` + `uppercase` | 500–600 |
| Primary CTA | Catamaran | `text-xs` + `tracking-widest` + `uppercase` | 600 |

Source: `apps/web/app/assets/css/index.css` (`@theme static`), `apps/web/nuxt.config.ts` (`@nuxt/fonts`), `packages/shared/app/components/JdcPublicSurface.vue`.

Do not swap these faces. Do not add a third family on the public site. Do not use Inter.

### Colour

| Token | Use |
|---|---|
| `bg-neutral-50` | Page canvas. The cream of the journal. |
| `text-highlighted` / `text-neutral-900` / `#111827` | Titles |
| `text-toned` / `text-stone-500` | Body and supporting copy |
| `text-muted` | Icons next to metadata |
| `yellow-600` | Primary button fill (`#ca8a04` range) |
| `yellow-500` | Button hover |
| `yellow-800` | Linked title hover |
| `border-default` / `border-stone-200` | Hairlines |
| `bg-elevated` | The one boxed surface (newsletter) |
| `bg-yellow-50` | Recipe reviews / nutrition tint (legacy, keep rare) |

Public `colorMode` is **off**. The journal is light. Do not invert a section to dark in the middle of the page. Do not add a second accent (teal, blue, purple).

Amber (`amber-700`, `amber-100`) appears in the header as the active nav colour. Treat that as debt, not as a second brand colour. The accent is yellow.

### Shape

The editorial rule is **sharp**.

- Homepage blocks, cards, newsletter, images: `rounded-none`
- Author portrait: `rounded-full` (the one exception that already exists)
- Logo: circular crop

`app.config.ts` still sets `rounded-md` on `UButton` / `UInput` and `--ui-radius: 0.375rem` in CSS. That is a conflict. New public UI follows `rounded-none` unless it is the portrait.

### Space

| Context | Rhythm |
|---|---|
| Section padding | `py-16` → `py-20` (list pages), `py-24` only for the tallest moments |
| Card grid | `gap-8` / `sm:gap-10` / `xl:gap-12` |
| Article stack | `space-y-12` / `lg:space-y-16` |
| Content column | `max-w-7xl` with `lg:w-4/5` + sidebar `lg:w-1/5` |
| Body measure | `max-w-[40ch]` to `max-w-[65ch]` |

Header is `h-24`, fixed. Content pages add `mt-24`. `--ui-header-height: 24rem` in CSS does not match the real 6rem bar. Do not use that variable as spacing truth.

### Motion

Allowed today:

- Title colour `200ms` on hover
- Cover `scale-[1.03]`–`[1.04]` over `500ms`
- Button `active:scale-[0.98]`
- Header background after scroll

Do not add scroll hijack, marquees, glass, or infinite loops. If motion is added later, it must mean hierarchy or feedback, and it must respect `prefers-reduced-motion`.

---

## Photography

This is the brand’s material.

| Crop | Where | Ratio |
|---|---|---|
| Full-bleed overlay | Homepage hero | Cover, object-position ~70% |
| Portrait recipe | Recipe grids | `aspect-[3/4]` |
| Landscape article | Article rows | `aspect-[13/9]`, max-height 500px |
| Circle | Author | 128–138px |

Images come from Strapi / R2 through `JdcCoverMedia` / `localImageSharp`. Do not drop raw Strapi URLs. Do not fake screenshots with divs. Do not invent decorative SVGs.

A text-only section on this site reads as unfinished, because the rest of the journal is photo-led. That is why a hairline-only hub feels basic, and why an icon-card hub feels like another website.

Creative work on a text section must borrow **from photography or from display type**, not from SaaS card chrome.

---

## Copy register

One voice on the public site:

- French, tutoiement (`Tu veux recevoir…`)
- Concrete kitchen words (gestes, sauces, grillades, fourneau)
- Against catalogue language (`sans catalogue interminable`)
- Sentence case titles
- Uppercase tracking only on meta (time, difficulty, “A propos de moi”) and on the primary button

Do not write English UI on the public site. Do not add “Elevate / Seamless / Unleash”. Do not put version labels, numbered eyebrows, or locale/weather strips in the header.

Live copy still contains typos (`Inscrire-toi`, `Fitrer`, `Tous droit reservée`) and em-dashes in CMS strings. Fix those when touching the strings. Do not spread them.

---

## Layout families (use each once per page)

The homepage already has a usable sequence. Keep the jobs. Change the composition, not the IA.

| Order | Block | Job | Family as it stands |
|---|---|---|---|
| 1 | `hero` | Promise + two paths | Full-bleed photo, cream scrim, left type, yellow CTA + text link |
| 2 | `person` | Who writes this | Circle portrait + serif bio + uppercase text link |
| 3 | `hubs` | Four doors into the silos | 2×2 serif titles on hairlines (currently too thin) |
| 4 | `recipe-list` | Cook something | 2-col 3:4 photos, serif title, meta with tiny icons |
| 5 | `article-list` | Read something | Horizontal photo + type rows |
| 6 | `newsletter` | Subscribe | The only boxed form (`ring-1`, sharp) |

Other families on inner pages:

- **Content column + sidebar** (`layouts/content.vue`): recipe and article detail
- **Filter + grid** (`/recette`): search, checkboxes, 16-up recipe grid
- **Print recipe chrome**: H1 serif 5xl, uppercase meta row, ingredients / steps with a hairline through the heading
- **404**: giant serif status code, black uppercase button (legacy)

Do not repeat the same family twice on one page. Recipe photos and hub tiles must not look like the same card.

Routes stay as they are: `/`, `/blog`, `/blog/:category/:slug`, `/recette`, `/recette/:slug`, `/recette/recettes-:category`, catch-all CMS pages. Do not rename nav labels or slugs in a visual pass.

---

## Component language (public)

Use Nuxt UI primitives, then restyle them to this journal. Do not invent a parallel kit.

| Piece | How it should feel |
|---|---|
| `UPageHero` | Overlay, left, cream scrim, type over photo |
| `UPageSection` | Quiet wrapper, generous vertical padding |
| `JdcSectionHeading` | Serif H2 + hairline to the right. This is the “chapter start”. |
| `UPageCard variant="naked"` | No box. Photo or type only. Hover = title → `yellow-800` |
| `UButton` primary | `rounded-none bg-yellow-600` uppercase tracking, white label |
| `UButton` secondary | `variant="link"` Catamaran, not a second fill |
| `UPageCTA` | Newsletter only. Sharp, ring, not a dark slab |
| Icons | Metadata only (clock, utensils). Never a leading mark on a hub tile |

Icons on the public site are already a mix (Lucide in new blocks, `ic:sharp-*` on recipes, Heroicons, Phosphor in the footer). New public icons should stay **small, gray, beside a number or a fact**. Do not grow them into feature glyphs.

---

## Audit (scan of the live system)

### Preserve

These are the journal. Keep them, and design toward them.

- Merriweather + Catamaran pairing
- `bg-neutral-50` canvas, light-only public theme
- Yellow as the single accent (fill on CTA, ink on hover)
- Sharp editorial corners
- `JdcSectionHeading` hairline + serif
- Photo-first recipe (3:4) and article (13:9) cards
- Hero as one surface: image under type, not a banner stacked on copy
- Person as unboxed portrait + bio (a journal has an author)
- Newsletter as the one boxed object (a form needs an edge)
- French tutoiement and the “journal, not factory” stance
- Fixed header that tints after scroll
- Real covers through the image pipeline

### Retire or isolate

These fight the journal. Do not spread them.

| Pattern | Where it lives | Why it is wrong here |
|---|---|---|
| Flowbite / Tailwind UI header | `BasicHeader.vue` | Gray bar, `rounded-lg` search, **blue** focus rings, amber active, hamburger SVGs. Looks like a dashboard kit on a food magazine. |
| Black uppercase buttons | Filter, sidebar, 404 | A second primary. The primary is yellow-600. |
| `rounded-md` / `rounded-lg` on public UI | `app.config.ts`, recipe listing cards, header | Breaks the sharp rule. |
| Mixed gray families | `gray-*`, `zinc-*`, `stone-*`, `neutral-*` | Warm and cool in the same paragraph. Stay on `neutral` + `stone` at most. |
| OG image template | `OgImage/Cooking.satori.vue` | Navy `#020420` + amber glow. Copied from Nuxt.com. Not this brand. |
| Legacy recipe card | `recipe/Card.vue` | `rounded-lg`, `text-lg font-semibold text-gray-900` (sans title). The homepage recipe list already shows the newer language. |
| Dark `dark:` classes in the header | `BasicHeader.vue` | Public colour mode is off. Dead dark styles. |
| Icon feature grid | Attempted on `hubs` | SaaS. Rejected because it is incoherent. |
| Hairline-only type grid | Current `hubs` | Coherent, but empty. The journal is photographic. |
| Inline `style="outline: 0px…"` | Article cards, 404, recipe meta | Old theme leftovers. Move to utilities when touching the file. |
| `--ui-header-height: 24rem` | `index.css` | Wrong number. Causes scroll-margin bugs (titles tuck under the bar). |
| Nuxt default OG / navy | Social cards | Readers meet a different site than the cream journal. |

### Weak points (skill audit)

**Typography**

- Pairing is good. Presence is uneven: hero H1 is bold and large; section titles stay `text-2xl` font-normal and can feel small next to 3:4 photos.
- Listing recipe titles on `/recette` still skip Merriweather.
- Tracking exists on labels, but those labels appear on almost every recipe sub-block (ingredients, steps, utensils). They start to look templated.

**Colour and surfaces**

- Canvas is flat cream. No grain, no paper tooth. On a journal that pretends to be printed, the flatness is the main “too basic” feeling.
- Header gray-100 vs page neutral-50 is a seam.
- Nutrition / reviews `bg-yellow-50` is the accent used as a wash. Keep it rare.

**Layout**

- Homepage is left-aligned (good) but the hubs and recipe grids are even 2×2 (safe, a bit static).
- Content sidebar still uses a boxed “A propos” card with a signature PNG: closer to 2018 WordPress food blogs than to the new homepage person block.
- Sticky header overlaps the person heading when you scroll (`à recettes` clipped). Real bug, not a style choice.
- `/recette` filter column and empty grid on first paint feel like an admin tool dropped onto the journal.

**Interactivity**

- Hover on titles and images is the only life in the interface. Fine for a journal, but hubs and nav need a clearer “this is a link” state than colour alone.
- Header search does not look wired like the `/recette` filter search.
- Focus rings in the header are blue (`focus:ring-blue-500`). Fail on brand and on contrast consistency.

**Content**

- Hero photograph (brunch fruit plate) does not argue “cuisine africaine” as hard as the H1 does. The image is bright and appetising; the story is Africa + seasons. Better when cover and headline agree.
- Sidebar bio still talks Asia / Europe / South America more than the homepage manifesto.
- 404 copy is English (`Page not found`).

**Icons**

- Too many families. Pick one public family for metadata (current recipe pages already use Iconify `ic:sharp-*`) and stop adding Lucide as decoration.

**Strategic holes**

- Footer is a thin legal strip plus Instagram / RSS / Pinterest. Privacy link exists on the newsletter. 404 exists but is unstyled as a journal page.
- No skip-to-content link.
- Comments form is present and not a visual priority.

---

## Conflicts to resolve (one system)

The site currently runs **two kits**:

1. **Journal kit** (what we keep): cream, Merriweather, sharp, yellow fill, hairlines, photos, Nuxt UI naked cards.
2. **Legacy kit** (what we starve): Flowbite header, black buttons, rounded search, blue rings, gray-900 sans titles, WordPress sidebar card, Nuxt.com OG.

New work must ship in kit 1. When a file from kit 2 is opened, migrate that file toward kit 1. Do not add kit 2 patterns to new blocks.

Concrete lock:

- **One accent:** `yellow-600` (fill) / `yellow-800` (type hover)
- **One radius on editorial UI:** `0`
- **One circle:** portraits and logo only
- **One heading face:** Merriweather
- **One body face:** Catamaran
- **One gray family on new code:** `neutral-*` (canvas, hairlines) + `stone-*` only if already on that screen
- **One primary button:** yellow, sharp, uppercase tracking, white label
- **One secondary:** text link, no fill
- **Theme:** light, full page, no inverted band

---

## How to be creative without leaving the journal

The last two hub attempts failed in opposite directions:

- **Icon tiles in a 2×2 box** → another product (SaaS features)
- **Hairline + title + blurb** → the same product, with the air let out

On this site, “more designed” means **more like a magazine spread**, not more UI.

Levers that stay on-brand:

1. **Photography in the section** (a cover, a crop, a background at low opacity). The hero already proves overlay works.
2. **Type scale** (one oversized serif word or a 2-line display title, not a 2xl caption pretending to be a hub).
3. **Asymmetry** (1 + 3, or one wide door + three notes), still left-aligned.
4. **Print devices** already in the DNA: hairlines, uppercase meta, generous measure, caption under image. Push those, do not replace them with cards.
5. **Overlap** (portrait bleeding a rule, a title sitting on a photo edge). The person ring on cream is a start.
6. **Paper** (a hint of grain on the canvas, not a texture slap on every card).

Levers that leave the brand:

- Glass, glow, mesh, purple, dark slabs
- Equal feature cards with leading icons
- Pill badges on photos
- Centered manifesto heroes
- Inter / Fraunces / Instrument Serif
- A second accent “for energy”

---

## Page checklist (before shipping a visual change)

- [ ] Still looks like a cooking journal at a glance (photo + serif + cream)
- [ ] Yellow is the only accent on the screen
- [ ] Corners are sharp except portraits
- [ ] No new icon-led feature grid
- [ ] Section heading still uses `JdcSectionHeading` or an intentional alternative, not a new eyebrow system
- [ ] Public copy is French
- [ ] Images go through `JdcCoverMedia` / `localImageSharp`
- [ ] Hover and `:active` exist on the thing you can click
- [ ] Header, listing, and detail still feel like one site
- [ ] Slugs and nav labels unchanged

---

## File map

| Concern | Where |
|---|---|
| Fonts and canvas | `apps/web/app/assets/css/index.css` |
| Nuxt UI colour + default slots | `apps/web/app.config.ts` (`primary: yellow`) |
| Font loading | `apps/web/nuxt.config.ts` → `fonts.families` |
| Public surface lock (light, serif helper) | `packages/shared/app/components/JdcPublicSurface.vue` |
| Chapter heading | `packages/shared/app/components/JdcSectionHeading.vue` |
| Homepage blocks | `packages/shared/blocks/*/Client.vue` |
| Homepage copy seed | `packages/shared/shared/content-blocks/page-seed.ts` |
| Header / footer (legacy) | `apps/web/app/components/section/BasicHeader.vue`, `Footer.vue` |
| Recipe / article detail chrome | `apps/web/app/pages/recette/[slug].vue`, `blog/[category]/[slug].vue` |
| OG | `apps/web/app/components/OgImage/Cooking.satori.vue` |

---

## Next

This document is the scan and the diagnosis. It does not change the site.

The next visual pass should pick **one** weak surface (hubs, header, `/recette` listing, or OG) and raise it with photography or type, inside the locks above.
