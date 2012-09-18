var storeModule = angular.module('wReader.store', []);

/**
 * Persistence service for all feeds data. Abstracts away all persistence operation on the local and cloud storage
 * and synchronization of data between the two.
 */
storeModule.factory('feedStore', function($q, $rootScope) {
  var stateStorage = chrome.storage.sync,
      contentStorage = chrome.storage.local,
      keepInSyncOn = false,
      syncInProgress = false;


  /**
   * @param storage chrome.storage
   * @return {Promise} Promise to be resolved with the feed object.
   */
  function getFeedsFrom(storage) {
    var deferred = $q.defer();

    storage.get('feeds', function(obj) {
      deferred.resolve(obj.feeds || {});
      if (!$rootScope.$$phase) $rootScope.$apply(); //flush evalAsyncQueue
    });

    return deferred.promise;
  }


  /**
   * @param feedContents Object representing feed contents
   * @param feedStates Object representing feed/entry read and starred states
   * @return {Promise} Promise to be resolved with syncing is finished.
   */
  function syncStorages(feedContents, feedStates) {
    var deferred = $q.defer(),
        feedContent, feedState, feedUrl, entryState;

    for (feedUrl in feedStates) {
      feedContent = feedContents[feedUrl];
      feedState = feedStates[feedUrl];

      if (feedContent) {
        angular.forEach(feedContent.entries, function(entry, entryId) {
          entryState = feedState.entries[entryId];
          if (entryState) {
            entry.read =  entryState.read || false;
            entry.starred = entryState.starred || false;
          } else {
            entry.read = false;
            entry.starred = false;
          }
        });
      }
    }

    for (feedUrl in feedContents) {
      feedContent = feedContents[feedUrl];
      feedState = feedStates[feedUrl];

      if (!feedState) {
        angular.forEach(feedContent.entries, function(entry) {
          entry.read = false;
          entry.starred = false;
        });
      } else {
        angular.forEach(feedContent.entries, function(entry, entryId) {
          entryState = feedState.entries[entryId];
          if (!entryState) {
            entry.read = false;
            entry.starred = false;
          }
        });
      }
    }

    contentStorage.set({feeds: feedContents}, function() {
      console.log('synced local and cloud storages');
      deferred.resolve();
      if (!$rootScope.$$phase) $rootScope.$apply();
    });

    return deferred.promise;
  }


  return {
    /**
     * Merges the new feed dump, existing feed content in local store and feed states from the cloud.
     *
     * @param updatedFeed Data for a single feed.
     * @return {Promise} Promise to be resolved with feeds object after the merge.
     */
    updateFeed: function(updatedFeed) {
      var deferred = $q.defer();

      getFeedsFrom(contentStorage).then(function(feeds) {
        var feed = feeds[updatedFeed.url] || (feeds[updatedFeed.url] = {url: updatedFeed.url, entries: {}});

        feed.title = updatedFeed.title;
        angular.forEach(updatedFeed.entries, function(entry, entryId) {
          if (feed.entries[entryId]) {
            entry.read = feed.entries[entryId].read;
            entry.starred = feed.entries[entryId].starred;
          }
          feed.entries[entryId] = entry;
        });


        getFeedsFrom(stateStorage).then(function(feedStates) {
          syncStorages(feeds, feedStates).then(function(feeds) {
            deferred.resolve(feeds);
            if (!$rootScope.$$phase) $rootScope.$apply();
          });
        });
      });

      return deferred.promise;
    },


    /**
     * Updates a single feed entry property in both local and cloud storages.
     *
     * @param feedUrl
     * @param entryId
     * @param propName
     * @param propValue
     */
    updateEntryProp: function(feedUrl, entryId, propName, propValue) {
      getFeedsFrom(contentStorage).then(function(feeds) {
        feeds[feedUrl].entries[entryId][propName] = propValue;
        contentStorage.set({feeds: feeds});
      });
      getFeedsFrom(stateStorage).then(function(feeds) {
        if (!feeds[feedUrl]) feeds[feedUrl] = {entries:{}};
        if (!feeds[feedUrl].entries[entryId]) feeds[feedUrl].entries[entryId] = {};
        feeds[feedUrl].entries[entryId][propName] = propValue;
        stateStorage.set({feeds: feeds}, function() {
          console.log('cloud storage updated');
        });
      });
    },


    /**
     * @return {Promise} Promise to be resolved with all feeds data from the local storage.
     */
    getAll: function() {
      return getFeedsFrom(contentStorage);
    },


    /**
     *
     * @return {Promise} Promise to be resolved when all syncing is done.
     */
    sync: function() {
      if (!syncInProgress) {
        syncInProgress = true;

        return $q.all([getFeedsFrom(contentStorage), getFeedsFrom(stateStorage)]).then(function(results) {

          return syncStorages(results[0], results[1]).then(function() {
            syncInProgress = false;
          });

        }, function() {
          syncInProgress = false;
        });
      }
    },


    /**
     * Registers a chrome.storage.onChange event listener that will sync cloud storage changes into the local storage.
     */
    keepInSync: function() {
      if (keepInSyncOn) return;

      keepInSyncOn = false;

      chrome.storage.onChanged.addListener(function(diff, namespace) {
        if (namespace != 'sync') return;

        console.log('cloud storage changed, syncing changes');

        getFeedsFrom(contentStorage).then(function(feedContents) {
          angular.forEach(diff.feeds.newValue, function(feed, feedUrl) {
            angular.forEach(feed.entries, function(entryDiff, entryId) {
              var entry;

              if (feedContents[feedUrl] && (entry = feedContents[feedUrl].entries[entryId])) {
                angular.forEach(entryDiff, function(propVal, propName) {
                  entry[propName] = propVal;
                });
              }
            });
          });
          contentStorage.set({feeds: feedContents});
        });
      });
    }
  }
});
