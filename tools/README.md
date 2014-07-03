# Mediahub Tools

## export app

Export offline app from couchdb to filesystem. Suitable to be served from static webserver (e.g. `index.coffee`, apache, etc.).

usage:
```
coffee exportapp.coffee <OFFLINEAPPURL>
```

Note: will append `.html` and remove the database name from the new app URL.

## couchdb replicate via filestore

These commands implement (virtually) the standard couchdb replication but via a static set of files/folders on disk as an intermediary stage. This can be copied to other machines are required.

`updatecache.coffee` will build a file-based copy of the documents in a couchdb database (excluding design documents). Each time it is run it will add a new incremental checkpoint. This directory must be created (but empty) before running the first time.

```
coffee updatecache.coffee <CACHE-DIR> [<COUCHDB-URL>]
```

Note: the couchdb url need only be provided the first time and is then stored in the disk cache.

`cache2couch.coffee` will push from a cache to an existing couchdb database:

```
coffee updatecache.coffee <CACHE-DIR> <COUCHDB-URL>
```

Node: the target database URL must always be specified, and the same cache can be used to send to any number of databases.

