import 'reflect-metadata'
import { container } from 'tsyringe'
import { PushoverClient } from './notification/pushover-client.js'
import { retryUntil } from './util/retry-util.js'
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

            const message = `Sunset in one hour (${sunUtil.format(sunset)})`
            // Retry this fire until sunset. Re-calling getNextNotifyAt() after a failed send
            // would see notifyAt in the past and skip today's notification.
            await retryUntil(() => pushoverClient.sendMessage(message), sunset)
            console.log('Sent:', message)
        } catch (err) {
            console.error(err)
            await sleep(TimeUnit.MINUTES.toMillis(1))
        }
    }
}

main()
