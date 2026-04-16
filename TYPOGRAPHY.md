# Typography system — Layoff Egypt (bilingual)

This app serves **real layoff stories** in **English and Arabic**, often with **mixed scripts in one sentence** (company names, dates, Latin acronyms). The system extends `DESIGN.md` / `apple-design.scss`: **documentary, calm, Apple-like restraint**—never flashy display fonts or mixed decorative families.

---

## 1. Font families (pairing rules)

### English / Latin (LTR UI chrome and Latin-only content)

| Role | Stack | Notes |
|------|--------|--------|
| **Display** | `var(--apple-font-display)` | System SF on Apple; `-apple-system` … Helvetica, Arial. |
| **Body / UI** | `var(--apple-font-text)` | Same rhythm as DESIGN.md §3 (17px body, negative tracking). |

When **`html` is Arabic** (`lang="ar"`), headings that must render Arabic script should use **`var(--type-font-ar-body)`**—SF Pro has no Arabic glyphs. English-only marketing heroes can stay on `--apple-font-display` when copy is Latin.

Use **one** Latin stack everywhere—no mixing Georgia, Inter, or a second sans for “accent.”

### Arabic (RTL UI and Arabic primary copy)

| Role | Stack | Notes |
|------|--------|--------|
| **All Arabic UI + story text** | `var(--type-font-ar-body)` | **`Cairo` → `Noto Sans Arabic` → `Segoe UI`** (see `index.html` font links). |

**Why Cairo first:** Readable at length, neutral, widely used; fits documentary tone. **Noto Sans Arabic** is the fallback for glyphs/weights Cairo might miss—same family *class* (clean neo-grotesque), not a decorative contrast.

### What not to do

- Do **not** pair Cairo with a second display font for “Arabic headings only.”
- Do **not** use Roboto for user-facing copy (it is Material’s default; keep it inside Material components only if the theme requires it).
- **Material Icons** stay isolated (`direction: ltr; unicode-bidi: isolate`) per `styles.scss`.

---

## 2. Type scale (rem-based, aligned with Apple roles)

Use **rem** for scalability. Map to DESIGN.md roles; app-specific tokens live in `:root` (`apple-design.scss`).

| Token / role | Size | Weight | Typical use |
|--------------|------|--------|-------------|
| **Hero / page title** | `clamp(2rem, 5vw, 3.5rem)` | 600 | Marketing hero only (`apple-display-hero`). |
| **Section heading** | `clamp(1.75rem, 4vw, 2.5rem)` | 600 | Section titles (`apple-section-heading`). |
| **Card / story title** | `clamp(1.25rem, 2.8vw, 1.375rem)` | 600 | Story company line, tile titles. |
| **Body** | `17px` (`1.0625rem`) | 400 | Story body, filters, primary reading. |
| **Secondary / role line** | `14px`–`15px` | 400 | Role, supporting lines. |
| **Caption / meta** | `12px`–`14px` | 400–500 | Tags, timeline, labels. |
| **Micro label** | `10px`–`11px` | 600 + uppercase + tracking | “Refine”, “Active filters”, month abbreviations. |

**Letter-spacing:** Keep DESIGN.md discipline—slight negative tracking on body (`-0.374px` at 17px for Latin). For Arabic, **reduce** fake “small caps” tracking on micro labels (`:lang(ar)` often uses `letter-spacing: 0.02em–0.04em` instead of 0.08em).

---

## 3. Line height — English vs Arabic

Arabic usually needs **slightly more line-height** than Latin at the same font size for comfortable reading.

| Context | English (`:lang(en)` or Latin UI) | Arabic (`:lang(ar)`) |
|---------|-----------------------------------|----------------------|
| **Body / story** | `--type-lh-body-en` → **1.47** | `--type-lh-body-ar` → **1.62** (use in components with `:host-context(:lang(ar))` or `:lang(ar)` scoped rules). |
| **Titles / card company** | `--type-lh-title-en` → **~1.15** | `--type-lh-title-ar` → **~1.28** |
| **Caption / small meta** | `--type-lh-caption-en` → **1.33** | `--type-lh-caption-ar` → **1.45** |

