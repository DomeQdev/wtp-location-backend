const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loadGTFS = require('../loadGTFS');

module.exports = async () => {
    db.routes.clear();
    db.trips.clear();
    db.stops.clear();
    db.shapes.clear();

    let data = await fetch("https://mkuran.pl/gtfs/warsaw/feeds/modtimes.json").then(res => res.json());
    Promise.all([
        /*loadGTFS("https://mkuran.pl/gtfs/kolejemazowieckie.zip", {
            shapes: [0, 2, 3],
            stopTimes: [0, 1, 2, 3, -1, -1],
            trips: [0, 2, 4, 5],
            split: ":",
            slice: 1
        }),*/
        loadGTFS(`https://mkuran.pl/gtfs/warsaw/feeds/${Object.keys(data)[0]}.zip`, {
            shapes: [0, 3, 4],
            stopTimes: [0, 1, 2, 3, 5, -1],
            trips: [0, 2, 3, 5],
            split: "/",
            slice: 2
        }),
        /*loadGTFS("https://mkuran.pl/gtfs/tristar.zip", {
            shapes: [0, 2, 3],
            stopTimes: [0, 1, 2, 3, 5, -1],
            trips: [0, 2, 3, 5]
        })*/
    ]);
}