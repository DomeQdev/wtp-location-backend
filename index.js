const Database = require("fast-json-collection");
const load = require("./util/load");
const loadVehicles = require("./util/vehicles");
const { point, nearestPointOnLine, lineString } = require("@turf/turf");
const predict = require("./util/predict");
const cron = require("node-cron");
const app = require('fastify')();

global.db = {
    routes: new Database({ path: "./db/routes.json", sync: false, space: 4 }),
    trips: new Database({ path: "./db/trips.json", sync: false }),
    stops: new Database({ path: "./db/stops.json", sync: false }),
    shapes: new Database({ path: "./db/shapes.json", sync: true }),
    vehicles: new Database({ path: "./db/vehicles.json", sync: false }),
    models: new Database({ path: "./db/models.json", sync: true, space: 4 })
};

if (!db.routes.size || !db.trips.size || !db.stops.size || !db.shapes.size) load();
cron.schedule('0 3 * * *', load);

if (!db.vehicles.size || !db.models.size) loadVehicles();
cron.schedule('0 4 */3 * *', loadVehicles);

app.get("/trip", async (req, res) => {
    let trip = db.trips.get(req.query.trip);
    if (!trip) return res.code(404).send("Trip not found");
    let shape = db.shapes.get(trip.shape);
    let line = lineString(shape);

    return {
        line: trip.line,
        headsign: trip.headsign,
        color: db.routes.get(trip.line) ? db.routes.get(trip.line).color : "#009955",
        shapes: shape,
        stops: trip.stops.map(stop => {
            let stopData = db.stops.get(stop.id);
            let nearest = nearestPointOnLine(line, point(stopData.location), { units: 'meters' });
            return {
                name: stopData.name,
                id: stop.id,
                on_request: stop.on_request,
                location: nearest.properties.dist < 50 ? nearest.geometry.coordinates : stopData.location,
                arrival: stop.arrival,
                departure: stop.departure,
                onLine: nearest.properties.location,
                index: nearest.properties.index
            }
        })
    };
});

app.get("/vehicle", async (req, res) => {
    let vehicle = db.vehicles.get(req.query.vehicle);
    if (!vehicle) return res.code(404).send("Vehicle not found");
    return vehicle;
});

app.get("/predict", predict);

app.get("/filter", async () => {
    return {
        models: db.models.values,
        routes: db.routes.values
    }
})

app.listen(3000, "0.0.0.0", (err, address) => {
    if (err) throw new Error(err);
    console.log(`Server listening on ${address}`);
});