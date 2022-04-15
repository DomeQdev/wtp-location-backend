const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loadGTFS = require('../loadGTFS');

module.exports = async () => {
    let now = Date.now();
    db.routes.clear();
    db.trips.clear();
    db.stops.clear();
    db.shapes.clear();

    let data = await fetch("https://mkuran.pl/gtfs/warsaw/feeds/modtimes.json").then(res => res.json());
    Promise.all([
        loadGTFS("https://f004.backblazeb2.com/file/domeqdev/m3.zip", {
          shapes: [0, 2, 3],
          stopTimes: [0, 3, 4, 2, -1, -1],
          trips: [0, 1, 2, 3],
          short: "m3"
        }),
        loadGTFS("https://mkuran.pl/gtfs/kolejemazowieckie.zip", {
            shapes: [0, 2, 3],
            stopTimes: [0, 3, 4, 2, -1, -1],
            trips: [0, 2, 4, 6],
            short: "km"
        }),
        loadGTFS(`https://mkuran.pl/gtfs/warsaw/feeds/${Object.keys(data)[0]}.zip`, {
            shapes: [0, 3, 4],
            stopTimes: [0, 1, 2, 3, 5, -1],
            trips: [0, 2, 3, 5],
            short: "ztm"
        }),
        loadGTFS("https://mkuran.pl/gtfs/wkd.zip", {
            shapes: [0, 2, 3],
            stopTimes: [0, 3, 4, 2, -1, -1],
            trips: [0, 2, 3, 6],
            short: "wkd"
        })
    ]).then(() => console.log(`It took ${Date.now() - now}ms to load all GTFS files.`));
}