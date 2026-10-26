import 'reflect-metadata'
import http from 'http'
import { HttpClient, HttpMethod } from '../../target/util/http-client.js'
import { TimeUnit } from '../../target/util/time-unit.js'

function listen(server) {
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address()
            resolve(`http://127.0.0.1:${port}/`)
        })
    })
}

async function close(server) {
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
}

describe('HttpClient', () => {
    const originalLog = console.log

    beforeEach(() => {
        console.log = () => {}
    })

    afterEach(() => {
        console.log = originalLog
    })

    test('applies a finite timeout when the caller does not set one', async () => {
        const client = new HttpClient()
        let seen
        await expect(
            client.request(
                HttpMethod.POST,
                'https://api.pushover.net/1/messages.json',
                {
                    message: 'hi'
                },
                {},
                {
                    adapter: async (config) => {
                        seen = config.timeout
                        throw new Error('stop')
                    }
                }
            )
        ).rejects.toThrow('stop')
        expect(seen).toBe(TimeUnit.SECONDS.toMillis(30))
    })

    test('rejects when the server accepts the connection and never responds', async () => {
        const server = http.createServer(() => {})
        const url = await listen(server)
        try {
            const client = new HttpClient()
            const started = Date.now()
            await expect(
                client.request(HttpMethod.POST, url, { message: 'hi' }, {}, { timeout: 200 })
            ).rejects.toThrow(/timeout/)
            expect(Date.now() - started).toBeLessThan(TimeUnit.SECONDS.toMillis(2))
        } finally {
            await close(server)
        }
    })

    test('returns the response body for a completed request', async () => {
        let raw = ''
        const server = http.createServer((req, res) => {
            req.on('data', (chunk) => {
                raw += chunk
            })
            req.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: 1 }))
            })
        })
        const url = await listen(server)
        try {
            const client = new HttpClient()
            const body = await client.request(HttpMethod.POST, url, { message: 'hi' })
            expect(body).toEqual({ status: 1 })
            expect(raw).toContain('"message":"hi"')
        } finally {
            await close(server)
        }
    })
})
