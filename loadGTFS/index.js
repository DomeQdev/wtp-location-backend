const downloadData = require('./downloadData');
const { point, nearestPointOnLine, lineString, lineChunk } = require("@turf/turf");

module.exports = async (link, options) => {
    let data = await downloadData(link);
    if (!data) return null;

    convertShapes(data["shapes.txt"].split("\r\n"), options.shapes, options.short);
    convertRoutes(data["routes.txt"].split(options.short === "wkd" ? "\n" : "\r\n"));
    convertStops(data["stops.txt"].split(options.short === "wkd" ? "\n" : "\r\n"));

    let stopTimes = convertStopTimes(data["stop_times.txt"].split("\r\n"), options.stopTimes);
    let trips = convertTrips(data["trips.txt"].split("\r\n"), options.trips, options.short);

    trips.map(trip => {
        if (trip.line.includes("R") || trip.line.includes("S") || trip.line.includes("A")) {
            try {
                let shape = lineString(lineChunk(lineString(db.shapes.get(trip.shape)), 400, { units: 'meters' }).features.map(x => x.geometry.coordinates[0]));

                db.trips.set(trip.trip, {
                    ...trip,
                    stops: stopTimes[trip.trip].map(stop => {
                        let stopData = db.stops.get(stop.id);
                        let nearest = nearestPointOnLine(shape, point(stopData.location), { units: 'meters' });
                        return {
                            ...stop,
                            location: nearest.properties.dist < 50 ? nearest.geometry.coordinates : stopData.location,
                            index: nearest.properties.index,
                            dist: nearest.properties.dist
                        }
                    })
                });
            } catch(e) {
                console.log(`${trip.line} > ${trip.headsign} (${trip.trip}, ${trip.shape}) ${e.message}`);
            }
        } else {
            db.trips.set(trip.trip, {
                ...trip,
                stops: stopTimes[trip.trip]
            });
        }
    });

    console.log(`${options.short} loaded!`)
    db.trips.sync();
};

// ztm: 0, 3, 4
// km: 0, 2, 3
// wkd: 0, 2, 3
function convertShapes(data, [shape_id, shape_pt_lat, shape_pt_lon], short) {
    let shapes = {};

    data.filter((x, i) => i !== 0 && i !== data.length - 1).map(line => {
        let shape = line.split(',');
        let id = !isNaN(shape[shape_id]) ? short + shape[shape_id] : shape[shape_id];

        if (!shapes[id]) shapes[id] = [];
        let lat = Number(shape[shape_pt_lat]);
        let lng = Number(shape[shape_pt_lon]);
        shapes[id].push([lat, lng]);
    });

    return db.shapes.setMany(shapes, false);
};

function convertRoutes(data) {
    data.filter((x, i) => i !== 0 && i !== data.length - 1).map(line => {
        let route = line.split(',');
        db.routes.set(route[2], {
            line: route[2],
            name: route[3],
            type: route[4] === "0" ? "tram" : (route[4] === "1" ? "metro" : (route[4] === "2" ? "rail" : (route[4] === "3" ? "bus" : "unknown"))),
            color: `#${route[5]}`
        })
    });

    return db.routes.sync();
}

function convertStops(data) {
    data.filter((x, i) => i !== 0 && i !== data.length - 1).map(line => {
        let stop = line.split(',');
        db.stops.set(stop[0], {
            id: stop[0],
            name: stop[1],
            location: [Number(stop[2]), Number(stop[3])]
        });
    });

    return db.stops.sync();
}


// ztm: 0, 1, 2, 3, 5, -1
// km: 0, 1, 2, 3, -1, -1
// pkp: 0, 3, 4, 2, -1, 5
// wkd: 0, 3, 4, 2, -1, -1
function convertStopTimes(data, [trip_id, arrival_time, departure_time, stop_id, pickup_type, platform]) {
    let stopTimes = {};

    data.filter((x, i) => i !== 0 && i !== data.length - 1).map(line => {
        let stopTime = line.split(',');
        if (!stopTimes[stopTime[trip_id]]) stopTimes[stopTime[trip_id]] = [];
        stopTimes[stopTime[trip_id]].push({
            id: stopTime[stop_id],
            arrival: czas(stopTime[arrival_time]),
            departure: czas(stopTime[departure_time]),
            on_request: stopTime[pickup_type] === "3" ? true : false,
            platform: stopTime[platform]
        });
    });

    return stopTimes;
}

// ztm: 0, 2, 3, 5
// km: 0, 2, 4, 5
// pkp: 0, 2, 3, 5
// wkd: 0, 2, 3, 6
function convertTrips(data, [route_id, trip_id, trip_headsign, shape_id], short) {
    return data.filter((x, i) => i !== 0 && i !== data.length - 1).filter(line => line.split(',')[shape_id]).map(line => {
        let trip = line.split(',');
        return {
            line: trip[route_id],
            trip: trip[trip_id],
            headsign: trip[trip_headsign],
            shape: !isNaN(trip[shape_id]) ? short + trip[shape_id] : trip[shape_id],
            stops: []
        };
    });
}

function czas(time) {
    let hours = Number(time.split(":")[0]);
    let minutes = Number(time.split(":")[1]);
    return new Date().setHours(0, 0, 0, 0) + ((hours * 60 + minutes) * 60 * 1000);
}