const express = require('express');
const app = express();
const fs = require('fs');
const jsmediatags = require('jsmediatags');

async function readTags(fileName) {
    return new Promise((resolve, reject) => {
        new jsmediatags.Reader(fileName)
            .read({
                onSuccess: resolve,
                onError: reject
            });
    })
}

app.get('/foldertree/', (req, res) => {
    res.send(fs.readdirSync('Music').map(e => '/music/' + encodeURIComponent(e)));
})

app.get('/foldertree/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const encodedFolderName = encodeURIComponent(folderName);

    if (fs.existsSync(`./Music/${folderName}`)) {
        const availableLinks = fs.readdirSync(`./Music/${folderName}`)
            .filter(e => e.endsWith('.mp3'))
            .map(e => `/music/${encodedFolderName}/${encodeURIComponent(e)}`);

        const hasThumbnail = fs.existsSync(`./Music/${folderName}/thumbnail.png`);

        res.send({
            availableLinks,
            thumbnail: hasThumbnail ? `/music/${encodedFolderName}/thumbnail.png` : null
        });
    } else {
        res.status(404).json({
            "error": "folder not found"
        });
    }
})

app.use('/foldertree', express.static('Music'));

app.get('/tags', (req, res) => {
    // uh not implemented yet idk
    res.status(404);
    res.send('nothing m8');
});

app.get('/allmusic', async (req, res) => {
    const folders = fs.readdirSync('./Music');
    let fileArr = [];

    for (folder of folders) {
        let files = fs.readdirSync(`./Music/${folder}`).filter(e => e.endsWith('.mp3'));
        let thumbnail = fs.existsSync(`./Music/${folder}/thumbnail.png`) ?
            `/music/${encodeURIComponent(folder)}/thumbnail.png` : null;
        for (file of files) {
            const path = `./Music/${folder}/${file}`;
            const { tags } = await readTags(path);
            fileArr.push({
                path: `/foldertree/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`,
                title: tags.title,
                album: tags.album,
                thumbnail
            });
        }
    }

    res.send(fileArr);
})

module.exports = app;