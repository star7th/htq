/**
 * @author  xing7th@gmail.com
 * @website http://www.showdoc.cc/htq
 */

var cp = require('child_process');

run_js("queue.js");
run_js("api.js");



function run_js(js_name){
	child = cp.fork('./'+js_name);

	//监听子进程发送过来的message
	child.on( 'message', ( m) => {
		console.log(message);
	});

	//子进程关闭
	child.on('close',function(code,signal){
		//console.log("run "+js_name)
		run_js(js_name);
	});	
}



