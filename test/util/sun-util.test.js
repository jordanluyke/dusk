import 'reflect-metadata'
import { SunUtil } from '../../target/util/sun-util.js'
import { TimeUnit } from '../../target/util/time-unit.js'

function createSunUtil(overrides = {}) {
    return new SunUtil({
        timezone: 'America/Los_Angeles',
        latitude: 33.6409,
        longitude: -117.6031,
        ...overrides,
    })
}

describe('SunUtil', () => {
    const sunUtil = createSunUtil()

    test('getSunset returns a Date for the given day', () => {
        const sunset = sunUtil.getSunset(new Date('2026-08-05T12:00:00Z'))
        expect(sunset).toBeInstanceOf(Date)
        expect(Number.isNaN(sunset.getTime())).toBe(false)
    })

    test('getNextNotifyAt is one hour before sunset', () => {
        const now = new Date('2026-08-05T12:00:00Z')
        const { sunset, notifyAt } = sunUtil.getNextNotifyAt(now)
        expect(notifyAt.getTime()).toBe(sunset.getTime() - TimeUnit.HOURS.toMillis(1))
        expect(notifyAt.getTime()).toBeGreaterThan(now.getTime())
    })

    test('getNextNotifyAt still returns today between notify time and sunset', () => {
        const morning = new Date('2026-08-05T12:00:00Z')
        const { sunset, notifyAt } = sunUtil.getNextNotifyAt(morning)

        const inWindow = new Date(notifyAt.getTime() + TimeUnit.MINUTES.toMillis(1))
        const again = sunUtil.getNextNotifyAt(inWindow)

        expect(inWindow.getTime()).toBeLessThan(sunset.getTime())
        expect(again.notifyAt.getTime()).toBe(notifyAt.getTime())
        expect(again.sunset.getTime()).toBe(sunset.getTime())
    })

    test('getNextNotifyAt rolls to the next day after sunset', () => {
        const morning = new Date('2026-08-05T12:00:00Z')
        const { sunset, notifyAt: todayNotify } = sunUtil.getNextNotifyAt(morning)

        const afterSunset = new Date(sunset.getTime() + TimeUnit.MINUTES.toMillis(1))
        const { notifyAt: nextNotify } = sunUtil.getNextNotifyAt(afterSunset)

        expect(nextNotify.getTime()).toBeGreaterThan(todayNotify.getTime())
        expect(nextNotify.getTime() - todayNotify.getTime()).toBeGreaterThan(TimeUnit.HOURS.toMillis(20))
    })

    test('getNextNotifyAt throws when the sun does not set for several days', () => {
        const arctic = createSunUtil({ latitude: 80, longitude: 20, timezone: 'UTC' })
        expect(() => arctic.getNextNotifyAt(new Date('2026-06-21T12:00:00Z'))).toThrow(
            'Failed to resolve next sunset notify time'
        )
    })

    test('getNextNotifyAt throws when coordinates are missing', () => {
        const broken = createSunUtil({ latitude: NaN, longitude: NaN })
        expect(() => broken.getNextNotifyAt()).toThrow('LATITUDE and LONGITUDE')
    })
})
