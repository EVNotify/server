<p align="center">
  <a href="http://evnotify.com/" target="blank"><img src="https://play-lh.googleusercontent.com/WWiksoDe8DSu6G_tGsEQyoeM7HMVFUGBjmkHILEqEUQ7T0OvwHQR11I3so7aNRAgRw=w240-h480" width="200" alt="EVNotify Logo" /></a>
</p>

## Description

[EVNotify](https://evnotify.com) backend of new [v3](https://github.com/EVNotify/v3) app.

## Installation

```bash
$ npm install
```

## Prerequisites

The backend requires Node.JS.

It is recommended to use the LTS version (18.16.0).

Other versions might work as well.

As a database system, MongoDB is required (v6 recommended).

## Configuration

In order to be able to run the server properly,
a few things needs to be set up first.

Copy the `.env.example` file to `.env`.

Adjust the variable values based to your needs.

## Running the server

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## TripNotify live updates

The bundled website lives in `public/tripnotify/index.html` and is served at
`/frontend/tripnotify/?code=SHARE_CODE`. It sends the required socket credentials
and displays live connection errors separately from trip-loading errors.

Socket.IO clients must supply the trip's share code when connecting:

```ts
const socket = io(serverUrl, { auth: { code: shareCode } });
socket.on(`route-update:${shareCode}`, ({ logId, data }) => {
  // Handle this trip's update.
});
socket.on('connect_error', (error) => {
  // Unauthorized shares receive the generic message "Unauthorized".
});
```

Each connection receives only its authorized share's updates. Reconnect with a new
connection to switch shares. Live delivery requires an active trip and active
owner Premium; permissions are checked again before each update. When location
sharing is disabled, updates include only timestamp and allowed battery/charging
telemetry, including temperature readings. Historical access after a trip ends
does not extend live delivery.

**Deployment:** update consuming clients to send `auth.code` before deploying this
server change. Clients that omit it will be rejected. There is no unrestricted
compatibility fallback. See the [implementation plan](docs/plans/tripnotify-socket-privacy.md).

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
