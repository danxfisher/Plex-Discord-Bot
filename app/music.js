module.exports = function(client, keys) {
  // plex api module -----------------------------------------------------------
  var PlexAPI = require('plex-api');

  // plex client ---------------------------------------------------------------
  var plex = new PlexAPI({
    hostname: keys.plex.hostname,
    username: keys.plex.username,
    password: keys.plex.password,
    token: keys.plex.token,
    options: {
      identifier: keys.username,
      product: keys.plex.options.identifier,
      version: keys.plex.options.version,
      deviceName: keys.plex.options.deviceName,
      platform: keys.plex.options.platform,
      device: keys.plex.options.device
    }
  });

  // plex constants ------------------------------------------------------------
  const PLEX_PLAY_START = 'http://' + keys.plex.hostname + ':32400';
  const PLEX_PLAY_END = '?X-Plex-Token=' + keys.plex.token;

  // plex variables ------------------------------------------------------------
  var tracks = null;
  var plexQuery = null;
  var plexOffset = 0; // default offset of 0
  var plexPageSize = 10; // default result size of 10

  // dispatcher for playing audio ----------------------------------------------
  var dispatcher = null;
  var voiceChannel = null;

  // when bot is ready
  client.on('ready', function() {
    console.log('bot ready');
    console.log('logged in as: ' + client.user.tag);

    // make sure plex is connected properly
    plex.query('/').then(function(result) {
      console.log('name: ' + result.MediaContainer.friendlyName);
      console.log('v: ' + result.MediaContainer.version);
    }, function(err) {
      console.log('ya done fucked up');
    });
  });

  // when message is sent to discord
  client.on('message', function(message){
    var msg = message.content.toLowerCase();

    // !play : bot will join voice channel and play song
    if (msg.startsWith('!play ')) {
      plexQuery = msg.substring(msg.indexOf(' ')+1);

      // if song request exists
      if (plexQuery.length > 0) {
        plexOffset = 0; // reset paging
        findSong(plexQuery, plexOffset, plexPageSize, message);
      }
      else {
        message.reply('**Please enter a song title**');
      }
    }

    // !nextpage : get next page of songs if desired song not listed
    else if (msg.startsWith('!nextpage')) {
      findSong(plexQuery, plexOffset, plexPageSize, message);
    }

    // !playsong : play a song from the song list
    else if (msg.startsWith('!playsong')) {
      var songNumber = msg.substring(msg.indexOf(' ')+1);
      songNumber = parseInt(songNumber);
      songNumber = songNumber - 1;

      voiceChannel = message.member.voiceChannel;
      playSong(songNumber, tracks, message);
    }

    // !stop : stops song if one is playing
    else if (msg.startsWith('!stop')) {
      if (dispatcher) {
        dispatcher.end();
        dispatcher.on('end', () => {
          connection.disconnect();
          voiceChannel.leave();
        });
        message.reply('**Playback has been stopped.**');
      }
      else {
        message.reply('**Nothing currently playing.**');
      }
    }
  });

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

      voiceChannel.join().then(function(connection) {
        var url = PLEX_PLAY_START + key + PLEX_PLAY_END;

        dispatcher = connection.playArbitraryInput(url).on('end', () => {
          connection.disconnect();
          voiceChannel.leave();
        });
        dispatcher.setVolume(0.2);
      });

      message.reply('**♪ ♫ ♪ Playing: ' + artist + ' - ' + title + ' ♪ ♫ ♪**');
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
        voiceChannel = message.member.voiceChannel;
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
};
