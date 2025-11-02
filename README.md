# Budget Buddy

A small personal budget app with an Expo (React Native) client and a Flask-based Python server. The client is an Expo/React Native app (TypeScript-ready) and the server is a lightweight Flask API that uses MongoDB when available and falls back to a file-backed store (`data.json`).

## Tech stack

- Client: Expo / React Native, React, TypeScript (dev), Tailwind (via `nativewind`), Metro bundler
- Server: Python 3.11+ (works with 3.10+), Flask, PyMongo, JWT for auth, python-dotenv for env loading
- Data: MongoDB (optional). If MongoDB is not available the server uses `server/data.json` as a fallback store.

## Repository layout

- `client/` — Expo React Native app
- `server/` — Flask API and `data.json` fallback

## Prerequisites

- Node.js (LTS) and Yarn (the project uses `yarn@4` in `client/package.json`). You can enable/prepare Yarn via Corepack if needed.
- Python 3.10+ and `venv` module
- (Optional) MongoDB server if you want persistent DB storage

## Required packages

Client dependencies (from `client/package.json`):

- expo
- react, react-native
- nativewind, tailwindcss
- react-native-reanimated, react-native-safe-area-context
- @react-native-async-storage/async-storage

Dev dependencies include TypeScript, ESLint, Prettier, and related tooling (see `client/package.json`).

Server dependencies (from `server/requirements.txt`):

- Flask==3.0.0
- flask-cors==3.0.10
- pymongo==4.7.1
- python-dotenv==1.0.0
- PyJWT==2.8.0
- passlib[bcrypt]==1.8.1

Install server dependencies with pip (see instructions below).

## Environment variables

Create a `.env` file in `server/` (or set env variables in your shell) with the following keys as needed:

- `MONGODB_URI` — MongoDB connection string (default: `mongodb://localhost:27017/`)
- `MONGODB_DB` — database name (default: `budgetbuddy`)
- `JWT_SECRET` — secret used for signing JWT tokens (default: `dev-secret`)
- `PORT` — port the Flask server listens on (default: `5000`)

Example `.env` (do NOT commit it):

```
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=budgetbuddy
JWT_SECRET=your-secret-here
PORT=5000
```

## Run the server (Windows PowerShell)

1. Open a PowerShell terminal and change to the `server` folder:

```powershell
cd server
```

2. Create and activate a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

4. (Optional) Create a `.env` in `server/` with the variables listed above.

5. Start the server:

```powershell
python app.py
```

The Flask server will start on `http://0.0.0.0:5000` by default. It exposes endpoints under `/api/*` (see `server/app.py`). If MongoDB is reachable the app will use it; otherwise it will read/write `server/data.json`.

## Run the client (Windows PowerShell)

1. Open a PowerShell terminal and change to the `client` folder:

```powershell
cd client
```

2. Install dependencies (Yarn):

```powershell
yarn install
```

If you don't have Yarn 4 available, you can enable Corepack and prepare Yarn:

```powershell
<!-- prettier-ignore -->
<!-- README redesigned: compact, visual, and copy-paste friendly -->

# Budget Buddy

![Budget Buddy screenshot](client/assets/splash.png)

A lightweight personal budgeting demo with an Expo (React Native) front-end and a Flask API back-end. It runs with MongoDB when available and falls back to a file-backed store for quick local development.

<!-- Badges -->
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Expo](https://img.shields.io/badge/Expo-React%20Native-5EA43A)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## Table of contents

- [Why this project](#why-this-project)
- [Tech stack](#tech-stack)
- [Quick start (copy & paste)](#quick-start-copy--paste)
- [Environment variables](#environment-variables)
- [Run (server & client)](#run-server--client)
- [Notes & tips](#notes--tips)
- [Contributing](#contributing)

---

## Why this project

Budget Buddy is a simple demo app meant for learning and prototyping: authentication (JWT), simple CRUD for transactions, MongoDB optional persistence, and an Expo-based mobile UI. It is intentionally small so you can extend it.

## Tech stack

- Client: Expo / React Native, React, Tailwind (nativewind)
- Server: Python + Flask, PyMongo (optional), JWT auth, python-dotenv
- Data: MongoDB (recommended) or file-backed JSON fallback (`server/data.json`)

## Quick start (copy & paste)

Open two PowerShell terminals — one for the server and one for the client.

Server (terminal A):

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Client (terminal B):

```powershell
cd client
yarn install
yarn start
# then press 'a' for Android, 'i' for iOS, or open the Expo dev tools
```

Notes:
- If running the mobile app on a physical device, point the API base URL to your machine IP (e.g. `http://192.168.x.y:5000`).
- To enable Yarn 4 via Corepack if needed:

```powershell
corepack enable; corepack prepare yarn@stable --activate
```

## Environment variables

Create `server/.env` with these values (examples):

```env
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=budgetbuddy
JWT_SECRET=your-secret-here
PORT=5000
```

The server will use MongoDB when `MONGODB_URI` points to a running instance. Otherwise it falls back to `server/data.json`.

## Run (server & client)

Server
- From `server/`: create a venv, install `requirements.txt`, then run `python app.py`. The API listens on `0.0.0.0:5000` by default.

Client
- From `client/`: `yarn install` then `yarn start`. Use Expo to run on device/emulator.

## Notes & tips

- The server currently stores plaintext passwords by design in this demo (see `server/app.py`). Replace `hash_password`/`verify_password` with `passlib`+bcrypt for real deployments.
- Commit `yarn.lock`/`pnpm-lock.yaml` normally — lockfiles ensure reproducible installs. The `.gitignore` added earlier intentionally ignores Yarn runtime caches but not `yarn.lock`.
- If you want persistent data, run a local MongoDB and set `MONGODB_URI` accordingly.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a pull request

Small, focused PRs (one feature or fix per PR) are easiest to review.

---

If you'd like, I can:

- Add a `CONTRIBUTING.md` with development conventions.
- Create `server/.env.example` and a root `.env.example` to document env defaults.
- Add a small screenshot or animated GIF under `docs/` and embed it in the README.

Enjoy! 😊
