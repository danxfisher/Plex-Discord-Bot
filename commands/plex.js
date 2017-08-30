// plex commands ---------------------------------------------------------------
var commands = {
  'test' : {
    usgae: '',
    description: 'test plex at bot start up to make sure everything is working',
    process: function() {
      plex.query('/').then(function(result) {
        console.log('name: ' + result.MediaContainer.friendlyName);
        console.log('v: ' + result.MediaContainer.version);
      }, function(err) {
        console.log('ya done fucked up');
      });
    }
  },
  'play' : {
    usage: '',
    description: 'bot will join voice channel and play song if one song available.  if more than one, bot will return a list to choose from',
    process: function(client, message, query) {
      // if song request exists
      if (query.length > 0) {
        plexOffset = 0; // reset paging
        findSong(query, plexOffset, plexPageSize, message);
      }
      else {
        message.reply('**Please enter a song title**');
      }
    }
  },
  'nextpage' : {
    usage: '',
    description: 'get next page of songs if desired song not listed',
    process: function(client, message, query) {
      findSong(query, plexOffset, plexPageSize, message);
    }
  },
  'playsong' : {
    usage: '',
    description: 'play a song from the generated song list',
    process: function(client, message, query) {
      var songNumber = query;
      songNumber = parseInt(songNumber);
      songNumber = songNumber - 1;

      playSong(songNumber, tracks, message);
    }
  },
  'stop' : {
    usage: '',
    description: 'stops song if one is playing',
    process: function(client, message) {
      if (isPlaying) {
        dispatcher.end();
        dispatcher.on('end', () => {
          stopSong();
        });

        message.reply('**Playback has been stopped.**');
      }
      else {
        message.reply('**Nothing currently playing.**');
      }
    }
  },
};

// plex api module -----------------------------------------------------------
var PlexAPI = require('plex-api');

// plex config ---------------------------------------------------------------
var plexConfig = require('../config/plex');

// plex commands -------------------------------------------------------------
var plexCommands = require('../commands/plex');

// plex client ---------------------------------------------------------------
var plex = new PlexAPI({
  hostname: plexConfig.hostname,
  username: plexConfig.username,
  password: plexConfig.password,
  token: plexConfig.token,
  options: {
    identifier: 'PlexBot',
    product: plexConfig.options.identifier,
    version: plexConfig.options.version,
    deviceName: plexConfig.options.deviceName,
    platform: plexConfig.options.platform,
    device: plexConfig.options.device
  }
});

// plex constants ------------------------------------------------------------
const PLEX_PLAY_START = 'http://' + plexConfig.hostname + ':32400';
const PLEX_PLAY_END = '?X-Plex-Token=' + plexConfig.token;

// plex variables ------------------------------------------------------------
var tracks = null;
var plexQuery = null;
var plexOffset = 0; // default offset of 0
var plexPageSize = 10; // default result size of 10
var isPlaying = false;

// plex vars for playing audio -----------------------------------------------
var dispatcher = null;
var voiceChannel = null;
var conn = null;

// play song when provided with index number, track, and message
function playSong(songNumber, tracks, message) {
  if (songNumber > -1){
    var key = tracks[songNumber].Media[0].Part[0].key;
    var artist = '';
    var title = tracks[songNumber].title;
    if ('originalTitle' in tracks[songNumber]) {
      artist = tracks[songNumber].originalTitle;
    }
    else {
      artist = tracks[songNumber].grandparentTitle;
    }

    voiceChannel = message.member.voiceChannel;

    if (voiceChannel) {
      voiceChannel.join().then(function(connection) {
        conn = connection;
        var url = PLEX_PLAY_START + key + PLEX_PLAY_END;

        isPlaying = true;

        dispatcher = connection.playArbitraryInput(url).on('end', () => {
          stopSong();
        });
        dispatcher.setVolume(0.2);
      });

      message.reply('**♪ ♫ ♪ Playing: ' + artist + ' - ' + title + ' ♪ ♫ ♪**');
    }
    else {
      message.reply('**Please join a voice channel first before requesting a song.**')
    }
  }
  else {
    message.reply('**Stop trying to break me.**');
  }
}

// find song when provided with query string, offset, pagesize, and message
function findSong(plexQuery, offset, pageSize, message) {
  plex.query('/search/?type=10&query=' + plexQuery + '&X-Plex-Container-Start=' + offset + '&X-Plex-Container-Size=' + pageSize).then(function(res) {
    tracks = res.MediaContainer.Metadata;

    var resultSize = res.MediaContainer.size;
    plexOffset = plexOffset + resultSize; // set paging
    var messageLines = '\n';
    var artist = '';

    if (resultSize == 1 && offset == 0) {
      songKey = 0;
      // play song
      playSong(songKey, tracks, message);
    }
    else if (resultSize > 1) {
      for (var t = 0; t < tracks.length; t++) {
        if ('originalTitle' in tracks[t]) {
          artist = tracks[t].originalTitle;
        }
        else {
          artist = tracks[t].grandparentTitle;
        }
        messageLines += (t+1) + ' - ' + artist + ' - ' + tracks[t].title + '\n';
      }
      messageLines += '\n**Use !playsong (number) to play your song.**';
      messageLines += '\n**Use !nextpage if the song you want isn\'t listed**';
      message.reply(messageLines);
    }
    else {
      message.reply('** I can\'t find a song with that title.**');
    }
  }, function (err) {
    console.log('narp');
  });
}

// stop a song from playing
function stopSong() {
  conn.disconnect();
  voiceChannel.leave();
  isPlaying = false;
}

module.exports = commands;
