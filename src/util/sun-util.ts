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
        let day = this.calendarDay(now)
        for (let i = 0; i < 3; i++) {
            const sunset = SunCalc.getTimes(day, this.config.latitude, this.config.longitude).sunset
            // Key off sunset, not notifyAt: a restart (or retry) between notify time and
            // sunset must still deliver today's fire. suncalc v2 returns null when the
            // sun does not set.
            if (sunset && sunset.getTime() > now.getTime()) {
                const notifyAt = new Date(sunset.getTime() - TimeUnit.HOURS.toMillis(1))
                return { sunset, notifyAt }
            }
            day = new Date(day.getTime() + TimeUnit.DAYS.toMillis(1))
        }
        throw new Error('Failed to resolve next sunset notify time')
    }

    public format(date: Date): string {
        return date.toLocaleString('en-US', {
            timeZone: this.config.timezone,
            dateStyle: 'medium',
            timeStyle: 'short',
        })
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
