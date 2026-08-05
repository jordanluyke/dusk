# Agent guide

## What this is

Personal Node/TypeScript service that notifies via Pushover one hour before local sunset. Long-running process (sleep-until loop), not cron.

## Layout

```
src/
  main.ts                 # loop: next notify → sleep → Pushover
  config.ts               # dotenv + Config (tsyringe singleton)
  notification/           # PushoverClient
  util/
    http-client.ts
    sun-util.ts           # suncalc + calendar day in config.timezone
    sleep-util.ts         # sleep / sleepUntil
    time-unit.ts          # duration helpers (millisecond base)
```

## Conventions

- ESM (`"type": "module"`), TypeScript, tsyringe DI, reflect-metadata
- Utils live under `src/util/` as `*-util.ts` or focused helpers (`time-unit.ts`, `http-client.ts`)
- Durations via `TimeUnit` (base unit is milliseconds) — no raw `60_000` / `3600000` literals for time math
- Sunset from `suncalc` + lat/lng; do not add an HTTP sunrise API unless asked
- Timezone via `TIMEZONE` env (default `America/Los_Angeles`)
- Pushover base URL is hardcoded on `PushoverClient`
- Secrets and coordinates only in `.env` (gitignored); keep `.env.example` in sync for non-secret keys
- Prettier: no semicolons, single quotes, tabWidth 4, printWidth 100

## Scheduling

Sunset moves daily; `SunUtil.getNextNotifyAt()` + `sleepUntil` is the intended approach.

On failure in the main loop, wait one minute then continue. Be aware that after a failed send at fire time, the next `getNextNotifyAt()` may roll to tomorrow.

## Commands

```bash
npm run build
npm start
npm test
```

Tests live under `test/` mirroring `src/` as plain JS against `target/`.

Output goes to `target/`. Do not commit `.env` or `target/`.
