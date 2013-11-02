angular.module('notifications.presenter', [])
    .factory('notificationPresenter', function() {
        return function(ctx) {
            console.dir(ctx);
        }
    });