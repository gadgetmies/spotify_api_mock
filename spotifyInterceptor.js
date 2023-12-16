const { BatchInterceptor } = require('@mswjs/interceptors')
const { default: nodeInterceptors } = require('@mswjs/interceptors/presets/node')
const R = require('ramda')

const spotifyUrlRegex = /^https:\/\/.*\.spotify.com(.*)/
const spotifyApiUrlOverwrite = process.env.SPOTIFY_API_URL;
const spotifyAccountsUrlOverwrite = process.env.SPOTIFY_ACCOUNTS_URL;
const searchResultMock = require('./searchResultMock.json')

module.exports.init = function init() {
    console.log('Enabling development / test http request interceptors')

    const interceptor = new BatchInterceptor({
        name: 'spotify-interceptor',
        interceptors: nodeInterceptors
    })

    interceptor.apply()
    interceptor.on('request', async (...args) => {
        const { request } = args[0]
        const clone = request.clone()
        const url = clone.url;
        if (url.match(spotifyUrlRegex)) {
            if (spotifyApiUrlOverwrite && spotifyAccountsUrlOverwrite) {
                const proxyUrl = url.startsWith('https://api')
                    ? spotifyApiUrlOverwrite
                    : url.startsWith('https://accounts') ? spotifyAccountsUrlOverwrite : null

                if (proxyUrl === null) {
                    console.log(`Subdomain not mocked ${url}`)
                    return request.end(...args)
                }

                console.log(`Proxying Spotify request to ${proxyUrl}`)
                const body = await clone.text()
                const rewrittenUrl = url.replace(spotifyUrlRegex, `${proxyUrl}$1`)

                const options = {
                    method: clone.method,
                    headers: {
                        authorization: clone.headers.get('authorization')
                    },
                    body,
                    duplex: clone.duplex
                }
                const res = await fetch(rewrittenUrl, request)
                const responseJson = await res.json()
                const headers = Object.fromEntries(res.headers)

                return request.respondWith(
                    new Response(JSON.stringify(responseJson), {
                        status: 200,
                        statusText: 'OK',
                        headers: R.omit(['content-encoding'], headers)
                    })
                )
            } else {
                console.log('Mocking Spotify request', url)
                const pathname = new URL(url).pathname;
                if (pathname.startsWith('/v1/search/')) {
                    console.log('Mocking Spotify token request')
                    return request.respondWith(
                        new Response(
                            JSON.stringify(searchResultMock),
                            {
                                status: 200,
                                statusText: 'OK',
                                headers: {
                                    'content-type': 'application/json'
                                }
                            }
                        )
                    )
                } else {
                    throw new Error(`Request not mocked: ${pathname}`)
                }
            }
        }

        console.log('Returning request without modifications')
        return request.end(...args)
    })
}
