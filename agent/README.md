# J.A.R.V.I.S. Local Bridge

Gives the Jarvis web UI real access to **your** machine: shell commands,
Python 3 execution, reading and writing files, and listing directories. All
under a bearer token you control.

## Requirements

- Python 3.8+ (no dependencies — uses stdlib only)

## Run

```bash
# recommended: also opens a public HTTPS tunnel (works from phones)
python3 agent/jarvis_agent.py --tunnel

# local only
python3 agent/jarvis_agent.py
```

With `--tunnel` (requires [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)) the terminal also prints an `https://….trycloudflare.com` URL. Paste that URL + token into the Jarvis UI on any device — laptop or phone — and the browser's HTTPS restrictions no longer apply.

You'll see something like:

```
============================================================
  J.A.R.V.I.S. local bridge — online
============================================================
  URL       : http://127.0.0.1:7842
  Token     : Xq7p...long-random-token...
  Base cwd  : /Users/you
============================================================
```

## Connect from the Jarvis web UI

1. Open the Jarvis app.
2. Click the **plug icon** in the header → paste the **URL** and **Token**.
3. Click "Testar conexão" — should read **online**.
4. Now ask Jarvis things like:
   - "liste os arquivos no meu Desktop"
   - "rode `git status` no repositório X"
   - "leia o arquivo ~/notas.md e me resuma"
   - "crie um arquivo hello.txt com 'olá mundo'"
   - "rode um script Python 3 que liste os arquivos da pasta atual"

## Python 3 support

The agent exposes a dedicated `POST /python3` endpoint. Jarvis can run Python 3 code directly on your machine — useful for scripts, data processing, automation, or anything that fits better as Python than as shell.

The endpoint accepts:

```json
{
  "code": "import os; print(os.listdir('.'))",
  "cwd": "/optional/working/dir",
  "args": ["arg1", "arg2"],
  "timeout": 30
}
```

Response mirrors `shell_exec`: `{exit, stdout, stderr, cwd, executable}`.

Requirements:
- `python3` (or `python`) must be installed and available on your PATH.
- Like `shell_exec`, this runs code with your user permissions. Be careful with destructive operations.

| Env var        | Default                      | Purpose                                  |
| -------------- | ---------------------------- | ---------------------------------------- |
| `JARVIS_HOST`  | `127.0.0.1`                  | Interface to bind (`0.0.0.0` = any)      |
| `JARVIS_PORT`  | `7842`                       | Port to listen on                        |
| `JARVIS_TOKEN` | random, printed on startup   | Fix the token instead of regenerating    |
| `JARVIS_CWD`   | current directory            | Base directory for relative paths        |

Example:

```bash
JARVIS_PORT=9000 JARVIS_TOKEN=meutokensecreto JARVIS_CWD=~/dev python3 agent/jarvis_agent.py
```

## Mobile access

By default the agent binds to `127.0.0.1`, so it can only be reached from the same computer. To use it from a phone or tablet on the same Wi-Fi, bind it to the local network:

```bash
JARVIS_HOST=0.0.0.0 python3 agent/jarvis_agent.py
```

The startup log will print your computer's local IP addresses (e.g. `http://192.168.1.50:7842`). Use that IP + token in the Jarvis mobile UI. Keep the token secret — anyone on your network with it can run commands as you.

## Security

- Default mode binds to `127.0.0.1` only — never reachable from the network.
- Every request requires `Authorization: Bearer <token>`.
- Shell commands run **as your user, with your permissions**. Treat this like giving Jarvis a terminal on your machine — because that's exactly what it is. Only use tokens you generated yourself.
- When you enable `JARVIS_HOST=0.0.0.0`, the agent becomes reachable from any device on your local network. Use it only on trusted networks, and never expose the port to the public internet.
- Stop it with `Ctrl+C` when you're done.
