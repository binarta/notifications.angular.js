angular.module('notifications.presenter', [])
    .factory('notificationHelper', function() {
        return {};
    })
    .factory('notificationPresenter', function(notificationHelper) {
        return function(ctx) {
            notificationHelper.lastReceived = ctx;
        }
    });