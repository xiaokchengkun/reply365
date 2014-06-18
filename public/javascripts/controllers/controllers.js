var controllers = angular.module("reply365.controllers", []);

var urlMap = {
	start: "/ajax/reply365/start",
	stop: "/ajax/reply365/stop"
};


controllers.controller("reply365Controller", ["$scope", "reply365Service",
	function($scope, reply365Service){

		$scope.target = reply365Service.target;

		$scope.users = reply365Service.users;

		$scope.logs = reply365Service.logs;

		$scope.selected = reply365Service.selected;

		$scope.status = {
			isStop: true,
			isProgress: false,
			audio: {
				isReady: false,
				isPlay: false,
				isStop: true
			}
		};

		$scope.start = function(){
			$scope.status.isStop = false;
			$scope.audio.stop();
			$scope.getData();
		};

		$scope.getData = function(){
			var query = {
				uid: $scope.target.uid
			};
			var response = reply365Service.getData(query).then(function(http){
				var response = http.data;

				if($.isPlainObject(response)){
					//if(response.errno == 6){
					if(response.errno == 3 || response.errno == 2 || response.errno == 6){
						$scope.status.isStop = true;

						$scope.audio.play();
						//来个桌面提醒
						//alert("有新消息！");
						$scope.notice();
					}
					else if(response.errno && !$scope.status.isStop){
						$scope.again();
					}
				}else{
					$scope.again();
				}
			});
		};

		$scope.stop = function(){
			$scope.status.isStop = true;
			$scope.status.isProgress = false;

			clearTimeout($scope.timer);
			$scope.timer = null;
		};

		$scope.again = function(){
			$scope.status.isProgress = true;
			$scope.timer = setTimeout(function(){
				$scope.status.isProgress = false;
				$scope.getData();
			}, 15000);
		};

		$scope.audio = {
			play: function(){
				if($scope.status.audio.isReady){
					$scope.status.audio.isPlay = true;
					$scope.status.audio.isStop = false;
				}
			},
			stop: function(){
				if($scope.status.audio.isReady){
					$scope.status.audio.isPlay = false;
					$scope.status.audio.isStop = true;
				}
			}
		};

		$scope.notice = function(){
			if (!("Notification" in window)) {
		    alert("This browser does not support desktop notification");
		  }

		  // Let's check if the user is okay to get some notification
		  else if (Notification.permission === "granted") {
		    // If it's okay let's create a notification
		    var notification = new Notification("Hi there!");
		  }

		  // Otherwise, we need to ask the user for permission
		  // Note, Chrome does not implement the permission static property
		  // So we have to check for NOT 'denied' instead of 'default'
		  else if (Notification.permission !== 'denied') {
		    Notification.requestPermission(function (permission) {

		      // Whatever the user answers, we make sure we store the information
		      if(!('permission' in Notification)) {
		        Notification.permission = permission;
		      }

		      // If the user is okay, let's create a notification
		      if (permission === "granted") {
		        var notification = new Notification("Hi there!");
		      }
		    });
		  }
		};
	}
]);


controllers.directive("selectUser", ["reply365Service",
	function(reply365Service){
		return {
			link: function(scope, element, attrs){
				var $element = $(element);

				var $button = $element.find("button:first-child");

				$button.on("click", function(){
					$element.toggleClass("open");
				});

				$element.on("click", "a", function(){
					var index = $(this).attr("data-index");
					var user = reply365Service.users[index];
					reply365Service.selected.user = {
						name: user.name,
						uid: user.uid
					};
					$element.removeClass("open");
					scope.$apply("selected");
				});
			}
		};
	}
]);

var domain = "http://cmwb.com";
var clientUrlMap = {
	getData: "/ajax/reply365/getdata?format=ajax",
	reply: domain + "/blog/commentSender.action",
	test: "/"
};

controllers.directive("replyForm", ["reply365Service",
	function(reply365Service){
		return {
			link: function(scope, element, attrs){
				var $element = $(element);

				var $form = $element.find("form");
				var $iframe = $element.find("iframe");

				$form.attr({
					"action": clientUrlMap.reply,
					//"action": clientUrlMap.reply,
					"method": "post"
				});

				scope.submit = function(){
					$form.submit();
					scope.isSubmit = true;
				};

			}
		};
	}
]);

controllers.directive("audioRemind", ["reply365Service",
	function($scope, reply365Service){
		return {
			link: function(scope, element, attrs){
				var $element = $(element);
				$(element).on("load", function(){
					scope.status.audio.isReady = true;
				});
				var src = "/static/views/music.mp3";
				$element.attr({
					controls: "true",
					src: src,
					type: "audio/mpeg",
					loop: "true"
				});
				element.load();

				scope.$watch("status.audio", function(){
					console.log(scope.status.audio);
					if(!scope.status.audio.isReady){
						return;
					}
					if(scope.status.audio.isStop){
						$(element)[0].pause();
						$element.attr("src", "").attr("src", src);
					}
					if(scope.status.audio.isPlay){
						$(element)[0].play();
					}
				}, true);
			}
		};
	}
]);
