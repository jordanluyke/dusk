import { TimeUnit } from '../../target/util/time-unit.js'

describe('TimeUnit', () => {
    test('converts to milliseconds', () => {
        expect(TimeUnit.MILLISECONDS.toMillis(1)).toBe(1)
        expect(TimeUnit.SECONDS.toMillis(1)).toBe(1000)
        expect(TimeUnit.MINUTES.toMillis(1)).toBe(60_000)
        expect(TimeUnit.HOURS.toMillis(1)).toBe(3_600_000)
        expect(TimeUnit.DAYS.toMillis(1)).toBe(86_400_000)
    })

    test('converts across units', () => {
        expect(TimeUnit.HOURS.toSeconds(1)).toBe(3600)
        expect(TimeUnit.DAYS.toHours(1)).toBe(24)
        expect(TimeUnit.MINUTES.toMinutes(5)).toBe(5)
    })
})
