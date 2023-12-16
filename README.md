# HTTP request interceptor template

This repository is meant to act as an example / template for intercepting HTTP requests made by libraries to different
APIs. The example uses `spotify-web-api-node`, but the same principles should be applicable to also other libraries.

## Usage

1. If you want to use Mockoon, follow the instructions in [mockoon/README.md](mockoon/README.md).
1. Configure the environment variables in `.env.development`
    * Here you can e.g. set your Spotify API credentials.
1. Start the server with `npm start`
1. Navigate to http://localhost:3000/ and make a search.

## Rationale

When implementing integration tests, you probably do not want to bombard the actual API with requests. Also, in order to
test the implementation on a CI, you would need to provide the credentials to the CI, which is not ideal. Testing for
errors can also be difficult.

By using the interceptor in combination with Mockoon, you are able to easily capture and store the requests and later
use the recorded requests and responses to mock the API.

