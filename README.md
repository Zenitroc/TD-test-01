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
3. Before starting, the Host selects a map type:
   - `Lineal` – camino recto.
   - `Intermedio` – curvas suaves sin retroceder.
   - `Grande` – recorrido amplio hacia los costados.
   - `ENORME` – zigzag que puede volver hacia atrás.
4. When both are connected, the Host can start the match.
5. Each player gains money over time to build turrets, walls or send waves of soldiers.
6. Zoom with the mouse wheel and pan with right-click drag; the canvas uses a fixed 1280×720 resolution.
7. A "Tienda" button opens a popup with upgrades for soldiers (HP/daño, velocidad, +1 unidad por oleada). The wave button has a 6s cooldown with a grey border that returns to green when available.

Custom sprites can be placed in `client/sprites/` (`turret.svg`, `wall.svg`, `soldier.svg`, `ground.svg`) and will be used when `Texturas activadas` is selected.