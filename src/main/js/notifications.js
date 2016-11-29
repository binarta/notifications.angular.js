angular.module('notifications', ['notifications.presenter', 'i18n'])
    .factory('topicRegistry',function () {
        return new TopicRegistry();
    }).factory('topicMessageDispatcher', ['topicRegistry', function (topicRegistry) {
        return new TopicMessageDispatcher(topicRegistry);
    }]).factory('ngRegisterTopicHandler', ['topicRegistry', NGRegisterTopicHandlerFactory])
    .directive('notifications', ['topicRegistry', 'notificationPresenter', 'i18nResolver', NotificationsDirectiveFactory]);

function NGRegisterTopicHandlerFactory(topicRegistry) {
    return function(scope, topic, handler) {
        var subscribe = function (scope, topic, handler) {
            scope.$on('$destroy', function() {
                topicRegistry.unsubscribe(topic, handler);
            });
            topicRegistry.subscribe(topic, handler);
        };

        var subscribeOnce = function (scope, topic, handler) {
            var callback = function (msg) {
                topicRegistry.unsubscribe(topic, callback);
                handler(msg);
            };
            topicRegistry.subscribe(topic, callback);
        };

        if (!topic) {
            var args = scope;
            if (args.executeHandlerOnce) subscribeOnce(args.scope, args.topic, args.handler);
            else subscribe(args.scope, args.topic, args.handler);
        } else {
            subscribe(scope, topic, handler);
        }
    }
}

function TopicRegistry() {
    var self = this;
    this.topics = {};

    var unknown = function (topic) {
        return !self.topics[topic];
    };

    var create = function (topic) {
        self.topics[topic] = {listeners: []};
    };

    var register = function (topic, listener) {
        self.topics[topic].listeners.push(listener);
        if (self.topics[topic].persistentMessage) listener(self.topics[topic].persistentMessage);
    };

    var unregister = function (topic, listener) {
        var listeners = self.topics[topic].listeners;
        var index = listeners.indexOf(listener);
        if (index != -1) listeners.splice(index, 1);
    };

    this.subscribe = function (topic, listener) {
        if (unknown(topic)) create(topic);
        register(topic, listener)
    };

    this.persistentMessage = function (topic, msg) {
        if (unknown(topic)) create(topic);
        self.topics[topic].persistentMessage = msg;
    };

    this.unsubscribe = function (topic, listener) {
        if (!unknown(topic)) unregister(topic, listener)
    };
}

function TopicMessageDispatcher(registry) {
    var listeners = function (topic) {
        var topic = registry.topics[topic];
        return topic ? topic.listeners : [];
    };

    this.fire = function (topic, msg) {
        if (listeners(topic)) angular.copy(listeners(topic)).forEach(function (listener) {
            listener(msg);
        });
    };

    this.firePersistently = function (topic, msg) {
        registry.persistentMessage(topic, msg);
        this.fire(topic, msg);
    }
}

function NotificationsDirectiveFactory(topicRegistry, notificationPresenter, i18nResolver) {
    return {
        restrict: 'C',
        link: function () {
            topicRegistry.subscribe('system.alert', function (status) {
                notificationPresenter({
                    type: 'error',
                    title: 'action failed!',
                    text: 'The system received an unexpected message and has stopped processing. Please try again later. [' + status + ']'
                });
            });
            ['success', 'warning', 'info'].forEach(function (level) {
                topicRegistry.subscribe('system.' + level, function (ctx) {
                    ctx.striptags = true;
                    i18nResolver(ctx, function (msg) {
                        notificationPresenter({
                            type: level,
                            text: msg,
                            persistent: ctx.persistent == undefined ? false : ctx.persistent
                        })
                    })
                });
            });
        }
    };
}