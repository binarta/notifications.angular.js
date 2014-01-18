angular.module('notifications.presenter', [])
    .factory('notificationPresenter', function() {
        return function(ctx) {
            if(ctx.type == 'warning')
                ctx.type = undefined;
            if(ctx.persistent != undefined)
                ctx.hide = !ctx.persistent;
            $.pnotify(ctx);
        }
    });