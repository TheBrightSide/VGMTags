//references html
let tag_count = document.querySelector(".tag-count");
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
let sidenav = document.querySelector(".sidenav");
let tag_track = document.querySelector(".tag-track");

//related to player
let track_index = 0; // Current index in the queue. Allows user to go to previous song.
let isPlaying = false; // True if the player is playing
let isTaggerOpen = false; // True if the tagger menu is open
let updateTimer; // Updates the seek slider
let track_list = []; // Songs in queue
let cache = []; // The unchanging cache
let full_albums = []; // The changing cache

//related to background
let backgrounds = [];
let background_index = 0;

//related to tags
let restricted_tag_list = [
  "Relaxing",
  "Summer",
  "Fall",
  "Winter",
  "Spring",
  "Rock",
  "Electronic",
]; // default tag list
let current_tags = [];
let current_user_tags = [];
let addable_tags = document.getElementById("tagSelections");
let cur_tags_html = document.getElementById("curUserTags");
let top_song_tags = document.getElementById("top-song-tags");
let used_custom_tag = false;

// Create new audio element
let curr_track = document.createElement("audio");
curr_track.setAttribute("crossOrigin", "anonymous");

// Listens for clicks
document.body.addEventListener("mousedown", function (event) {
  // Detects clicks outside of sidenav
  if (!sidenav.contains(event.target) && event.target.tagName == "DIV") {
    closeNav();
  }
});

//keyboard shortcuts
document.body.addEventListener("keydown", function (event) {
  if(document.getElementById("tagSearchFilter") != document.activeElement) {
    switch (event.key) {
      case "ArrowDown":
        loadPrevBackground();
        break;
      case "ArrowUp":
        loadNextBackground();
        break;
      case "ArrowRight":
        nextTrack();
        break;
      case "ArrowLeft":
        prevTrack();
        break;
      case " ":
        playpauseTrack();
        break;
      case "=":
        volume_slider.value = parseInt(volume_slider.value) + 1
        setVolume()
        break;
      case "-":
        volume_slider.value = parseInt(volume_slider.value) - 1
        setVolume()
        break;
      case "t":
        tagSong();
        document.getElementById("tagSearchFilter").blur()
        document.getElementById("tagSearchFilter").value = ''
        setTimeout(() => {
          document.getElementById("tagSearchFilter").focus()
        }, .5);
        break;
      case "f":
        heartSong();
    }
  }
  else if (document.getElementById("tagSearchFilter") == document.activeElement){
    if(event.key == "Escape"){
      tagSong()
      document.getElementById("tagSearchFilter").blur()
      document.body.focus()
    }
    if(event.key == "Enter" && document.getElementById("tagSearchFilter").value != ""){
      results = Array.from(document.getElementById("tagSelections").getElementsByTagName("tag")).filter((bruh) => bruh.style.display!="none")
      custom = Array.from(document.getElementById("tagSelections").getElementsByTagName("custom")).filter((bruh) => bruh.innerText!="")
      if (results.length > 0){
        selectTag(results[0])
      }
      else{
        selectTag(custom[0])
      }
      document.getElementById("tagSearchFilter").value = ""
    }
  }
});

