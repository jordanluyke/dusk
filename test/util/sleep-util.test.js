import { sleep, sleepUntil } from '../../target/util/sleep-util.js'

describe('sleep-util', () => {
    test('sleep resolves after the given delay', async () => {
        const start = Date.now()
        await sleep(20)
        expect(Date.now() - start).toBeGreaterThanOrEqual(15)
    })

    test('sleepUntil resolves immediately when the date is in the past', async () => {
        await expect(sleepUntil(new Date(Date.now() - 1000))).resolves.toBeUndefined()
    })
})
