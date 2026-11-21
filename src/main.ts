import 'reflect-metadata'
import { container } from 'tsyringe'
import { PushoverClient } from './notification/pushover-client.js'
import { logError, retryUntil } from './util/retry-util.js'
import { sleep, sleepUntil } from './util/sleep-util.js'
import { SunUtil } from './util/sun-util.js'
import { TimeUnit } from './util/time-unit.js'

async function main() {
    const sunUtil = container.resolve(SunUtil)
    const pushoverClient = container.resolve(PushoverClient)

    while (true) {
        try {
            const { sunset, notifyAt } = sunUtil.getNextNotifyAt()
            console.log('Next sunset:', sunUtil.format(sunset))
            console.log('Notify at:', sunUtil.format(notifyAt))

            await sleepUntil(notifyAt)

            // sleepUntil returns as soon as notifyAt is behind the clock. That also
            // happens when the host was suspended, or the clock stepped forward, and
            // sunset has already passed.
            if (!sunUtil.isBeforeSunset(sunset)) {
                console.log('Skipped notify; sunset already passed:', sunUtil.format(sunset))
                continue
            }

            // Rebuild on each attempt so a retry does not keep the earlier lead.
            let message: string
            await retryUntil(async () => {
                message = sunUtil.notifyMessage(sunset)
                await pushoverClient.sendMessage(message)
            }, sunset)
            console.log('Sent:', message)
            // getNextNotifyAt() keeps returning today until sunset passes. Sleep past
            // this sunset so the next iteration cannot send the same notification again.
            await sleepUntil(new Date(sunset.getTime() + TimeUnit.SECONDS.toMillis(1)))
        } catch (err) {
            logError(err)
            await sleep(TimeUnit.MINUTES.toMillis(1))
        }
    }
}

main()
