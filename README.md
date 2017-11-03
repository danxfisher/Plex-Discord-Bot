# Plex Discord Bot

## Installation

1. Install Node.js: https://nodejs.org/
2. If using Windows, I generally install Cmder as a console emulator to avoid issues: http://cmder.net/
3. Clone the repo or download a zip and unpackage it.
4. Navigate to the root folder and in the console, type `npm install`
    * You should see packages beginning to install
5. Once this is complete, go here: https://discordapp.com/developers/applications/me
    1. Log in or create an account
    2. Click **New App**
    3. Fill in App Name and anything else you'd like to include
    4. Click **Create App**
        * This will provide you with your Client ID and Client Secret
    5. Click **Create Bot User**
        * This will provide you with your bot Username and Token
6. Take all of the information from the page and enter it into the `config/keys.js` file, replacing the placeholders.
7. Navigate to the `config/plex.js` file and replace the placeholders with your Plex Server information
    1. To get your token, following the instructions here: https://support.plex.tv/hc/en-us/articles/204059436-Finding-an-authentication-token-X-Plex-Token
    2. To get your machineId or "machineIdentifier", follow the instructions here: https://support.plex.tv/hc/en-us/articles/201638786-Plex-Media-Server-URL-Commands
        * In the first example under "Base Server Capabilities", you can see the information returned when you type `http://[PMS_IP_Address]:32400/?X-Plex-Token=YourTokenGoesHere` into your address bar of a web browser.  Copy everything between the quotes for the parameter "machineIdentifier" and paste it into the "machineId" property in `config/plex.js`
    3. The identifier, product, version, and deviceName can be anything you want
8. Once you have the configs set up correctly, you'll need to authorize your bot on a server you have administrative access to.  For documentation, you can read: https://discordapp.com/developers/docs/topics/oauth2#bots.  The steps are as follows:
    1. Go to `https://discordapp.com/api/oauth2/authorize?client_id=[CLIENT_ID]&scope=bot&permissions=1` where [CLIENT_ID] is the Discord App Client ID
    2. Select **Add a bot to a server** and select the server to add it to
    3. Click **Authorize**
    4. You should now see your bot in your server listed as *Offline*
9. To bring your bot *Online*, navigate to the root of the app (where `index.js` is located) and in your console, type `node index.js`
    * This will start your server.  The console will need to be running for the bot to run.

If I am missing any steps, feel free to reach out or open  an issue/bug in the Issues for this repository.

***

## Usage

1. Join a Discord voice channel.
2. Upon playing a song, the bot will join your channel and play your desired song.

***

## Commands

* `!plexTest` : a test to see make sure your Plex server is connected properly
* `!clearqueue` : clears all songs in queue
* `!nextpage` : get next page of songs if desired song is not listed
* `!pause` : pauses current song if one is playing
* `!play <song title or artist>` : bot will join voice channel and play song if one song available.  if more than one, bot will return a list to choose from
* `!playsong <song number>` : plays a song from the generated song list
* `!removesong <song queue number>` : removes song by index from the song queue
* `!resume` : resumes song if previously paused
* `!skip` : skips the current song if one is playing and plays the next song in queue if it exists
* `!stop` : stops song if one is playing
* `!viewqueue` : displays current song queue

***
## Customization

Update the `config\keys.js` file with your information:

```javascript
module.exports = {
  'clientId'      : 'DISCORD_CLIENT_ID',
  'clientSecret'  : 'DISCORD_CLIENT_SECRET',
  'username'      : 'DISCORD_BOT_USERNAME',
  'botToken'      : 'DISCORD_BOT_TOKEN',
};
```

And update the `config\plex.js` file with your Plex information:

```javascript
module.exports= {
  'hostname'    : 'PLEX_LOCAL_IP',
  'port'        : 'PLEX_LOCAL_PORT'
  'username'    : 'PLEX_USERNAME',
  'password'    : 'PLEX_PASSWORD',
  'token'       : 'PLEX_TOKEN',
  'machineId'   : 'PLEX_MACHINEID',
  'managedUser' : 'PLEX_MANAGED_USERNAME',
  'options'     : {
    'identifier': 'APP_IDENTIFIER',
    'product'   : 'APP_PRODUCT_NAME',
    'version'   : 'APP_VERSION_NUMBER',
    'deviceName': 'APP_DEVICE_NAME',
    'platform'  : 'Discord',
    'device'    : 'Discord'
  }
};
```

If you see any bugs or have any suggestions, use the issue tracker.  Thanks!

***

## To Do:
* [ ] Make !nextpage count continue to increase rather than restarting each page
* [ ] move to next gen javascript w/babel
* [ ] use uri/headers for plex.query as shown here:

```
return api.query({ uri: '/', extraHeaders: { 'X-TEST-HEADER': 'X-TEST-HEADER-VAL' } }).then(result => {
    expect(result).to.be.an('object');
    nockServer.done();
});
```

## Completed:
* [x] handle case where user types `!play` when another song is playing
* [x] make code look less shitty
* [x] fix !stop again
* [x] make playlists
