# Welltime Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Rust (for Tauri)
- Anthropic API key

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Anthropic API key:**

   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API key:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

   **Get your API key:**
   - Sign up at https://console.anthropic.com
   - Go to Settings → API Keys
   - Create a new key
   - Copy it to your `.env` file

   **Note:** The `.env` file is gitignored and will not be committed.

## Running the App

### Development Mode
```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server (React frontend)
- Compile and launch the Tauri desktop app
- Enable hot-reload for frontend changes

### Production Build
```bash
npm run tauri:build
```

This creates a production-ready desktop app in `src-tauri/target/release`.

## Features

### Plan Panel (Claude Integration)
The Plan panel uses Claude AI to help you:
- Break down complex tasks into subtasks
- Prioritize your day based on habits and tasks
- Review your reflections and learnings
- Get context-aware planning suggestions

**How it works:**
- Claude receives your complete context (habits, tasks, reflections, current time)
- Responses are streamed in real-time for better UX
- Conversation history is maintained for multi-turn planning

**Example queries:**
- "What should I focus on today?"
- "Break down the VP Sales hiring task"
- "What have I learned about hiring?"
- "I'm stuck on the network infrastructure task"

### Data Storage
Your data is stored locally in `~/.welltime/`:
- `current.md` - Human-readable Markdown
- `data.json` - Fast-loading JSON format
- `history/` - Snapshots for undo functionality

## Troubleshooting

**"API key not configured" error:**
- Make sure you created a `.env` file
- Verify the key starts with `sk-ant-`
- Restart the dev server after adding the key

**Port 1420 already in use:**
```bash
lsof -ti:1420 | xargs kill -9
npm run tauri:dev
```

**Rust compilation errors:**
Make sure Rust is installed:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Development

### Project Structure
```
src/
├── components/        # React UI components
│   ├── HabitItem.tsx
│   ├── TaskItem.tsx
│   ├── ChatPanel.tsx  # Claude AI integration
│   └── ...
├── lib/
│   ├── types.ts       # TypeScript data models
│   ├── claude.ts      # Claude API service
│   ├── storage.ts     # File system operations
│   └── ...
├── hooks/             # React hooks
└── App.tsx            # Main app component

src-tauri/             # Rust backend (Tauri)
```

### Key Technologies
- **Tauri** - Lightweight Rust-based desktop framework
- **React + TypeScript** - Frontend
- **Tailwind CSS** - Styling
- **Anthropic SDK** - Claude AI integration
- **Vite** - Build tooling

## Next Steps

After setup, you can:
1. Add your own habits and tasks
2. Complete items and add reflections
3. Use the Plan panel to get AI assistance
4. Data persists automatically to `~/.welltime/`

Enjoy building your productivity system! 🚀
