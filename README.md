# 🔐 Real-Time-Chat

**Ephemeral real-time chat — conversations vanish when you leave.**

No accounts. No history. No trace.

🌐 **[Live Demo](https://real-time-chat-system-baat.onrender.com)**

---

## Tech Stack

- **Backend** — Java 21, Spring Boot 3.2, WebSocket (STOMP), Redis 7
- **Frontend** — React 19, TypeScript, Vite, Zustand
- **Infra** — Docker, Render

## Features

- 👻 Anonymous ghost sessions (JWT, no signup)
- 💬 Real-time messaging over native WebSocket
- 🏠 Public & private chat rooms
- 📎 File & image sharing
- 🧹 Auto-cleanup — rooms decay after inactivity
- 🛡️ Rate limiting & channel-level auth

## Quick Start

```bash
git clone https://github.com/ashlin311/real_time_chat_system.git
cd real_time_chat_system
docker compose up --build
```

App runs at **http://localhost:8080**

## Project Structure

```
├── cipher-slate/          # React frontend
├── src/main/java/         # Spring Boot backend
├── Dockerfile             # Multi-stage build (Node → Maven → JRE)
└── docker-compose.yml     # App + Redis
```

