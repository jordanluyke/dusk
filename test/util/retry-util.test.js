import { retryUntil } from '../../target/util/retry-util.js'
import { TimeUnit } from '../../target/util/time-unit.js'

describe('retryUntil', () => {
    const originalError = console.error

    beforeEach(() => {
        console.error = () => {}
    })

    afterEach(() => {
        console.error = originalError
    })

    test('resolves on the first successful attempt without waiting', async () => {
        const waits = []
        await retryUntil(
            async () => {},
            new Date(1000),
            async (ms) => {
                waits.push(ms)
            },
            () => 0
        )
        expect(waits).toEqual([])
    })

    test('retries after a failure when the deadline has not passed', async () => {
        let attempts = 0
        const waits = []
        await retryUntil(
            async () => {
                attempts++
                if (attempts < 3) {
                    throw new Error(`fail ${attempts}`)
                }
            },
            new Date(1000),
            async (ms) => {
                waits.push(ms)
            },
            () => 0
        )
        expect(attempts).toBe(3)
        expect(waits).toEqual([TimeUnit.MINUTES.toMillis(1), TimeUnit.MINUTES.toMillis(1)])
    })

    test('rethrows when the first attempt fails at or after the deadline', async () => {
        await expect(
            retryUntil(
                async () => {
                    throw new Error('pushover down')
                },
                new Date(1000),
                async () => {
                    throw new Error('should not wait')
                },
                () => 1000
            )
        ).rejects.toThrow('pushover down')
    })

    test('logs the error stack without request secrets', async () => {
        const logged = []
        console.error = (...args) => {
            logged.push(args.map(String).join(' '))
        }
        const secret = 'TOKENSECRET456'
        let now = 0
        await expect(
            retryUntil(
                async () => {
                    const err = new Error('Request failed with status code 500')
                    err.config = { data: JSON.stringify({ token: secret, user: 'USERKEY123' }) }
                    throw err
                },
                new Date(1000),
                async () => {
                    now = 1000
                },
                () => now
            )
        ).rejects.toThrow('Request failed with status code 500')
        const text = logged.join('\n')
        expect(text).toContain('Request failed with status code 500')
        expect(text).not.toContain(secret)
        expect(text).not.toContain('USERKEY123')
    })

    test('rethrows once a later attempt misses the deadline', async () => {
        let now = 0
        let attempts = 0
        await expect(
            retryUntil(
                async () => {
                    attempts++
                    throw new Error('still down')
                },
                new Date(1000),
                async () => {
                    now = 1000
                },
                () => now
            )
        ).rejects.toThrow('still down')
        expect(attempts).toBe(2)
    })
})
