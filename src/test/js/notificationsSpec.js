describe('notifications', function () {
    var registry, dispatcher, directive, i18n;

    beforeEach(module('notifications'));
    beforeEach(inject(function (topicRegistry, topicMessageDispatcher) {
        i18n = {
            resolver:function(ctx, presenter) {
                i18n.ctx = ctx;
                i18n.presenter = presenter;
            }
        };
        registry = topicRegistry;
        dispatcher = topicMessageDispatcher;
    }));

    describe('event notifications', function () {
        it('fire notifications without listeners', function () {
            dispatcher.fire('topic', 'whatever');
        });

        it('subscribe to a topic and receive messages', function () {
            var receivedMsg;
            var listener = function (msg) {
                receivedMsg = msg;
            };
            registry.subscribe('topic', listener);
            dispatcher.fire('topic', 'msg');
            expect(receivedMsg).toEqual('msg');
        });

        it('a topic with multiple listeners', function () {
            var receivedMsg1, receivedMsg2;
            var listener1 = function (msg) {
                receivedMsg1 = msg;
            };
            var listener2 = function (msg) {
                receivedMsg2 = msg;
            };

            registry.subscribe('topic', listener1);
            registry.subscribe('topic', listener2);

            dispatcher.fire('topic', 'msg');

            expect(receivedMsg1).toEqual('msg');
            expect(receivedMsg2).toEqual('msg');
        });

        it('different topics get their own messages', function () {
            var receivedMsg1, receivedMsg2;
            var listener1 = function (msg) {
                receivedMsg1 = msg;
            };
            var listener2 = function (msg) {
                receivedMsg2 = msg;
            };

            registry.subscribe('topic-1', listener1);
            registry.subscribe('topic-2', listener2);

            dispatcher.fire('topic-1', 'msg-1');
            dispatcher.fire('topic-2', 'msg-2');

            expect(receivedMsg1).toEqual('msg-1');
            expect(receivedMsg2).toEqual('msg-2');
        });

        it('persistent messages are delivered to late subscribers', function() {
            var receivedMsg;
            var listener = function (msg) {
                receivedMsg = msg;
            };
            dispatcher.firePersistently('topic', 'msg');
            registry.subscribe('topic', listener);
            expect(receivedMsg).toEqual('msg');
        });
    });

    describe('notifications directive', function () {
        var topicRegistry;
        var notifications;

        beforeEach(inject(function (notificationPresenter, notificationHelper) {
            notifications = notificationHelper;
            topicRegistry = {subscribe: function (topic, listener) {
                this[topic] = listener;
            }};
            directive = NotificationsDirectiveFactory(topicRegistry, notificationPresenter, i18n.resolver);
        }));

        it('restrict', function () {
            expect(directive.restrict).toEqual('C');
        });

        [0, 500].forEach(function (status) {
            it('directive', function () {
                directive.link();
                topicRegistry['system.alert'](status);
                expect(notifications.lastReceived.type).toEqual('error');
                expect(notifications.lastReceived.title).toEqual('action failed!');
                expect(notifications.lastReceived.text).toEqual('The system received an unexpected message and has stopped processing. Please try again later. [' + status + ']');
            });
        });

        ['success', 'warning', 'info'].forEach(function(level) {
            it('system ' + level + ' messages raise notifications', function() {
                directive.link();
                topicRegistry['system.' + level]({});
                i18n.presenter('msg');
                expect(notifications.lastReceived.type).toEqual(level);
                expect(notifications.lastReceived.text).toEqual('msg');
            });

            it('system ' + level + ' messages are translated', function() {
                directive.link();
                topicRegistry['system.' + level]({code:'msg.code'});
                expect(i18n.ctx.code).toEqual('msg.code');
                expect(i18n.ctx.striptags).toEqual(true);
            });
        });

    });
});