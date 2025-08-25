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

Requires Node.js. Install dependencies and start server:

```bash
npm install
node server/index.js
```

## Gameplay

1. Run the server and open the page on two computers in the same LAN.
2. One player chooses **Host** and shares the displayed IP. The other clicks **Conectarse**.
3. When both are connected, the Host can start the match.
4. Each player gains money over time to build turrets, walls or send waves of soldiers.

