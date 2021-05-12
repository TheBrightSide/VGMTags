let now_playing = document.querySelector(".now-playing");
let track_art = document.querySelector(".track-art");
let track_name = document.querySelector(".track-name");
let track_artist = document.querySelector(".track-artist");

let playpause_btn = document.querySelector(".playpause-track");
let next_btn = document.querySelector(".next-track");
let prev_btn = document.querySelector(".prev-track");

let seek_slider = document.querySelector(".seek_slider");
let volume_slider = document.querySelector(".volume_slider");
let curr_time = document.querySelector(".current-time");
let total_duration = document.querySelector(".total-duration");

let heart_button = document.querySelector(".add-playlist");

let track_index = 0;
let isPlaying = false;
let isTaggerOpen = false;
let updateTimer;
let track_list = []; //Songs in queue
let cache = []; //The unchanging cache
let full_albums = []; //The changing cache
let restricted_tag_list = ["Summer", "Fall", "Winter", "Spring", "Rock", "Electronic"];

// Create new audio element
let curr_track = document.createElement('audio');
curr_track.setAttribute('crossOrigin', 'anonymous')

class Album {
  constructor(title, songs, path) {
    this.title = title;
    this.songs = songs;
    this.path = path;
    this.tags = [];
  }
}

class Song {
  constructor(path, album, title, thumbnail) {
    this.title = title;
    this.album = album;
    this.image = path.substring(0, path.lastIndexOf("/") + 1) + "thumbnail.png";
    this.path = path;
    this.tags = [];
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function loadTrack(track_index) {
  clearInterval(updateTimer);
  resetValues();

  // Load a new track
  curr_track.src = track_list[track_index].path;
  curr_track.load();

  // Update details of the track
  track_art.style.backgroundImage = "url('" + track_list[track_index].image + "')";
  track_name.textContent = track_list[track_index].title;
  track_artist.textContent = track_list[track_index].album;
  now_playing.textContent = "PLAYING " + (track_index + 1) + " OF " + track_list.length;

  // Set an interval of 1000 milliseconds for updating the seek slider
  updateTimer = setInterval(seekUpdate, 1000);

  // Move to the next track if the current one finishes playing
  curr_track.addEventListener("ended", nextTrack);
}

// Reset Values
function resetValues() {
  curr_time.textContent = "00:00";
  total_duration.textContent = "00:00";
  seek_slider.value = 0;
}

function playpauseTrack() {
  if (!isPlaying) playTrack();
  else pauseTrack();
}

function playTrack() {
  curr_track.play();
  isPlaying = true;

  // Replace icon with the pause icon
  playpause_btn.innerHTML = '<i class="fas fa-pause-circle fa-5x"></i>';
}

function pauseTrack() {
  curr_track.pause();
  isPlaying = false;

  // Replace icon with the play icon
  playpause_btn.innerHTML = '<i class="fas fa-play-circle fa-5x"></i>';;
}

// Fetches a newSong. Yes I know it is messy :/
async function loadNextSong() {
  if (track_list.length - 1 == track_index) {
    selected_song = null;

    // Selects a song that has not already been played
    while (selected_song == null || track_list.some((song) => song.title === selected_song.title)) {
      var selected_album = full_albums[Math.floor(Math.random() * full_albums.length)]
      selected_song = selected_album.songs[Math.floor(Math.random() * selected_album.songs.length)]
    }
    track_list.push(selected_song)
  }
}

async function nextTrack() {
  await loadNextSong();
  if (track_index < track_list.length - 1) {
    track_index += 1;
  } else {
    track_index = 0;
  };
  loadTrack(track_index);
  playTrack();
}

async function prevTrack() {
  await (async function() {
    if (track_index > 0)
      track_index -= 1;
    else track_index = track_list.length;
  })();


  loadTrack(track_index);
  playTrack();
}

function seekTo() {
  seekto = curr_track.duration * (seek_slider.value / 100);
  curr_track.currentTime = seekto;
}

function setVolume() {
  curr_track.volume = volume_slider.value / 100;
  document.cookie = "volume=" + volume_slider.value / 100
}

function seekUpdate() {
  let seekPosition = 0;

  // Check if the current track duration is a legible number
  if (!isNaN(curr_track.duration)) {
    seekPosition = curr_track.currentTime * (100 / curr_track.duration);
    seek_slider.value = seekPosition;

    // Calculate the time left and the total duration
    let currentMinutes = Math.floor(curr_track.currentTime / 60);
    let currentSeconds = Math.floor(curr_track.currentTime - currentMinutes * 60);
    let durationMinutes = Math.floor(curr_track.duration / 60);
    let durationSeconds = Math.floor(curr_track.duration - durationMinutes * 60);

    // Adding a zero to the single digit time values
    if (currentSeconds < 10) {
      currentSeconds = "0" + currentSeconds;
    }
    if (durationSeconds < 10) {
      durationSeconds = "0" + durationSeconds;
    }
    if (currentMinutes < 10) {
      currentMinutes = "0" + currentMinutes;
    }
    if (durationMinutes < 10) {
      durationMinutes = "0" + durationMinutes;
    }

    curr_time.textContent = currentMinutes + ":" + currentSeconds;
    total_duration.textContent = durationMinutes + ":" + durationSeconds;
  }
}

function heartSong() {
  if (heart_button.innerHTML == '<i class="far fa-heart" aria-hidden="true"></i>') {
    heart_button.innerHTML = '<i class="fas fa-heart"></i>'
  }
  else {
    heart_button.innerHTML = '<i class="far fa-heart"></i>'
  }
}

function tagSong() {
  
  var tagAdderList = document.getElementById('tagAdderList');
  restricted_tag_list.forEach(song => {
    tag = document.createElement("tagEntry")
    tag.innerHTML = '<tag><a onclick="printHi()">' + song + '</a></tag>';
    tagAdderList.appendChild(tag);
  })
  if(isTaggerOpen){
    closeNav();
  } 
  else{
    openNav();
  } 
}
/* Set the width of the side navigation to 250px */
function openNav() {
  document.getElementById("tagAdderList").style.width = "20%";
  document.getElementById("tagSearchFilter").focus();
  isTaggerOpen = true;
}

/* Set the width of the side navigation to 0 */
function closeNav() {
  document.getElementById("tagAdderList").style.width = "0";
  isTaggerOpen = false;
}

function searchFilter() {
  // Declare variables
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById('tagSearchFilter');
  filter = input.value.toUpperCase();
  ul = document.getElementById("tagAdderList");
  li = ul.getElementsByTagName('tag');

  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

function printHi() {
  alert("hi Alex (:")
}


(async () => {
  await fetch('/music/allmusic', {
    method: 'GET',
  })
  .then(response => response.json())
  .then(data => {
    data.forEach(album => {
      album_songs = []
      album['songs'].forEach(song => {
        album_songs.push(new Song(song['path'], album['title'], song['title'], album['thumbnail']));
      })
      cache.push(new Album(album['title'], album_songs, album['path']))
    });
  })

  full_albums = cache;

  var selected_album = full_albums[Math.floor(Math.random() * full_albums.length)]
  var selected_song = selected_album.songs[Math.floor(Math.random() * selected_album.songs.length)]
  track_list.push(selected_song)

  if (getCookie('volume') != undefined){
    volume_slider.value = getCookie('volume')*100;
    curr_track.volume = getCookie('volume');
    console.log(getCookie('volume'))
  }
  else{
    volume_slider.value = 50;
    curr_track.volume = .5;
    document.cookie = "volume=.5"
  }


  // Load the random background
  async function loadNextBackground() {
    await fetch('/newBackground', {
      method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.background);
      document.body.style.background = "linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('" + data.background + "')";
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundRepeat = "no-repeat";
    });
  }
  
  //Loads the background
  loadNextBackground();

  //Loads the first song from track_list
  loadTrack(track_index);
})();