Implement in SCSS, e.g.:

```scss
.body-like {
  line-height: var(--type-lh-body-en);
}
:lang(ar) .body-like,
:host-context(:lang(ar)) .body-like {
  line-height: var(--type-lh-body-ar);
}
```

---

## 4. Spacing rules (vertical rhythm)

- **Between major blocks** (hero → section → card grid): **`--type-space-section`** (1.5rem) minimum; sections already use `apple-section--*` padding—prefer those utilities.
- **Between title → subtitle → paragraph** inside a card: **`--type-space-tight`** (0.5rem) to **`--type-space-block`** (1rem).
- **Story paragraph measure:** cap line length at **~65ch** for body (`max-width: 65ch` where appropriate); **do not** force narrow measure on full-width UI chrome.
- **Consistent margins:** use `margin-block` / `padding-block` and logical properties so RTL mirrors correctly without separate “RTL file.”

---

## 5. Mixed direction text (same block)

**Goal:** Unicode bidirectionality does the heavy lifting; CSS only nudges when needed.

1. **`dir` on the document:** `I18nLocaleService` sets `lang` + `dir` on `<html>`—global reading order for the page.
2. **User-generated story paragraphs:** use **`dir="auto"`** on the `<p>` so the first strong character picks direction (good for mixed anecdotes).
3. **Embedded Latin inside Arabic UI** (e.g. product names): wrap in `<span dir="ltr">` or `<bdi>` if you see wrong glyph order in production data.
4. **Numbers and dates:** often best with **`dir="ltr"`** on `<time>` or a wrapper so digits don’t jump (already used on story timeline).
5. **Avoid** `unicode-bidi: plaintext` unless fixing a specific bug—it overrides normal bidi and can surprise screen readers.

---

## 6. Angular implementation checklist

- Copy goes through **ngx-translate**; **do not** hardcode fonts per route.
- Prefer **`var(--apple-font-*)`** and **`var(--type-font-ar-body)`** in component SCSS rather than repeating raw stacks.
- For components that need Arabic line-height, scope with **`:host-context(:lang(ar))`** (child under localized root) or **`:lang(ar)`** on the element.
- **Bootstrap** grid is neutral; typography still follows this document.

---

## 7. Utility classes (`src/styles/type-system.scss`)

| Class | Use |
|-------|-----|
| `type-heading-hero` | Hero title (inherit `color` from parent). |
| `type-heading-section` | Major section headings. |
| `type-heading-card` | Card / story titles. |
| `type-heading-sub` | Subheadings. |
| `type-body` | Default prose. |
| `type-story` | Long narrative (65ch, locale line-height). |
| `type-lead` | Intro / lead. |
| `type-secondary` | Secondary lines (role, helper). |
| `type-overline` | Uppercase labels (“Refine”, “Active filters”). |
| `type-field-label` | Labels above inputs. |
| `type-meta` | Tags, quiet metadata. |
| `type-meta-label` | Micro uppercase (timeline month, chip keys). |
| `type-meta-strong` | Dates, chip values. |
| `type-button` / `type-button-sm` | Text in custom buttons / compact controls. |
| `type-mixed-script` | `unicode-bidi: isolate` when needed. |

Locale-aware **font stacks and line heights** are driven by **`html[lang]`** variables (`--type-ui-font`, `--type-ui-lh-*`) set in `src/styles.scss`.

## 8. References

- `src/styles/apple-design.scss` — `:root` tokens (`--type-*`, `--apple-font-*`).
- `src/styles/type-system.scss` — global typography classes.
- `DESIGN.md` — Apple Latin scale and philosophy.
- `src/styles.scss` — `html` locale variables, body font, Material font inheritance, Material icon isolation.
- `.impeccable.md` — product tone (dignified, documentary).
