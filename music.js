const express = require('express');
const app = express();
const { IPDatabase, TagDatabase } = require('./database');
const fs = require('fs');
const path = require('path').posix;

const {
    getCachedMusicFilenames,
    getCachedFolderNames,
    isPathSame
} = require('./util.js');

const {
    FOLDERTREE_ENDPOINT,
    TAGS_ENDPOINT,
    ALLMUSIC_ENDPOINT,
    IPS_DB_PATH,
    TAGS_DB_PATH
} = require('./consts.js');

const ipDB = new IPDatabase(IPS_DB_PATH);
const tagDB = new TagDatabase(TAGS_DB_PATH);
console.log('Loaded DBs.');

app.get('/foldertree/', async (req, res) => {
    try {
        res.send((await getCachedFolderNames()).map(e => `${FOLDERTREE_ENDPOINT}/` + encodeURIComponent(e)));
    } catch (e) {
        res.status(500);
        res.send({
            "error": "Oops! Something went wrong, check the stack below.",
            "stack": e.stack
        })
    }
})

app.get('/foldertree/:folderName', (req, res) => {
    getCachedMusicFilenames(req.params.folderName)
        .then(r => res.send(r))
        .catch(e => {
            res.status(500);
            res.send({
                "error": "Oops! Something went wrong, check the stack below.",
                "stack": e.stack
            });
        });
})

app.use('/foldertree', express.static('Music'));

app.get('/allmusic', (req, res) => {
    var { count, offset } = req.query;
    count = parseInt(count);
    offset = parseInt(offset);

    getCachedMusicFilenames()
        .then(arr => {
            if ((count === undefined || isNaN(count)) && (offset === undefined || isNaN(offset)))
                res.send(arr);
            else {
                res.send(arr.slice(offset, offset + count));
            }
        })
        .catch(e => {
            res.status(500);
            res.send({
                "error": "Oops! Something went wrong, check the stack below.",
                "stack": e.stack
            });
        });
});

const DEFAULT_TAGS = ["relaxing", "upbeat", "intense", "weird", "ambient", "emotional", "electronic", "jazz", "piano", "brass", "violin", "harp", "guitar", "saxophone", "synth", "beach", "winter", "spring", "summer", "fall", "cheery", "insane", "cover", "remix", "horror", "circus", "glitch", "secret", "march", "chiptune", "8-bit", "celebration", "hardcore", "rave", "dynamic", "minimal", "vocals", "volcano", "underwater", "menu", "cave", "romantic", "foreboding", "battle", "boss", "finale", "credits", "space", "lullaby", "orchestrated", "night", "tropical", "rock", "metal", "snow"];

app.get('/defaulttags', (req, res) => {
    res.send(DEFAULT_TAGS);
})

app.get('/usertags/:folderName/:fileName', (req, res) => {
    const { folderName, fileName } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const songPath = path.join('Music', folderName, fileName);

    //how do you do this more effectively?
    ipDB.searchByIP(ip).taggedSongs.forEach((song, i) => {
        if (song.path == songPath){
            res.send(ipDB.searchByIP(ip).taggedSongs[i].tags)
        }
    });
    if (!res.headersSent){
        res.send(JSON.stringify(new Array()));
    }
})

app.get('/tags/:folderName/:fileName', (req, res) => {
    const { folderName, fileName } = req.params;
    const songPath = path.join('Music', folderName, fileName);

    //how do you do this more effectively?
    if(tagDB.searchByPath(songPath) != undefined){
        console.log(tagDB.searchByPath(songPath).tags)
        result = {};

        for (tag of tagDB.searchByPath(songPath).tags) {
            result[tag.tagName] = tag.votes;
        }

        res.send(result);
    }
    if (!res.headersSent){
        res.send(JSON.stringify(new Array()));
    }
})

app.post('/tags/:folderName/:fileName', (req, res) => {
    const { action } = req.body;
    const { folderName, fileName } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const songPath = path.join('Music', folderName, fileName);

    if (!folderName || !fileName || !fs.existsSync(songPath)) {
        res.status(400);
        res.send({
            error: "path doesn't exist"
        });
        return;
    } else {
        switch (action) {
            case 'vote': {
                if (!req.body.tags || req.body.tags.length == 0 || !Array.isArray(req.body.tags)) {
                    res.status(400);
                    res.send({
                        error: "insufficient or invalid body parameters"
                    });
                    return;
                }

                const tags = req.body.tags.map(e => e.toLowerCase());
                let acceptedTags = [];
                let rejectedTags = [];

                // tag checks on behalf of the ip database
                // these checks are basically to check if the ip user
                // has already tagged a song with the tags array
                if (!!ipDB.searchByIP(ip)) {
                    // filtered custom input tags
                    let customTags = tags.filter(e => !DEFAULT_TAGS.includes(e));
                    // filtered default input tags
                    let defaultTags = tags.filter(e => DEFAULT_TAGS.includes(e));
                    // get taggedSongs for the ip requester
                    let currIPTaggedSongs = ipDB.searchByIP(ip).taggedSongs;
                    
                    if (!(currIPTaggedSongs.findIndex(e => isPathSame(songPath, e.path)) === -1)) {
                        // it means that the selected song has already
                        // been tagged with something in the ip database
                        
                        // getting the selected song's tags
                        let currIPSongTags = currIPTaggedSongs[currIPTaggedSongs.findIndex(e => isPathSame(songPath, e.path))].tags;
                        
                        if (customTags.length > 0 && currIPSongTags.filter(e => !DEFAULT_TAGS.includes(e)).length > 0) {
                            rejectedTags.push(...tags.filter(e => !DEFAULT_TAGS.includes(e)));
                        }

                        // sorry i aint explaining this im having a mental breakdown rn
                        for (let tag of currIPSongTags) {
                            if (DEFAULT_TAGS.includes(tag) && defaultTags.includes(tag)) {
                                rejectedTags.push(tag);
                            }
                        }
                    }
                }

                rejectedTags = [...new Set(rejectedTags)];
                acceptedTags = [...new Set(tags.filter(e => !rejectedTags.includes(e)))];

                acceptedTags.forEach(e => {
                    if (!tagDB.tagExists(songPath, e)) {
                        tagDB.addTagToSong(songPath, e);
                    }

                    ipDB.addTaggedSongForIP(ip, songPath, e);
                    tagDB.incrementTagOnSong(songPath, e);
                });

                res.send({
                    accepted: acceptedTags,
                    rejected: rejectedTags
                });
                
                break;
            }
            case 'removevote': {
                if (!req.body.tags || req.body.tags.length == 0 || !Array.isArray(req.body.tags)) {
                    res.status(400);
                    res.send({
                        error: "insufficient or invalid body parameters"
                    });
                    return;
                }

                const tags = req.body.tags.map(e => e.toLowerCase());
                let acceptedTags = []
                let rejectedTags = []

                tags.forEach(tag => {
                    try {
                        ipDB.removeTaggedSongForIP(ip, songPath, tag);
                        tagDB.decrementTagOnSong(songPath, tag);
                        acceptedTags.push(tag);
                    } catch (e) {
                        rejectedTags.push(tag);
                    }
                });

                res.send({
                    accepted: acceptedTags,
                    rejected: rejectedTags
                });

                break;
            }
            default: {
                res.status(400);
                res.send({
                    error: "invalid action"
                });
                return;
            }
        }
    }
});

module.exports = app;