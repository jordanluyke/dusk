import { singleton } from 'tsyringe'
import axios from 'axios'

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
        options = {}
    ): Promise<any> {
        const req: any = {
            ...options,
            method,
            url,
            headers,
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
                console.error(res)
                throw new Error('HTTP error')
            }
            return res.data
        })
    }
}
