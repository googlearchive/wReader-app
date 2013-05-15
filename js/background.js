var bg = angular.module('wReader.bg', []),
    FEED_URL = 'http://blog.chromium.org/feeds/posts/default?alt=json';

bg.run(function(refreshFeeds, feedStore) {
  chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('../index.html', {
      width: 900,
      height: 700,
      left: 100,
      top: 100
    });
  });

  chrome.runtime.onMessage.addListener(function(request) {
    if (request == 'refreshFeeds') {
      refreshFeeds().then(notifyApp);
    }
  });

  // sync data changes that happened while we were offline
  feedStore.sync().then(function() {
    // listen for changes in the cloud and sync them into local store
    feedStore.keepInSync();

    refreshFeeds();
  });

  chrome.alarms.create('fetchFeeds', {periodInMinutes: 5});
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name == 'refreshFeeds') refreshFeeds().then(notifyApp);
  });

  function notifyApp() {
    chrome.extension.sendMessage('feedsUpdated');
  }
});


/**
 * Fetches a feed and returns a promise which will be resolved with massaged feed data.
 *
 * @param {string} feedUrl
 * @returns {Promise} Promise to be resolved with feed object.
 */
bg.factory('fetchFeed', function($http) {
  return function fetchFeed(feedUrl) {
    function getLink(links, rel) {
      for (var i = 0, link; link = links[i]; ++i) {
        if (link.rel === rel) {
          return link.href;
        }
      }
      return null;
    }

    return $http.get(feedUrl).then(function(response) {
      var feed = {
        title: response.data.feed.title.$t,
        url: getLink(response.data.feed.link, 'alternate'),
        entries: {}
      };

      response.data.feed.entry.forEach(function(entry) {
        feed.entries[entry.id.$t] = {
          id: entry.id.$t,
          title: entry.title.$t,
          content: entry.content.$t,
          author: entry.author[0].name.$t,
          url: getLink(entry.link, 'alternate'),
          date: entry.published.$t,
          read: false,
          starred: false
        }
      });

      return feed;
    });
  }
});


/**
 * Fetches the hardcoded feed and updates the feed store with the new content.
 */
bg.factory('refreshFeeds', function(fetchFeed, feedStore) {
  return function() {
    return fetchFeed(FEED_URL).then(function(feed) {
      return feedStore.updateFeed(feed);
    });
  };
});


// bootstrap the background page app
injector = angular.injector(['wReader.bg', 'wReader.store', 'ng']);
