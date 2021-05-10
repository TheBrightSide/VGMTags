const express = require('express');
const app = express();
const fs = require('fs');

const { 
    getMusicFilenames,
    getCachedMusicFilenames,
    random,
    getMusicFolders
} = require('./util.js');

const FOLDERTREE_ENDPOINT = '/music/foldertree';
const TAGS_ENDPOINT = '/music/tags';
const ALLMUSIC_ENDPOINT = '/music/allmusic';

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

app.get('/randomSong', (req, res) => {
    throw new Error('not implemented');
})

app.get('/allmusic', (req, res) => {
    var { count, offset } = req.query;

    getCachedMusicFilenames()
        .then(arr => {
            if (count === undefined && offset === undefined)
                res.send(arr)
            else {
                res.send(arr.slice(parseInt(offset), parseInt(offset) + parseInt(count)))
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

app.get('/tags', (req, res) => {
    // uh not implemented yet idk
    res.status(404);
    res.send('nothing m8');
});

module.exports = app;