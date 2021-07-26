const fs = require('fs');
const express = require('express');
const jsmediatags = require('jsmediatags');
const musicModule = require('./music.js');

const dirCacheScheduler = new (require('./cacheDirectoryTask.js'))('./Music', 3600000);
const backupScheduler = new (require('./backupDatabaseTask.js'))('./snapshots', 86400000);

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

app.use(express.static('static'));
app.use(express.static('./'))

backupScheduler.once('writtenBackup', date => {
  console.log('Creating database snapshots every', backupScheduler.refreshBackupInterval, 'ms');
  console.log('Database snapshot created! Date', date);

  backupScheduler.on('writtenBackup', date => console.log('Database snapshot created! Date', date));
});

console.log('Waiting for cache...');
dirCacheScheduler.once('writtenCache', () => {
  console.log('Cache created!');

  console.log('Refreshing cache every', dirCacheScheduler.refreshCacheInterval, 'ms');
  let listener = app.listen(process.env.PORT || 3000, () => console.log('Server started on port', listener.address().port));

  dirCacheScheduler.on('writtenCache', () => console.log('Cache refreshed!'));
});

dirCacheScheduler.startCacheTimer();
backupScheduler.startDirectoryTimer();
