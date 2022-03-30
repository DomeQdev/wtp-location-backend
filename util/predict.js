const { point, nearestPointOnLine, lineString } = require("@turf/turf");

module.exports = async () => {
    let naTrasie = db.trips.filter(trip => (trip.line.includes("R") || trip.line.includes("S") || trip.line.includes("A")) && (trip.stops[0].arrival < Date.now() && trip.stops[trip.stops.length - 1].departure > Date.now()));
    return removeDup(naTrasie.map(x => {
        let shape = lineString(db.shapes.get(x.shape));
        let stops = x.stops.map(stop => {
            let stopData = db.stops.get(stop.id);
            return {
                ...stop,
                ...stopData,
                index: nearestPointOnLine(shape, point(stopData.location), { units: 'meters' }).properties.index
            }
        });
        
        let nextStop = stops.filter(stop => stop.arrival > Date.now()).shift();
        let beforeStop = stops.filter(stop => stop.departure <= Date.now()).pop();

        let shapes = shape.geometry.coordinates.slice(beforeStop ? beforeStop.index : 0, nextStop ? nextStop.index : 0);
        let timeForShape = (nextStop.arrival - beforeStop.departure) / shapes.length;

        let when = shapes.map((s, i) => {
            return {
                location: s,
                time: Math.floor(stops[0].arrival + i * timeForShape)
            }
        });

        if(!when.length) {
            console.log(`Rozjebany kurs: ${x.line} > ${x.headsign} (${x.trip})`);
            return null;
        }

        let nearest = when.reduce((a, b) => Math.abs(a.time - Date.now()) < Math.abs(b.time - Date.now()) ? a : b);
        return {
            line: x.line,
            trip: x.trip,
            headsign: x.headsign,
            location: nearest.location
        };
    }).filter(x => x), "location");
};

function removeDup(arr, key) {
    let seen = {};
    return arr.filter((item) => seen.hasOwnProperty(item[key]) ? false : (seen[item[key]] = true));
}