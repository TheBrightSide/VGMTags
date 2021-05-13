const fs = require('fs');
const path = require('path');

class JSONDatabase {
    constructor(dbPath) {
        this.dbPath = dbPath;

        if (!fs.existsSync(this.dbPath)) {
            var builtPath = '';
            path.normalize(path.dirname(this.dbPath)).split(path.sep).forEach(e => {
                if (!fs.existsSync(path.join(builtPath, e)))
                    fs.mkdirSync(path.join(builtPath, e));
                
                builtPath = path.join(builtPath, e);
            });

            fs.writeFileSync(this.dbPath, '[]');
        } else {
            try {
                JSON.parse(fs.readFileSync(this.dbPath));
            } catch (e) {
                console.log('error!');
                fs.writeFileSync(this.dbPath, '[]');
            }
        }
    }

    appendDB(data) {
        let db = this.readDB();
        db.push(data);
        this.writeDB(db);
    }

    modifyDB(index, data) {
        var db = this.readDB();
        db[index] = data;
        this.writeDB(db);
    }

    writeDB(data) {
        if (typeof data === 'object') data = JSON.stringify(data);
        fs.writeFileSync(this.dbPath, data);
    }
    
    readDB() {
        return JSON.parse(fs.readFileSync(this.dbPath));
    }
}

class IPDatabase extends JSONDatabase {
    constructor (dbPath) {
        super(dbPath);
    }

    _validateIPAddress(ipAddr) {
        const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (regex.test(ipAddr)) return true;
        else return false;
    }

    searchByIP(ipAddr) {
        return this.readDB().find(e => e.ip === ipAddr);
    }
    
    modifyByIP(ipAddr, data) {
        var itemIdx = this.readDB().findIndex(e => e.ip === ipAddr);
        this.modifyDB(itemIdx, data);
    }

    addTaggedSongForIP(ipAddr, taggedSongPath, tags) {
        // if (!this._validateIPAddress(ipAddr)) throw new Error('invalid ip address');
        if (!this.searchByIP(ipAddr)) {
            this.appendDB({
                ip: ipAddr,
                taggedSongs: [ { path: taggedSongPath, tags: [ ...tags ] } ]
            });
        } else {
            let data = this.searchByIP(ipAddr);
            data.taggedSongs.push({
                path: taggedSongPath,
                tags: [ ...tags ]
            });
            this.modifyByIP(ipAddr, data);
        }
    }
}

class TagDatabase extends JSONDatabase {
    constructor(dbPath) {
        super(dbPath);
    }

    searchByPath(filePath) {
        return this.readDB().find(e => e.path === filePath);
    }

    tagExists(filePath, tagName) {
        try {
            return this.readDB()
                .find(e => e.path === filePath).tags
                    .map(e => e.tagName).includes(tagName);
        } catch {
            return false;
        }
    }

    modifyByPath(filePath, data) {
        var itemIdx = this.readDB().findIndex(e => e.path === filePath);
        this.modifyDB(itemIdx, data);
    }

    addTagToSong(filePath, tagName) {
        tagName = tagName.toLowerCase();
        if (!this.searchByPath(filePath)) {
            this.appendDB({
                path: filePath,
                tags: [{
                    tagName: tagName,
                    votes: 0
                }]
            });
        } else {
            if (this.tagExists(filePath, tagName)) {
                throw new Error('tag already exists');
            } else {
                let data = this.searchByPath(filePath);
                data.tags.push({
                    tagName: tagName,
                    votes: 0
                });
                this.modifyByPath(filePath, data);
            }
        }
    }

    incrementTagOnSong(filePath, tagName) {
        tagName = tagName.toLowerCase();
        if (this.searchByPath(filePath)) {
            if (this.tagExists(filePath, tagName)) {
                let data = this.searchByPath(filePath);
                data.tags[
                    data.tags.findIndex(e => e.tagName === tagName)
                ].votes++;
                this.modifyByPath(filePath, data);
            } else {
                throw new Error('tag doesn\'t exist');
            }
        } else {
            throw new Error('song doesn\'t exist');
        }
    }
}

module.exports = { JSONDatabase, IPDatabase, TagDatabase };