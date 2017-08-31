# Plex Discord Bot

Update the `config\keys.js` file with your information:

```
module.exports = {
  'clientId'      : 'DISCORD_CLIENT_ID',
  'clientSecret'  : 'DISCORD_CLIENT_SECRET',
  'username'      : 'DISCORD_BOT_USERNAME',
  'botToken'      : 'DISCORD_BOT_TOKEN',
};
```

And update the `config\plex.js` file with your Plex information:
```
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

Install like any other Discord Bot.  This seems like a decent tutorial to get you going: https://www.youtube.com/watch?v=2YO96GFBSLw

Then, in terminal/cmd prompt, navigate to this repository's directory and run: `node index.js`

If you see any bugs or have any suggestions, use the issue tracker.  Thanks!

## To Do:
* [ ] make playlists
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
