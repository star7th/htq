
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
		run_js(js_name);
	});	
}



