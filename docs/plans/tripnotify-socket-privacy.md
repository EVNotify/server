# TripNotify sharing fixes

## Summary

Prevent live trip updates from reaching unauthorized clients, restore the owner's
complete trip list, and include history from sessions crossing sharing boundaries.
Enforce sharing dates, active Premium, and location preferences.

## Implementation

- List all trips belonging to the authenticated owner, independent of guest
  sharing dates and retained-access settings. Keep guest authorization unchanged.
- Select overlapping sessions, including running sessions, and expose only samples
  in `start <= timestamp < end`. Omit logs with no valid samples in that window.
- Build a response-only view: clamp session dates to the share, and mark a running
  session's shared portion finished once the share ends. Leave stored logs intact.
- Recalculate partial-session SOC/counter endpoints, energy, averages, and distance
  from sorted in-window samples. Preserve valid zeros, omit insufficient or reset
  counter measurements, and do not interpolate across the boundaries. Preserve
  stored measurements for fully contained sessions. Omit aggregate totals if any
  contributing session lacks the required data; display unavailable values as
  "–" on the website.
- Share the battery-field allowlist between HTTP history and live updates so
  mixed telemetry cannot expose location when location sharing is disabled.
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

- Verify all owner trip states are listed while account isolation and
  authentication remain enforced.
- Cover both overlap boundaries, running and spanning sessions, exact endpoint
  timestamps, invalid/unsorted samples, empty windows, zero readings, counter
  resets, partial totals, and stored-log immutability.
- Check website formatting for zero and unavailable totals, including charge-stop
  summaries, alongside socket handshake and error-handling smoke checks.
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
