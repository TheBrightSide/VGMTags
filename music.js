const express = require('express');
const app = express();
const { IPDatabase, TagDatabase } = require('./database');
const fs = require('fs');
const path = require('path');

const {
    getCachedMusicFilenames,
    getMusicFolders
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

app.get('/tags/:folderName/:fileName', (req, res) => {
    const { action } = req.query;
    const { folderName, fileName } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!fs.existsSync(path.join('Music', folderName, fileName))) {
        res.status(400);
        res.send({
            error: "path doesn't exist"
        });   
    } else {
        switch (action) {
            case 'vote': {
                const { tag } = req.query;
                if (!tag) {
                    res.send({
                        error: "insufficient query parameters"
                    });
                } else {
                    // do stuff
                }
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
                res.send({
                    error: "invalid action"
                })
            }
        }
    }
});

module.exports = app;