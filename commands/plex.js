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
const PLEX_PLAY_START = 'http://' + plexConfig.hostname + ':' + plexConfig.port;
const PLEX_PLAY_END = '?X-Plex-Token=' + plexConfig.token;

// plex variables ------------------------------------------------------------
var tracks = null;
var plexQuery = null;
var plexOffset = 0; // default offset of 0
var plexPageSize = 10; // default result size of 10
var isPlaying = false;
var isPaused = false;
var songQueue = []; // will be used for queueing songs

// plex vars for playing audio -----------------------------------------------
var dispatcher = null;
var voiceChannel = null;
var conn = null;

// plex functions ------------------------------------------------------------

// find song when provided with query string, offset, pagesize, and message
function findSong(query, offset, pageSize, message) {
  plex.query('/search/?type=10&query=' + query + '&X-Plex-Container-Start=' + offset + '&X-Plex-Container-Size=' + pageSize).then(function(res) {
    tracks = res.MediaContainer.Metadata;

    var resultSize = res.MediaContainer.size;
    plexQuery = query; // set query for !nextpage
    plexOffset = plexOffset + resultSize; // set paging

    var messageLines = '\n';
    var artist = '';

    if (resultSize == 1 && offset == 0) {
      songKey = 0;
      // add song to queue
      addToQueue(songKey, tracks, message);
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
      messageLines += '\n***!playsong (number)** to play your song.*';
      messageLines += '\n***!nextpage** if the song you want isn\'t listed*';
      message.reply(messageLines);
    }
    else {
      message.reply('** I can\'t find a song with that title.**');
    }
  }, function (err) {
    console.log('narp');
  });
}

// not sure if ill need this
function addToQueue(songNumber, tracks, message) {
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

    songQueue.push({'artist' : artist, 'title': title, 'key': key});
    if (songQueue.length > 1) {
      message.reply('You have added **' + artist + ' - ' + title + '** to the queue.\n\n***!viewqueue** to view the queue.*');
    }

    if (!isPlaying) {
      playSong(message);
    }

  }
  else {
    message.reply('**Stop trying to break me.**');
  }
}

// play song when provided with index number, track, and message
function playSong(message) {
  voiceChannel = message.member.voiceChannel;

  if (voiceChannel) {
    voiceChannel.join().then(function(connection) {
      conn = connection;
      var url = PLEX_PLAY_START + songQueue[0].key + PLEX_PLAY_END;

      isPlaying = true;

      dispatcher = connection.playArbitraryInput(url).on('end', () => {
        songQueue.shift();
        if (songQueue.length > 0) {
          playSong(message);
        }
        // no songs left in queue, continue with playback completetion events
        else {
          playbackCompletion(message);
        }
      });
      dispatcher.setVolume(0.2);
    });

    // probbaly just change this to channel alert, not reply
    var embedObj = {
      embed: {
        color: 4251856,
        fields:
        [
          {
            name: 'Artist',
            value: songQueue[0].artist,
            inline: true
          },
          {
            name: 'Title',
            value: songQueue[0].title,
            inline: true
          }
        ],
        footer: {
          text: songQueue.length + ' song(s) in the queue'
        },
      }
    };
    message.channel.send('**Now playing:**\n', embedObj);
    //message.channel.send('**♪ ♫ ♪ Playing: ' + songQueue[0].artist + ' - ' + songQueue[0].title + ' ♪ ♫ ♪**');
  }
  else {
    message.reply('**Please join a voice channel first before requesting a song.**')
  }
}

// run at end of songQueue / remove bot from voiceChannel
function playbackCompletion(message) {
  conn.disconnect();
  voiceChannel.leave();
  isPlaying = false;
}


