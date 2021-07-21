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

let track_index = 0; // Current index in the queue. Allows user to go to previous song.
let isPlaying = false; // True if the player is playing
let isTaggerOpen = false; // True if the tagger menu is open
let updateTimer; // Updates the seek slider
let track_list = []; // Songs in queue
let cache = []; // The unchanging cache
let full_albums = []; // The changing cache

let restricted_tag_list = ["Relaxing", "Summer", "Fall", "Winter", "Spring", "Rock", "Electronic"]; // default tag list

let current_tags = [];
let current_user_tags = [];
let addable_tags = document.getElementById('tagSelections');
let cur_tags_html = document.getElementById('curUserTags');
let top_song_tags = document.getElementById('top-song-tags')
let used_custom_tag = false;

// Create new audio element
let curr_track = document.createElement('audio');
curr_track.setAttribute('crossOrigin', 'anonymous')

displayTopTag("Hell"), displayTopTag("Relaxing"), displayTopTag("Zen"), displayTopTag("Insane"), displayTopTag("Ugh");

function displayTopTag(tagname){
  var tag = document.createElement("song-tag");
  tag.className = "song-tag";
  tag.innerHTML = tagname;
  tag.style.backgroundColor = stringToColour(tagname);
  tag_colors = tag.style.backgroundColor.substring(4, tag.style.backgroundColor.length - 1).split(', ');
  if ((tag_colors[0] * 0.299 + tag_colors[1] * 0.587 + tag_colors[2] * 0.114) > 160) {
    tag.style.color = "#000000"
  }
  else {
    tag.style.color = "#ffffff"
  }
  top_song_tags.appendChild(tag);
}

class Album {
  constructor(title, songs, path) {
    this.title = title;
    this.songs = songs;
    this.path = path;
    this.tags = [];
  }
}

class Song {
  constructor(path, album, title) {
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
  resetTagSelector();
  if (isTaggerOpen) {
    importTagList();
    importUserTags();
    searchFilter();
  }
}

async function prevTrack() {
  await (async function () {
    if (track_index > 0)
      track_index -= 1;
    else track_index = track_list.length;
  })();
  loadTrack(track_index);
  playTrack();
  resetTagSelector();
  if (isTaggerOpen) {
    importTagList();
    importUserTags();
    searchFilter();
  }
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

// TAGGING SYSTEM

function searchFilter() {
  // Declare variables 
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById('tagSearchFilter');
  filter = input.value.toUpperCase();
  ul = document.getElementById("tagSelections");
  li = ul.getElementsByTagName('tag');

  // Loop through all list items, and hide those who don't match the search query
  var hidden_items = 0;
  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      if (document.getElementById("addCustomTag")) {
        if (txtValue.replace('Add custom tag:', '').toUpperCase() == input.value.toUpperCase().substring(0, input.value.length - 1)) {
          continue;
        }
      }
      li[i].style.display = "none";
      hidden_items++;
    }
  }
  if (document.getElementById("addCustomTag")) ++hidden_items;
  if (hidden_items >= li.length) {
    if (document.getElementById("addCustomTag")) {
      document.getElementById("addCustomTag").innerHTML = '<a onclick="selectTag(this)">Add custom tag:<br><br>' + input.value + '</a>' //change to addCustomTag
    } else {
      customAdd = document.createElement("custom")
      customAdd.innerHTML = '<tag id="addCustomTag"><a onclick="selectTag(this)">Add custom tag:<br><br>' + input.value + '</a></tag>';
      document.getElementById("tagSelections").appendChild(customAdd);
    }
  } else {
    if (document.getElementById("addCustomTag")) document.getElementById("addCustomTag").remove();
  }
}

function selectTag(tag) {
  if (current_user_tags.length >= 5) {
    console.log(current_user_tags)
    alert("You can't add any more tags to this song. Remove some or move on!")
  }
  else if (current_user_tags.map(cur_tag => cur_tag.textContent.toLowerCase()).includes(tag.textContent.toLowerCase())) {
    alert("You have already added that tag, pick a different one!")
  }
  else {
    if (!restricted_tag_list.map(cur_tag => cur_tag.toLowerCase()).includes(tag.textContent.toLowerCase())) {
      if (used_custom_tag) {
        alert("You can only use one custom tag per song");
      } else addCustomTag(tag);
    } else addUserTag(tag);
  }
  console.log(current_user_tags)
}

