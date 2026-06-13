# Midjourney Art Guide: Second Chance at a Billion

## Art Direction

**Theme:** Dark, moody financial thriller meets retro-futurism. Think Wolf of Wall Street meets Tron. Not cartoony, not photorealistic. Stylized, atmospheric, cinematic.

**Color palette:** Deep navy/black backgrounds, cyan/electric blue accents, warm amber/gold highlights, hints of neon green for "money." Avoid purple gradients (AI slop signal).

**Mood:** Tense, exciting, slightly dangerous. This is a game about insider trading and dodging the SEC. The art should feel like a late-night trading floor, not a sunny finance app.

**Consistency tip:** Once you get a style you like, use `--sref [image URL]` to keep that style across all assets. Generate the main capsule first and use it as the style reference for everything else.

---

## PRIORITY 1: Steam Store Page (what buyers see first)

### 1. Main Capsule (1232 x 706px)
This is the single most important image. It appears on the Steam store page, in search results, and in recommendations. Must communicate the game concept in under 2 seconds.

```
A lone figure silhouetted at a massive curved trading desk covered in glowing screens,
stock charts with cyan lines soaring upward, scattered dollar bills and gold coins
floating in the air, dark moody room lit only by screens, volumetric light from monitors,
cinematic composition, aspect ratio 16:9, dramatic lighting --ar 16:9 --s 750 --v 6.1
```

**Alt prompt (more abstract):**
```
Dark cinematic scene of glowing cyan stock market charts rising through a cityscape
at night, golden dollar signs and ticker symbols floating like particles, a single
rocket trail cutting through the charts heading upward, dramatic volumetric lighting,
film noir atmosphere, digital art --ar 16:9 --s 750 --v 6.1
```

**Requirements:** Leave space in the upper-left for the title text overlay. Avoid putting important details in the corners (Steam crops them in some views).

### 2. Header Capsule (920 x 430px)
Appears at the top of the store page. Same concept as main capsule but wider and shorter.

```
Wide cinematic shot of a dark trading floor, multiple glowing screens showing rising
stock charts in cyan and blue, a leather chair facing the screens, stacks of money
on the desk, atmospheric fog and volumetric light, dark moody finance thriller aesthetic
--ar 920:430 --s 750 --v 6.1
```

**Requirements:** Title "SECOND CHANCE AT A BILLION" will be overlaid in post. Keep the center-left clear for text.

### 3. Small Capsule (462 x 174px)
Appears in wishlists, library, and sale pages. Very small, must read clearly.

```
Close-up of a glowing cyan stock chart arrow pointing sharply upward against a dark
background, golden sparkles trailing behind it, minimal composition, high contrast,
clean and bold --ar 462:174 --s 750 --v 6.1
```

**Requirements:** Very simple composition. This renders tiny. Just the chart/rocket motif with high contrast.

### 4. Vertical Capsule (748 x 896px)
Appears in Steam sales events and featured sections.

```
Vertical composition: a figure in a suit viewed from behind, standing before a towering
wall of stock market screens in a dark room, cyan chart lines reflected on the floor,
money floating upward like confetti, dramatic upward perspective, dark cinematic mood
--ar 5:6 --s 750 --v 6.1
```

### 5. Library Hero (3840 x 1240px)
Ultra-wide banner shown in the Steam library when the game is selected.

```
Ultra-wide panoramic view of a futuristic trading floor at night, rows of curved
monitors showing glowing cyan and blue stock charts, a subtle cityscape visible through
floor-to-ceiling windows, atmospheric haze, reflective dark floor, no people,
cinematic and moody --ar 3840:1240 --s 750 --v 6.1
```

**Requirements:** Very wide aspect ratio. Keep composition spread across the full width. The game logo will be overlaid on the left side.

### 6. Library Logo (1280 x 400px)
The game title rendered artistically. Generate separately or create in a design tool using a good font.

```
The text "SECOND CHANCE AT A BILLION" rendered in sleek modern typography,
cyan glowing edges, dark background, subtle stock chart line integrated into the
letterforms, clean and readable, logo design --ar 1280:400 --s 750 --v 6.1
```

