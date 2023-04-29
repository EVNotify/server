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

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
