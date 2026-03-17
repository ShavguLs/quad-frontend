# featureCalled Assets

Keep local static files for `featureCalled` in this folder.

## `images/`

- Put feature-specific image files in `frontend/src/featureCalled/assets/images/`.
- Use kebab-case file names, for example: `hero-banner.png`, `empty-state-illustration.webp`.

## `fonts/`

- Put feature-specific font files in `frontend/src/featureCalled/assets/fonts/`.
- Use kebab-case file names, for example: `feature-called-display.woff2`.

### Available Fonts

#### BPG Extrasquare Mtavruli 2009
A Georgian Mtavruli-style display font for enhanced typography.

**Usage via CSS:**
```css
.georgian-heading {
  font-family: var(--font-bpg-mtavruli);
}
```

**Usage via inline style:**
```tsx
<h1 style={{ fontFamily: "'BPG Extrasquare Mtavruli 2009', sans-serif" }}>
  ქართული ტექსტი
</h1>
```

**Note:** The font is automatically loaded via @font-face in globals.css.

## Import example

From `frontend/src/featureCalled/components/Hero.tsx`:

```ts
import heroBanner from "../assets/images/hero-banner.png";
```
