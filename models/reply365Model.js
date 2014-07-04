var http = require("http");
var url = require("url");
var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");
var queryString=require("querystring");

var counter = {
	tweet: 1,
	comment: 1
};

var reply365 = {
	init: function(req, callback){
		var me = this;
		//log数据
		this.logs = [];

		this.errno = {
			"0": "ok",
			"1": "网络错误",
			"2": "微博有匹配，但不是最新",
			"3": "微博无匹配",
			"4": "发送请求超时",
			"5": "接受数据超时",
			"6": "结束",
			"7": "暂无评论",
			"8": "有评论了！"
		};

		this.url = url.parse(req.url);
		//this.query 包含目标uid
	    this.query = req.body;
	    this.callback = callback;


	    //uid是必填项
	    if(!this.query.uid && !this.query.rid){
	    	return;
	    }

	    //目标信息
	    this.target = {
	    	uid: this.query.uid,
	    	rid: this.query.rid || 0 //最新微博的回复id
	    };

	    //设置抓取参数

		//获取微博时间间隔
		this.getDataTime = this.query.getDataTime || 15000;
		//获取评论时间间隔
		this.getCommentTime = this.query.getDataTime || 5000;

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
		this.log("开始干活！");

		if(req.url.indexOf("tweet") != -1){
			this.getData();
		}else if(req.url.indexOf("comment") != -1){
			this.getComment();
		}
	},

	getData: function(){
		var me = this;
		var reqTimeout, resTimeout, req;
		me.log("开始第" + counter.tweet +"次抓取最新微博...");
		var url = "http://cmwb.com/mylist/tahome.action?userid=" + me.target.uid + "&random=" + Math.random();
		req = http.get(url, function(response){
			me.clear(reqTimeout);
			resTimeout = me.responseTimeOut(response, me.responseLimit.data);
			var source = "";
			response.on("data", function(data){
				source += data;
			});
			response.on("end", function(){
				me.clear(resTimeout);
				delete me.target.comment;
				me.target.content = null;
				me.target.question = null;
				me.log("获取微博成功！");
				counter.tweet ++;
				var $ = cheerio.load(source);
				var $tweetList = $("#idLeftCont2 ul li");
				var filterWord = "竞猜内容";
				//var filterWord = "#我爱世界杯#这是XXX";
				//var filterWord = "!";

				//for(var i=0; i<$tweetList.length; i++){
					var item = $tweetList[0];
					var rid;
					try{
						rid = $(item).attr("id").replace(/mytopic/, "");
					}catch(e){
						me.log("error:" + $(item), 1);
					}
					if(!rid){
						me.log("error: rid不存在", 1);
						return;
					}
					var content = $(item).find("#topicContent" + rid);
					me.target.rid = rid.substring(0,8);
					var tweetTime = $(item).find(".Mib_feed_c1_l").text();
					var tweetWord = content.text();
					console.log(tweetWord);
					me.target.content = tweetWord;
					me.target.time = tweetTime.replace(/来自:彩民微博/g,"");
					if(tweetWord.indexOf(filterWord) != -1){
						//var _word1 = tweetWord.split("竞猜内容")[0];
						var _word1 = tweetWord.split("竞猜内容")[1];
						var _word2 = _word1.split("活动规则")[0];

						if(tweetTime.indexOf("秒") != -1){
							me.target.question = _word2.replace(/【/g, "").replace(/】/g, "").replace(/:/g,"").replace(/：/g, "");
							me.log("有新的消息了！");
							me.log("匹配成功!!!!!!!!!!!!!!!!!!!!!!!!!!!!!！\n关键字是:" + filterWord +"\n\n微博内容是：" + me.target.question + "\n" + tweetTime, 6);
						}else{
							me.log("暂无最新消息..." + tweetTime, 2);
						}
					}else{
						me.log("没有匹配，继续轮询抓取微博。 最新微博时间：" + tweetTime, 3);
					}
				//}
			});
		}).on("error", function(e){
			me.log("抓取微博错误信息：" + e, 1);
			me.clear(reqTimeout);
			me.clear(resTimeout);
		});

		reqTimeout = me.requestTimeOut(req, me.requestLimit.data);
	},

	getComment: function(){
		var me = this;
		if(!me.target.rid){
			return;
		}
		var reqTimeout, resTimeout, req;
		me.log("开始第" + counter.comment +"次抓取评论...");
		//var url = "http://cmwb.com/mylist/commentgetcomments.action?topicid=" + me.target.rid;
		var url = "http://cmwb.com/mylist/tatopic.action?topicid=" + me.target.rid  + "&random=" + Math.random();
		req = http.get(url, function(response){
			me.clear(reqTimeout);
			delete me.target.content;
			delete me.target.question;
			me.target.comment = null;
			resTimeout = me.responseTimeOut(response, me.responseLimit.data);
			var source = "";
			response.on("data", function(data){
				source += data;
			});
			response.on("end", function(){
				me.clear(resTimeout);
				me.log("获取评论列表成功！");
				counter.comment ++;
				var $ = cheerio.load(source);
				var commentNewest = $("#topicComments .hfzr")[0];
				if(!commentNewest){
					me.log("但是还没有评论内容", 7);
					return;
				}
				$(commentNewest).find("span").remove();
				var text = $(commentNewest).text().replace(/<[^<,\s]>/g, "");
				var time = text.match(/\([^)]+\)/);
				if(time && time.length){
					text = text.replace(time[0], "");
				}

				//var data = JSON.parse(source);
				//data = JSON.parse(data);
				//if(!data || data.length === 0){
				//	me.log("但是还没有评论内容", 7);
				//	return;
				//}
				//
				text = text.split("：");

				var comment = text;
				if(text.length>0){
					comment = {
						user: text[0].replace(/\s/g, ""),
						content: text[1].replace(/\s/g, ""),
						time: time
					};
				}
				me.target.comment = comment;

				me.log("评论列表：" + comment.user + ":" + comment.content + comment.time, 6);
			});
		}).on("error", function(e){
			me.log("抓取评论错误信息：" + e, 1);
			me.clear(reqTimeout);
			me.clear(resTimeout);
		});

		reqTimeout = me.requestTimeOut(req, me.requestLimit.data);
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

	log: function(content, errno){
		console.log(this.showTime(), content, "\n");
		var log = {
			time: this.showTime(),
			content: content
		};
		this.logs.unshift(log);
		if(errno){
			this.done(errno);
		}
	},

	requestTimeOut: function(req, during, callback){
		var me = this;
		me.log("正在发送请求....");
		var timeout = setTimeout(function(){
			req.abort();
			me.log("发送请求超时，重新发送~", 4);
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	responseTimeOut: function(res, during, callback){
		var me = this;
		me.log("正在接受返回数据....");
		var timeout = setTimeout(function(){
			res.destroy();
			me.log("接受数据超时，重新发送~", 5);
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	clear: function(timer){
		clearTimeout(timer);
	},

	/*
	** 返回错误请求信息
	 */
	error: function(errno){
		this.done();
	},

	done: function(errno){
		//添加间隔
		this.logs.push({
			blank: 1
		});
		this.callback({
			errno: errno,
			target: this.target,
			logs: this.logs
		});
	}
};


module.exports = reply365;

