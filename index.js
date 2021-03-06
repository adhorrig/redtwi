var fs = require('fs');
var async = require('async');
var request = require('request');
var Twitter = require('twitter');
var CronJob = require('cron').CronJob;
var endPoint = "http://www.reddit.com/r/soccer/.json";

new CronJob('0 0 */2 * * *', function (){
  async.waterfall([
    function(callback) {
      request({method: "get",  url: endPoint}, function(err, resp, body){
        if (body.error){
          return console.error(body.error);
        } else {
          body = JSON.parse(body);
          callback(null, body);
        }
      });
    },
    function(tobj, callback) {
      var link = tobj.data.children[2].data.url;
      shortenUrl(link, function(url){
        link = url;
        var title = tobj.data.children[2].data.title;
        var id = tobj.data.children[2].data.id;
        var tweet = tweetBuilder(title, link);
        console.log(tweet);
        fs.readFile('id.txt', 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
          data = data.toString();
          if(data.indexOf(id) > -1){
            console.log('ID already exists');
          } else {
            fs.appendFile('id.txt', id, function(err){
              if(err){
                return console.log(err);
              }
              console.log("ID saved");
            });
          }
        });
        callback(null, tweet);
      });
    },
    function(post, callback) {
      var client = new Twitter({
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: ''
      });
      client.post('statuses/update', {status: post},  function(err, post, response){
        if(err){
          console.log(err);
        } else {
          console.log('Tweet posted');
        }
      });
      callback(null, 'done');
    }
  ], function (err) {
    if(err){
      console.log('Error when posting from Reddit to Twitter.', err);
    }
  });
}, null, true, 'Europe/Dublin');

function tweetBuilder(title, url){
  var len = (title+ ' ' + url).length;
  if(len < 130){
    var tweet = title+ ': ' + url;
     return tweet;
  } else {
    title = title.substring(0, title.lastIndexOf(" "));
    return tweetBuilder(title, url);
  }
}

function shortenUrl(url, fn){
  var key = '';
  var endPoint = "https://www.googleapis.com/urlshortener/v1/url?key="+key;
  var data = {"longUrl": url}

  request({method: "post", url: endPoint,  body: data,  json: true}, function(err, resp, body){
    if (err){
      console.log(err);
    } else {
      url = body.id;
      fn(url);
    }
  });
}
