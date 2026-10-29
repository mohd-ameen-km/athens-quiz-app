# Athens

**Athens** is a competitive 3-player quiz tournament application built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. Designed for screen-shares and shared-room trivia matches, Athens pairs a warm paper-and-ink aesthetic with structured tournament mechanics: structured challenger-defender pairings, pass sequences, running category point counters, safety-guarded answer reveals, and full undo support.

---

## Table of Contents

- [Game Rules & Tournament Structure](#game-rules--tournament-structure)
  - [Roles & Attempt Order](#roles--attempt-order)
  - [Scoring Rules](#scoring-rules)
- [Key Features](#key-features)
- [Accepted TSV Dataset Format](#accepted-tsv-dataset-format)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development & Quality Scripts](#development--quality-scripts)
- [Project Architecture](#project-architecture)

---

## Game Rules & Tournament Structure

Each match features **3 players** competing across rounds determined by the number of topics provided.

- A round consists of **3 challenges**, guaranteeing that each player faces every opponent in both offensive (Challenger) and defensive (Defender) roles.
- The total number of topics in the dataset must be a **multiple of 3** (e.g. 6, 9, 12, 15).

### Roles & Attempt Order

For each challenge:

1. **Topic Selection**: The active **Challenger** chooses an available topic from the Topics Board.
2. **Direct Attempt**: The **Defender** gets the first opportunity to answer under the Direct Timer (default: 25 seconds).
3. **Pass 1 (Challenger)**: If the defender fails or times out, the turn passes to the **Challenger** under the Pass Timer (default: 20 seconds).
4. **Pass 2 (Third Player)**: If the challenger fails, the **Third Player** receives the final attempt.

### Scoring Rules

Scores are tracked via four running counters per player:

| Counter   | Metric             | Points | Description                                                                                                     |
| :-------- | :----------------- | :----- | :-------------------------------------------------------------------------------------------------------------- |
| **DP**    | Defended Points    | **+2** | Earned by the **Defender** for answering correctly on the direct turn.                                          |
| **CN**    | Challenge Negative | **−1** | Penalty deducted from the **Challenger** when the defender answers correctly or the challenger fails on a pass. |
| **CP**    | Challenge Positive | **+2** | Earned by the **Challenger** on Pass 1 after the defender failed.                                               |
| **PP**    | Passed Points      | **+2** | Earned by the **Third Player** on Pass 2 when both defender and challenger failed.                              |
| **Total** | Total Score        | —      | Calculated as: `Total = CP + CN + DP + PP`                                                                      |

---

## Key Features

- **Decoupled Outcome & Reveal**: Clicking _Correct_ or _Wrong_ records points and resolves attempts without displaying the answer. The host explicitly controls when to reveal the answer to the audience using _Reveal Answer_.
- **Full Global Undo**: Complete state snapshotting on every action. Undoing a recorded outcome restores prior scores, attempts, and the timer's previous state.
- **Interactive Media Lightbox**: Click any question or answer image to open an enlarged full-screen modal with keyboard (`Escape`) and backdrop dismiss.
- **Compact Sidebar & 80/20 Layout**: On question screens, content occupies ~80% width with high typography legibility, while a slim ~20% sidebar displays the active pairing and compact scoreboard.
- **Screen-Share Optimized Board**: Topic cards fit within standard viewports with minimal padding. Completed topics show clean match tags (e.g. `R1 · Alice vs Bob`) without distracting clutter.
- **Custom Timer Controls**: Direct editable numeric seconds, `+10` / `−10` quick adjustments, and play/pause controls.

---

## Accepted TSV Dataset Format

Athens imports question packages via tab-separated values (`.tsv` or `.txt`).

### File Specifications

- **Encoding**: UTF-8.
- **Delimiter**: Tab (`\t`).
- **Topic Constraint**: Unique topic count must be a multiple of 3.
- **Media**: Image, video, and audio columns accept local paths (e.g. `/media/pic.jpg`) or remote URLs (`https://...`).

### Column Schema

```tsv
Topic	Question	Answer	Question Image	Question Video	Question Audio	Answer Image	Answer Video	Answer Audio
Ancient Rome	Who was the first emperor of Rome?	Augustus Caesar
Ancient Rome	What year was Julius Caesar assassinated?	44 BC
Ancient Rome	What structure held chariot races in Rome?	Circus Maximus
Greek Philosophy	Who was the teacher of Alexander the Great?	Aristotle
Greek Philosophy	What method of inquiry uses cooperative dialogue?	The Socratic Method
Greek Philosophy	Which philosopher wrote The Republic?	Plato
Mythology	What is the Roman name for the Greek god Ares?	Mars
Mythology	Who was cursed to hold up the celestial heavens?	Atlas
Mythology	What mythical beast guarded the underworld?	Cerberus
```

_(You can also click **Load Sample TSV** on the setup screen to inspect and test the built-in sample dataset.)_

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Fraunces serif & Geist sans typography
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## Getting Started

### Prerequisites

- Node.js 18.17+ or Node.js 20+
- npm (or pnpm / yarn)

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/athens.git
cd athens
npm install
```

2. Start the local development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development & Quality Scripts

| Command                | Action                                                |
| :--------------------- | :---------------------------------------------------- |
| `npm run dev`          | Starts the Next.js development server.                |
| `npm test`             | Runs the Vitest test suite (unit and workflow tests). |
| `npm run lint`         | Checks code with Next.js ESLint.                      |
| `npm run format`       | Automatically formats all files using Prettier.       |
| `npm run format:check` | Validates formatting against Prettier standards.      |
| `npm run build`        | Compiles the production application bundle.           |

---

## Project Architecture

```
athens/
├── app/
│   ├── globals.css          # Design system CSS variables & glass tokens
│   ├── layout.tsx           # Fraunces & Geist font setups, metadata
│   └── page.tsx             # Root page & sticky branding header
├── components/
│   ├── question/            # Question screen, pacing timer, lightbox
│   ├── result/              # Final standings, podium, scoreboard table
│   ├── scoreboard/          # Full & compact CP/CN/DP/PP running tables
│   ├── setup/               # TSV drag-and-drop, player setup, timers
│   ├── topics/              # Topics grid, spotlight card, match status
│   └── ui/                  # Badge, Button, Card, and Logo primitives
├── context/
│   └── GameContext.tsx      # Global React Context provider & dispatchers
├── lib/
│   ├── gameReducer.ts       # Reducer: scoring logic, scheduling, undo stack
│   ├── parseTsv.ts          # Robust TSV parsing and validation engine
│   ├── sampleTsv.ts         # Bundled sample dataset
│   ├── scheduling.ts        # Round-robin pairing generator
│   └── scoreboard.ts        # Score formatting and calculation helpers
└── types/
    └── index.ts             # Domain models (GameTopic, Player, Challenge)
```
