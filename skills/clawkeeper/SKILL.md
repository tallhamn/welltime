---
name: clawkeeper
description: Use when the user wants to manage their tasks, habits, or todos. Handles adding, completing, editing, deleting tasks and habits, managing subtasks and notes, and showing current state.
---

# ClawKeeper CLI

Manage the user's tasks and habits via the ClawKeeper CLI. All data is stored as markdown at the path set by `CLAWKEEPER_DIR` (defaults to `~/.clawkeeper/`).

Run commands using:

```bash
clawkeeper <entity> <command> [--flags]
```

If `CLAWKEEPER_DIR` is set in your environment, the CLI reads and writes data there. This allows multiple agents to share the same task list.

## Tasks

```bash
clawkeeper task list
clawkeeper task add --text "Buy groceries"
clawkeeper task add-subtask --parent-text "Buy groceries" --text "Milk"
clawkeeper task complete --id <id>
clawkeeper task complete --text "Buy groceries"
clawkeeper task uncomplete --id <id>
clawkeeper task edit --text "Old name" --new-text "New name"
clawkeeper task delete --text "Buy groceries"
clawkeeper task add-note --text "Buy groceries" --note "Check prices first"
clawkeeper task delete-note --text "Buy groceries" --note "Check prices first"
```

## Habits

```bash
clawkeeper habit list
clawkeeper habit add --text "Meditate" --interval 24
clawkeeper habit edit --text "Meditate" --new-text "Morning meditation" --interval 12
clawkeeper habit delete --text "Meditate"
clawkeeper habit complete --text "Meditate"
clawkeeper habit add-note --text "Meditate" --note "Felt calm today"
```

## State

```bash
clawkeeper state show
```

## Notes

- All commands return JSON: `{"ok": true, "data": ...}` on success, `{"ok": false, "error": "..."}` on failure.
- IDs are stable across invocations. Use `--id` for precise lookups or `--text` for fuzzy substring matching.
- When adding a task, the response includes the new task's `id` for subsequent operations.
