# Voyager 01 — Flight Archive

A standalone Three.js experience. Run `npm install`, then `npm run dev` from this folder. `npm run build` creates a static site in `dist/`; `npm test` validates the ephemerides and interpolation. This folder is independent of the parent Stardew application.

Drag to rotate the onboard camera or orbit the spacecraft. Scroll to zoom. Choose a planet or the velocity vector in the Look toward menu. Space or the play button pauses time. Playback ranges from one simulated second per real second to 30 days per second. The slider spans the full archive; milestones jump to the encounters. The overview has exaggerated planet sizes by default, with an explicit true-scale toggle.

## Data and scientific limits

- NASA JPL Horizons, target -31 and planet centers 199, 299, 399, 499, 599, 699, 799, 899; heliocentric geometric vectors, ICRF/J2000 ecliptic, kilometers and km/s. All displayed calendar times use TDB.
- 1977-09-06 through 2100-01-01. Each of the nine JSON files contains 11,672 states, request URLs, retrieval timestamp, and the original Horizons header. Five-day baseline, one-hour departure samples, ten-minute samples March 1–10, 1979 and November 8–17, 1980, plus explicit endpoints. The timeline spans departure to the moving present, not the end of prediction coverage. LIVE uses the wall clock, automatically sets 1×, and evaluates NASA predicted states beyond 2026. Pause or scrub back to resume historical exploration.
- Cubic Hermite interpolation uses positions and velocities; displayed velocity is its analytical derivative. No extrapolation outside the supplied NASA coverage. Contemporary UTC-to-TDB conversion includes the 37-second leap-second offset and approximate periodic correction; update the offset if a future leap second is announced. This is a replay of a published trajectory, not live telemetry or an independently integrated gravitational model.
- Horizons describes the pre-1981 segment as an approximate patched-conic reconstruction and the later segment as a tracking-data fit plus prediction. Read `public/data/voyager.json` for the complete provenance. Historical attitude and thrust firings are not available here. The spacecraft's dish points at the geometric Earth position with a chosen illustrative roll.
- Positions and angular sizes are physical in onboard/external views. Floating-origin rendering compresses far-object render distances and radii by the same factor to preserve angular sizes. In overview mode, positions remain linear and planet sizes can be restored to physical scale. Ambient fill is added for inspection. The Sun has an additive illustrative optical glare halo.
- Procedural spacecraft modeled after NASA references: parabolic 3.7 m antenna, decagonal bus, antenna struts, 13 m magnetometer truss, instrument platform, three finned RTGs, Golden Record, antennas and thrusters. Small-component shapes are illustrative rather than engineering CAD.
- Planet surfaces: Solar System Scope / INOVE, https://www.solarsystemscope.com/textures/, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Maps are based on NASA imagery, with artistic adjustments and filled gaps. Used as surface color maps; procedural fallback if a texture fails. Not historical cloud/rotation maps. Saturn's ring rendering, rotational orientation, and the star field are illustrative. Moon trajectories are not included.

## Reproduce the data

`python3 scripts/fetch_ephemeris.py` downloads datasets sequentially using curl with certificate verification. Existing complete files are retained. Remove a specific dataset to refresh it. `python3 scripts/fetch_textures.py` downloads the eight attributed surface maps.

References: https://ssd-api.jpl.nasa.gov/doc/horizons.html and https://science.nasa.gov/mission/voyager/spacecraft/.
