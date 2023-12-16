require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

if (process.env.NODE_ENV !== 'production') {
    require('./spotifyInterceptor').init()
}

const express = require('express')
const SpotifyWebApi = require("spotify-web-api-node");
const app = express()
const port = process.env.PORT;
app.listen(port, () => console.log(`Listening on port ${port}`))

const credentials = {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: `http://localhost:${port}/auth/spotify/callback`
}
console.log('Spotify credentials', credentials)

const spotifyApi = new SpotifyWebApi(credentials)
const refreshToken = async () => {
    const data = await spotifyApi.clientCredentialsGrant()
    if (data.body.error) {
        console.log('Spotify token refresh failed', data)
        return
    }
    spotifyApi.setAccessToken(data.body['access_token'])
    const expiresIn = data.body['expires_in']
    console.log(`Refreshing token in ${expiresIn / 2} seconds`)
    setTimeout(refreshToken, (expiresIn / 2) * 1000)
    console.log('Done refreshing Spotify token')
}

refreshToken()

app.get('/', (_, res) => {
    res.send('<form action="/search"><label>Search query<input type="text" name="q"/></label></form>')
})
app.get('/search', async ({query: {q}}, res) => {
    const results = await spotifyApi.search(q, ['track', 'artist', 'album'], {limit: 10})
    res.send(results.body)
})