# Skydle HQ — Economy Design

## Design Goals

- **First drone** takes ~12 manual clicks to afford
- **First few upgrades** are cheap and feel immediately rewarding (hook the player)
- **Mid-game** upgrades come roughly every 1 minute
- **Late-game** upgrades take 3–5 minutes of accumulation
- **Full completion** takes approximately 2 hours of active play

## Income Model

Each flower collected yields:

```
final_value = flower_base_value(level) × multiplier(level)
```

Mega flowers multiply the base by 5× on top of that. Income scales with:

1. **Manual clicking** (~20 clicks/min early game)
2. **Drone fleet** (automated collection, limited by cooldown + travel + harvest time)
3. **Spawn rate & batch size** (more flowers available on the map)

At max upgrades (value 100, multiplier 5×), each regular flower yields 500 flowers. Mega flowers yield 2,500.

## Price Scaling — S-Curve with Linear Cap

All 25-level upgrades use a three-phase pricing model: `[early, peak, late, maxPrice]` = `[1.5, 2.0, 1.2, 1200000]`

### Phase 1: S-Curve (levels 1–~18)

Per-level multiplier follows a sine bell curve:

```
t = level / maxLevel
bell = sin(π × t)
scale = (t ≤ 0.5) ? early + (peak − early) × bell
                    : late  + (peak − late)  × bell
```

- **Early levels**: ×1.5 per level (+50%) — cheap enough to hook the player
- **Mid levels**: ×2.0 per level (+100%) — steep ramp matches income acceleration
- **Late levels**: ×1.2 per level (+20%) — begins tapering

### Phase 2: Linear Cap (levels ~19–25)

Once the price exceeds 40% of `maxPrice` (480,000), growth switches to **linear increments** that distribute the remaining headroom evenly across remaining levels, capping at **1,200,000**.

```
step = floor((maxPrice − currentPrice) / (remainingLevels + 1))
```

## Raw Prices — All Upgrades

### Flower Value (25 levels, exponential ~×1.6)

| Level | Cost | Level | Cost | Level | Cost |
|-------|------|-------|------|-------|------|
| 1 | 14 | 10 | 1,000 | 19 | 70,000 |
| 2 | 23 | 11 | 1,600 | 20 | 115,000 |
| 3 | 37 | 12 | 2,550 | 21 | 180,000 |
| 4 | 60 | 13 | 4,150 | 22 | 290,000 |
| 5 | 95 | 14 | 6,500 | 23 | 465,000 |
| 6 | 150 | 15 | 10,500 | 24 | 750,000 |
| 7 | 240 | 16 | 17,000 | 25 | 1,200,000 |
| 8 | 390 | 17 | 27,500 | | |
| 9 | 600 | 18 | 44,000 | | |

Total cost to max: ~3.19M flowers

### Multiplier (25 levels, ⌈1.5× value cost⌉)

| Level | Cost | Level | Cost | Level | Cost |
|-------|------|-------|------|-------|------|
| 1 | 21 | 10 | 1,500 | 19 | 105,000 |
| 2 | 35 | 11 | 2,400 | 20 | 172,500 |
| 3 | 56 | 12 | 3,825 | 21 | 270,000 |
| 4 | 90 | 13 | 6,225 | 22 | 435,000 |
| 5 | 143 | 14 | 9,750 | 23 | 697,500 |
| 6 | 225 | 15 | 15,750 | 24 | 1,125,000 |
| 7 | 360 | 16 | 25,500 | 25 | 1,800,000 |
| 8 | 585 | 17 | 41,250 | | |
| 9 | 900 | 18 | 66,000 | | |

Each level costs exactly ⌈1.5×⌉ the corresponding Flower Value level.

### Faster Spawns (25 levels, base 15)

| Level | Cost | Level | Cost | Level | Cost |
|-------|------|-------|------|-------|------|
| 1 | 15 | 10 | 2,479 | 19 | 710,412 |
| 2 | 23 | 11 | 4,897 | 20 | 792,010 |
| 3 | 37 | 12 | 9,750 | 21 | 873,608 |
| 4 | 62 | 13 | 19,490 | 22 | 955,206 |
| 5 | 107 | 14 | 38,949 | 23 | 1,036,804 |
| 6 | 191 | 15 | 77,346 | 24 | 1,118,402 |
| 7 | 351 | 16 | 151,663 | 25 | ~1,200,000 |
| 8 | 661 | 17 | 291,778 | | |
| 9 | 1,270 | 18 | 547,218 | | |

