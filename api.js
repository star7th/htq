/**
 * @author  xing7th@gmail.com
 * @website http://www.showdoc.cc/htq
 */
var express = require('express');
var multipart =  require("connect-multiparty"); 
var cookieParser =  require("cookie-parser"); 
var redis = require('redis');
var request = require('request');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json').toString());
var app = express();
var redis_client = redis.createClient(config.redis_port,config.redis_host); //creates a new client

var multipartMiddleware = multipart();

//  首页
app.get('/', function (req, res) {
   res.send('HTQ');
});

//添加队列
app.post('/api/addQueue', multipartMiddleware ,  function (req, res){
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Credentials", "true");
   var queue_name = config.redis_key_prefix+req.body.queue_name;
   var type = req.body.type;
   var post_app_key = req.body.app_key;
   var post_app_token = req.body.app_token;
   var stepping_time = req.body.stepping_time;
   var max_time_interval = req.body.max_time_interval;
   var attribute = {"type":type};
   if (stepping_time) {attribute['stepping_time'] = stepping_time};
   if (max_time_interval) {attribute['max_time_interval'] = max_time_interval};

   if(!check_token(post_app_key,post_app_token)){
   		res.send( '{"error_code":1000,"message":"认证失败"}' );
   		return false;
   }
   //判断是否在哈希表里存在队列名
   redis_client.hexists(config.redis_key_prefix+"queue_list",queue_name,function(err, reply){
		if (!reply) {
			//增加
			redis_client.hmset(config.redis_key_prefix+"queue_list",queue_name,JSON.stringify(attribute) ,function(err, reply){
				if (reply) {
					res.send( '{"error_code":0,"message":"添加成功"}' );
				}else{
					res.send( '{"error_code":1001,"message":"添加失败"}');
				}
			});
		}else{
			res.send( '{"error_code":1002,"message":"队列名已经存在"}');
		}
   });
});

//删除队列
app.post('/api/deleteQueue', multipartMiddleware ,function (req, res){
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Credentials", "true");

   var queue_name = config.redis_key_prefix+req.body.queue_name;
   var type = req.body.type;
   var post_app_key = req.body.app_key;
   var post_app_token = req.body.app_token;
   if(!check_token(post_app_key,post_app_token)){
   		res.send( '{"error_code":1000,"message":"认证失败"}' );
   		return false;
   }
   //判断是否在哈希表里存在队列名
   redis_client.hexists(config.redis_key_prefix+"queue_list",queue_name,function(err, reply){
		if (reply) {
         redis_client.del(queue_name);
			redis_client.del(queue_name+"_times");
			redis_client.hdel(config.redis_key_prefix+"queue_list",queue_name ,function(err, reply){
				redis_client.del(queue_name);
				if (reply) {
					res.send( '{"error_code":0,"message":"删除成功"}' );
				}else{
					res.send( '{"error_code":1004,"message":"删除失败"}');
				}

			});
		}else{
			res.send( '{"error_code":1003,"message":"队列不存在，请先创建"}');
		}
   });
});

//获取所有队列
app.post('/api/allQueue', multipartMiddleware , function (req, res){
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Credentials", "true");

   var queue_name = config.redis_key_prefix+req.body.queue_name;
   var type = req.body.type;
   var post_app_key = req.body.app_key;
   var post_app_token = req.body.app_token;
   if(!check_token(post_app_key,post_app_token)){
         res.send( '{"error_code":1000,"message":"认证失败"}' );
         return false;
   }

   redis_client.hscan(config.redis_key_prefix+"queue_list",0,function(err, reply){
      var queue_list = reply[1] ;
      var return_queue_list = [] ;
      if (queue_list) {
         for (var i = 0; i < queue_list.length; i=i+2) {
            var queue_name = queue_list[i];
            queue_name = queue_name.replace(config.redis_key_prefix,'');
            var attribute = JSON.parse(queue_list[i+1]);
            var queue = {"queue_name":queue_name,"attribute":attribute};
            return_queue_list.push(queue) ;
         };
      };
      res.send(JSON.stringify(return_queue_list));
   });

});

//获取某个队列当前的任务数
app.post('/api/countQueue', multipartMiddleware , function (req, res){
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow+-Credentials", "true");

   var queue_name = config.redis_key_prefix+req.body.queue_name;
   var type = req.body.type;
   var post_app_key = req.body.app_key;
   var post_app_token = req.body.app_token;
   if(!check_token(post_app_key,post_app_token)){
         res.send( '{"error_code":1000,"message":"认证失败"}' );
         return false;
   }

   redis_client.zcard(queue_name,function(err, reply){
      //res.send(reply);
      var count = parseInt(reply);
      res.send('{"error_code":0,"count":'+count+'}');
   });

});


//为某个队列添加任务
app.post('/api/addTask', multipartMiddleware ,function (req, res){
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Credentials", "true");

   var queue_name = req.body.queue_name ? config.redis_key_prefix+req.body.queue_name : config.redis_key_prefix+"default_queue";
   var url = req.body.url;
   var post_app_key = req.body.app_key;
   var post_app_token = req.body.app_token;
   var execute_time = req.body.execute_time;
   var json={};
   if(!check_token(post_app_key,post_app_token)){
   		res.send('{"error_code":1000,"message":"认证失败"}');
   		return false;
   }
   //判断是否在哈希表里存在队列名
   redis_client.hexists(config.redis_key_prefix+"queue_list",queue_name,function(err, reply){
		if (!reply) {
			//res.send('{"error_code":1003,"message":"队列不存在，请先创建"}');
         //若不存在，则默认创建
         var attribute = {"type":"real_time"};
         redis_client.hmset(config.redis_key_prefix+"queue_list",queue_name,JSON.stringify(attribute));
		}

      if (check_dateTime(execute_time)) {
         var score = Date.parse(execute_time);
      }else{
         var score = Date.parse();
      }

      if (url.indexOf("?") > -1 ) {
            url += "&htq_no_repeat="+score+Math.random().toFixed(4);
      }else{
            url += "?htq_no_repeat="+score+Math.random().toFixed(4);
      }

      json['url']=url;
      redis_client.zadd(queue_name,score,JSON.stringify(json),function(err, reply){
         if (reply) {
            res.send( '{"error_code":0,"message":"添加成功"}');
         }else{
            res.send('{"error_code":1001,"message":"添加失败"}');
         }
         
      });

   });

	
});

function check_token(post_app_key,post_app_token){
	if (post_app_key == config.app_key && post_app_token ==  config.app_token) {
		return true;
	}else{
		return false;
	}
}

/**
 * 判断是否合法日期
 * @param str
 * @returns {boolean}
 */
function check_dateTime(str)
{
    var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    var r = str.match(reg);
    if(r==null)return false;
    var d= new Date(r[1], r[3]-1,r[4],r[5],r[6],r[7]);
    return (d.getFullYear()==r[1]&&(d.getMonth()+1)==r[3]&&d.getDate()==r[4]&&d.getHours()==r[5]&&d.getMinutes()==r[6]&&d.getSeconds()==r[7]);
}

var server = app.listen(config.api_port, function () {

  var host = server.address().address;
  host = host != '::' ? host : '127.0.0.1';
  var port = server.address().port ;
  console.log("APi服务已经启动，访问地址为 http://%s:%s", host, port);

});




