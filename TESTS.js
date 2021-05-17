const { IPDatabase } = require('./database');
let ipDB = new IPDatabase('./db/ips.json');
ipDB.addTaggedSongForIP('192.168.1.101', './Music/asdfjkl/ajdkl.mp3');

const { TagDatabase } = require('./database');
let tagDB = new TagDatabase('./db/tags.json');
tagDB.addTagToSong('./Music/folder/song.mp3', 'scary');

const { TagDatabase } = require('./database');
let tagDB = new TagDatabase('./db/tags.json');
tagDB.incrementTagOnSong('./Music/folder/song.mp3', 'scary');

const { IPDatabase } = require('./database');
let ipDB = new IPDatabase('./db/ips.json');
ip = "::ffff:127.0.0.1"
songPath = "Music/1080° Snowboarding/Dance!.mp3"
ipDB.addTaggedSongForIP(ip, songPath, ['why']);

const { TagDatabase } = require('./database');
let tagDB = new TagDatabase('./db/tags.json');
tagDB.addTagToSong('./Music/folder/song.mp3', ['scary', 'a']); 