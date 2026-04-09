# Skydle HQ

Isometric pixel art idle game set in Skydio's global HQ, built with Three.js. Collect flowers, buy drones, upgrade attachments, and automate your way to a flower empire.

Now with a skill tree.

## Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev
```

The game runs at `http://localhost:5173`. Add `?dev` to the URL for dev mode (999 starting flowers, all items cost 1).

## Production Build

```bash
# Build optimized static bundle
npm run build

# Preview the production build locally
npm run preview
```

The build outputs to `dist/` — a single-page app with all assets bundled and minified. Deploy the contents of `dist/` to any static host:

- **Vercel**: `npx vercel --prod`
- **Netlify**: `npx netlify deploy --prod --dir=dist`
- **GitHub Pages**: push `dist/` to a `gh-pages` branch
- **Any static server**: upload the `dist/` folder (nginx, S3, Cloudflare Pages, etc.)

## Project Structure

```
src/
  config.json        # All game balance values (speeds, prices, upgrades)
  main.js            # Entry point
  styles.css         # UI styles
  game/
    Game.js          # Scene, camera, renderer, input loop
    GameState.js     # Flowers, prices, upgrade levels
    World.js         # Grid board and dock tiles
    FlowerManager.js # Flower spawning, collection, animations
    DroneManager.js  # Drone AI, upgrades, state machine
    FloatingText.js  # +N floating text on collection
    UI.js            # Shop, popups, badges, toasts
```

## Game Config

All game mechanics are driven by `src/config.json`. Tweak drone speed, harvest time, prices, spawn rates, and upgrade scaling without touching code.

## Skill Point Progression

Skill points are earned by filling a skill XP bar. The bar cost grows exponentially (configured via `skillPoints.barSize` and `skillPoints.barScale` in `config.json`):

| Skill Point | XP Required |
|-------------|-------------|
| 1st         | 1,000,000   |
| 2nd         | 1,600,000   |
| 3rd         | 2,560,000   |
| 4th         | 4,096,000   |
| 5th         | 6,553,600   |
| 6th         | 10,485,760  |

Each subsequent skill point costs 1.6x more than the last. Sources of skill XP:

- **Convert flowers** — 1 flower = 1 skill XP (manual, costs flowers)
- **Mega Dock** — passive generation, 10 XP/s per drone (requires Drone Dock)
- **Mushrooms** — 500 XP per mushroom collected (skill XP only, no flowers)

## Rival CEO

A rival CEO periodically enters the field, disrupting operations:

- **First appearance**: 8 minutes into the game
- **Respawn interval**: every 4 minutes after despawning
- **Active duration**: 45 seconds on the field
- **Slowdown**: all drone operations run at 25% speed (75% slower)
- **Manual harvest disabled**: players cannot click to collect flowers
- **Visual effect**: board and lighting desaturate to dull grey

All timing values are configurable in `config.json` under `rivalCEO`.

## Ideas

### Map

- Max flowers on map is tied to map grid size
- Upgrade to increase map grid size, which increases the max flower cap
- Larger maps = more flowers = more drones needed

### Drone Parameters

- **Fly speed** — how fast the drone travels to/from flowers
- **Harvest speed** — how long it takes to pick a flower
- **Recharge speed** — cooldown between flights
- **Harvests per flight** — starts at 1, upgrade to collect multiple flowers before returning home
- **Area harvest** — starts as single-flower pickup, upgrade to harvest a radius (2x2, 3x3, etc.)

### Flower Parameters

- **Count per harvest** — how many flowers each collection yields (base 1)
- **Spawn period** — time between new flowers appearing
- **Flowers per spawn** — starts at 1, upgrade to spawn clusters

### New Collectibles

- **Mega flowers** — rare, worth 5+ flowers each (implemented)
- **Fruits** — slower to grow, much higher value
- **Beehives** — passive income over time, attract more flowers nearby

### Skill Tree

- Map is modeled after the **Clearview campus**
- Each building on the campus is a separate skill tree branch
- Upgrading a skill **sacrifices the entire board** (prestige mechanic) — all flowers, drones reset
- New drone types (X2, X10) unlocked deeper in the skill tree
- Skill points earned based on **total flowers collected lifetime** — increasingly expensive tiers
- Strategic choice: which building to invest in first, when to prestige
