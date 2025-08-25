# TD-test-01
TD 2D

Prototype for a 2D PvP tower defense game.

## Development

Requires Node.js. Install dependencies and start server:

```bash
npm install
node server/index.js
```

Client served from `/client` via Express and socket.io.

## Gameplay

1. Run the server and open the page on two computers in the same LAN.
2. One player chooses **Host** and shares the displayed IP. The other clicks **Conectarse**.
3. When both are connected, the Host can start the match.
4. Each player gains money over time to build turrets, walls or send waves of soldiers.