# dusk

Sends a Pushover notification one hour before sunset for a configured location.

The process stays running: it computes the next sunset, sleeps until one hour before, sends the notification, then repeats.

## Setup

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `TIMEZONE` | IANA timezone (default `America/Los_Angeles`) |
| `LATITUDE` | Location latitude |
| `LONGITUDE` | Location longitude |
| `PUSHOVER_USER_KEY` | Pushover user key |
| `PUSHOVER_API_TOKEN` | Pushover API token |

```bash
npm i
npm run build
npm test
npm start
```
