const downloadData = require('./downloadData');

module.exports = async (link, options) => {
    let data = await downloadData(link);
    if (!data) return null;

    convertShapes(data["shapes.txt"].split("\r\n"), options.shapes);
    convertRoutes(data["routes.txt"].split("\r\n"));
    convertStops(data["stops.txt"].split("\r\n"));
    let stopTimes = convertStopTimes(data["stop_times.txt"].split("\r\n"), options.stopTimes);
    let trips = convertTrips(data["trips.txt"].split("\r\n"), options.trips);

    trips.map(trip => {
        db.trips.set(trip.trip, {
            ...trip,
            stops: stopTimes[trip.trip]
        });
    })

    db.trips.sync();
};

// ztm: 0, 3, 4
// km: 0, 2, 3
function convertShapes(data, [shape_id, shape_pt_lat, shape_pt_lon]) {
    let shapes = {};

    data.filter((x, i) => i !== 0 && i !== data.length - 1).map(line => {
        let shape = line.split(',');
        if (!shapes[shape[shape_id]]) shapes[shape[shape_id]] = [];
        let lat = Number(shape[shape_pt_lat]);
        let lng = Number(shape[shape_pt_lon]);
        shapes[shape[shape_id]].push([lat, lng]);
    });

    return db.shapes.setMany(shapes);
};

function convertRoutes(data) {
    data.filter((x, i) => i !== 0 && i !== data.length - 1).map(line => {
        let route = line.split(',');
        db.routes.set(route[1], {
            line: route[1],
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
function convertTrips(data, [route_id, trip_id, trip_headsign, shape_id]) {
    return data.filter((x, i) => i !== 0 && i !== data.length - 1).map(line => {
        let trip = line.split(',');
        return {
            line: trip[route_id],
            trip: trip[trip_id],
            headsign: trip[trip_headsign],
            shape: trip[shape_id],
            stops: []
        };
    });
}

function czas(time) {
    let hours = Number(time.split(":")[0]);
    let minutes = Number(time.split(":")[1]);
    return new Date().setHours(0, 0, 0, 0) + ((hours * 60 + minutes) * 60 * 1000);
}