### 7. Page Background (1438 x 810px)
Subtle dark background for the Steam store page. Must not distract from content.

```
Abstract dark background with very subtle cyan grid lines fading into darkness,
tiny floating particles like distant stars, barely visible stock chart curves in
deep navy, minimal and atmospheric, meant as a background texture --ar 16:9 --s 250 --v 6.1
```

**Requirements:** Must be very dark and subtle. If it competes with the store page text, it's too busy.

---

## PRIORITY 2: Promotional / Marketing

### 8. Social Media Banner (1200 x 630px - og:image)
For Reddit posts, Twitter/X cards, Discord embeds.

```
A dramatic scene of a time traveler's desk: vintage clock showing midnight, modern
trading screens with cyan stock charts, a newspaper headline about a market crash,
scattered $100 bills, a mysterious glowing briefcase, dark cinematic lighting
--ar 1200:630 --s 750 --v 6.1
```

**Overlay text in post-production:** "Travel back in time. Trade with foresight. Try not to get arrested."

### 9. YouTube/TikTok Thumbnail (1280 x 720px)
For trailer and gameplay videos.

```
Close-up dramatic shot of a person's eyes reflected in a trading screen, the screen
shows a stock chart going parabolic in cyan, golden dollar signs reflected in their
eyes, intense expression, dark moody lighting, cinematic --ar 16:9 --s 750 --v 6.1
```

### 10. Trailer Key Frames (1920 x 1080px) - Generate 4-5

**Frame 1: "The Setup"**
```
A dark office at night, single desk lamp illuminating a mysterious device (time machine),
stock market newspapers scattered on the desk dated 2008, moody noir atmosphere,
film grain --ar 16:9 --s 750 --v 6.1
```

**Frame 2: "The Trading Floor"**
```
First-person perspective sitting at a massive curved trading desk, dozens of screens
showing green and cyan stock charts all going up, the feeling of power and control,
dark room lit by screen glow --ar 16:9 --s 750 --v 6.1
```

**Frame 3: "The SEC"**
```
A dark hallway with harsh fluorescent lighting, men in suits approaching from the
shadows, FBI/SEC badges visible, red warning lights, tense thriller atmosphere,
danger approaching --ar 16:9 --s 750 --v 6.1
```

**Frame 4: "The Billion"**
```
Extreme wide shot of a figure standing on top of a mountain of gold coins and
dollar bills, city skyline at night behind them, cyan aurora in the sky shaped
like a stock chart, triumphant and cinematic --ar 16:9 --s 750 --v 6.1
```

---

## PRIORITY 3: In-Game Assets

### 11. Menu Background (1920 x 1080px)
Atmospheric background for the main menu. Should be dark enough that cyan text is readable over it.

```
Dark atmospheric scene of a trading desk from above, scattered financial documents,
a glowing computer screen, long shadows, dust particles in air, very dark and moody,
noir aesthetic, must be dark enough for text overlay --ar 16:9 --s 500 --v 6.1
```

**Requirements:** Must be VERY dark (overall brightness below 20%). The game overlays white/cyan text on top. Test by putting white text over it.

### 12. Year Select Background (1920 x 1080px)
For the year selection screen. Could show a timeline or time-travel motif.

```
Abstract dark composition showing a timeline flowing left to right, dates from
2000 to 2024 subtly visible, a glowing portal or clock in the center, cyan energy
lines connecting the dates, time travel aesthetic, very dark atmospheric
--ar 16:9 --s 500 --v 6.1
```

### 13. Run End Screen Background (1920 x 1080px)
Two variants needed: one for success (reached targets) and one for arrest.

**Success variant:**
```
Dark celebratory scene, golden light rays breaking through darkness, abstract
stock charts forming a crown shape, scattered gold coins, triumphant atmosphere
but still moody, dark enough for text overlay --ar 16:9 --s 500 --v 6.1
```

**Arrested variant:**
```
Dark oppressive scene, red and blue police lights casting shadows through window
blinds, an empty chair at a trading desk, scattered papers, feeling of everything
falling apart, noir thriller atmosphere --ar 16:9 --s 500 --v 6.1
```

