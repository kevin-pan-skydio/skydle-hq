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

### Flower Value (25 levels, base 5)

| Level | Cost | Level | Cost | Level | Cost |
|-------|------|-------|------|-------|------|
| 1 | 5 | 10 | 712 | 19 | 498,648 |
| 2 | 7 | 11 | 1,406 | 20 | 615,540 |
| 3 | 11 | 12 | 2,799 | 21 | 732,432 |
| 4 | 18 | 13 | 5,595 | 22 | 849,324 |
| 5 | 31 | 14 | 11,181 | 23 | 966,216 |
| 6 | 55 | 15 | 22,203 | 24 | 1,083,108 |
| 7 | 101 | 16 | 43,536 | 25 | ~1,200,000 |
| 8 | 190 | 17 | 83,757 | | |
| 9 | 365 | 18 | 157,083 | | |

### Multiplier (25 levels, base 8)

| Level | Cost | Level | Cost | Level | Cost |
|-------|------|-------|------|-------|------|
| 1 | 8 | 10 | 1,233 | 19 | 595,035 |
| 2 | 12 | 11 | 2,435 | 20 | 695,862 |
| 3 | 19 | 12 | 4,848 | 21 | 796,689 |
| 4 | 31 | 13 | 9,691 | 22 | 897,516 |
| 5 | 53 | 14 | 19,366 | 23 | 998,344 |
| 6 | 95 | 15 | 38,457 | 24 | 1,099,172 |
| 7 | 175 | 16 | 75,408 | 25 | ~1,200,000 |
| 8 | 329 | 17 | 145,074 | | |
| 9 | 632 | 18 | 272,080 | | |

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

### Propeller+ (5 levels, ×2.0 flat scale)

| Level | Cost |
|-------|------|
| 1 | 25 |
| 2 | 50 |
| 3 | 100 |
| 4 | 200 |
| 5 | 400 |

### Harvester+ (8 levels, ×2.0 flat scale)

| Level | Cost |
|-------|------|
| 1 | 30 |
| 2 | 60 |
| 3 | 120 |
| 4 | 240 |
| 5 | 480 |
| 6 | 960 |
| 7 | 1,920 |
| 8 | 3,840 |

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
| Flower Value | 25 | Base value 1 → 100 per flower (power curve `t^1.5`) | 5 | S-curve [1.5, 2.0, 1.2] cap 1.2M |
| Multiplier | 25 | Income multiplier 1× → 5× | 8 | S-curve [1.5, 2.0, 1.2] cap 1.2M |
| Faster Spawns | 25 | Spawn interval 3.5s → 0.8s | 15 | S-curve [1.5, 2.0, 1.2] cap 1.2M |
| Batch Spawns | 25 | Flowers per cycle 1 → up to 15 (probabilistic) | 12 | S-curve [1.5, 2.0, 1.2] cap 1.2M |
| Mega Flowers | 5 | Mega chance 0% → 50% (each mega = 5× value) | 120 | Explicit tiers |

### Drone Upgrades (Upgrades → Drones tab)

| Upgrade | Max Level | Effect | Base Cost | Scale |
|---------|-----------|--------|-----------|-------|
| Propeller+ | 5 | Flight speed +1.5/level (all R1s) | 25 | ×2.0 flat |
| Harvester+ | 8 | Harvest time −0.5s/level, min 0.5s (all R1s) | 30 | ×2.0 flat |
| Drone Dock | 1 | Cooldown → 1s for all R1s | 50,000 | — |

### Per-Drone Upgrades (click drone's dock tile)

| Upgrade | Cost | Effect |
|---------|------|--------|
| Ultimate R1 | 10,000 | 3× all stats + rainbow holo visual |

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
