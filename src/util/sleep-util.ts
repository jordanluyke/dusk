import { TimeUnit } from './time-unit.js'

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sleepUntil(date: Date): Promise<void> {
    while (true) {
        const ms = date.getTime() - Date.now()
        if (ms <= 0) {
            return
        }
        await sleep(Math.min(ms, TimeUnit.MINUTES.toMillis(1)))
    }
}
