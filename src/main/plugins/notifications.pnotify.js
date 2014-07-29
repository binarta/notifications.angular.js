angular.module('notifications.presenter', [])
    .factory('notificationPresenter', ['config', function(config) {
        return function(ctx) {
            if(ctx.type == 'warning')
                ctx.type = undefined;
            if(ctx.persistent != undefined)
                ctx.hide = !ctx.persistent;

            ctx.nonblock = {
                nonblock: true
            };
            if(config.styling) ctx.styling = config.styling;

            $(function(){
                new PNotify(ctx);
            });
        }
    }]);