// plex commands -------------------------------------------------------------
var commands = {
  'plexTest' : {
    usage: '',
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
  'clearqueue' : {
    usage: '',
    description: 'clears all songs in queue',
    process: function(client, message) {
      if (songQueue.length > 0) {
        songQueue = []; // remove all songs from queue

        message.reply('**The queue has been cleared.**');
      }
      else {
        message.reply('**There are no songs in the queue.**');
      }
    }
  },
  'nextpage' : {
    usage: '',
    description: 'get next page of songs if desired song not listed',
    process: function(client, message, query) {
      findSong(plexQuery, plexOffset, plexPageSize, message);
    }
  },
  'pause' : {
    usage: '',
    description: 'pauses current song if one is playing',
    process: function(client, message) {
      if (isPlaying) {
        dispatcher.pause(); // pause song
        isPaused = true;
        var embedObj = {
          embed: {
            color: 16424969,
            description: '**Playback has been paused.**',
          }
        };
        message.channel.send('**Update:**', embedObj);
      }
      else {
        message.reply('**Nothing currently playing.**');
      }
    }
  },
  'play' : {
    usage: '<song title or artist>',
    description: 'bot will join voice channel and play song if one song available.  if more than one, bot will return a list to choose from',
    process: function(client, message, query) {
      // if song request exists
      if (query.length > 0) {
        plexOffset = 0; // reset paging
        plexQuery = null; // reset query for !nextpage

        findSong(query, plexOffset, plexPageSize, message);
      }
      else {
        message.reply('**Please enter a song title**');
      }
    }
  },
  'playsong' : {
    usage: '<song number>',
    description: 'play a song from the generated song list',
    process: function(client, message, query) {
      var songNumber = query;
      songNumber = parseInt(songNumber);
      songNumber = songNumber - 1;

      addToQueue(songNumber, tracks, message);
    }
  },
  'removesong' : {
    usage: '<song queue number>',
    description: 'removes song by index from the song queue',
    process: function(client, message, query) {
      var songNumber = query;
      songNumber = parseInt(songNumber);
      songNumber = songNumber - 1;

      if (songQueue.length > 0 ) {
        if (songNumber > -1 && songNumber <= songQueue.length) {
          // remove by index (splice)
          var removedSong = songQueue.splice(songNumber, 1);
          message.reply('**You have removed ' + removedSong[0].artist + ' - ' + removedSong[0].title + ' from the queue.**');
          // message that it has been removed
        }
        else {
          message.reply('**Stop trying to break me.**');
        }
      }
      else {
        message.reply('**There are no songs in the queue.**');
      }
    }
  },
  'resume' : {
    usage: '',
    description: 'skips the current song if one is playing and plays the next song in queue if it exists',
    process: function(client, message) {
      if (isPaused) {

        dispatcher.resume(); // run dispatcher.end events in playSong
        var embedObj = {
          embed: {
            color: 4251856,
            description: '**Playback has been resumed.**',
          }
        };
        message.channel.send('**Update:**', embedObj);
      }
      else {
        message.reply('**Nothing is paused.**');
      }
    }
  },
  'skip' : {
    usage: '',
    description: 'skips the current song if one is playing and plays the next song in queue if it exists',
    process: function(client, message) {
      if (isPlaying) {
        message.channel.send(songQueue[0].artist + ' - ' + songQueue[0].title + ' has been **skipped.**');
        dispatcher.end(); // run dispatcher.end events in playSong
      }
      else {
        message.reply('**Nothing currently playing.**');
      }
    }
  },
  'stop' : {
    usage: '',
    description: 'stops song if one is playing',
    process: function(client, message) {
      if (isPlaying) {
        songQueue = []; // removes all songs from queue
        dispatcher.end(); // stop dispatcher from playing audio

        var embedObj = {
          embed: {
            color: 10813448,
            description: '**Playback has been stopped.**',
          }
        };
        message.channel.send('**Update:**', embedObj);
      }
      else {
        message.reply('**Nothing currently playing.**');
      }
    }
  },
  'viewqueue' : {
    usage: '',
    description: 'displays current song queue',
    process: function(client, message) {
      //var messageLines = '\n**Song Queue:**\n\n';

      var messageLines = '';

      if (songQueue.length > 0) {
        for (var t = 0; t < songQueue.length; t++) {
          messageLines += (t+1) + ' - ' + songQueue[t].artist + ' - ' + songQueue[t].title + '\n';
        }

        messageLines += '\n***!removesong (number)** to remove a song*';
        messageLines += '\n***!skip** to skip the current song*';

        var embedObj = {
          embed: {
            color: 2389639,
            description: messageLines,
          }
        };

        message.channel.send('\n**Song Queue:**\n\n', embedObj);
      }
      else {
        message.reply('**There are no songs in the queue.**');
      }
    }
  },
};

module.exports = commands;
