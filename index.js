const Database = require("fast-json-collection");
const load = require("./util/load");
const cron = require("node-cron");
const app = require('fastify')();

global.db = {
    routes: new Database({ path: "./db/routes.json", sync: false }),
    trips: new Database({ path: "./db/trips.json", sync: false }),
    stops: new Database({ path: "./db/stops.json", sync: false }),
    shapes: new Database({ path: "./db/shapes.json", sync: true })
};

cron.schedule('0 3 * * *', load);

app.get("/trip",  async(req, res) => {
    let trip = db.trips.get(req.query.trip);
    if (!trip) return res.code(404).send("Trip not found");
    let shape = db.shapes.get(trip.shape);
    res.send({
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
    });
});

app.listen(3000, (err, address) => {
    if (err) throw err;
    console.log(`server listening on ${address}`);
});