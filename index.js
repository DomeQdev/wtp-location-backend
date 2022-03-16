const level = require('level')
const db = {
    stops: level('./db/stops', { valueEncoding: 'json' }),
    routes: level('./db/routes', { valueEncoding: 'json' }),
    shapes: level('./db/shapes', { valueEncoding: 'json' }),
    trips: level('./db/trips', { valueEncoding: 'json' })
}