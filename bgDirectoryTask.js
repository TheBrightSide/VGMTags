const EventEmitter = require('events');
const fs = require('fs');
const { getBackgroundFilenames } = require('./util.js');

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

        fs.writeFileSync('./cache/backgrounds.json', JSON.stringify(await getBackgroundFilenames()));
        emitter.emit('writtenBackgrounds');
    }

    startCacheTimer() {
        this._refreshCache(this).then(() => {
            this.refreshCacheIntervalID = setInterval(() => { this._refreshCache(this) }, this.refreshCacheInterval);
        });
    }

    stopCacheTimer() {
        clearInterval(this.refreshCacheIntervalID);
        this.refreshCacheIntervalID = -1;
    }
}

module.exports = CacheTaskEventEmitter;