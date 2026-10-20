# Trivia Race
Multiplayer host-controlled trivia board game for up to 10 players. Uses the exact uploaded board (positions 0–50).

## Local start
Install Node.js 20+, run `npm install` then `npm start`. Open http://localhost:3000. Open the same server address on other devices (or deploy it publicly).

## Render deployment
Push this folder to a GitHub repository. In Render create a **Web Service**, choose the repo, Runtime **Node**, Build Command `npm install`, Start Command `npm start`. Share the Render URL. The host creates a lobby and players enter the code.

## Question sheet
First worksheet: header row, column A Question ID, B Question, C Answer, D Hint. Upload from host lobby.

## Important first-version notes
- Rooms live in server memory: restarting the server loses active rooms. Use one Render instance; a persistent datastore is recommended before production.
- Timers and buzz ordering are checked by the server, but internet latency can still affect fairness. Clients render their own countdown based on server timestamps.
- Player reconnection uses a token stored in localStorage on the same browser/device. Clearing browser storage loses the token.
- A piggybacked player moves the same amount as the selected player when that player rolls; landing effects are only triggered for the roller.
- The initial build has no audio/confetti animation, and token movement is immediate rather than animated.
