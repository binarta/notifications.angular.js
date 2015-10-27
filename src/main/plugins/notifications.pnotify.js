angular.module('notifications.presenter', ['config'])
    .factory('notificationPresenter', ['config', function(config) {
        return function(ctx) {
            if(ctx.type == 'warning')
                ctx.type = undefined;
            if(ctx.persistent != undefined)
                ctx.hide = !ctx.persistent;

            if(config.styling) ctx.styling = config.styling;

            ctx.buttons = {
                closer: true,
                sticker: false
            };

            $(function(){
                new PNotify(ctx);
            });
        }
    }]);