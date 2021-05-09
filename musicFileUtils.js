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

async function getCachedMusicFilenames(folderName) {
    if (fs.existsSync('./cache/listing.json')) {
        if (folderName === undefined)
            return require('./cache/listing.json');
        else
            return require('./cache/listing.json').filter(e => e.album === folderName);
    } else {
        throw new Error('cache is not available!');
    }
}

module.exports = {
    readTags,
    getMusicFilenames,
    getCachedMusicFilenames
}