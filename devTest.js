/**
 * @author  xing7th@gmail.com
 * @website http://www.showdoc.cc/htq
 */

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json').toString());
const express = require('express');
const bodyParser =  require("body-parser"); 
const redis = require('redis');
const request = require('request');
const asyncRedis = require("async-redis");
const client = asyncRedis.createClient(config.redis_port,config.redis_host);
const fetch = require("node-fetch");

const redis_client = asyncRedis.createClient(config.redis_port,config.redis_host); //creates a new client
console.log("后台队列服务已经启动，随时等待新队列任务");
var queue_status_array = [];

async function check_queue_hash(){
	var reply = await redis_client.hscan(config.redis_key_prefix+"queue_list",0);
	//console.log(reply[1]);
	var queue_list = reply[1] ;

	var cur_time = Date.parse(new Date());
	var reply =  await redis_client.zrangebyscore(queue_list[0],0,cur_time,'LIMIT',0,1);
	//console.log(reply);
	var request_url = "http://127.0.0.1/test.php";
	let response = await fetch(request_url,{ timeout : 30*1000});
	let body = await response.text();
	
	console.log(body);
}


check_queue_hash() ;


