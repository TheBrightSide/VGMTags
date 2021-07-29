const fs = require('fs');
const express = require('express');
const jsmediatags = require('jsmediatags');
const musicModule = require('./music.js');
const { getCachedMusicFilenames } = require('./util.js');
const { getCachedBackgroundFilenames } = require('./util.js');

const dirCacheScheduler = new (require('./cacheDirectoryTask.js'))('./Music', 3600000);
const backupScheduler = new (require('./backupDatabaseTask.js'))('./snapshots', 86400000);
const bgCacheScheduler = new (require('./bgDirectoryTask.js'))('./Backgrounds',3600000)

const app = express();
var viable_albums = [];

fs.readdir('Music', (err, files) => {
  files.forEach(album => {
    if (fs.existsSync("Music/" + album + "/thumbnail.png")) {
      viable_albums.push("Music/" + album);
    }
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/newSong', function (request, response) {
  const song = request.body.song;

  var selected_album = viable_albums[Math.floor(Math.random() * viable_albums.length)]
  var newSong = "";

  fs.readdir(selected_album, (err, files) => {
    var album_songs = [];
    files.forEach(song => {
      if (song.endsWith(".mp3")) {
        album_songs.push(song);
      }
    });
    newSong = selected_album + "/" + album_songs[Math.floor(Math.random() * album_songs.length)]
    newSong = newSong.replace("'", "\'")

    jsmediatags.read(newSong, {
      onSuccess: (tag) => {
        console.log("\n" + tag.tags.title);
        console.log(tag.tags.album);
        console.log(newSong)
        response.send({ path: newSong, title: tag.tags.title, album: tag.tags.album })
      },
      onError: (error) => {
        console.log("Error loading tags!");
      }
    });
  });
});

app.use('/music', musicModule);

app.get('/newBackground', function (request, response) {
  fs.readdir("Backgrounds", (err, files) => {
    var backgrounds = [];
    files.forEach(image => {
      backgrounds.push("Backgrounds/" + image)
    });
    response.send({ background: backgrounds[Math.floor(Math.random() * backgrounds.length)] })
  })
})

app.get('/allbg', (req, res) => {
  var { count, offset } = req.query;
  count = parseInt(count);
  offset = parseInt(offset);

  getCachedBackgroundFilenames()
      .then(arr => {
          if ((count === undefined || isNaN(count)) && (offset === undefined || isNaN(offset))){
            res.send(arr);
          } 
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

app.use(express.static('static'));
app.use(express.static('./'))

backupScheduler.once('writtenBackup', date => {
  console.log('Creating database snapshots every', backupScheduler.refreshBackupInterval, 'ms');
  console.log('Database snapshot created! Date', date);

  backupScheduler.on('writtenBackup', date => console.log('Database snapshot created! Date', date));
});

bgCacheScheduler.once('writtenBackgrounds', () => {
  console.log('Background cache created!');

  console.log('Refreshing background cache every', bgCacheScheduler.refreshCacheInterval, 'ms');

  bgCacheScheduler.on('writtenBackgrounds', () => console.log('Background cache refreshed!'));
});

console.log('Waiting for cache...');
dirCacheScheduler.once('writtenCache', () => {
  console.log('Music cache created!');

  console.log('Refreshing music cache every', dirCacheScheduler.refreshCacheInterval, 'ms');
  let listener = app.listen(process.env.PORT || 3000, () => console.log('Server started on port', listener.address().port));

  dirCacheScheduler.on('writtenCache', () => console.log('Music cache refreshed!'));
});


bgCacheScheduler.startCacheTimer();
dirCacheScheduler.startCacheTimer();
backupScheduler.startDirectoryTimer();
