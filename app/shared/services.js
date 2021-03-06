angular.module('services', [])
    .factory('Helpers', function () {
        return {
            isEmpty: function (obj) {
                if (obj == null) return true;
                if (obj.length > 0)    return false;
                if (obj.length === 0)  return true;
                var hasOwnProperty = Object.prototype.hasOwnProperty;
                for (var key in obj) {
                    if (hasOwnProperty.call(obj, key)) return false;
                }
                return true;
            },
            hasTrueFlag: function (object, propertyName) {
                return !!(object.hasOwnProperty(propertyName) && object[propertyName] == true);
            },
            newId: function () {
                return Math.random().toString(36).substr(2, 9);
            },
            isPositiveInteger: function (numberCandidate) {
                return !isNaN(parseInt(numberCandidate)) && isFinite(numberCandidate) && parseInt(numberCandidate) >= 0;
            },
            hasValidContainerName: function (containerName) {
                var rx = new RegExp('^\/?[a-zA-Z0-9][a-zA-Z0-9_.-]+$');

                return rx.test(containerName);
            },
            changeSorting: function (sort, column) {
                if (sort.column === column) {
                    if (sort.direction === 'ascending') {
                        sort.direction = 'descending';
                        sort.desc = true;
                    } else if (sort.direction === 'descending') {
                        sort.column = null;
                        sort.direction = null;
                        sort.desc = null;
                    }
                } else {
                    sort.column = column;
                    sort.direction = 'ascending';
                    sort.desc = false;
                }
                return sort;
            }
        }
    })
    .factory('Docker', function ($resource, $http, $rootScope) {
        return {
            containerLogs: function (containerId, logParams, callback) {
                $http({
                    method: 'GET',
                    url: $rootScope.hostUrl + '/containers/' + containerId + '/logs',
                    params: logParams
                })
                    .success(callback)
                    .error(function (data, status, headers, config) {
                        console.log('error', data);
                    });
            },
            containers: function () {
                return $resource($rootScope.hostUrl + '/containers/:containerId/json', null, {
                    create: {
                        url: $rootScope.hostUrl + '/containers/create',
                        method: "POST",
                        isArray: false
                    },
                    diff: {
                        url: $rootScope.hostUrl + '/containers/:containerId/changes',
                        method: "GET",
                        isArray: true
                    },
                    get: {
                        method: "GET",
                        isArray: false
                    },
                    kill: {
                        url: $rootScope.hostUrl + '/containers/:containerId/kill',
                        method: "POST"
                    },
                    pause: {
                        url: $rootScope.hostUrl + '/containers/:containerId/pause',
                        method: "POST"
                    },
                    query: {
                        method: "GET",
                        isArray: true
                    },
                    remove: {
                        url: $rootScope.hostUrl + '/containers/:containerId',
                        method: "DELETE"
                    },
                    rename: {
                        url: $rootScope.hostUrl + '/containers/:containerId/rename',
                        method: "POST"
                    },
                    restart: {
                        url: $rootScope.hostUrl + '/containers/:containerId/restart?t=1',
                        method: "POST"
                    },
                    start: {
                        url: $rootScope.hostUrl + '/containers/:containerId/start',
                        method: "POST"
                    },
                    stop: {
                        url: $rootScope.hostUrl + '/containers/:containerId/stop',
                        method: "POST"
                    },
                    top: {
                        url: $rootScope.hostUrl + '/containers/:containerId/top',
                        method: "GET",
                        isArray: false
                    },
                    unpause: {
                        url: $rootScope.hostUrl + '/containers/:containerId/unpause',
                        method: "POST"
                    }
                });
            }, images: function () {
                return $resource($rootScope.hostUrl + '/images/:imageId/json?all=:showAllImagesFlag', null, {
                    'query': {
                        method: "GET",
                        isArray: true
                    },
                    'get': {
                        method: "GET",
                        isArray: false
                    },
                    'history': {
                        method: "GET",
                        url: $rootScope.hostUrl + '/images/:imageId/history',
                        isArray: true

                    },
                    remove: {
                        url: $rootScope.hostUrl + '/images/:imageId',
                        method: "DELETE",
                        isArray: true
                    },
                    search: {
                        url: $rootScope.hostUrl + '/images/search',
                        method: "GET",
                        isArray: true
                    }
                });
            },
            auth: function () {
                return $resource($rootScope.hostUrl + '/auth', null, {
                    post: {
                        method: "POST",
                        isArray: false
                    }
                });
            }, commit: function () {
                return $resource($rootScope.hostUrl + '/commit', null, {
                    save: {
                        method: "POST",
                        isArray: false
                    }
                });
            },
            info: function () {
                return $resource($rootScope.hostUrl + '/info', null, {
                    get: {
                        method: "GET",
                        isArray: false
                    }
                });
            },
            ping: function (hostUrl) {
                return $resource(hostUrl + '/_ping', null, {
                    get: {
                        method: "GET",
                        isArray: false
                    }
                });
            },
            version: function () {
                return $resource($rootScope.hostUrl + '/version', null, {
                    get: {
                        method: "GET",
                        isArray: false
                    }
                });
            }
        }
    })
    .factory('Registry', function ($resource, $http, $rootScope) {
        return {
            // TODO: replace with a CORS based stuff. If possible.. :)
            tags: function (imageName) {
                return $resource('https://jsonp.nodejitsu.com/?url=https://index.docker.io/v1/repositories/:imageName/tags', null, {
                    get: {
                        method: "GET",
                        isArray: true
                    }
                });
            }
        }
    })
    .factory('HostService', ['$rootScope', 'Helpers', function ($rootScope, Helpers) {
        return {
            load: function () {
                //
                var hosts = [];
                if ($rootScope.chrome === true) {
                    chrome.storage.local.get("hosts", function (result) {
                        console.log(JSON.stringify(result));
                        return (angular.fromJson(result.hosts));
                    });

                } else {
                    //localStorage.clear();
                    var hosts = angular.fromJson(localStorage.getItem("hosts"));
                    if (Helpers.isEmpty(hosts)) {
                        hosts = [];
                    } else {
                        hosts.forEach(function (host) {
                            if (host.default) {
                                $rootScope.hostUrl = host;
                            }
                        });
                    }
                    return hosts;
                }
            },
            save: function (hosts) {
                if ($rootScope.chrome === true) {
                    chrome.storage.local.set({"hosts": angular.toJson(hosts)}, function () {
                    });
                } else {
                    localStorage.setItem("hosts", angular.toJson(hosts));
                }

            },
            loadSettings: function (callback) {
                var dockerySettings = {};
                var hosts = [];
                if ($rootScope.chrome === true) {
                    console.log('chrome storage');
                    //chrome.storage.local.clear();
                    var myself = this;
                    chrome.storage.local.get("dockerySettings", function (result) {
                        if (Helpers.isEmpty(result.dockerySettings)) {
                            dockerySettings = myself.initSettings();
                            //
                            chrome.storage.local.get("hosts", function (result) {
                                if (!Helpers.isEmpty(result)) {
                                    console.log('loadSettings chrome legacy load ' + JSON.stringify(dockerySettings));
                                    dockerySettings.hosts = JSON.parse(result.hosts);
                                }
                                $rootScope.dockerySettings = dockerySettings;
                                myself.saveSettings();
                                callback();
                            });

                        } else {
                            dockerySettings = JSON.parse(result.dockerySettings);
                            $rootScope.dockerySettings = dockerySettings;
                            callback();
                        }
                    });

                } else {
                    //localStorage.clear();
                    console.log('browser storage');
                    var dockerySettings = angular.fromJson(localStorage.getItem("dockerySettings"));
                    // do we need legacy load?
                    if (Helpers.isEmpty(dockerySettings)) {
                        console.log('loadSettings legacy load ' + JSON.stringify(dockerySettings));
                        dockerySettings = this.initSettings();
                        hosts = this.load();
                        if (Helpers.isEmpty(hosts)) {
                            dockerySettings.hosts = [];
                        } else {
                            dockerySettings.hosts = hosts;
                        }
                        $rootScope.dockerySettings = dockerySettings;
                        this.saveSettings();

                    } else {
                        dockerySettings.hosts.forEach(function (host) {
                            if (host.default) {
                                $rootScope.hostUrl = host;
                            }
                        });
                    }

                    console.log('dockerySettings ' + JSON.stringify(dockerySettings));
                    if (dockerySettings.appVersion == $rootScope.appVersion) {
                        if (dockerySettings.newsRead != true) {
                            dockerySettings.newsRead = false;
                        }
                        $rootScope.dockerySettings = dockerySettings;
                    } else {
                        dockerySettings.appVersion = $rootScope.appVersion
                        dockerySettings.newsRead = false;
                        $rootScope.dockerySettings = dockerySettings;
                        this.saveSettings();
                    }
                    callback();
                }

            },
            saveSettings: function () {
                //
                var dockerySettings = $rootScope.dockerySettings;
                if (Helpers.isEmpty(dockerySettings)) {
                    dockerySettings = this.initSettings();
                }
                //
                if ($rootScope.chrome === true) {
                    chrome.storage.local.set({"dockerySettings": angular.toJson(dockerySettings)}, function () {
                    });
                    this.save(dockerySettings.hosts);
                } else {
                    localStorage.setItem("dockerySettings", angular.toJson(dockerySettings));
                }
            },
            initSettings: function () {
                var dockerySettings = {};
                dockerySettings.hosts = [];
                dockerySettings.configVersion = 1;
                dockerySettings.appVersion = $rootScope.appVersion;
                dockerySettings.newsRead = false;
                return dockerySettings;
            }
        }
    }
    ])
;


