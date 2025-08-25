# TD-test-01

Prototype for a 2D PvP tower defense game.

## Development

Requires Node.js. Install dependencies and start the server:

```bash
npm install
npm start
```

Then open `http://localhost:3000` in two browsers on the same LAN.

Client files are served from `/client` via Express and socket.io.

## Gameplay

1. Run the server and open the page on two computers in the same LAN.
2. One player chooses **Host** and shares the displayed IP. The other clicks **Conectarse**.
3. In the lobby the Host can configure the match:
   - Map type: `Lineal`, `Intermedio`, `Grande`, `ENORME`.
   - Number of base towers per player (1–3) which creates that many lanes.
   - Economy multiplier (x1–x10) affecting passive income.
   - Graphics mode: `Minimalista` (shapes) or `Texturas activadas` (loads sprites).
4. When both are connected, the Host can start the match.
5. Each player gains money over time to build turrets, walls or send waves of soldiers.
6. Zoom with the mouse wheel and pan with right-click drag; the canvas uses a fixed 1280×720 resolution.

Custom sprites can be placed in `client/sprites/` (`turret.svg`, `wall.svg`, `soldier.svg`, `ground.svg`) and will be used when `Texturas activadas` is selected.
