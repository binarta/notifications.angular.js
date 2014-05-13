describe('notifications', function () {
    var registry, dispatcher, directive, i18n;

    beforeEach(module('notifications'));
    beforeEach(inject(function (topicRegistry, topicMessageDispatcher) {
        i18n = {
            resolver: function (ctx, presenter) {
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

        it('persistent messages are delivered to late subscribers', function () {
            var receivedMsg;
            var listener = function (msg) {
                receivedMsg = msg;
            };
            dispatcher.firePersistently('topic', 'msg');
            registry.subscribe('topic', listener);
            expect(receivedMsg).toEqual('msg');
        });

        it('unsubscribe a topic listener', function () {
            var receivedMsg;
            var listener = function (msg) {
                receivedMsg = msg;
            };

            registry.subscribe('topic', listener);
            registry.unsubscribe('topic', listener);
            dispatcher.fire('topic', 'msg');

            expect(receivedMsg).toBeUndefined();
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

        ['success', 'warning', 'info'].forEach(function (level) {
            it('system ' + level + ' messages raise notifications', function () {
                directive.link();
                topicRegistry['system.' + level]({});
                i18n.presenter('msg');
                expect(notifications.lastReceived.type).toEqual(level);
                expect(notifications.lastReceived.text).toEqual('msg');
                expect(notifications.lastReceived.persistent).toEqual(false);
            });

            it('system ' + level + ' messages are translated', function () {
                directive.link();
                topicRegistry['system.' + level]({code: 'msg.code'});
                expect(i18n.ctx.code).toEqual('msg.code');
                expect(i18n.ctx.striptags).toEqual(true);
            });

            it('system ' + level + ' messages can be persistent', function () {
                directive.link();
                topicRegistry['system.' + level]({persistent: true});
                i18n.presenter('msg');
                expect(notifications.lastReceived.persistent).toEqual(true);
            });
        });
    });

    describe('subscribing for notification during the lifecycle of an angular scope', function () {
        var scope, receivedMessage;

        beforeEach(function () {
            receivedMessage = undefined;
            scope = {
                $on: function (topic, handler) {
                    scope[topic + 'Handlers'].push(handler);
                },
                $destroyHandlers: [],
                $destroy: function () {
                    scope.$destroyHandlers.forEach(function (it) {
                        it();
                    });
                }
            };
        });

        var assert = function () {
            it('should receive messages', function () {
                dispatcher.fire('test.topic', 'msg');
                expect(receivedMessage).toEqual('msg');
            });

            it('should continue to receive messages', function () {
                dispatcher.fire('test.topic', 'msg1');
                expect(receivedMessage).toEqual('msg1');

                dispatcher.fire('test.topic', 'msg2');
                expect(receivedMessage).toEqual('msg2');
            });

            it('should unsubscribe when scope dies', function () {
                scope.$destroy();
                dispatcher.fire('test.topic', 'msg');
                expect(receivedMessage).toBeUndefined();
            });
        };

        describe('using separate arguments', function () {
            beforeEach(inject(function (ngRegisterTopicHandler) {
                ngRegisterTopicHandler(scope, 'test.topic', function (it) {
                    receivedMessage = it
                });
            }));

            assert();
        });

        describe('using hash as argument', function () {
            describe('execute handler', function () {
                beforeEach(inject(function (ngRegisterTopicHandler) {
                    ngRegisterTopicHandler({
                        scope: scope,
                        topic: 'test.topic',
                        handler: function (it) {
                            receivedMessage = it
                        }
                    });
                }));

                assert();
            });

            describe('execute handler only once', function () {
                beforeEach(inject(function (ngRegisterTopicHandler) {
                    ngRegisterTopicHandler({
                        scope: scope,
                        topic: 'test.topic',
                        handler: function (it) {
                            receivedMessage = it
                        },
                        executeHandlerOnce: true
                    });
                }));

                it('should receive messages only once', function () {
                    dispatcher.firePersistently('test.topic', 'executed');
                    dispatcher.firePersistently('test.topic', 'should not have been executed');
                    expect(receivedMessage).toEqual('executed');
                });
            });
        });
    });
});