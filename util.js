const fs = require('fs');
const jsmediatags = require('jsmediatags');
const path = require('path').posix;

const {
    FOLDERTREE_ENDPOINT,
    TAGS_ENDPOINT,
    ALLMUSIC_ENDPOINT
} = require('./consts.js');

function random(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

async function readTags(fileName) {
    return new Promise((resolve, reject) => {
        new jsmediatags.Reader(fileName)
            .read({
                onSuccess: resolve,
                onError: reject
            });
    })
}

function getMusicFolders() {
    return fs.readdirSync('./Music', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .filter(dirent => dirent.existsSync("thumbnail.png"))
        .map(dirent => dirent.name);
}

async function getMusicFilenames(folderName) {
    if (folderName) var folders = fs.readdirSync('./Music').filter(e => e === folderName);
    else var folders = fs.readdirSync('./Music');
    
    var albumArr = [];

    for (folder of folders) {
        let files = fs.readdirSync(`./Music/${folder}`, { withFileTypes: true })
            .filter(e => e.name.endsWith('.mp3') && !e.isDirectory())
            .map(e => e.name);
        
        var album = {
            title: '',
            songs: [],
            thumbnail: fs.existsSync(`./Music/${folder}/thumbnail.png`) ?
                `${FOLDERTREE_ENDPOINT}/${encodeURIComponent(folder)}/thumbnail.png` : null,
            path: `${FOLDERTREE_ENDPOINT}/${encodeURIComponent(folder)}/`
        };
                
        for (file of files) {
            const path = `./Music/${folder}/${file}`;
            const { tags } = await readTags(path);

            if (album.title === '') album.title = tags.album;

            album.songs.push({
                title: tags.title,
                path: encodeURI(`${FOLDERTREE_ENDPOINT}/${folder}/${file}`)
            });
        }

        albumArr.push(album);
    }

    return albumArr;
}

async function getCachedMusicFilenames(folderName) {
    if (fs.existsSync('./cache/listing.json')) {
        if (folderName === undefined) return require('./cache/listing.json');
        else {
            return require('./cache/listing.json')
                .filter(e => e.title === folderName);
        }
    } else {
        throw new Error('cache is not available!');
    }
}

function URLToFilePath(url) {
    return path.format({
        dir: path.join('./Music', path.normalize(url).split('/').slice(-2, -1).join(path.sep)),
        base: path.normalize(url).split('/').slice(-1).join(path.sep)
    });
}

function filePathToFolderTreeURL(filepath) {
    return '/' + [
        'music', 'foldertree',
        ...filepath.split(path.sep).slice(-2)
    ].join('/');
}

function isPathSame(path1, path2) {
    return path.normalize(path1) === path.normalize(path2);
}

module.exports = {
    random,
    readTags,
    getMusicFolders,
    getMusicFilenames,
    getCachedMusicFilenames,
    URLToFilePath,
    filePathToFolderTreeURL,
    isPathSame
}