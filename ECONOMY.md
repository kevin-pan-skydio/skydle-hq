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

## Progression Tiers

### Tier 1: The Hook (0–3 min)

Cheap upgrades that immediately boost click value. Flower Value uses a **power curve** (`t^1.5`) with a guaranteed `+1` floor so every early level *feels* like progress.

| Upgrade | Base Cost | Scale | First 3 Levels |
|---------|-----------|-------|-----------------|
| Flower Value | 5 | 1.25× | 5, 6, 8 |
| Multiplier | 8 | 1.22× | 8, 10, 12 |
| First R1 Drone | 12 | — | 12 |

After ~25 flowers spent: each click yields 2–3 flowers instead of 1. The player immediately sees numbers grow.

### Tier 2: Fleet Building (3–15 min)

Balance buying drones vs. map upgrades. Drones are slow early (10s cooldown + travel + 4.3s harvest ≈ 20s cycle).

| Upgrade | Base Cost | Scale | Lv5 Cost | Lv10 Cost |
|---------|-----------|-------|----------|-----------|
| Faster Spawns | 15 | 1.16× | 27 | 62 |
| Batch Spawns | 12 | 1.18× | 24 | 63 |
| R1 Drones | 12 | 1.55× | 68 | — |
| Propeller+ | 25 | 1.6× | 105 | — |
| Harvester+ | 30 | 1.6× | 126 | — |

### Tier 3: Scaling (15–45 min)

Higher value/multiplier levels, drone fleet optimization.

| Upgrade | Lv15 Cost | Lv20 Cost | Lv25 Cost |
|---------|-----------|-----------|-----------|
| Flower Value | 46 | 115 | 286 |
| Multiplier | 57 | 160 | 452 |
| Faster Spawns | 90 | 193 | 414 |
| Batch Spawns | 92 | 216 | 508 |

### Tier 4: Late Game (45–90 min)

Mega flowers and final map upgrade levels become the focus.

| Upgrade | Cost Progression |
|---------|-----------------|
| Mega Flowers (5 lvls) | 120 → 300 → 750 → 1,875 → 4,688 |
| Multiplier Lv21–25 | 535 → 1,612 |

### Tier 5: Endgame (90–120+ min)

Massive one-time purchases that require sustained income.

| Upgrade | Cost | Effect |
|---------|------|--------|
| Drone Dock | **12,000** | 1s cooldown for all R1s (was 10s) |
| Ultimate R1 | **8,000** / drone | 3× speed, 3× harvest, 3× cooldown + rainbow holo |

## Upgrade Reference

### Map Upgrades (Upgrades → Map tab)

| Upgrade | Max Level | Effect | Base | Scale |
|---------|-----------|--------|------|-------|
| Flower Value | 25 | Base value 1 → 100 per flower (power curve `t^1.5`) | 5 | 1.25× |
| Multiplier | 25 | Income multiplier 1× → 5× | 8 | 1.22× |
| Faster Spawns | 25 | Spawn interval 8s → 2s | 15 | 1.16× |
| Batch Spawns | 25 | Flowers per cycle 1 → up to 15 (probabilistic) | 12 | 1.18× |
| Mega Flowers | 5 | Mega chance 0% → 50% (each mega = 5× value) | 120 | 2.5× |

### Drone Upgrades (Upgrades → Drones tab)

| Upgrade | Max Level | Effect | Base | Scale |
|---------|-----------|--------|------|-------|
| Propeller+ | 5 | Flight speed +1.5/level (all R1s) | 25 | 1.6× |
| Harvester+ | 8 | Harvest time −0.5s/level, min 0.5s (all R1s) | 30 | 1.6× |
| Drone Dock | 1 (one-time) | Cooldown → 1s for all R1s | 12,000 | — |

### Per-Drone Upgrades (click drone's dock tile)

| Upgrade | Cost | Effect |
|---------|------|--------|
| Ultimate R1 | 8,000 | 3× all stats + rainbow holo visual |

### Drones

| Stat | Base Value |
|------|-----------|
| Buy price | 12 (×1.55 each) |
| Flight speed | 2.1 |
| Harvest time | 4.3s |
| Cooldown | 10s (1s with dock) |

Drone costs: 12, 18, 28, 44, 68, 105, 163, 253, ...

## Flower Value — Power Curve Progression

Uses `value = max(1 + level, round(1 + 99 × (level/25)^1.5))` to guarantee every level gives at least +1, with gains accelerating into mid/late game.

| Level | Value/Flower | Δ | Level | Value/Flower | Δ |
|-------|-------------|---|-------|-------------|---|
| 0 | 1 | — | 13 | 38 | +4 |
| 1 | 2 | +1 | 14 | 42 | +4 |
| 2 | 3 | +1 | 15 | 47 | +5 |
| 3 | 5 | +2 | 16 | 52 | +5 |
| 4 | 7 | +2 | 17 | 57 | +5 |
| 5 | 10 | +3 | 18 | 61 | +4 |
| 6 | 13 | +3 | 19 | 67 | +6 |
| 7 | 16 | +3 | 20 | 72 | +5 |
| 8 | 19 | +3 | 21 | 77 | +5 |
| 9 | 22 | +3 | 22 | 83 | +6 |
| 10 | 26 | +4 | 23 | 88 | +5 |
| 11 | 30 | +4 | 24 | 94 | +6 |
| 12 | 34 | +4 | 25 | 100 | +6 |

Early levels (+1, +1, +2, +2) make each purchase feel tangible. The multiplier upgrade compounds on top, so by mid-game a single Flower Value level can meaningfully shift income.

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

## Max Flowers on Map

Flowers share a single cap based on grid size. No more spawn when at capacity.

| Grid Size | Max Flowers |
|-----------|-------------|
| 10×10 | 50 |
| 11×11 | 65 |
| 12×12 | 80 |
| 13×13 | 100 |
| 14×14 | 125 |
| 15×15 | 150 |

## Dev & Speed Modes

- `?dev` — Start with 999 flowers, all upgrades cost 1
- `?speed=N` — Time runs at N× speed (e.g. `?speed=3` for 3× faster)
