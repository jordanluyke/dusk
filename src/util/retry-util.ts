import { sleep } from './sleep-util.js'
import { TimeUnit } from './time-unit.js'

export function logError(err: unknown): void {
    // Axios errors enumerate `config.data`, which holds the Pushover token and user key.
    // Logging the stack avoids util.inspect dumping those fields.
    if (err instanceof Error) {
        console.error(err.stack || err.message)
        return
    }
    console.error(err)
}

export async function retryUntil(
    fn: () => Promise<unknown>,
    deadline: Date,
    wait: (ms: number) => Promise<void> = sleep,
    now: () => number = Date.now
): Promise<void> {
    while (true) {
        try {
            await fn()
            return
        } catch (err) {
            if (now() >= deadline.getTime()) {
                throw err
            }
            logError(err)
            await wait(TimeUnit.MINUTES.toMillis(1))
        }
    }
}
