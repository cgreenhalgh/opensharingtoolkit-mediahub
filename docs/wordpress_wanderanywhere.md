# Wander Anywhere integration

## Wander Anywhere Internals

Wander Anywhere adds custom post type `anywhere_map_post`. This has custom fields:

- `type`, `0` => Point, `1` => Polygon
- `geojson`

If geojson property `type` = `Polygon` then polygon, else assumed `coordinates[1]` is Latitude and `coordinates[0]` is longitude.

`anywhere_map_post`s are converted to `Place` pages in the generated app.

## Current Status

Notes:

- if the geometry is a polygon just the first point is taken
- the offline maps use a single default zoom level (15)
- offline maps use openstreetmap tiles 
- there is current no navigation support

