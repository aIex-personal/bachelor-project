<h1 align="center">🎵 HapticStudio</h1>

<p align="center">
  <em>A web-based and desktop tool for designing, storing, and playing back haptic vibration patterns — visually, without writing code.</em><br/>
  <strong>BSc Software Engineering Bachelor Project · SDU × Hamsø Engineering ApS</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-SvelteKit_5-FF3E00?style=for-the-badge&logo=svelte" alt="SvelteKit"/>
  <img src="https://img.shields.io/badge/Backend-PocketBase-B8DBE4?style=for-the-badge" alt="PocketBase"/>
  <img src="https://img.shields.io/badge/Desktop-Electron_33-47848F?style=for-the-badge&logo=electron" alt="Electron"/>
  <img src="https://img.shields.io/badge/Deploy-Docker_+_VPS-2496ED?style=for-the-badge&logo=docker" alt="Docker"/>
  <a href="https://studio.hamso.dk">
    <img src="https://img.shields.io/badge/Live-studio.hamso.dk-22c55e?style=for-the-badge" alt="Live"/>
  </a>
</p>

---

## 🎯 The Problem

Designing haptic (vibration) patterns today means writing low-level, platform-specific code — Apple AHAP files, Android vibration APIs — then flashing firmware, feeling the result on hardware, adjusting values, and repeating. There is no visual editor. There is no instant preview. Every iteration requires a full hardware cycle.

**HapticStudio solves this** with a timeline-based visual editor in the browser — or as a cross-platform desktop app — where patterns can be designed, heard in real time via the Web Audio API, and exported to WAV for direct use with haptic actuator hardware.

> 🌐 **Live deployment:** [studio.hamso.dk](https://studio.hamso.dk)

---

## ✨ What You Can Do

- 🎛️ **Draw waveforms** across multiple tracks — sine, square, triangle, sawtooth
- 🎚️ **Tune parameters** — frequency, amplitude, duration, fade-in/out envelope
- 📈 **Draw frequency envelopes** — draggable breakpoints to define how frequency evolves over time
- 👂 **Preview in real time** — hear patterns via the Web Audio API before touching hardware
- 📤 **Export to WAV** — universal format compatible with DAWs, MATLAB, LabVIEW, and LRA actuator drivers
- 🗂️ **Manage projects and a preset library** — save, load, organise, and share patterns
- 🖥️ **Run as a desktop app** — Electron build supports up to 16 independent audio output channels for multi-actuator rigs

Validated on a **real LRA (Linear Resonant Actuator)** hardware device provided by Hamsø Engineering ApS.

---

## 🏗️ Architecture

```
                 Electron (desktop)  ── loads ──┐
                                                 ▼
 ┌──────────────────────── Browser / Client ────────────────────────┐
 │  Pages: Login · Register · Dashboard · Editor · Admin             │
 │        │                                │                          │
 │  Reactive Stores (Svelte 5 runes)   PocketBase JS SDK             │
 │  auth · timeline · playback · editor · audioDevice                │
 │        │                                │                          │
 │  UI Components                          │                          │
 │  Timeline · SoundEditor · FilterPanel · PresetLibrary · Admin     │
 │        │                                │                          │
 │  Audio Layer: AudioEngine + WavEncoder  │                          │
 └─────────────────────────────────────────┼──────────────────────────┘
                                REST API   │
                                     ▼     │
                      ┌── PocketBase (Go + SQLite) ──────────────────┘
                      │   users · sounds · projects
                      │   patterns · admin_signals · signal_access
```

**One codebase → three targets:** browser (Docker + VPS), Electron desktop, and offline static build — via a single adapter switch.

---

## ⚙️ Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | **SvelteKit** (Svelte 5 runes) | Compile-time reactivity — no virtual DOM overhead on a drag-heavy timeline with dozens of position updates per frame |
| Styling | **Tailwind CSS v4 + DaisyUI v5** | Rapid, consistent component design as required by the client |
| Audio | **Web Audio API** | Sample-accurate synthesis and offline rendering — no native code, runs in both browser and Electron |
| Backend | **PocketBase** (Go + SQLite) | Auth + DB + REST + admin panel in one binary — eliminated weeks of boilerplate |
| Desktop | **Electron 33** | Packages the same SvelteKit static build; unlocks 16-channel audio output for multi-LRA rigs |
| Unit Tests | **Vitest** | 135 tests across 5 suites |
| E2E Tests | **Playwright** | 61 test cases across real browser workflows |
| Deploy | **Docker Compose** on VPS | Two containers: SvelteKit + PocketBase |

---

## 🔑 Key Technical Decisions

**Why WAV instead of AHAP?**
WAV is uncompressed PCM — natively readable by DAWs, MATLAB, LabVIEW, and actuator drivers without conversion. AHAP is powerful but Apple-only and code-driven.

**Why schedule audio against `AudioContext.currentTime`?**
The Web Audio clock advances independently of frame rate and tab throttling — it's sample-accurate. `setTimeout` and `requestAnimationFrame` drift when the tab is backgrounded. Both the audio engine and the visual playhead derive from the same clock, so they never desync.

**Why PocketBase over Express + PostgreSQL?**
One binary = auth, database, REST API, file storage, migrations, and an admin UI. At this project's scale, the coupling trade-off was acceptable and saved weeks of infrastructure work.

---

## 🧪 Testing

| Level | Tool | Result |
|---|---|---|
| Unit | Vitest | **135 tests, 5/5 suites pass** |
| E2E | Playwright | **61 test cases pass** |
| Hardware | LRA actuator (Hamsø) | All 6 hardware validation scenarios confirmed |
| Compatibility | Manual | Chrome ✅ · Safari ✅ · Electron ✅ |

---

## 🚀 Getting Started

### Web (Docker)

```bash
git clone https://github.com/aIex-personal/bachelor-project.git
cd bachelor-project

cp .env.example .env
# Set PUBLIC_POCKETBASE_URL in .env

docker-compose up --build
# SvelteKit  →  http://localhost:3000
# PocketBase →  http://localhost:8090/_/
```

### Desktop (Electron)

```bash
cd project && npm install
npm run dev:electron    # development
npm run build:electron  # production build
```

---

## 👥 Team

| Name | Role |
|---|---|
| Alexandru Daniel Baducu | Developer |
| Beniamin Avramita (Cantor-Labiserica) | Developer |
| Ionela Sorina Pertea | Developer |

**Supervisors:** Devender Kumar · Amir Ghomashi (SDU)
**Industry Partner:** Hamsø Engineering ApS

---

## 📄 Academic Context

Bachelor's Thesis in Software Engineering — University of Southern Denmark (SDU), 2026.
Delivered across 6 sprints (Feb – Jun 2026): 49 user stories, 8 functional requirements, 10 non-functional requirements, 11 use cases.