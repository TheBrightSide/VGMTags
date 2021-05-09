const express = require('express');
const app = express();
const fs = require('fs');
const jsmediatags = require('jsmediatags');

const FOLDERTREE_ENDPOINT = '/music/foldertree';
const TAGS_ENDPOINT = '/music/tags';
const ALLMUSIC_ENDPOINT = '/music/allmusic';

async function readTags(fileName) {
    return new Promise((resolve, reject) => {
        new jsmediatags.Reader(fileName)
            .read({
                onSuccess: resolve,
                onError: reject
            });
    })
}

async function getMusicFilenames(folderName) {
    if (folderName) var folders = fs.readdirSync('./Music').filter(e => e === folderName);
    else var folders = fs.readdirSync('./Music');

    var fileArr = [];

    for (folder of folders) {
        let files = fs.readdirSync(`./Music/${folder}`).filter(e => e.endsWith('.mp3'));
        let thumbnail = fs.existsSync(`./Music/${folder}/thumbnail.png`) ?
            `${FOLDERTREE_ENDPOINT}/${encodeURIComponent(folder)}/thumbnail.png` : null;
        for (file of files) {
            const path = `./Music/${folder}/${file}`;
            const { tags } = await readTags(path);
            fileArr.push({
                path: `${FOLDERTREE_ENDPOINT}/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`,
                title: tags.title,
                album: tags.album,
                thumbnail
            });
        }
    }

    return fileArr;
}

app.get('/foldertree/', (req, res) => {
    res.send(fs.readdirSync('Music').map(e => `${FOLDERTREE_ENDPOINT}/` + encodeURIComponent(e)));
})

app.get('/foldertree/:folderName', (req, res) => {
    getMusicFilenames(req.params.folderName)
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
    getMusicFilenames()
        .then(r => res.send(r))
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