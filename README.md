# Remix of Remix of Your Personal Assistant (95)

Construa um Jarvis

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4cc27919-942d-47f0-a857-44323084c00e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Scheduled AI news

The **Tarefas agendadas** menu can send a news digest about OpenAI, Anthropic,
Google Gemini, and AI for business every Tuesday and Friday at 08:00
(`America/Sao_Paulo`). The fixed schedule runs through Vercel Cron and sends
the reports to Telegram even when the browser is closed. Vercel Hobby runs
cron schedules at some point within the configured hour, not necessarily at
the exact minute.

Configure these Vercel environment variables and redeploy:

- `CRON_SECRET` to authenticate the scheduled endpoint.
- `JARVIS_TASKS_TOKEN` for the key entered in the task menu.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ALLOWED_CHAT_ID` for report delivery.

Generate a private task-menu key with `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
Set it as `JARVIS_TASKS_TOKEN`, then paste the same value into **Tarefas
agendadas** in the Jarvis app. Keep these values private. Successful digests
are shown in the menu when manually requested. This no-database configuration
does not retain run history or pause state; disable the Cron Job from Vercel
project settings to pause automatic runs. The scheduled endpoint runs only on
a production deployment, not a local browser session.
