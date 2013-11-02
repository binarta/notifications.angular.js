angular.module('notifications.presenter', [])
    .factory('notificationPresenter', function() {
        return function(ctx) {
            if(ctx.type == 'warning')
                ctx.type = undefined;
            $.pnotify(ctx);
        }
    });