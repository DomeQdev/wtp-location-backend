const { point, nearestPointOnLine, lineString } = require("@turf/turf");

module.exports = async() => {
    let naTrasie = db.trips.filter(trip => (trip.line.includes("R") || trip.line.includes("S")) && (trip.stops[0].arrival < Date.now() && trip.stops[trip.stops.length - 1].departure > Date.now()));
    return naTrasie.map(x => {
        let shape = lineString(db.shapes.get(x.shape));
        return {
            shape,
            stops: x.stops.map(stop => {
                let stopData = db.stops.get(stop.id);
                return {
                    ...stop,
                    onLine: nearestPointOnLine(shape, point(stopData.location), {units: 'meters'})
                }
            })
        }
        //return x.stops;
    })[0];
};

function removeDup(arr, key) {
    let seen = {};
    return arr.filter((item) => seen.hasOwnProperty(item[key]) ? false : (seen[item[key]] = true));
}

/*
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
*/