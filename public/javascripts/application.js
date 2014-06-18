var reply365 = {
    init: function() {
        var uiModule = ['ngRoute'];
        var selfModule = ["reply365.controllers", "reply365.services"];
        var subModule = uiModule.concat(selfModule);
        var reply365Mod = angular.module("reply365Mod", subModule);
        this.module = reply365Mod;

        this.routeConfig();
        this.httpConfig();
        angular.bootstrap(document, ['reply365Mod']);
    },
    routeConfig: function() {
        var me = this;
        this.module.config(['$routeProvider',
            function($routeProvider) {
                $routeProvider.
                    when("/",{
                        templateUrl: "/static/views/index.html",
                        controller: "reply365Controller"
                    });
            }
        ]);
    },
    httpConfig: function() {
        this.module.config(['$httpProvider',
            function($httpProvider) {
                $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
                $httpProvider.defaults.transformRequest = function(data) {
                    if (data === undefined) {
                        return data;
                    }
                    return $.param(data);
                };

                $httpProvider.defaults.transformResponse = function(data, func) {
                    try{
                        var json = $.parseJSON(data);
                        return json;
                    }catch(err){
                        return data;
                    }
                };
            }
        ]);
    }
};

reply365.init();