function removeTag(tag) {
  if (!restricted_tag_list.map(cur_tag => cur_tag.toLowerCase()).includes(tag.parentElement.parentElement.textContent.toLowerCase())) used_custom_tag = false;
  current_user_tags.splice(current_user_tags.indexOf(tag.parentElement.parentElement), 1)
  tag.parentElement.parentElement.remove();
  tag.parentElement.remove();
  tag.remove();
}

function resetTagSelector() {
  current_tags.forEach(tag => {
    tag.remove();
  })
  current_tags = [];
  current_user_tags.forEach(tag => {
    tag.remove();
  })
  current_user_tags = [];
}

function importTagList() {
  if (current_tags.length == 0) {
    restricted_tag_list.forEach(default_tag => {
      tag = document.createElement("tagEntry")
      tag.innerHTML = '<tag><a onclick="selectTag(this)">' + default_tag + '</a></tag>';
      addable_tags.appendChild(tag);
      current_tags.push(tag);
    });
    //This part imports the song's custom tags (:
    //blahblah.getTags(song)
  }
}

function importUserTags() {
  //import user tags from music.js
  if (current_user_tags.length == 0) { //This should be == 0
    current_user_tags.forEach(user_tag => {
      if (!restricted_tag_list.map(cur_tag => cur_tag.toLowerCase()).includes(user_tag.textContent.toLowerCase()) && !used_custom_tag) {
        addCustomTag(user_tag);
      } else addUserTag(user_tag);
    })
  }
}

function addCustomTag(user_tag) {
  console.log("custom tag")
  var tag = document.createElement("tag");
  tag.className = "tag";
  tag.innerHTML = '<span id="tagRemover" class="removeTagButton"><i class="fas fa-times" onclick="removeTag(this)"></i></span>' + user_tag.textContent.replace('Add custom tag:', '');
  tag.style.backgroundColor = stringToColour(user_tag.textContent);
  tag_colors = tag.style.backgroundColor.substring(4, tag.style.backgroundColor.length - 1).split(', ');
  if ((tag_colors[0] * 0.299 + tag_colors[1] * 0.587 + tag_colors[2] * 0.114) > 160) {
    tag.style.color = "#000000"
  }
  else {
    tag.style.color = "#ffffff"
  }
  current_user_tags.push(tag);
  cur_tags_html.appendChild(tag);
  used_custom_tag = true;
}

async function addUserTag(user_tag) {
  console.log(user_tag.textContent)
  console.log(curr_track.src.substring(curr_track.src.indexOf('foldertree/') + 11))
  var tag = document.createElement("tag");
  tag.className = "tag";
  tag.innerHTML = '<span id="tagRemover" class="removeTagButton"><i class="fas fa-times" onclick="removeTag(this)"></i></span>' + user_tag.textContent;
  tag.style.backgroundColor = stringToColour(user_tag.textContent);
  tag_colors = tag.style.backgroundColor.substring(4, tag.style.backgroundColor.length - 1).split(', ');
  if ((tag_colors[0] * 0.299 + tag_colors[1] * 0.587 + tag_colors[2] * 0.114) > 160) {
    tag.style.color = "#000000"
  }
  else {
    tag.style.color = "#ffffff"
  }
  current_user_tags.push(tag);
  cur_tags_html.appendChild(tag);

  // Updates the database with the new tag. This should be changed in the future to a submit button = less requests.
  await fetch('/music/tags/' + curr_track.src.substring(curr_track.src.indexOf('foldertree/') + 11), {
    method: 'POST',
    body: JSON.stringify({
      "action": "vote",
      "tags": [user_tag.textContent.toLowerCase()]
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })
}

function tagSong() {
  importTagList();
  importUserTags();
  if (isTaggerOpen) {
    closeNav();
  }
  else {
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

function printHi() {
  alert("hi Alex (:")
}

function stringToColour(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
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

  if (getCookie('volume') != undefined) {
    volume_slider.value = getCookie('volume') * 100;
    curr_track.volume = getCookie('volume');
    console.log(getCookie('volume'))
  }
  else {
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

  await fetch('/music/defaulttags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      restricted_tag_list = data.map(entry => entry.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }));
    });

  console.log("Default tags: ")
  console.log(restricted_tag_list)


  //Loads the background
  loadNextBackground();

  //Loads the first song from track_list
  loadTrack(track_index);
})();