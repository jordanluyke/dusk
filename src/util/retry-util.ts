import { sleep } from './sleep-util.js'
import { TimeUnit } from './time-unit.js'

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
            console.error(err)
            await wait(TimeUnit.MINUTES.toMillis(1))
        }
    }
}
