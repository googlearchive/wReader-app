var wReader = angular.module('wReader', ['wReader.filters', 'wReader.services', 'wReader.directives', 'wReader.store']);

wReader.run(function(items) {
  chrome.extension.onMessage.addListener(function(request) {
    if (request != 'feedsUpdated') return;
    items.getItemsFromDataStore();
  });
});


// Main app controller
function AppController($scope, items, scroll, bgPage) {

  $scope.items = items;

  $scope.refresh = function() {
    bgPage.refreshFeeds();
  };

  $scope.handleSpace = function() {
    if (!scroll.pageDown()) {
      items.next();
    }
  };

  $scope.$watch('items.selectedIdx', function(newVal) {
    if (newVal !== null) scroll.toCurrent();
  });
}


// Top Menu/Nav Bar
function NavBarController($scope, items) {

  $scope.showAll = function() {
    items.clearFilter();
  };

  $scope.showUnread = function() {
    items.filterBy('read', false);
  };

  $scope.showStarred = function() {
    items.filterBy('starred', true);
  };

  $scope.showRead = function() {
    items.filterBy('read', true);
  };
}
