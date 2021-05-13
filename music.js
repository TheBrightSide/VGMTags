const express = require('express');
const app = express();
const { IPDatabase, TagDatabase } = require('./database');
const fs = require('fs');
const path = require('path');

const {
    getCachedMusicFilenames,
    getMusicFolders,
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

app.get('/foldertree/', (req, res) => {
    try {
        res.send(getMusicFolders().map(e => `${FOLDERTREE_ENDPOINT}/` + encodeURIComponent(e)));
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
const DEFAULT_ONLY = false;

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
                if (!!ipDB.searchByIP(ip)) {
                    if (ipDB.searchByIP(ip).taggedSongs.filter(e => 
                        isPathSame(e.path, songPath)).length >= 1) {
                        res.status(403);
                        res.send({
                            error: "song already tagged"
                        });
                        return;
                    }
                } else {
                    const { tags } = req.body;

                    if (!tags || tags.length == 0 || !Array.isArray(tags)) {
                        res.status(400);
                        res.send({
                            error: "insufficient or invalid body parameters"
                        });
                        return;
                    } else {
                        if (!DEFAULT_ONLY) {
                            if (tags.filter(tag => !DEFAULT_TAGS.includes(tag)).length > 1) {
                                res.status(403);
                                res.send({
                                    error: "too many custom tags"
                                });
                                return;
                            }
                        } else {
                            if (tags.filter(tag => !DEFAULT_TAGS.includes(tag)).length > 0) {
                                res.status(403);
                                res.send({
                                    error: "too many custom tags"
                                });
                                return;
                            }
                        }

                        ipDB.addTaggedSongForIP(ip, songPath, tags);

                        res.send({
                            success: true,
                            votedFor: tags
                        });
                    }
                }                
                break;
            }
            case 'cleartags': {
                // clear tag
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