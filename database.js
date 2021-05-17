const fs = require('fs');
const path = require('path').posix;

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
        tags = tags.map(e => e.toLowerCase());
        taggedSongPath = path.normalize(taggedSongPath);
        if (!this.searchByIP(ipAddr)) {
            console.log('why');
            this.appendDB({
                ip: ipAddr,
                taggedSongs: [ { path: taggedSongPath, tags: [ ...tags ] } ]
            });
        } else {
            let data = this.searchByIP(ipAddr);
            if (data.taggedSongs.findIndex(e => e.path === taggedSongPath) !== -1) {
                data.taggedSongs[
                    data.taggedSongs.findIndex(e => e.path === taggedSongPath)
                ].tags.push(...tags)
                this.modifyByIP(ipAddr, data);
            } else {
                data.taggedSongs.push({
                    path: taggedSongPath,
                    tags: [ ...tags ]
                });
                this.modifyByIP(ipAddr, data);
            }
        }
    }
}

class TagDatabase extends JSONDatabase {
    constructor(dbPath) {
        super(dbPath);
    }

    searchByPath(filePath) {
        filePath = path.normalize(filePath);
        return this.readDB().find(e => e.path === filePath);
    }

    tagExists(filePath, tagName) {
        filePath = path.normalize(filePath);
        try {
            return this.readDB()
                .find(e => e.path === filePath).tags
                    .map(e => e.tagName).includes(tagName);
        } catch {
            return false;
        }
    }

    modifyByPath(filePath, data) {
        filePath = path.normalize(filePath);
        var itemIdx = this.readDB().findIndex(e => e.path === filePath);
        this.modifyDB(itemIdx, data);
    }

    addTagToSong(filePath, tagNames) {
        filePath = path.normalize(filePath);
        tagNames = tagNames.map(e => {
            return {
                tagName: e.toLowerCase(),
                votes: 0
            } 
        });
        if (!this.searchByPath(filePath)) {
            this.appendDB({
                path: filePath,
                tags: [ ...tagNames ]
            });
        } else {
            if (tagNames.findIndex(e => this.tagExists(filePath, e.tagName)) !== -1) {
                throw new Error('tag already exists');
            } else {
                let data = this.searchByPath(filePath);
                data.tags.push( ...tagNames );
                this.modifyByPath(filePath, data);
            }
        }
    }

    incrementTagOnSong(filePath, tagName) {
        filePath = path.normalize(filePath);
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

    decrementTagOnSong(filePath, tagName) {
        filePath = path.normalize(filePath);
        tagName = tagName.toLowerCase();
        if (this.searchByPath(filePath)) {
            if (this.tagExists(filePath, tagName)) {
                let data = this.searchByPath(filePath);
                data.tags[
                    data.tags.findIndex(e => e.tagName === tagName)
                ].votes--;
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