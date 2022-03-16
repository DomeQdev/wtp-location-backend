const fetch = require('node-fetch');
const { unzip } = require('unzipit');

module.exports = async(link) => {
    // link should be .zip file.
    let data = await fetch(link).then(res => res.arrayBuffer());

    let { entries } = await unzip(data).catch(() => ({ entries: null }));
    if(!entries) return null;

    let files = {};
    await Promise.all(Object.values(entries).map(async(entry) => {
        files[entry.name] = await entry.text();
    }));
    
    return files;
};