function displayTopTag(tagname, votes) {
  var tag = document.createElement("song-tag");
  tag.innerHTML =
    "<table><tr><td><div class=song-tag>" +
    tagname +
    "</div></td><td><div class=votes>" +
    votes +
    "</div></td></tr></table>";
  var tagvote = tag.children[0].children[0].children[0].children[1].children[0];
  var tagdiv = tag.children[0].children[0].children[0].children[0].children[0];
  tag.setAttribute("votes", votes);
  tag.onclick = async function () {
    // await tagSong();
    selectTag(tagdiv);
  };
  tagdiv.onmouseover = function () {
    // tagvote.style.display = "inline-block"
    tagvote.style.opacity = 1;
  };
  tagdiv.onmouseout = function () {
    // tagvote.style.display = "none"
    tagvote.style.opacity = 0;
  };
  tag.style.backgroundColor = stringToColour(tagname);

  tagdiv.style.backgroundColor = stringToColour(tagname);
  tag_colors = tagdiv.style.backgroundColor
    .substring(4, tagdiv.style.backgroundColor.length - 1)
    .split(", ");
  if (
    tag_colors[0] * 0.299 + tag_colors[1] * 0.587 + tag_colors[2] * 0.114 >
    160
  ) {
    tagdiv.style.color = "#000000";
  } else {
    tagdiv.style.color = "#ffffff";
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
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function loadTrack(track_index) {
  clearInterval(updateTimer);
  resetValues();
  importTopTags();
  resetTagSelector();
  if (isTaggerOpen) {
    importTagList();
    importUserTags();
    if (document.getElementById("tagSearchFilter").value.length != 0)
      searchFilter();
  }

  // Removes heart from song
  heart_button.innerHTML = '<i class="far fa-heart"></i>'

  // Load a new track
  curr_track.src = track_list[track_index].path;
  curr_track.load();

  // Update details of the track
  track_art.style.backgroundImage =
    "url('" + track_list[track_index].image + "')";
  track_name.textContent = track_list[track_index].title;
  track_artist.textContent = track_list[track_index].album;

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
  playpause_btn.innerHTML = '<i class="fas fa-play-circle fa-5x"></i>';
}

// Fetches a newSong. Yes I know it is messy :/
async function loadNextSong() {
  if (track_list.length - 1 == track_index) {
    selected_song = null;

    // Selects a song that has not already been played
    while (
      selected_song == null ||
      track_list.some((song) => song.title === selected_song.title)
    ) {
      var selected_album =
        full_albums[Math.floor(Math.random() * full_albums.length)];
      selected_song =
        selected_album.songs[
          Math.floor(Math.random() * selected_album.songs.length)
        ];
    }
    track_list.push(selected_song);
  }
}

async function nextTrack() {
  await loadNextSong();
  if (track_index < track_list.length - 1) {
    
    track_index += 1;
  } else {
    track_index = 0;
  }
  loadTrack(track_index);
  playTrack();
}

async function prevTrack() {
  await (async function () {
    if (track_index > 0) track_index -= 1;
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
  document.cookie = "volume=" + volume_slider.value / 100;
}

function seekUpdate() {
  let seekPosition = 0;

  // Check if the current track duration is a legible number
  if (!isNaN(curr_track.duration)) {
    seekPosition = curr_track.currentTime * (100 / curr_track.duration);
    seek_slider.value = seekPosition;

    // Calculate the time left and the total duration
    let currentMinutes = Math.floor(curr_track.currentTime / 60);
    let currentSeconds = Math.floor(
      curr_track.currentTime - currentMinutes * 60
    );
    let durationMinutes = Math.floor(curr_track.duration / 60);
    let durationSeconds = Math.floor(
      curr_track.duration - durationMinutes * 60
    );

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
  if (heart_button.innerHTML == '<i class="far fa-heart" aria-hidden="true"></i>') heart_button.innerHTML = '<i class="fas fa-heart"></i>';
  else heart_button.innerHTML = '<i class="far fa-heart"></i>';
}

// TAGGING SYSTEM

function searchFilter() {
  // Declare variables
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("tagSearchFilter");
  filter = input.value.toUpperCase();
  ul = document.getElementById("tagSelections");
  li = ul.getElementsByTagName("tag");

  // Loop through all list items, and hide those who don't match the search query
  var hidden_items = 0;
  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      if (document.getElementById("addCustomTag")) {
        if (
          txtValue.replace("Add custom tag:", "").toUpperCase() ==
          input.value.toUpperCase().substring(0, input.value.length - 1)
        ) {
          continue;
        }
      }
      li[i].style.display = "none";
      hidden_items++;
    }
  }

  if (hidden_items > 0) {
    if (document.getElementById("addCustomTag")) {
      document.getElementById("addCustomTag").innerHTML =
        '<a onclick="selectTag(this)">Add custom tag:<br><br>' +
        input.value +
        "</a>";
    } else {
      customAdd = document.createElement("custom");
      customAdd.innerHTML =
        '<bruh id="addCustomTag"><a onclick="selectTag(this)">Add custom tag:<br><br>' +
        input.value +
        "</a></bruh>";
      document.getElementById("tagSelections").appendChild(customAdd);
    }
  } 
  else {
    Array.from(ul.getElementsByTagName("custom")).forEach(tag => {
      tag.remove()
    });
  }
}

function selectTag(tag) {
  if (current_user_tags.length >= 5) {
    alert("You can't add any more tags to this song. Remove some or move on!");
  } else if (tag.textContent.replace("Add custom tag:", "").length > 18) {
    alert("This tag is too long!");
  } else if (
    current_user_tags
      .map((cur_tag) => cur_tag.textContent.toLowerCase())
      .includes(tag.textContent.toLowerCase())
  ) {
    alert("You have already added that tag, pick a different one!");
  } else {
    if (
      !restricted_tag_list
        .map((cur_tag) => cur_tag.toLowerCase())
        .includes(tag.textContent.toLowerCase())
    ) {
      if (used_custom_tag) {
        alert("You can only use one custom tag per song");
      } else {
        addToTagDB(addHTMLTag(tag));
        used_custom_tag = true;
      }
    } else {
      addToTagDB(addHTMLTag(tag));
    }
  }
}

function addHTMLTag(user_tag) {
  var tag = document.createElement("tag");
  tag.className = "tag";
  tag.innerHTML =
    '<span id="tagRemover" class="removeTagButton"><i class="fas fa-times" onclick="removeTag(this)"></i></span>' +
    user_tag.textContent
      .replace("Add custom tag:", "")
      .replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
  tag.style.backgroundColor = stringToColour(tag.textContent);
  tag_colors = tag.style.backgroundColor
    .substring(4, tag.style.backgroundColor.length - 1)
    .split(", ");
  if (
    tag_colors[0] * 0.299 + tag_colors[1] * 0.587 + tag_colors[2] * 0.114 >
    160
  ) {
    tag.style.color = "#000000";
  } else {
    tag.style.color = "#ffffff";
  }
  current_user_tags.push(tag);
  cur_tags_html.appendChild(tag);
  return tag;
}

async function addToTagDB(html_tag) {
  await fetch("/music/tags/" + curr_track.src.split("foldertree/")[1], {
    method: "POST",
    body: JSON.stringify({
      action: "vote",
      tags: [html_tag.textContent.toLowerCase()],
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.rejected.length > 0) {
        html_tag.remove();
        alert("You have already added that tag, pick a different one!");
      }
    });
  importTopTags();
}

async function removeTag(tag) {
  if (
    !restricted_tag_list
      .map((cur_tag) => cur_tag.toLowerCase())
      .includes(tag.parentElement.parentElement.textContent.toLowerCase())
  )
    used_custom_tag = false;
  current_user_tags.splice(
    current_user_tags.indexOf(tag.parentElement.parentElement),
    1
  );

  await fetch(
    "/music/tags/" +
      curr_track.src.substring(curr_track.src.indexOf("foldertree/") + 11),
    {
      method: "POST",
      body: JSON.stringify({
        action: "removevote",
        tags: [tag.parentElement.parentElement.textContent.toLowerCase()],
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    });

  tag.parentElement.parentElement.remove(); //removes the tag from the tag selector

  importTopTags(); //refreshes the song's toptags
}

function resetTagSelector() {
  current_tags.forEach((tag) => {
    tag.remove();
  });
  current_tags = [];
  current_user_tags.forEach((tag) => {
    tag.remove();
  });
  current_user_tags = [];
  used_custom_tag = false;
}

async function importTopTags() {
  //removes current top-tag elements
  Array.from(top_song_tags.children).forEach((tag) => {
    tag.remove();
  });

  await fetch(
    "/music/tags/" + track_list[track_index].path.split("foldertree/")[1],
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      var items = [];

      //puts the dictionary into an array (votes of 1 or greater)
      for (const [tag, votes] of Object.entries(data)) {
        if (votes != 0) items.push([tag, votes]);
      }

      //sorts the array by vote; high to low
      items.sort(function (first, second) {
        return second[1] - first[1];
      });

      //for each item in the array, a top-tag html element is created to display beside the album art
      items.forEach((tag) => {
        displayTopTag(
          tag[0].replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          }),
          tag[1]
        );
      });
    });

  //info above album art
  if (top_song_tags.childElementCount <= 0)
    tag_count.textContent = "Be the first to tag this song!";
  else if (top_song_tags.childElementCount == 1)
    tag_count.textContent =
      "This song has " + top_song_tags.childElementCount + " tag";
  else
    tag_count.textContent =
      "This song has " + top_song_tags.childElementCount + " tags";
}

function importTagList() {
  if (current_tags.length == 0) {
    restricted_tag_list.forEach((default_tag) => {
      tag = document.createElement("tagEntry");
      tag.innerHTML =
        '<tag><a onclick="selectTag(this)">' + default_tag + "</a></tag>";
      addable_tags.appendChild(tag);
      current_tags.push(tag);
    });
  }
}

async function importUserTags() {
  //import ip tags from music.js
  if (current_user_tags.length == 0) {
    //This should be == 0
    var received_tags;

    await fetch(
      "/music/usertags/" + track_list[track_index].path.split("foldertree/")[1],
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        received_tags = data.map((entry) =>
          entry.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          })
        );
      });

    received_tags.forEach((user_tag) => {
      if (
        !restricted_tag_list
          .map((tag) => tag.toLowerCase())
          .includes(user_tag.toLowerCase()) &&
        !used_custom_tag
      ) {
        // Same as in addCustomTag
        var tag = document.createElement("tag");
        tag.className = "tag";
        tag.innerHTML =
          '<span id="tagRemover" class="removeTagButton"><i class="fas fa-times" onclick="removeTag(this)"></i></span>' +
          user_tag;
        tag.style.backgroundColor = stringToColour(user_tag);
        tag_colors = tag.style.backgroundColor
          .substring(4, tag.style.backgroundColor.length - 1)
          .split(", ");
        if (
          tag_colors[0] * 0.299 +
            tag_colors[1] * 0.587 +
            tag_colors[2] * 0.114 >
          160
        ) {
          tag.style.color = "#000000";
        } else {
          tag.style.color = "#ffffff";
        }
        current_user_tags.push(tag);
        cur_tags_html.appendChild(tag);
        used_custom_tag = true;
      } else {
        // Same as in addUserTag
        var tag = document.createElement("tag");
        tag.className = "tag";
        tag.innerHTML =
          '<span id="tagRemover" class="removeTagButton"><i class="fas fa-times" onclick="removeTag(this)"></i></span>' +
          user_tag;
        tag.style.backgroundColor = stringToColour(user_tag);
        tag_colors = tag.style.backgroundColor
          .substring(4, tag.style.backgroundColor.length - 1)
          .split(", ");
        if (
          tag_colors[0] * 0.299 +
            tag_colors[1] * 0.587 +
            tag_colors[2] * 0.114 >
          160
        ) {
          tag.style.color = "#000000";
        } else {
          tag.style.color = "#ffffff";
        }
        current_user_tags.push(tag);
        cur_tags_html.appendChild(tag);
      }
    });
  }
}

