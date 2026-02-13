# ClawKeeper

Agentic task management. Habits and tasks stored as markdown, editable by humans and AI agents alike.

## Architecture

```
/opt/clawkeeper/              ← shared CLI install (read-only)
/srv/clawkeeper/current.md    ← shared data (read-write by marcus + openclaw)
/usr/local/bin/clawkeeper     ← symlink to /opt/clawkeeper/bin/clawkeeper
~/.clawkeeper                 ← symlink to /srv/clawkeeper (for Tauri app)
```

Three access paths to the same data:
- **Tauri desktop app** — runs as marcus, reads `~/.clawkeeper` (symlink)
- **Claude Code** — runs as marcus in the dev repo, uses `npm run cli` with `CLAWKEEPER_DIR`
- **OpenClaw** — runs as openclaw, uses `/usr/local/bin/clawkeeper` with `CLAWKEEPER_DIR`

## Setup

### 1. Shared group and data directory

```bash
sudo groupadd clawkeeper
sudo usermod -aG clawkeeper marcus
sudo usermod -aG clawkeeper openclaw

sudo mkdir -p /srv/clawkeeper
sudo chown marcus:clawkeeper /srv/clawkeeper
sudo chmod 770 /srv/clawkeeper
```

### 2. Install CLI to shared location

```bash
sudo git clone /home/marcus/Documents/GitHub/welltime /opt/clawkeeper
sudo chown -R marcus:clawkeeper /opt/clawkeeper
sudo chmod -R g+rX /opt/clawkeeper
cd /opt/clawkeeper && npm install
sudo ln -s /opt/clawkeeper/bin/clawkeeper /usr/local/bin/clawkeeper
```

### 3. Migrate existing data and symlink

```bash
# Move data to shared location
cp ~/.clawkeeper/current.md /srv/clawkeeper/current.md
rm -rf ~/.clawkeeper
ln -s /srv/clawkeeper ~/.clawkeeper
```

### 4. Set CLAWKEEPER_DIR for CLI usage

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export CLAWKEEPER_DIR=/srv/clawkeeper
```

### 5. OpenClaw systemd service

```bash
sudo systemctl edit openclaw-gateway.service
```

Add:

```ini
[Service]
Environment=CLAWKEEPER_DIR=/srv/clawkeeper
ReadWritePaths=/srv/clawkeeper
ReadOnlyPaths=/opt/clawkeeper
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl restart openclaw-gateway
```

### 6. Install OpenClaw skill

```bash
sudo -u openclaw mkdir -p /home/openclaw/.openclaw/skills/clawkeeper
sudo cp /opt/clawkeeper/skills/clawkeeper/SKILL.md /home/openclaw/.openclaw/skills/clawkeeper/
sudo chown -R openclaw:openclaw /home/openclaw/.openclaw/skills/clawkeeper
```

### 7. Claude Code skill

The skill at `.claude/skills/clawkeeper/SKILL.md` is automatically available when Claude Code runs in the dev repo. No extra setup needed.

## Desktop App (Tauri)

```bash
cd /home/marcus/Documents/GitHub/welltime
npm install
cp .env.example .env   # add VITE_ANTHROPIC_API_KEY (required), VITE_TAVILY_API_KEY (optional)
npm run tauri:dev
```

The Tauri app reads `~/.clawkeeper/current.md` which symlinks to `/srv/clawkeeper/current.md`.

## CLI Reference

All commands return JSON. Use `--id` for exact ID match, `--text` for fuzzy substring match.

| Command | Description |
|---------|-------------|
| `task list` | List all tasks |
| `task add --text "..."` | Add a task |
| `task add-subtask --parent-text "..." --text "..."` | Add subtask |
| `task complete --id <id>` | Complete a task |
| `task edit --text "..." --new-text "..."` | Rename a task |
| `task delete --text "..."` | Delete a task |
| `task add-note --text "..." --note "..."` | Add note to task |
| `habit list` | List all habits |
| `habit add --text "..." [--interval 24]` | Add a habit |
| `habit complete --text "..."` | Complete a habit |
| `habit edit --text "..." [--new-text "..."] [--interval N]` | Edit habit |
| `habit delete --text "..."` | Delete a habit |
| `habit add-note --text "..." --note "..."` | Add note to habit |
| `state show` | Show full state |

## Updating the shared CLI

After pulling changes in the dev repo:

```bash
cd /opt/clawkeeper && sudo -u marcus git pull origin main && npm install
```
