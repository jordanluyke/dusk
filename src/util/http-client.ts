import { singleton } from 'tsyringe'
import axios from 'axios'
import { TimeUnit } from './time-unit.js'

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
}

@singleton()
export class HttpClient {
    public async get(url: string, params = {}, headers = {}, options = {}): Promise<any> {
        return this.request(HttpMethod.GET, url, params, options)
    }

    public async post(url: string, data: any = {}, headers = {}, options = {}): Promise<any> {
        return this.request(HttpMethod.POST, url, data, options)
    }

    public async request(
        method: HttpMethod,
        url: string,
        data: any = {},
        headers = {},
        options: any = {}
    ): Promise<any> {
        const req: any = {
            ...options,
            method,
            url,
            headers,
            // Axios defaults to no timeout. A stalled socket would never reject, so
            // retryUntil would not run and the process would stop notifying.
            timeout: options.timeout ?? TimeUnit.SECONDS.toMillis(30)
        }
        if (method === HttpMethod.GET) {
            req.params = data
        } else {
            req.data = data
        }
        console.log('Request url:', url)
        return axios(req).then((res) => {
            console.log('Response status:', res.status)
            if (res.status !== 200) {
                console.error(`HTTP error status: ${res.status}`)
                throw new Error('HTTP error')
            }
            return res.data
        })
    }
}
