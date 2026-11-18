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

    test('getNextNotifyAt keeps a sunset that falls after UTC midnight', () => {
        // 4:30 PM PT on Jan 15. Sunset is 5:07 PM PT, which is 01:07 UTC on Jan 16,
        // so suncalc files it under the previous UTC date.
        const now = new Date('2026-01-16T00:30:00Z')
        const { sunset, notifyAt } = sunUtil.getNextNotifyAt(now)
        expect(notifyAt.getTime()).toBe(sunset.getTime() - TimeUnit.HOURS.toMillis(1))
        expect(sunset.getTime()).toBeGreaterThan(now.getTime())
        expect(sunset.getTime() - now.getTime()).toBeLessThan(TimeUnit.HOURS.toMillis(2))
    })

    test('getNextNotifyAt does not skip the upcoming sunset east of the date line', () => {
        const cases = [
            {
                timezone: 'Pacific/Apia',
                latitude: -13.833,
                longitude: -171.75,
                now: '2026-01-15T00:00:00Z',
                localDay: '2026-01-15',
            },
            {
                timezone: 'Pacific/Kiritimati',
                latitude: 1.8721,
                longitude: -157.4278,
                now: '2026-01-01T00:00:00Z',
                localDay: '2026-01-01',
            },
        ]
        for (const c of cases) {
            const zoned = createSunUtil({
                timezone: c.timezone,
                latitude: c.latitude,
                longitude: c.longitude,
            })
            const now = new Date(c.now)
            const { sunset, notifyAt } = zoned.getNextNotifyAt(now)
            expect(notifyAt.getTime()).toBe(sunset.getTime() - TimeUnit.HOURS.toMillis(1))
            expect(sunset.getTime()).toBeGreaterThan(now.getTime())
            // The bug returns tomorrow's sunset, about 30 hours out. Today's is under 20.
            expect(sunset.getTime() - now.getTime()).toBeLessThan(TimeUnit.HOURS.toMillis(20))
            const localDay = new Intl.DateTimeFormat('en-CA', {
                timeZone: c.timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(sunset)
            expect(localDay).toBe(c.localDay)

            const again = zoned.getNextNotifyAt(
                new Date(sunset.getTime() - TimeUnit.MINUTES.toMillis(30))
            )
            expect(again.sunset.getTime()).toBe(sunset.getTime())
        }
    })

    test('getNextNotifyAt throws when the sun does not set for several days', () => {
        const arctic = createSunUtil({ latitude: 80, longitude: 20, timezone: 'UTC' })
        expect(() => arctic.getNextNotifyAt(new Date('2026-06-21T12:00:00Z'))).toThrow(
            'Failed to resolve next sunset notify time'
        )
    })

    test('getNextNotifyAt keeps the last real sunset before polar day', () => {
        // Utqiagvik, an hour before the last sunset of spring 2026.
        const arctic = createSunUtil({
            latitude: 71.29,
            longitude: -156.79,
            timezone: 'America/Anchorage',
        })
        const now = new Date('2026-05-10T08:00:00Z')
        const { sunset, notifyAt } = arctic.getNextNotifyAt(now)
        expect(notifyAt.getTime()).toBe(sunset.getTime() - TimeUnit.HOURS.toMillis(1))
        expect(sunset.getTime()).toBeGreaterThan(now.getTime())
        expect(sunset.getTime() - now.getTime()).toBeLessThan(TimeUnit.HOURS.toMillis(3))
    })

    test('getNextNotifyAt does not invent a sunset once the sun stays up', () => {
        // Same place, after that sunset. The sun does not set again until August.
        // A bad solve here is 2026-05-11 22:08 UTC, with the sun still ~37° up.
        const arctic = createSunUtil({
            latitude: 71.29,
            longitude: -156.79,
            timezone: 'America/Anchorage',
        })
        expect(() => arctic.getNextNotifyAt(new Date('2026-05-10T12:00:00Z'))).toThrow(
            'Failed to resolve next sunset notify time'
        )
    })

    test('getNextNotifyAt does not skip the first sunset after polar day', () => {
        // Tromsø on 2026-07-24 12:00 UTC. Sunset is 2026-07-25 22:37 UTC,
        // which is 00:37 on July 26 in Oslo. Skipping it waits until July 27.
        const tromso = createSunUtil({
            latitude: 69.65,
            longitude: 18.96,
            timezone: 'Europe/Oslo',
        })
        const now = new Date('2026-07-24T12:00:00Z')
        const { sunset, notifyAt } = tromso.getNextNotifyAt(now)
        expect(notifyAt.getTime()).toBe(sunset.getTime() - TimeUnit.HOURS.toMillis(1))
        expect(sunset.getTime() - now.getTime()).toBeGreaterThan(TimeUnit.HOURS.toMillis(20))
        expect(sunset.getTime() - now.getTime()).toBeLessThan(TimeUnit.HOURS.toMillis(40))
        const localDay = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Oslo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(sunset)
        expect(localDay).toBe('2026-07-26')
    })

    test('isBeforeSunset is false at and after sunset', () => {
        const sunset = new Date('2026-08-05T02:54:00Z')
        const morningAfter = new Date(sunset.getTime() + TimeUnit.HOURS.toMillis(8))
        expect(sunUtil.isBeforeSunset(sunset, new Date(sunset.getTime() - 1))).toBe(true)
        expect(sunUtil.isBeforeSunset(sunset, sunset)).toBe(false)
        expect(sunUtil.isBeforeSunset(sunset, morningAfter)).toBe(false)
    })

    test('getNextNotifyAt throws when coordinates are missing', () => {
        const broken = createSunUtil({ latitude: NaN, longitude: NaN })
        expect(() => broken.getNextNotifyAt()).toThrow('LATITUDE and LONGITUDE')
    })
})
