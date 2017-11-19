var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');
var querystring = require('querystring');

var client_id = '66c3beba677040d3bfa0eb1e607bc5b9';
var client_secret = '99e3ac371d1d4b03a5d742cb3939dc1b';
var redirect_uri = 'https://musicscapes.herokuapp.com/spotifycallback';
var stateKey = 'spotify_auth_state';

var spotifyApi = new SpotifyWebApi({
    clientId : client_id,
    clientSecret : client_secret,
    redirectUri : redirect_uri
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'musicScape' });
});

router.get('/musicScape', function(req, res, next) {

    // this is an JSON obj that contains the avg of the song features
    var obj = req.session.obj;
    //(obj);

    // this is the time difference between the first song and the last played song
    var landscapeSize = req.session.timeDiff;

    var user = req.session.user.body;

    res.render('visualisation', { title: 'musicScape',  d: obj, t: landscapeSize, u: user});

});

router.get('/spotifycallback', function(req, res, next) {

    spotifyApi.authorizationCodeGrant(req.query.code).then(function (data) {
        spotifyApi.setAccessToken(data.body.access_token);
        spotifyApi.setRefreshToken(data.body.refresh_token);
        return spotifyApi.getMe()

    }).then(function (data) {

        spotifyApi.getMyRecentlyPlayedTracks({limit: 50}).then(function (data) {
            var arr =[];
            var songIDs = [];

            data.body.items.forEach(function (p) {
                var obj = {
                    id: p.track.id,
                    played_at: p.played_at,
                    name: p.track.name
                };

                arr.push(obj);
                songIDs.push(p.track.id);

            });

            //console.log(arr);

            //calculating the time difference

            var startTime = Date.parse(arr[arr.length-1].played_at);
            var endTime = Date.parse(arr[0].played_at);
            //we also convert into hours
            var timeDif = (endTime - startTime)/(1000*60*60);

            //console.log('here is the timedif ' + timeDif);

            if(timeDif < 10){
                req.session.timeDiff = 0;
                console.log('timeDIff' + 0)
            }

            else if (timeDif < 10 && timeDif > 18){
                req.session.timeDiff = 1;
                console.log('timeDIff' + 1)
            }

            else {
                req.session.timeDiff = 2;
                console.log('timeDIff' + 2)
            }


            spotifyApi.getAudioFeaturesForTracks(songIDs).then(function (data) {
                //
                // console.log(data.body.audio_features[0]);

                var danceability = 0;
                var key = [];
                var loudness = 0;
                var valence = 0;
                var tempo = 0;
                var mode = 0;
                var energy = 0;
                var speechiness = 0;
                var acousticness = 0;
                var instrumentalness = 0;
                var liveness = 0;

                data.body.audio_features.forEach(function (p1, p2, p3) {
                    danceability += p1.danceability;
                    key.push(p1.key);
                    loudness += p1.loudness;
                    valence += p1.valence;
                    tempo += p1.tempo;
                    mode += p1.mode;
                    energy += p1.energy;
                    speechiness += p1.speechiness;
                    acousticness += p1.acousticness;
                    instrumentalness += p1.instrumentalness;
                    liveness += p1.liveness;
                });
//console.log('here is the freq' + frequent(key));
                var obj = {
                    danceability: danceability/data.body.audio_features.length,
                    key: frequent(key),
                    loudness: loudness/data.body.audio_features.length,
                    valence: valence/data.body.audio_features.length,
                    tempo: tempo/data.body.audio_features.length,
                    mode: Math.round(mode/data.body.audio_features.length),
                    energy: energy/data.body.audio_features.length,
                    speechiness: speechiness/data.body.audio_features.length,
                    acousticness: acousticness/data.body.audio_features.length,
                    instrumentalness: instrumentalness/data.body.audio_features.length,
                    liveness: liveness/data.body.audio_features.length
                };

                //console.log(obj);
                req.session.obj = obj;
                res.redirect('/musicScape');

            });

        });
        console.log(data); //personal data
        req.session.user = data;
    });

});

router.get('/login', function(req, res, next) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    // your application requests authorization
    var scope = 'user-read-private user-read-email user-library-read user-follow-read user-top-read user-read-recently-played';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));

});

 function generateRandomString (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

function frequent(number){
    //var count = 0;
    //var sortedNumber = number.sort();
    var start = number[0], item;
    for(var i = 0 ;  i < number.length; i++){
        if(start === number[i] || number[i] === number[i+1]){
            item = number[i]
        }
    }
    return item

}

module.exports = router;
