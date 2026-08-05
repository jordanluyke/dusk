import { singleton } from 'tsyringe'
import { config } from 'dotenv'

config({ quiet: true })

@singleton()
export class Config {
    public readonly timezone = process.env.TIMEZONE || 'America/Los_Angeles'
    public pushoverUserKey = process.env.PUSHOVER_USER_KEY
    public pushoverApiToken = process.env.PUSHOVER_API_TOKEN
    public latitude = parseNumber(process.env.LATITUDE)
    public longitude = parseNumber(process.env.LONGITUDE)
}

function parseNumber(value: string | undefined): number {
    if (value === undefined || value.trim() === '') {
        return NaN
    }
    return Number(value)
}
