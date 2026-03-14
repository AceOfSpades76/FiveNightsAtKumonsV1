# Five Nights at Kumon

A browser-based horror game inspired by *Five Nights at Freddy's*. Survive six in-game hours (12 AM–6 AM) each night by managing power, doors, lights, and cameras while avoiding the Math Teacher, Reading Teacher, and Mr. Sub. Clear all five nights to win.

![Five Nights at Kumon](https://img.shields.io/badge/React-18-61dafb?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite) ![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## Quick start

**Requirements:** Node.js 18+

```bash
# Clone the repo (replace YOUR_USERNAME with your GitHub username)
git clone https://github.com/YOUR_USERNAME/kumon-horror-nights.git
cd kumon-horror-nights

# Install dependencies
npm install

# Run in development (with hot reload)
npm run dev
```

Open **http://localhost:3000** in your browser. Click **NEW GAME** from the menu (this enables audio), then survive the night.

---

## How to play

- **Power** – Your focus (battery) drains when doors, lights, or the camera monitor are on. Run out and it’s game over.
- **Doors** – Close the **left** and **right** doors to block the Math Teacher (left) and Reading Teacher (right). Closing a door uses power.
- **Lights** – Use the **light buttons** next to each door to check the hallway before opening the door. Lights also drain power.
- **Cameras** – Click **Raise Monitor** to open the camera system. Check cameras to see where the teachers are. The monitor uses power and briefly leaves you vulnerable when you lower it.
- **Mr. Sub** – A roamer that appears once per night when power is low. When you see **“MR. SUB IS APPROACHING”** and the door flicker, **close the correct door** (left or right) before he reaches it. If the door is open when he arrives, you get a jumpscare and game over.
- **Vent** – When the vent starts failing, a **VENT CIRCUIT RESET** minigame appears. Complete the node sequence (PWR → A1 → B2 → C3 → GND) before time runs out, or you get a strike. Two strikes trigger the Dean and a monitor blackout.

**Goal:** Survive from 12 AM to 6 AM for five nights without being caught or running out of power.

---

## Scripts

| Command       | Description                          |
|---------------|--------------------------------------|
| `npm run dev` | Start dev server (Vite + Express)   |
| `npm run build` | Build client + server for production |
| `npm start`   | Run production build                 |
| `npm run check` | TypeScript type check              |

---

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Wouter
- **Backend:** Express, in-memory score storage (no database required to run)
- **Audio:** Web Audio API (synthesized sounds; enable audio by clicking or using the menu)

---

## Project structure

```
├── client/           # React app (Vite)
│   └── src/
│       ├── components/  # UI and game components (Office, HUD, Cameras, etc.)
│       ├── hooks/       # use-game, use-audio, use-scores
│       └── pages/       # MainMenu, Game, Leaderboard
├── server/           # Express API (scores, static serve)
├── shared/           # Shared types and API schema (Zod, routes)
├── script/           # Build script
└── dist/             # Production output (after npm run build)
```

---

## Configuration

- **Port:** Set `PORT` (default `3000`) to run the server on another port.
- **Audio:** Browsers require a user gesture before playing sound. Click **NEW GAME** from the main menu (or click anywhere / press a key on the game screen) to unlock audio.

---

## Publishing on GitHub

1. Create a new repository on GitHub (e.g. `kumon-horror-nights`).
2. In `package.json`, set `repository.url` to your repo:  
   `"url": "https://github.com/YOUR_USERNAME/kumon-horror-nights.git"`.
3. In this README, replace `YOUR_USERNAME` in the clone URL with your GitHub username.
4. Do not commit `.env` (it’s in `.gitignore`). Use `.env.example` as a template if you add env vars.

## License

MIT — see [LICENSE](LICENSE).
