const Database = require("fast-json-collection");
const loadGTFS = require('./loadGTFS');

global.db = {
    routes: new Database({
        path: "./db/routes.json",
        sync: false
    }),
    trips: new Database({
        path: "./db/trips.json",
        sync: false
    }),
    stops: new Database({
        path: "./db/stops.json",
        sync: false
    }),
    shapes: new Database({
        path: "./db/shapes.json",
        sync: true
    })
};

loadGTFS("https://mkuran.pl/gtfs/kolejemazowieckie.zip", {
    shapes: [0, 2, 3],
    stopTimes: [0, 1, 2, 3, -1, -1],
    trips: [0, 2, 4, 5]
});