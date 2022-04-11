module.exports = async () => {
    let naTrasie = db.trips.filter(trip => (trip.line.includes("R") || trip.line.includes("S") || trip.line.includes("A") || trip.line.includes("M")) && (trip.stops[0].arrival < Date.now() && trip.stops[trip.stops.length - 1].departure > Date.now()));
    return removeDup(naTrasie.map(x => {
        let shape = db.shapes.get(x.shape);
        let stops = x.stops;

        let nextStop = stops.filter(stop => stop.arrival > Date.now()).shift();
        let beforeStop = stops.filter(stop => stop.departure <= Date.now()).pop();

        let shapes = shape.slice(beforeStop ? beforeStop.index : 0, nextStop ? nextStop.index : 0);
        let timeForShape = (nextStop.arrival - beforeStop.departure) / shapes.length;

        let when = shapes.map((s, i) => {
            return {
                location: s,
                time: Math.floor(stops[0].arrival + i * timeForShape)
            }
        });

        if (!when.length) {
            console.log(`Rozjebany kurs: ${x.line} > ${x.headsign} (${x.trip})`);
            return null;
        }

        let nearest = when.reduce((a, b) => Math.abs(a.time - Date.now()) < Math.abs(b.time - Date.now()) ? a : b);
        let previousLocation = when.filter(w => w.time < nearest.time).pop();
        return {
            line: x.line,
            trip: x.trip,
            headsign: x.headsign,
            location: nearest.location,
            previousLocation: previousLocation ? previousLocation.location : null,
        };
    }).filter(x => x), "location");
};

function removeDup(arr, key) {
    let seen = {};
    return arr.filter((item) => seen.hasOwnProperty(item[key]) ? false : (seen[item[key]] = true));
}