# TripNotify socket privacy fix

## Summary

Prevent live trip updates from reaching unauthorized clients. Enforce sharing
dates, active Premium, and location preferences for socket delivery. Keep
owner-list and overlapping-history fixes separate.

## Implementation

- Require `auth: { code: string }` in the Socket.IO handshake. Authorize through
  `TripNotifyService.findAccessibleByCode()` before accepting the connection.
  Reject missing, malformed, unknown, or inaccessible codes with a generic
  `connect_error` whose message is `Unauthorized`.
- Assign each socket to one server-controlled share room. Expose no client room
  joining messages. Replace global broadcasts with delivery to that room.
- Preserve `route-update:${code}` and the `{ logId, data }` payload structure.
- Adapt the bundled `public/tripnotify/index.html` website to send `auth.code` to
  the same backend as its HTTP requests. Display generic live connection errors
  separately from trip-loading errors; clear only the live error on reconnection.
- Before every broadcast, revalidate the share and Premium. Suppress updates on
  authorization failure, deletion, or database errors. Live access requires
  `startDate <= now < endDate`, even when historical access is retained.
- For location-disabled shares, copy only timestamp and explicitly allowed
  battery/charging telemetry, including temperature readings. Exclude coordinates,
  altitude, accuracy, speed, odometer, and unknown fields. Never modify the source
  sync object or another share's payload.
- Await all per-share delivery checks in the sync handler. Record failures
  without share codes, account identifiers, location data, or raw database errors.

## Verification

Use isolated MongoDB, real Premium queries, and real Socket.IO clients. Add
`socket.io-client` as a development dependency.

- Reject unauthorized handshakes; verify exact start/end boundaries and both
  historical-access settings.
- Verify room isolation with catch-all listeners and multiple clients per share.
- Verify the existing event and payload structure for authorized clients.
- Verify mixed GPS/battery payloads are filtered without modifying the input.
- Verify changes to location preferences, Premium expiry, deletion, and trip
  expiry take effect for already-connected clients.
- Verify database failures suppress delivery and do not expose error details.
- Run guest HTTP regressions, socket regressions, and the build. Report the
  existing account-guard test failure separately if it persists.

## Compatibility and rollout

Share codes remain bearer credentials. Code strength and distribution are outside
this change. Update consuming clients to send `auth.code` on every connection and
reconnection before deploying enforcement. Clients without it will lose live
updates; retain no unrestricted fallback.

Historical access after expiry may authorize a connection, but produces no live
updates. No application deployment or client repository changes are included here.
