import { singleton } from 'tsyringe'
import { Config } from '../config.js'
import { HttpClient, HttpMethod } from '../util/http-client.js'

@singleton()
export class PushoverClient {
    private readonly baseUrl = 'https://api.pushover.net/1'

    constructor(private config: Config, private httpClient: HttpClient) {}

    public async sendMessage(message: string): Promise<any> {
        return this.post('/messages.json', {
            message,
        })
    }

    private async post(path: string, data: any = {}): Promise<any> {
        return this.request(HttpMethod.POST, path, {
            ...data,
            user: this.config.pushoverUserKey,
            token: this.config.pushoverApiToken,
        })
    }

    private async request(method: HttpMethod, path: string, data: any = {}): Promise<any> {
        return this.httpClient.request(method, this.baseUrl + path, data)
    }
}
