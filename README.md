# Trivia Race

Online multiplayer trivia board game (one host and up to 10 players).

## Local run
Install Node.js 20+ and run:

```sh
npm install
npm start
```

Open http://localhost:3000. Choose HOST and create a lobby. To test a player on the same computer, open an incognito/private window and choose PLAYER, then enter the displayed room code. Use other private sessions/devices for more players.

## Deploy to Render
1. Extract this folder and commit the contents of `trivia-race/` to a GitHub repository (the `package.json`, `server.js`, `public/`, and `render.yaml` should be at repository root).
2. In Render, choose **New → Blueprint**, connect the GitHub repository, and deploy the `render.yaml` service. Alternatively create a **Web Service** with build command `npm install`, start command `npm start`, and health path `/health`.
3. Visit the Render HTTPS URL on host and player devices. The game uses Socket.IO over the same URL, so no separate frontend deployment or special websocket endpoint is needed.
4. Upload an `.xlsx` or `.xls` file with columns `ID`, `Question`, `Answer`, `Hint` on the first worksheet. The first three fields are required per row; IDs must be unique. The server rejects invalid uploads with row-level messages.

## Important operational limits
Game state is held **in server memory**. Host and player reconnect works while the same server process is running, but a server restart, redeploy, or sleeping free instance will lose active games. For dependable long-running sessions, add persistent shared storage (e.g. Redis or PostgreSQL), session restoration, and deploy a non-sleeping single instance. This version is an online deployable beta, not a production-hardened persistent service. Host credentials and player credentials are saved in browser localStorage, so avoid clearing site data midgame.

## Test checklist
- Host lobby creation, join with a room code from a second browser session, duplicate color rejection, max 10 players.
- Reconnect host/player after refresh; try from a separate device via deployed HTTPS URL.
- Upload valid and invalid workbooks; start and reveal a question.
- Confirm LOCKED (red) changes to BUZZ! (green) at unlock time and buzzer order is determined by server.
- Test correct/incorrect, timer, private hint, die roll, each special space, exact Goal landing, roll-off, Run It Back, Home Menu.

Note: Syntax checked; full multi-device end-to-end testing has not been performed.