---

## PRIORITY 4: Achievement Icons (256 x 256px each)

Currently auto-generated with simple vector shapes. Midjourney can make these look premium. All should share the same style: circular composition, dark background, single iconic element.

**Style prefix for all achievement icons:**
```
Circular icon design on dark background, single iconic symbol, glowing edges,
game achievement badge style, detailed miniature illustration --ar 1:1 --s 750 --v 6.1
```

| Achievement | Prompt addition |
|-------------|----------------|
| Male Astrology | `a crystal ball showing stock charts, mystical purple glow` |
| Diamond Hands | `a pair of diamond-encrusted hands gripping a stock chart, blue sparkle` |
| Paper Hands | `paper origami hands crumbling apart, scattered paper pieces` |
| Bought the Dip | `a shopping cart full of red downward arrows turning green` |
| First Million | `the number $1M in gold, surrounded by golden light rays` |
| GUH | `a shocked face emoji on a crashing red stock chart, dramatic` |
| HODL King | `a golden crown on top of a candlestick chart, regal` |
| Clean Hands | `pristine white gloves holding money, angelic glow` |
| Literally Criminal | `handcuffs on a pile of money, red police siren light` |
| Margin Call Survivor | `a person hanging from a cliff edge made of stock charts, dramatic` |
| Teflon Don | `a shield deflecting red SEC warning arrows, golden defense` |
| Speed Demon | `a clock melting like Dali with stock tickers racing past` |
| Billion Dollar Baby | `a golden baby cradle overflowing with money, whimsical` |
| Portfolio Picasso | `a painter's palette but the colors are stock chart patterns` |
| Comeback Kid | `a phoenix made of green stock charts rising from red flames` |
| Day Trader | `rapid-fire screens showing millisecond trades, energy and speed` |

---

## Post-Production Notes

After generating in Midjourney:

1. **Title text overlay** - Add "SECOND CHANCE AT A BILLION" to capsule images using a clean sans-serif font (Bebas Neue, Oswald, or similar). White or cyan text with subtle drop shadow.

2. **Resize precisely** - Steam rejects images that aren't exact dimensions. Use Photoshop/Figma to crop and resize to exact pixel specs.

3. **Test readability** - Every capsule appears at multiple sizes on Steam. View your main capsule at 200px wide (search results) and make sure the key visual still reads.

4. **In-game backgrounds** - Darken aggressively in post. Apply a 60-80% black overlay if needed. The game UI must remain readable.

5. **Achievement icons** - Crop to circle, add dark border ring for consistency. Export as JPG at 256x256 for Steam and 64x64 for in-game display.

6. **Style reference** - Once you find a style you love on the main capsule, copy the image URL and use `--sref [URL]` on all subsequent prompts to maintain visual consistency across all assets.

---

## Asset Checklist

| # | Asset | Dimensions | Priority | Status |
|---|-------|-----------|----------|--------|
| 1 | Main Capsule | 1232 x 706 | P1 | |
| 2 | Header Capsule | 920 x 430 | P1 | |
| 3 | Small Capsule | 462 x 174 | P1 | |
| 4 | Vertical Capsule | 748 x 896 | P1 | |
| 5 | Library Hero | 3840 x 1240 | P1 | |
| 6 | Library Logo | 1280 x 400 | P1 | |
| 7 | Page Background | 1438 x 810 | P1 | |
| 8 | Social Media Banner | 1200 x 630 | P2 | |
| 9 | YouTube Thumbnail | 1280 x 720 | P2 | |
| 10a-d | Trailer Key Frames | 1920 x 1080 | P2 | |
| 11 | Menu Background | 1920 x 1080 | P3 | |
| 12 | Year Select Background | 1920 x 1080 | P3 | |
| 13a | Run End (Success) | 1920 x 1080 | P3 | |
| 13b | Run End (Arrested) | 1920 x 1080 | P3 | |
| 14a-p | Achievement Icons (16) | 256 x 256 | P4 | |

**Total: ~24 images to generate**