### Batch Spawns (25 levels, base 12)

| Level | Cost | Level | Cost | Level | Cost |
|-------|------|-------|------|-------|------|
| 1 | 12 | 10 | 1,921 | 19 | 831,496 |
| 2 | 18 | 11 | 3,794 | 20 | 892,913 |
| 3 | 29 | 12 | 7,554 | 21 | 954,330 |
| 4 | 48 | 13 | 15,100 | 22 | 1,015,747 |
| 5 | 83 | 14 | 30,176 | 23 | 1,077,164 |
| 6 | 148 | 15 | 59,924 | 24 | 1,138,582 |
| 7 | 272 | 16 | 117,501 | 25 | ~1,200,000 |
| 8 | 512 | 17 | 226,055 | | |
| 9 | 984 | 18 | 423,957 | | |

### Mega Flowers (5 levels, explicit tiers)

| Level | Cost |
|-------|------|
| 1 | 120 |
| 2 | 800 |
| 3 | 5,000 |
| 4 | 50,000 |
| 5 | 200,000 |

### R1 Drones — Three-Phase Pricing

Drone pricing uses three phases to match diminishing returns of additional drones:

1. **Fixed early** (drones 1–3): hand-tuned cheap prices to hook the player
2. **Exponential** (drones 4–12): ×1.6 per drone during fleet-building
3. **Linear** (drones 13+): +200 per drone as marginal value tapers

| Drone # | Cost | Phase |
|---------|------|-------|
| 1 | 12 | Fixed |
| 2 | 24 | Fixed |
| 3 | 50 | Fixed |
| 4 | 80 | ×1.6 |
| 5 | 128 | ×1.6 |
| 6 | 204 | ×1.6 |
| 7 | 326 | ×1.6 |
| 8 | 521 | ×1.6 |
| 9 | 833 | ×1.6 |
| 10 | 1,332 | ×1.6 |
| 11 | 2,131 | ×1.6 |
| 12 | 3,409 | ×1.6 |
| 13 | 3,609 | +200 |
| 14 | 3,809 | +200 |
| 15 | 4,009 | +200 |

### Propeller+ (25 levels, exponential ~×1.57, cap 1.2M)

Speed per level: +0.24 (base 2.1 → max 8.1)

| Level | Cost | Tier | Level | Cost | Tier | Level | Cost | Tier |
|-------|------|------|-------|------|------|-------|------|------|
| 1 | 25 | Bronze | 10 | 1,400 | Silver | 19 | 80,000 | Diamond |
| 2 | 39 | Bronze | 11 | 2,250 | Gold | 20 | 125,000 | Diamond |
| 3 | 60 | Bronze | 12 | 3,500 | Gold | 21 | 200,000 | Ultimate |
| 4 | 95 | Bronze | 13 | 5,500 | Gold | 22 | 310,000 | Ultimate |
| 5 | 150 | Bronze | 14 | 8,500 | Gold | 23 | 490,000 | Ultimate |
| 6 | 235 | Silver | 15 | 13,500 | Gold | 24 | 750,000 | Ultimate |
| 7 | 370 | Silver | 16 | 21,000 | Diamond | 25 | 1,200,000 | Ultimate |
| 8 | 600 | Silver | 17 | 33,000 | Diamond | | | |
| 9 | 900 | Silver | 18 | 50,000 | Diamond | | | |

Total cost to max: ~2.57M flowers

### Harvester+ (25 levels, exponential ~×1.48, cap 1.2M)

Harvest time reduction per level: −0.15s (base 4.3s → min 0.5s)

| Level | Cost | Tier | Level | Cost | Tier | Level | Cost | Tier |
|-------|------|------|-------|------|------|-------|------|------|
| 1 | 100 | Bronze | 10 | 3,400 | Silver | 19 | 115,000 | Diamond |
| 2 | 150 | Bronze | 11 | 5,000 | Gold | 20 | 170,000 | Diamond |
| 3 | 220 | Bronze | 12 | 7,500 | Gold | 21 | 250,000 | Ultimate |
| 4 | 325 | Bronze | 13 | 11,000 | Gold | 22 | 370,000 | Ultimate |
| 5 | 480 | Bronze | 14 | 16,000 | Gold | 23 | 550,000 | Ultimate |
| 6 | 700 | Silver | 15 | 24,000 | Gold | 24 | 800,000 | Ultimate |
| 7 | 1,050 | Silver | 16 | 35,500 | Diamond | 25 | 1,200,000 | Ultimate |
| 8 | 1,550 | Silver | 17 | 50,000 | Diamond | | | |
| 9 | 2,300 | Silver | 18 | 80,000 | Diamond | | | |

