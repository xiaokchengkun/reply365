var services = angular.module("reply365.services", []);

services.factory("reply365Service", ["$http",
	function($http){
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

			logs: {
				list: [],
				limit: 50
			},

			selected: {
				user: {}
			}

		};
		var domain = "http://cmwb.com";
		var serviceUrlMap = {
			target: domain + "/mylist/tahome.action?userid=" + reply365Service.target.uid
		};

		var clientUrlMap = {
			getData: "/ajax/reply365/getdata",
			reply: domain + "/blog/commentSender.action"
		};

		var scope = reply365Service;

		$.extend(reply365Service, {
			//从后段接数据
			getData: function(query){
				return $http.post(clientUrlMap.getData, query).success(function(response){
					console.log(response);
					var errno = response.errno;
					var logs = response.logs || [];
					var target = response.target;
					scope.logs.list = logs.concat(scope.logs.list);
					if(scope.logs.list.length >= scope.logs.limit){
						scope.logs.list.length = scope.logs.limit;
					}
					$.extend(scope.target, target);
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


