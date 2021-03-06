'use strict';
var Article = require('./articleSchema.js');
var appleLohText = require('./appleLohText.js');
var appleLohThreshold = require('./appleLohThreshold.js');
var appleLohDetailedInfo = require('./appleLohFetch').appleLohDetailedInfo;

function getContextTask(url, context, slack, done) {
  appleLohDetailedInfo(url).then(function(data){
    Object.assign(context, {
      link: data[0].link,
      title: data[0].title,
      hits: data[0]._hits,
      thumb_url_medium: data[0].thumb_url_medium,
      author: data[0].author,
      slack: slack
    });
    done();
  }).catch(function(err){
    console.log("error from appleLohDetailedInfo: ", err);
    done(err);
  });
}

function findArticleAppleLohTask(context, done) {
  Article.findOne({link: context.link}, function (err, article){
    if (article === null) {
      context.article = new Article({
        title: context.title,
        link: context.link,
        hits: context.hits
      });
    } else {
      context.article = article;
    }
    done();
  }).catch(function(err){
    console.log("error from findOne: ", err);
    done(err);
  });
}

function notifySlackAppleLohTask(context, done) {
  let currentAppleLoh;
  let text = '';
  let aboveThreshold = false;
  let apiKey = process.env.API_KEY;
  let articleLink = 'http://dash.parsely.com/' + apiKey + '/find?url=' + context.link;
  let articleInfo = '<' + articleLink + '|' + context.title + '>' ;
  if (context.article.appleLohHistory) {
    currentAppleLoh = context.article.appleLohHistory;
  }
  text = appleLohText.appleLohText(context.hits, currentAppleLoh, articleInfo, context.article, context.timeEngage);
  if (text !== null) {
    appleLohThreshold.appleLohThreshold(context.link, text, context.slack, context.thumb_url_medium, context.author, context.hits);
  }
  done();
}

function saveArticleAppleLohTask(context, done) {
  context.article.save(function(err){
    if (err) {
      console.log('appleLoh article save failed.', err);
    } else {
      console.log('appleLoh article save success.');
    }
    done(err);
  });
}

  module.exports = {
    findArticleAppleLohTask: findArticleAppleLohTask,
    notifySlackAppleLohTask: notifySlackAppleLohTask,
    saveArticleAppleLohTask: saveArticleAppleLohTask,
    getContextTask: getContextTask
  };