Total cost to max: ~3.82M flowers

### Drone Dock (one-time)

| Cost |
|------|
| 50,000 |

### Ultimate R1 (per drone, one-time each)

| Cost |
|------|
| 10,000 |

## Flower Value — Power Curve Progression

Uses `value = max(1 + level, round(1 + 99 × (level/25)^1.5))` to guarantee every level gives at least +1.

| Level | Value | Level | Value | Level | Value |
|-------|-------|-------|-------|-------|-------|
| 0 | 1 | 9 | 22 | 18 | 61 |
| 1 | 2 | 10 | 26 | 19 | 67 |
| 2 | 3 | 11 | 30 | 20 | 72 |
| 3 | 5 | 12 | 34 | 21 | 77 |
| 4 | 7 | 13 | 38 | 22 | 83 |
| 5 | 10 | 14 | 42 | 23 | 88 |
| 6 | 13 | 15 | 47 | 24 | 94 |
| 7 | 16 | 16 | 52 | 25 | 100 |
| 8 | 19 | 17 | 57 | | |

## Batch Spawns — Probabilistic Model

Levels 0–2 are deterministic: always spawn 1, 2, 3 flowers per cycle.

Levels 3–25: guaranteed minimum of 3, then each of 12 extra slots (up to 15 total) is rolled independently. The per-slot probability scales linearly with level, capped at 82% at max level.

| Level | Min | Expected Avg | Max |
|-------|-----|-------------|-----|
| 0 | 1 | 1 | 1 |
| 1 | 2 | 2 | 2 |
| 2 | 3 | 3 | 3 |
| 5 | 3 | ~3.8 | 15 |
| 15 | 3 | ~7.6 | 15 |
| 25 | 3 | ~12.8 | 15 |

## Upgrade Reference

### Map Upgrades (Upgrades → Map tab)

| Upgrade | Max Level | Effect | Base Cost | Scale |
|---------|-----------|--------|-----------|-------|
| Flower Value | 25 | Base value 1 → 100 per flower (power curve `t^1.5`) | 14 | Exponential ×1.6 cap 1.2M |
| Multiplier | 25 | Income multiplier 1.1× → 8× | 21 | ⌈1.5×⌉ of value cost, cap 1.8M |
| Faster Spawns | 25 | Spawn interval 3.5s → 0.8s | 15 | S-curve [1.5, 2.0, 1.2] cap 1.2M |
| Batch Spawns | 25 | Flowers per cycle 1 → up to 15 (probabilistic) | 12 | S-curve [1.5, 2.0, 1.2] cap 1.2M |
| Flower Capacity | 5 | +18 max flowers on map per level (+90 total) | 1M | Explicit tiers |
| Mega Flowers | 5 | Mega chance 0% → 50% (each mega = 5× value) | 120 | Explicit tiers |

### Drone Upgrades (Upgrades → Drones tab)

| Upgrade | Max Level | Effect | Base Cost | Scale |
|---------|-----------|--------|-----------|-------|
| Propeller+ | 25 | Flight speed +0.24/level, 2.1 → 8.1 (all R1s) | 25 | Exponential ×1.57 cap 1.2M |
| Harvester+ | 25 | Harvest time −0.15s/level, 4.3s → 0.5s (all R1s) | 100 | Exponential ×1.48 cap 1.2M |
| Drone Dock | 1 | Cooldown → 1s for all R1s | 50,000 | — |

### Per-Drone Upgrades (click drone's dock tile)

| Upgrade | Cost | Effect |
|---------|------|--------|
| Ultimate R1 | 50,000 | +50% speed, 5 flowers per run + rainbow holo visual |

### Drones

| Stat | Base Value |
|------|-----------|
| Buy price | 12 → 24 → 50 (fixed), then ×1.6, then +200 |
| Flight speed | 2.1 |
| Harvest time | 4.3s |
| Cooldown | 10s (1s with dock) |

## Max Flowers on Map

| Grid Size | Max Flowers |
|-----------|-------------|
| 10×10 | 70 |
| 11×11 | 90 |
| 12×12 | 110 |
| 13×13 | 135 |
| 14×14 | 165 |
| 15×15 | 200 |

## Dev & Speed Modes

- `?dev` — Start with 999 flowers, all upgrades cost 1
- `?speed=N` — Time runs at N× speed (e.g. `?speed=3` for 3× faster)
