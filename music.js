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

const DEFAULT_TAGS = ["8-bit","accordian","adventure","ambient","battle","beautiful","boss","brass","cave","celebration","cheery","chiptune","choir","circus","credits","creepy","cutscene","depressing","dark","day","disco","distant","distorted","dynamic","electronic","emotional","empty","fall","fast","finale","foreboding","frantic","gambling","game over","gentle","glitch","guitar","happy","hardcore","harp","heavy","heroic","hip hop","horror","insane","intense","jazz","joyful","latin","lullaby","march","medley","mellow","meloncholy","meme","menu","metal","minimal","music box","mysterious","night","nostalgic","orchestrated","organ","piano","pop","powerful","rave","relaxing","remix","rock","romantic","saxophone","secret","sfx","shop","silly","slow","snow","soft","space","spring","strings","summer","synth","tropical","trumpet","underwater","upbeat","violin","vocals","volcano","waltz","weird","western","winter","woodwind"]

app.get('/defaulttags', (req, res) => {
    res.send(DEFAULT_TAGS);
})

app.get('/usertags/:folderName/:fileName', (req, res) => {
    const { folderName, fileName } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const songPath = path.join('Music', folderName, fileName);

    //how do you do this more effectively?
    if (!!ipDB.searchByIP(ip)) {
        ipDB.searchByIP(ip).taggedSongs.forEach((song, i) => {
            if (song.path == songPath){
                res.send(ipDB.searchByIP(ip).taggedSongs[i].tags)
            }
        });
    } else {
        res.send(JSON.stringify([]));
    }
    if (!res.headersSent){
        res.send(JSON.stringify(new Array()));
    }
})

app.get('/tags/:folderName/:fileName', (req, res) => {
    const { folderName, fileName } = req.params;
    const songPath = path.join('Music', folderName, fileName);

    //how do you do this more effectively?
    if(!!tagDB.searchByPath(songPath)){
        result = {};

        for (tag of tagDB.searchByPath(songPath).tags) {
            result[tag.tagName] = tag.votes;
        }

        res.send(result);
    }
    if (!res.headersSent){
        res.send(JSON.stringify([]));
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
                if(require('./db/bannedips.json').includes(ip)){
                    res.status(403);
                    res.send({
                        error: "You have been banned from voting."
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