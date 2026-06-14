# Midjourney Art Guide: Second Chance at a Billion

## Art Direction

**Style:** Painted illustration, atmospheric, muted palette. No people. Think editorial illustration for a financial magazine, not sci-fi or futuristic.

**Subject:** The empty New York Stock Exchange trading floor. Trading posts, screens, American flags, warm light from screens against cool blue architecture.

**What to avoid:** Neon/cyan glow, volumetric lighting, "cinematic" AI slop, floating particles, futuristic elements, people/figures. Keep it simple and clean so it looks human-made.

**Style reference:** Use `--sref [URL]` with your chosen header capsule image on all prompts to maintain consistency.

**Text overlay:** Copperplate Gothic Bold, white with drop shadow, right-aligned in the top-right corner. Run `add_text_overlay.py` to generate text versions.

---

## Asset List

### PRIORITY 1: Steam Store Page

#### 1. Main Capsule (1232 x 706)
The most important image. Appears in search results and recommendations.

```
The empty New York Stock Exchange trading floor, trading posts and screens, American flags, warm light glowing from screens, painted illustration style, atmospheric, muted palette --ar 16:9 --s 250 --v 6.1 --sref [URL]
```

**Text overlay:** "SECOND CHANCE / AT A BILLION" top-right

#### 2. Header Capsule (920 x 430)
Top of the store page.

```
The empty New York Stock Exchange trading floor, trading posts and screens, American flags, warm light glowing from screens, clear space on the right side for text overlay, painted illustration style, atmospheric, muted palette --ar 920:430 --s 250 --v 6.1 --sref [URL]
```

**Text overlay:** "SECOND CHANCE / AT A BILLION" top-right

#### 3. Small Capsule (462 x 174)
Wishlists, library, sale pages. Renders very small.

```
Close-up of a single NYSE trading post with glowing screens, American flag in background, painted illustration style, atmospheric, muted palette, simple composition --ar 462:174 --s 250 --v 6.1 --sref [URL]
```

**Text overlay:** "SECOND CHANCE AT A BILLION" centered, single line

#### 4. Vertical Capsule (748 x 896)
Steam sales events and featured sections.

```
Looking upward inside the empty New York Stock Exchange, tall columns and American flags above, trading posts and screens below, absolutely no people, dramatic vertical perspective, painted illustration style, atmospheric, muted palette --ar 5:6 --s 250 --v 6.1 --sref [URL]
```

**No text overlay.**

#### 5. Library Hero (3840 x 1240)
Ultra-wide banner in the Steam library.

```
Ultra-wide panoramic view of the empty New York Stock Exchange trading floor stretching across the full frame, trading posts and screens, American flags, warm light, painted illustration style, atmospheric, muted palette --ar 3840:1240 --s 250 --v 6.1 --sref [URL]
```

**No text overlay.** Game logo overlaid on the left side by Steam.

---

### PRIORITY 2: Promotional / Marketing

#### 6. Social Media Banner (1200 x 630)
For Reddit, Twitter/X, Discord embeds.

```
The empty NYSE trading floor at dawn, first light streaming through windows onto the trading posts, American flags in warm light, painted illustration style, atmospheric, muted palette --ar 1200:630 --s 250 --v 6.1 --sref [URL]
```

**Text overlay:** "SECOND CHANCE / AT A BILLION" top-right

---

### PRIORITY 3: In-Game Backgrounds

#### 7. Menu Background (1920 x 1080)
Must be very dark for cyan/white text readability.

```
The empty NYSE trading floor at night, very dark, screens casting faint warm glow on trading posts, deep shadows everywhere, must be very dark for text overlay, painted illustration style, atmospheric, muted palette --ar 16:9 --s 250 --v 6.1 --sref [URL]
```

**No text overlay.** Game UI renders on top.

#### 8. Year Select Background (1920 x 1080)

```
A long corridor inside the New York Stock Exchange, very dark, faint warm light at the far end, columns and wood panelling, deep shadows, painted illustration style, atmospheric, muted palette --ar 16:9 --s 250 --v 6.1 --sref [URL]
```

**No text overlay.** Game UI renders on top.

#### 9. Run End - Success (1920 x 1080)

```
The NYSE trading floor bathed in warm golden morning light streaming through tall windows, triumphant atmosphere, empty and still, painted illustration style, atmospheric, muted palette, dark enough for text overlay --ar 16:9 --s 250 --v 6.1 --sref [URL]
```

**No text overlay.** Game UI renders on top.

#### 10. Run End - Arrested (1920 x 1080)

```
The empty NYSE trading floor in cold blue light, a single overturned chair, papers scattered on the floor, abandoned and still, painted illustration style, atmospheric, muted palette, dark enough for text overlay --ar 16:9 --s 250 --v 6.1 --sref [URL]
```

**No text overlay.** Game UI renders on top.

---

## Post-Production

The `add_text_overlay.py` script handles:
- Resizing all images to exact Steam pixel dimensions
- Adding "SECOND CHANCE AT A BILLION" in Copperplate Gothic Bold with drop shadow
- Right-aligned in the top-right corner (except Small Capsule which is centered)
- Originals preserved in `artwork/`, text versions saved to `artwork/with-text/`

To re-run after replacing source images:
```bash
python add_text_overlay.py
```

For Steam upload, use the images from `artwork/with-text/` for capsules that need text, and directly from `artwork/` for backgrounds and the vertical capsule.

---

## Asset Checklist

| # | Asset | Dimensions | Text? | Status |
|---|-------|-----------|-------|--------|
| 1 | Main Capsule | 1232 x 706 | Yes | Done |
| 2 | Header Capsule | 920 x 430 | Yes | Done |
| 3 | Small Capsule | 462 x 174 | Yes | Done |
| 4 | Vertical Capsule | 748 x 896 | No | Done |
| 5 | Library Hero | 3840 x 1240 | No | Done |
| 6 | Social Media Banner | 1200 x 630 | Yes | Done |
| 7 | Menu Background | 1920 x 1080 | No | Done |
| 8 | Year Select Background | 1920 x 1080 | No | Done |
| 9 | Run End - Success | 1920 x 1080 | No | Done |
| 10 | Run End - Arrested | 1920 x 1080 | No | Done |

**Total: 10 images**
