const Database = require("fast-json-collection");
const load = require("./util/load");
const loadVehicles = require("./util/vehicles");
const cron = require("node-cron");
const app = require('fastify')();

global.db = {
    routes: new Database({ path: "./db/routes.json", sync: false, space: 4 }),
    trips: new Database({ path: "./db/trips.json", sync: false }),
    stops: new Database({ path: "./db/stops.json", sync: false }),
    shapes: new Database({ path: "./db/shapes.json", sync: true }),
    vehicles: new Database({ path: "./db/vehicles.json", sync: false }),
    filter: new Database({ path: "./db/filter.json", sync: false, space: 4 })
};

if (!db.routes.size || !db.trips.size || !db.stops.size || !db.shapes.size) load();
cron.schedule('0 3 * * *', load);

//if (!db.vehicles.size || !db.filter.size) loadVehicles();
cron.schedule('0 4 */3 * *', loadVehicles);

app.get("/trip", async (req, res) => {
    let trip = db.trips.get(req.query.trip);
    if (!trip) return res.code(404).send("Trip not found");
    let shape = db.shapes.get(trip.shape);
    return {
        line: trip.line,
        headsign: trip.headsign,
        shapes: shape,
        stops: trip.stops.map(stop => {
            let stopData = db.stops.get(stop.id);
            return {
                name: stopData.name,
                id: stop.id,
                on_request: stop.on_request,
                location: stopData.location,
                time: stop.departure
            }
        })
    };
});

app.get("/predict", async () => {
    let naTrasie = db.trips.filter(trip => (trip.line.includes("R") || (trip.line.includes("S") && trip.trip.includes("DP"))) && (trip.stops[0].arrival < Date.now() && trip.stops[trip.stops.length - 1].departure > Date.now()));
    return removeDup(naTrasie.map(x => {
        let shape = db.shapes.get(x.shape);
        let time = (x.stops[x.stops.length - 1].departure - x.stops[0].arrival) / 1000;
        let timePerShape = time / shape.length;

        let when = shape.map((s, i) => {
            return {
                location: s,
                time: Math.floor(x.stops[0].arrival + (i * timePerShape * 1000))
            }
        });

        let nearest = when.reduce((a, b) => Math.abs(a.time - Date.now()) < Math.abs(b.time - Date.now()) ? a : b);
        return {
            line: x.line,
            trip: x.trip,
            headsign: x.headsign,
            location: nearest.location,
        };
    }), "location");
});

app.listen(3000, (err, address) => {
    if (err) throw err;
    console.log(`server listening on ${address}`);
});

function removeDup(arr, key) {
    let seen = {};
    return arr.filter((item) => seen.hasOwnProperty(item[key]) ? false : (seen[item[key]] = true));
}