function tagSong() {
  importTagList();
  importUserTags();
  if (isTaggerOpen) {
    closeNav();
  } else {
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

function stringToColour(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = "#";
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xff;
    colour += ("00" + value.toString(16)).substr(-2);
  }
  return colour;
}

// Load the random background
async function loadNextBackground() {
  if (background_index != backgrounds.length - 1) {
    background_index += 1;
    loadBackground(backgrounds[background_index]);
  }
  else{
    background_index = 0;
    loadBackground(backgrounds[background_index]);
  }
}

function loadPrevBackground() {
  if (background_index != 0) {
    background_index -= 1;
    loadBackground(backgrounds[background_index]);
  } else {
    background_index = backgrounds.length - 1;
    loadBackground(backgrounds[background_index]);
  }
}

function loadBackground(background) {
  document.body.style.background =
    "linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('" +
    background +
    "')";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
}

(async () => {
  await fetch("/music/allmusic", {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      data.forEach((album) => {
        album_songs = [];
        album["songs"].forEach((song) => {
          album_songs.push(
            new Song(
              song["path"],
              album["title"],
              song["title"],
              album["thumbnail"]
            )
          );
        });
        cache.push(new Album(album["title"], album_songs, album["path"]));
      });
    });
  
  await fetch("/allbg", {
    method: "GET",
  })
  .then((response)=>response.json())
  .then((data)=>{
    data.forEach((background)=>{
      backgrounds.push(`./Backgrounds/${background}`)
    });
    for(let i = backgrounds.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * i)
      const temp = backgrounds[i]
      backgrounds[i] = backgrounds[j]
      backgrounds[j] = temp
    }
  });

  full_albums = cache;

  var selected_album =
    full_albums[Math.floor(Math.random() * full_albums.length)];
  var selected_song =
    selected_album.songs[
      Math.floor(Math.random() * selected_album.songs.length)
    ];
  track_list.push(selected_song);

  if (getCookie("volume") != undefined) {
    volume_slider.value = getCookie("volume") * 100;
    curr_track.volume = getCookie("volume");
  } else {
    volume_slider.value = 50;
    curr_track.volume = 0.5;
    document.cookie = "volume=.5";
  }

  await fetch("/music/defaulttags", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      restricted_tag_list = data.map((entry) =>
        entry.replace(/\w\S*/g, function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        })
      );
    });

  console.log("Default tags: ");
  console.log(restricted_tag_list);

  //Loads the background
  if (getCookie("background") != undefined) {
    loadBackground(getCookie("background"));
    backgrounds.push(getCookie("background"));
  } else loadNextBackground();

  //Loads the first song from track_list
  loadTrack(track_index);
})();
