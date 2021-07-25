const EventEmitter = require('events');
const fs = require('fs');

class BackupTaskEventEmitter extends EventEmitter {
    constructor (backupDirectory, refreshCacheInterval) {
        super();

        this.refreshBackupInterval = refreshCacheInterval;
        this.backupDirectory = backupDirectory;
        this.refreshBackupIntervalID = 0;
    }

    _refreshBackup(emitter) {
        if (!fs.existsSync(this.backupDirectory)) {
            fs.mkdirSync(this.backupDirectory);
        }

        let ipsRaw = require('./db/ips.json');
        let tagsRaw = require('./db/tags.json');
        let date = new Date().toISOString();

        fs.mkdirSync(`${this.backupDirectory}/${date}/`);
        fs.writeFileSync(`${this.backupDirectory}/${date}/ips.json`, JSON.stringify(ipsRaw));
        fs.writeFileSync(`${this.backupDirectory}/${date}/tags.json`, JSON.stringify(tagsRaw));
        emitter.emit('writtenBackup', date);
    }

    startDirectoryTimer() {
        this._refreshBackup(this);
        this.refreshBackupIntervalID = setInterval(() => {
            this._refreshBackup(this);
        }, this.refreshBackupInterval);
    }

    stopDirectoryTimer() {
        clearInterval(this.refreshBackupIntervalID);
        this.refreshBackupIntervalID = -1;
    }
}

module.exports = BackupTaskEventEmitter;