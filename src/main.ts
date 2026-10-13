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
            await retryUntil(() => pushoverClient.sendMessage(message), sunset)
            console.log('Sent:', message)
            // getNextNotifyAt() keeps returning today until sunset passes. Sleep past
            // this sunset so the next iteration cannot send the same notification again.
            await sleepUntil(new Date(sunset.getTime() + TimeUnit.SECONDS.toMillis(1)))
        } catch (err) {
            console.error(err)
            await sleep(TimeUnit.MINUTES.toMillis(1))
        }
    }
}

main()
