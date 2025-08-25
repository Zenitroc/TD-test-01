# Bizzare Defense

Prototipo de un juego de tower defense PvP en 2D.

## Desarrollo

Requiere Node.js. Instala las dependencias y ejecuta el servidor:

```bash
npm install
npm start
```

Luego abre `http://localhost:3000` en dos navegadores en la misma LAN.

Los archivos del cliente se sirven desde `/client` usando Express y socket.io.

## Jugabilidad

1. Ejecuta el servidor y abre la página en dos computadoras de la misma red.
2. Un jugador elige **Host** y comparte la IP mostrada. El otro hace clic en **Conectarse**.
3. En el lobby el Host puede configurar la partida:
   - Tipo de mapa: `Lineal`, `Intermedio`, `Grande`, `ENORME`.
   - Cantidad de torres por jugador (1–3) que define los carriles.
   - Multiplicador de economía (x1–x10) que afecta el ingreso pasivo.
   - Modo gráfico: `Minimalista` (formas) o `Texturas activadas` (usa sprites).
4. Cuando ambos están conectados, el Host puede iniciar la partida.
5. Cada jugador gana dinero con el tiempo para construir torretas, muros o enviar oleadas de soldados.
6. Haz zoom con la rueda del mouse y desplázate con el botón central.
7. Haz clic derecho en una torreta para mejorarla (20💰 por nivel, hasta 3). El nivel 2 duplica el daño; el nivel 3 dispara dos proyectiles.
8. El botón "Tienda" abre un menú con mejoras para los soldados (HP/daño, velocidad, +1 unidad por oleada). El botón de oleada tiene un enfriamiento de 6 s.
9. Cuando una base llega a 0 HP aparece una pantalla de victoria/derrota con estadísticas y fuegos artificiales para el ganador.

Los sprites personalizados se pueden colocar en `client/sprites/` (`turret`, `wall`, `soldier`, `ground`) en formato `.png`, `.jpg` o `.svg` y se usarán cuando se seleccione `Texturas activadas`. También se puede proporcionar una URL de música en el lobby para reproducirla de fondo.