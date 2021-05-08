const http = require('http')
const fs = require('fs')
const express = require('express')
const axios = require('axios')
const jsmediatags = require('jsmediatags')
const bodyParser = require('body-parser')
const publicDir = require('path').join(__dirname, './')

app = express();

var viable_albums = [];

fs.readdir('Music', (err, files)=>{
  files.forEach(album => {
    if (fs.existsSync("Music/" + album + "/thumbnail.png")){
      viable_albums.push("Music/" + album);
    }
  });
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/newSong', function(request, response){
  const song = request.body.song;

  var selected_album = viable_albums[Math.floor(Math.random() * viable_albums.length + 1)]
  var newSong = "";

  fs.readdir(selected_album, (err, files)=>{
    var album_songs = [];
    files.forEach(song => {
      if(song.endsWith(".mp3")){
        album_songs.push(song);
      }
    });
    newSong = selected_album + "/" + album_songs[Math.floor(Math.random() * album_songs.length + 1)]
    newSong = newSong.replace("'", "\'")

    jsmediatags.read(newSong, {
      onSuccess: (tag) => {
        console.log("\n" + tag.tags.title);
        console.log(tag.tags.album);
        console.log(newSong)
        response.send({path: newSong, title: tag.tags.title, album: tag.tags.album})
      },
      onError: (error) => {
        console.log("Error loading tags!");
      }
    });
  });
});

app.get('/newBackground', function(request, response){
  fs.readdir("Backgrounds", (err, files)=>{
    var backgrounds = [];
    files.forEach(image => {
      backgrounds.push("Backgrounds/" + image)
    });
    response.send({background: backgrounds[Math.floor(Math.random() * backgrounds.length + 1)]})
  })

})

app.use(express.static(publicDir))
app.listen(process.env.PORT || 3000, () => console.log('Server started on port 3000'))
