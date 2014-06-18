var http = require("http");
var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");
var forever = require("forever");
var querystring=require("querystring");
// 载入模块
var Segment = require('node-segment').Segment;
// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault();

var checkTweet = {
	init: function(){
		var me = this;
		var date = moment();
		this.time = {
			h: date.hour(),
			m: date.minute(),
			s: date.second()
		};
		//匹配上的微博ID
		this.id = null;
		this.stop = false;
		//获取微博时间间隔
		this.getDataTime = 15000;
		//获取评论时间间隔
		this.getCommentTime = 5000;
		//回复的微博id
		this.id = 0;
		//用户id 用来发送回复
		//this.uid = "3039594";
		//test
		this.uid = "3784367";

		//轮询次数
		this.counter = {
			data: 1,
			comment: 1
		};

		//设置发送请求的超时时间 ms
		this.requestLimit = {
			data: 10000,
			comment: 100000
		};

		//设置后端返回数据的超时时间 ms
		this.responseLimit = {
			data: 10000,
			comment: 10000
		};

		//开始干活！
		this.setIntervalGetData();
		this.log("开始干活！");

		//this.login();
	},

	checkTime: function(){
		var time = this.time;
		//08:50 - 09: 10
		//09:50 - 10: 10
		//14:50 - 15: 10
		//15:50 - 16: 10
		var hour = [9, 10, 11, 15, 16, 17, 18, 0];
		var start = 1;
		var end = 59;
		var status = false;
		for(var i=0; i<hour.length; i++){
			var h = hour[i];
			var valid = (time.h == (h-1) && time.m >= start) ||
				(time.h == h && time.m <= end);
			if(valid){
				status = true;
				break;
			}
		}
		return status;
	},

	setIntervalGetData: function(){
		var me = this;
		this.timerGetData = setTimeout(function(){
			var status = me.checkTime();
			me.log("是否在时间范围内：" + status);
			if(status){
				me.log(me.showTime(),"开始轮询");
				me.getData();
				me.counter.data++;
			}
		}, this.getDataTime);
	},

	setIntervalGetComment: function(){
		var me = this;
		this.timerGetComment = setTimeout(function(){
			me.getComment();
			me.counter.comment++;
		}, this.getCommentTime);
	},

	getData: function(){
		var me = this;
		//var userId = "3784367"; //test
		var userId = "1878604"; //365
		var reqTimeout, resTimeout, req;
		me.log("开始第" + me.counter.data +"次抓取最新微博...");
		var url = "http://cmwb.com/mylist/tahome.action?userid=" + userId;
		req = http.get(url, function(response){
			me.clear(reqTimeout);
			resTimeout = me.responseTimeOut(response, me.responseLimit.data, me.getData);
			var source = "";
			response.on("data", function(data){
				source += data;
			});
			response.on("end", function(){
				me.clear(resTimeout);
				me.log("获取微博成功！");
				var $ = cheerio.load(source);
				var $tweetList = $("#idLeftCont2 ul li");
				var filterWord = "竞猜内容";
				//var filterWord = "!";

				//for(var i=0; i<$tweetList.length; i++){
					var item = $tweetList[0];
					try{
						me.id = $(item).attr("id").replace(/mytopic/, "");
					}catch(e){
						me.log("error:" + $(item));
					}
					if(!me.id){
						return;
					}
					var content = $(item).find("#topicContent" + me.id);
					var tweetTime = $(item).find(".Mib_feed_c1_l").text();
					var tweetWord = content.text();
					//console.log(tweetWord);
					if(tweetWord.indexOf(filterWord) != -1){
						var _word1 = tweetWord.split("竞猜内容")[1];
						var _word2 = _word1.split("活动规则")[0];

						if(tweetTime.indexOf("秒") != -1){
							me.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n有新的消息了！");
							me.log("匹配成功!!!!!!!!!!!!!!!!!!!!!!!!!!!!!！\n关键字是:" + filterWord +"\n\n微博内容是：" + _word2 + "\n" + tweetTime);
						}else{
							me.log("暂无最新消息..." + tweetTime);
						}
						//选中的


						//me.log("匹配成功!!!!!!!!!!!!!!!!!!!!!!!!!!!!!！\n关键字是:" + filterWord +"\n微博内容是：" + tweetWord);
						me.setIntervalGetData();

						//me.stopDataInterval();
						//me.postComment("ask");
						//me.getComment();
						//break;
					}else{
						me.log("没有匹配，继续轮询抓取微博。 最新微博时间：" + tweetTime);
						me.setIntervalGetData();
					}
				//}
			});
		}).on("error", function(e){
			me.log("抓取微博错误信息：" + e);
			me.stopDataInterval();
			me.getData();
			me.clear(reqTimeout);
			me.clear(resTimeout);
		});

		reqTimeout = me.requestTimeOut(req, me.requestLimit.data, me.getData);
	},

	getComment: function(){
		var me = this;
		if(!me.id){
			return;
		}
		var replyId = me.id.substring(0, 8);
		me.log("开始获取评论...");
		var url = "http://cmwb.com/mylist/commentgetcomments.action?topicid=" + replyId;
		http.get(url, function(response){
			var source = "";
			response.on("data", function(data){
				source += data;
			});
			response.on("end", function(){
				me.log("获取评论列表成功！");
				var data = JSON.parse(source);
				data = JSON.parse(data);
				if(!data || data.length === 0){
					me.log("但是还没有评论内容");
					me.setIntervalGetComment();
					return;
				}

				var comments = "";
				$.each(data, function(index, item){
					comments = comments + item.content + "\n";
				});
				me.log("评论列表：" + comments);
				//me.postComment(commentNew.content);
				me.stopCommentInterval();
			});
		}).on("error", function(e){
			me.log(e);
			me.stopCommentInterval();
		});
	},

	postComment: function(content){
		var me = this;
		if(!content || !me.id || !me.uid){
			return;
		}
		me.log("开始发送评论...");
		//设置cookie
		var j = request.jar();
		var _cookie = "JSESSIONID=EBADEB737078B40F7BF97918AB4CC73E-n3";
		var cookie = request.cookie(_cookie);
		var url = "http://cmwb.com/blog/commentSender.action";
		j.setCookie(cookie, url);

		var body = JSON.stringify({
			"cuid": me.id.substring(0, 8),
			"tuid": me.uid,
			"text": content,
			"anticache": Math.random()
		});


		var options = {
	    url: url,
	    jar: j,
	    method: "POST",
	   //  headers: {
	   //  	"Accept": "application/json, text/javascript, */*",
	   //    "Content-Type": "application/x-www-form-urlencoded",
				// "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36",
				// "Host": "cmwb.com",
				// "Content-Length": content.length,
				// "Accept-Encoding": "gzip,deflate,sdch",
				// "Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4",
				// "Referer": "http://cmwb.com/mylist/myhome.action",
				// "X-Requested-With": "XMLHttpRequest"
	   //  },
	   headers: {
	   	Accept: "application/json, text/javascript, */*",
			"Accept-Encoding": "gzip,deflate,sdch",
			"Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Content-Length": 115,
			"Content-Type": "application/x-www-form-urlencoded",
			Cookie: "JSESSIONID=57D14CCEB423B7B886E7EB88EEAC039A-n4",
			Host: "cmwb.com",
			Origin: "http://cmwb.com",
			Pragma: "no-cache",
			Referer: "http://cmwb.com/mylist/myhome.action",
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36",
			"X-Requested-With": "XMLHttpRequest"
	   },
	    body: body
		};

		var callback = function(error, response, body){
			me.log(response);
			if(error){
				me.log(error);
			}
			//me.log(body);
			me.log("发送评论成功：" + content);
		};

		request(options, callback);

	},

	login: function(){
		var me = this;
		var url = "http://cmwb.com/interface/dologin.jsp";
		var body = JSON.stringify({
			loginname:"lvtest",
			pwd: "xiaok123"
		});

		var options = {
	    url: url,
	    method: "POST",
			headers: {
				Accept: "application/json, text/javascript, */*",
				"Accept-Encoding": "gzip,deflate,sdch",
				"Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"Content-Type": "application/x-www-form-urlencoded",
				Host: "cmwb.com",
				Origin: "http://cmwb.com",
				Pragma: "no-cache",
				Referer: "http://cmwb.com/",
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36",
				"X-Requested-With": "XMLHttpRequest"
			},
	    body: body
		};

		var callback = function(error, response, body){
			me.log(response);
			if(error){
				me.log(error);
			}
		};

		request(options, callback);
	},

	stopDataInterval: function(){
		this.log("停止抓取微博！！！！");
		clearInterval(this.timerData);
	},

	stopCommentInterval: function(){
		this.log( "停止抓取评论！！！！");
		clearInterval(this.timerComment);
	},

	showTime: function(){
		var date = moment();
		var time = {
			h: date.hour(),
			m: date.minute(),
			s: date.second()
		};
		return (time.h + ":" + time.m + ":" + time.s);
	},

	log: function(content){
		console.log(this.showTime(), content, "\n");
	},

	requestTimeOut: function(req, during, callback){
		var me = this;
		me.log("正在发送请求....");
		var timeout = setTimeout(function(){
			req.abort();
			me.log("发送请求超时，重新发送~");
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	responseTimeOut: function(res, during, callback){
		var me = this;
		me.log("正在接受返回数据....");
		var timeout = setTimeout(function(){
			res.destroy();
			me.log("接受数据超时，重新发送~");
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	clear: function(timer){
		clearTimeout(timer);
	},

	restart: function(){
		this.log("请求出错，重新启动程序。");
	}
};

checkTweet.init();

