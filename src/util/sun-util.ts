import { singleton } from 'tsyringe'
import * as SunCalc from 'suncalc'
import { Config } from '../config.js'
import { TimeUnit } from './time-unit.js'

@singleton()
export class SunUtil {
    constructor(private config: Config) {}

    public getSunset(date = new Date()): Date {
        this.assertCoordinates()
        const day = this.calendarDay(date)
        return SunCalc.getTimes(day, this.config.latitude, this.config.longitude).sunset
    }

    public getNextNotifyAt(now = new Date()): { sunset: Date; notifyAt: Date } {
        this.assertCoordinates()
        // Key off sunset, not notifyAt: a restart between notify time and sunset must
        // still deliver today's fire. suncalc v2 returns null when the sun does not set,
        // and it keys each sunset to the UTC date of solar noon at this longitude, not
        // the civil date. Anchoring on the civil date skips the upcoming sunset from
        // local midnight onward in zones ahead of their longitude (Samoa, Tonga, the
        // Chatham Islands, Kiritimati), so a start or restart misses that day's alert.
        const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 12)
        let sunset: Date = null
        for (let i = 0; i < 4; i++) {
            const day = new Date(start + TimeUnit.DAYS.toMillis(i))
            const candidate = SunCalc.getTimes(day, this.config.latitude, this.config.longitude)
                .sunset
            if (!candidate || !this.isBeforeSunset(candidate, now)) {
                continue
            }
            if (!sunset || candidate.getTime() < sunset.getTime()) {
                sunset = candidate
            }
        }
        if (!sunset) {
            throw new Error('Failed to resolve next sunset notify time')
        }
        const notifyAt = new Date(sunset.getTime() - TimeUnit.HOURS.toMillis(1))
        return { sunset, notifyAt }
    }

    public isBeforeSunset(sunset: Date, now = new Date()): boolean {
        return sunset.getTime() > now.getTime()
    }

    public format(date: Date): string {
        return date.toLocaleString('en-US', {
            timeZone: this.config.timezone,
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    }

    public notifyMessage(sunset: Date, now = new Date()): string {
        return `Sunset in ${this.leadPhrase(sunset, now)} (${this.format(sunset)})`
    }

    private leadPhrase(sunset: Date, now: Date): string {
        const minutes = Math.round(
            (sunset.getTime() - now.getTime()) / TimeUnit.MINUTES.toMillis(1)
        )
        // The scheduled fire is one hour out. A few seconds of timer delay still
        // rounds to 60, so the usual alert keeps its wording.
        if (minutes === 60) {
            return 'one hour'
        }
        if (minutes <= 0) {
            return 'less than a minute'
        }
        return minutes === 1 ? '1 minute' : `${minutes} minutes`
    }

    private calendarDay(date: Date): Date {
        // en-CA formats as YYYY-MM-DD
        const ymd = date.toLocaleDateString('en-CA', { timeZone: this.config.timezone })
        const [year, month, day] = ymd.split('-').map(Number)
        return new Date(Date.UTC(year, month - 1, day, 12))
    }

    private assertCoordinates() {
        if (!Number.isFinite(this.config.latitude) || !Number.isFinite(this.config.longitude)) {
            throw new Error('LATITUDE and LONGITUDE must be set to valid numbers')
        }
    }
}
