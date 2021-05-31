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

const DEFAULT_TAGS = ["relaxing", "upbeat", "intense", "weird", "ambient", "emotional", "electronic", "jazz", "piano", "brass", "violin", "harp", "guitar", "saxophone", "synth", "beach", "winter", "spring", "summer", "fall", "cheery", "insane", "cover", "remix", "happy birthday to you"];

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
                    console.log("curriptaggedsongs" + currIPTaggedSongs)
                    
                    if (!(currIPTaggedSongs.findIndex(e => isPathSame(songPath, e.path)) === -1)) {
                        // it means that the selected song has already
                        // been tagged with something in the ip database
                        
                        // getting the selected song's tags
                        let currIPSongTags = currIPTaggedSongs[currIPTaggedSongs.findIndex(e => isPathSame(songPath, e.path))].tags;
                        console.log("curripsongtags: " + currIPSongTags)

                        if (customTags.length > 0 && currIPSongTags.filter(e => !DEFAULT_TAGS.includes(e)).length > 0) {
                            res.status(403);
                            res.send({
                                error: "song has already been tagged with a custom tag"
                            });
                            return;
                        }

                        // sorry i aint explaining this im having a mental breakdown rn
                        for (let tag of currIPSongTags) {
                            if (DEFAULT_TAGS.includes(tag) && defaultTags.includes(tag)) {
                                res.status(403);
                                res.send({
                                    error: "song has already been tagged with " + tag
                                });
                                return;
                            }
                        }
                    }
                }

                if (tags.filter(tag => !DEFAULT_TAGS.includes(tag)).length > 1) {
                    res.status(403);
                    res.send({
                        error: "too many custom tags"
                    });
                    return;
                }

                tags.forEach(e => {
                    if (!tagDB.tagExists(songPath, e)) {
                        tagDB.addTagToSong(songPath, e);
                        ipDB.addTaggedSongForIP(ip, songPath, e);
                    }

                    tagDB.incrementTagOnSong(songPath, e);
                });

                res.send({
                    success: true,
                    votedFor: tags
                });
                break;
            }
            case 'cleartag': {
                
                break;
            }
            case 'create': {
                res.send('yes ok you create tag');
                break;
            }
            case 'availabletags': {
                res.send(DEFAULT_TAGS);
                break;
            }
            case 'get': {
                let currIPTaggedSongs = ipDB.searchByIP(ip).taggedSongs;
                let currIPSongTags = currIPTaggedSongs[currIPTaggedSongs.findIndex(e => isPathSame(songPath, e.path))].tags;
                console.log(currIPSongTags);
                res.send(currIPSongTags);
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