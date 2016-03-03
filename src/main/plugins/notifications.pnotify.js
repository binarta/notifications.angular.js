angular.module('notifications.presenter', ['config'])
    .factory('notificationPresenter', function() {
        return function(ctx) {
            if(ctx.type == 'warning')
                ctx.type = undefined;
            if(ctx.persistent != undefined)
                ctx.hide = !ctx.persistent;

            ctx.styling = 'fontawesome';

            ctx.buttons = {
                closer: true,
                sticker: false
            };

            $(function(){
                new PNotify(ctx);
            });
        }
    });