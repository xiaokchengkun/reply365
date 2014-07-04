var services = angular.module("reply365.services", []);

services.factory("reply365Service", ["$http",
	function($http){
		var viewsUrl = "/static/views";
		var reply365Service = {
			target: {
				uid: "", //目标个人主页的uid
				rid: "", //目标最新微博的tid
				random: Math.random()
			},
			users: [{
				name: "xiaokchengkun",
				uid: "3039594"
			},{
				name: "lc_treed",
				uid: "2850662"
			},{
				name: "lvtest",
				uid: "3784367"
			}],

			musics: [{
				name: "We Are One",
				uid: viewsUrl + "/we are one.mp3"
			},{
				name: "Drrr",
				uid: viewsUrl + "/drrr.mp3"
			}],

			logs: {
				list: [],
				limit: 50
			},

			selected: {
				user: {
					name: "xiaokchengkun"
				},
				music: {
					name: "We Are One",
					uid: viewsUrl + "/we are one.mp3"
				}
			}

		};
		var domain = "http://cmwb.com";
		var serviceUrlMap = {
			target: domain + "/mylist/tahome.action?userid=" + reply365Service.target.uid
		};

		var clientUrlMap = {
			tweet: "/ajax/reply365/gettweet",
			comment: "/ajax/reply365/getcomment",
			reply: domain + "/blog/commentSender.action"
		};

		var scope = reply365Service;

		$.extend(reply365Service, {
			//从后段接数据
			getData: function(type, query){
				return $http.post(clientUrlMap[type], query).success(function(response){
					var errno = response.errno;
					var logs = response.logs || [];
					var target = response.target;
					scope.logs.list = logs.concat(scope.logs.list);
					if(scope.logs.list.length >= scope.logs.limit){
						scope.logs.list.length = scope.logs.limit;
					}
					console.log(target);
					$.extend(true, scope.target, target);
					if(response.errno){

					}
				});
			},
			//前端form提交回复
			reply: function(data){
				$http.post(clientUrlMap.reply, data).success(function(response){
					alert(response);
				});
			},

			urls: function() {
				return serviceUrlMap;
			}
		});

		return reply365Service;
	}
]);


