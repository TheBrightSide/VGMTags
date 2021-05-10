const EventEmitter = require('events');
const fs = require('fs');
const { getMusicFilenames } = require('./util.js');

class CacheTaskEventEmitter extends EventEmitter {
    constructor (cacheDirectory, refreshCacheInterval) {
        super();

        this.refreshCacheInterval = refreshCacheInterval;
        this.cacheDirectory = cacheDirectory;
        this.refreshCacheIntervalID = 0;

        if (!fs.existsSync(this.cacheDirectory))
            throw new Error('directory for caching does not exist');
    }

    async _refreshCache(emitter) {
        if (!fs.existsSync('./cache')) {
            fs.mkdirSync('./cache');
        }

        fs.writeFileSync('./cache/listing.json', JSON.stringify(await getMusicFilenames()));
        emitter.emit('writtenCache');
    }

    startCacheTimer() {
        this._refreshCache(this).then(() => {
            this.refreshCacheIntervalID = setInterval(() => { this._refreshCache(this) }, this.refreshCacheInterval);
        });
    }

    stopCacheTimer() {
        clearInterval(this.refreshCacheIntervalID);
        this.refreshCacheIntervalID = 0;
    }
}

module.exports = CacheTaskEventEmitter;