---
name: clawkeeper
description: Use when the user wants to manage their tasks, habits, or todos. Handles adding, completing, editing, deleting tasks and habits, managing subtasks and notes, and showing current state.
---

# ClawKeeper CLI

Manage the user's tasks and habits via the ClawKeeper CLI. All data is stored as markdown in `~/.clawkeeper/current.md` (or the path set by `CLAWKEEPER_DIR`).

Run commands from the project root:

```bash
npm run cli -- <entity> <command> [--flags]
```

## Tasks

```bash
npm run cli -- task list
npm run cli -- task add --text "Buy groceries"
npm run cli -- task add-subtask --parent-text "Buy groceries" --text "Milk"
npm run cli -- task complete --id <id>
npm run cli -- task complete --text "Buy groceries"
npm run cli -- task uncomplete --id <id>
npm run cli -- task edit --text "Old name" --new-text "New name"
npm run cli -- task delete --text "Buy groceries"
npm run cli -- task add-note --text "Buy groceries" --note "Check prices first"
npm run cli -- task delete-note --text "Buy groceries" --note "Check prices first"
```

## Habits

```bash
npm run cli -- habit list
npm run cli -- habit add --text "Meditate" --interval 24
npm run cli -- habit edit --text "Meditate" --new-text "Morning meditation" --interval 12
npm run cli -- habit delete --text "Meditate"
npm run cli -- habit complete --text "Meditate"
npm run cli -- habit add-note --text "Meditate" --note "Felt calm today"
```

## State

```bash
npm run cli -- state show
```

## Notes

- All commands return JSON: `{"ok": true, "data": ...}` on success, `{"ok": false, "error": "..."}` on failure.
- IDs are stable across invocations. Use `--id` for precise lookups or `--text` for fuzzy substring matching.
- When adding a task, the response includes the new task's `id` for subsequent operations.
