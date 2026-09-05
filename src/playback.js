import { DAY } from './ephemeris.js';

// Contemporary UTC -> TDB: TT = UTC + 37 leap seconds + 32.184 s.
// The small annual TDB-TT correction is approximate; future leap seconds
// require updating the UTC offset, not altering the JPL state vectors.
export function liveJulianDate(milliseconds = Date.now()) {
  const utc = milliseconds / 86400000 + 2440587.5;
  const g = (357.53 + 0.9856003 * (utc - 2451545)) * Math.PI / 180;
  return utc + (69.184 + 0.001658 * Math.sin(g) + 0.000014 * Math.sin(2 * g)) / DAY;
}

export function chartWindow(date, start, end, requestedSpan) {
  const span = Math.min(requestedSpan, end - start);
  const left = Math.max(start, Math.min(date - span / 2, end - span));
  return { start: left, end: left + span, fraction: span ? Math.max(0, Math.min(1, (date - left) / span)) : 0 };
}

export function advancePlayback(date, elapsedSeconds, rate, live, now) {
  if (live || date + elapsedSeconds * rate / DAY >= now) {
    return { date: now, rate: 1, live: true };
  }
  return { date: date + elapsedSeconds * rate / DAY, rate, live: false };
}
