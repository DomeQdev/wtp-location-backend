const Database = require("fast-json-collection");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
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

db.routes.clear();
db.trips.clear();
db.stops.clear();
db.shapes.clear();

fetch("https://mkuran.pl/gtfs/warsaw/feeds/modtimes.json").then(res => res.json()).then(data => {
    Promise.all([
        loadGTFS("https://mkuran.pl/gtfs/kolejemazowieckie.zip", {
            shapes: [0, 2, 3],
            stopTimes: [0, 1, 2, 3, -1, -1],
            trips: [0, 2, 4, 5]
        }),
        loadGTFS(`https://mkuran.pl/gtfs/warsaw/feeds/${Object.keys(data)[0]}.zip`, {
            shapes: [0, 3, 4],
            stopTimes: [0, 1, 2, 3, 5, -1],
            trips: [0, 2, 3, 5]
        })
        /*loadGTFS("https://mkuran.pl/gtfs/tristar.zip", {
            shapes: [0, 2, 3],
            stopTimes: [0, 1, 2, 3, 5, -1],
            trips: [0, 2, 3, 5]
        })*/
    ]);
});