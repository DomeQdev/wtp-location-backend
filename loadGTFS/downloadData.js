const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { unzip } = require('unzipit');

module.exports = async (link) => {
    let data = await fetch(link).then(res => res.arrayBuffer());

    let { entries } = await unzip(data).catch(() => ({ entries: null }));
    if (!entries) return null;

    let files = {};
    await Promise.all(Object.values(entries).map(async (entry) => {
        files[entry.name] = await entry.text();
    }));

    return files;
};