<?php

/**
* 
*/
class HTQClient 
{
	private $htq_addr;
	private $app_key;
	private $app_token;

	function __construct($app_key , $app_token ,$htq_addr = 'http://127.0.0.1:5999')
	{
        $this->htq_addr = $htq_addr;
        $this->app_key = $app_key;
        $this->app_token = $app_token;
	}

	public function addQueue($queue_name,$type,$stepping_time = 0 , $max_time_interval = 0 ){
		$post_data = array(
			"app_key"=>$this->app_key,
			"app_token"=>$this->app_token,
			"queue_name"=>$queue_name,
			"type"=>$type,
			"stepping_time"=>$stepping_time,
			"max_time_interval"=>$max_time_interval,
			);
		$url = $this->htq_addr . '/api/addQueue';
		return $this->_post($url,$post_data);
	}

	public function deleteQueue($queue_name){
		$post_data = array(
			"app_key"=>$this->app_key,
			"app_token"=>$this->app_token,
			"queue_name"=>$queue_name,
			);
		$url = $this->htq_addr . '/api/deleteQueue';
		return $this->_post($url,$post_data);
	}

	public function allQueue(){
		$data = array(
			"app_key"=>$this->app_key,
			"app_token"=>$this->app_token,
			);
		$url = $this->htq_addr . '/api/allQueue';
		return $this->_post($url,$data);
	}

	public function countQueue($queue_name){
		$data = array(
			"app_key"=>$this->app_key,
			"app_token"=>$this->app_token,
			"queue_name"=>$queue_name,
			);
		$url = $this->htq_addr . '/api/countQueue';
		return $this->_post($url,$data);
	}

	public function addTask($queue_name , $url ,$method='GET',$header=[],$data=[], $execute_time = 0 ){
		$post_data = array(
			"app_key"=>$this->app_key,
			"app_token"=>$this->app_token,
			"queue_name"=>$queue_name,
			"url"=>$url,
			"execute_time"=>$execute_time,
            "method"=>$method,
            "header"=>json_encode($header),
            "data"=>json_encode($data)
			);
		$url = $this->htq_addr . '/api/addTask';
		return $this->_post($url,$post_data);
	}


	//post数据
	protected function _post($url,$post_data){
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $url);
		curl_setopt($curl, CURLOPT_POST, 1 );
		curl_setopt($curl, CURLOPT_POSTFIELDS, $post_data);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
	    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);
		$response = curl_exec($curl);
		$result = json_decode($response,true);
		$error = curl_error($curl);
		return $error ? $error : $result;
	}

	//GET
	protected function _get($url,$query_data){
		$query_data = http_build_query($query_data);
		echo $url = $url."?".$query_data ;
	    $curlObj = curl_init();    //初始化curl，
	    curl_setopt($curlObj, CURLOPT_URL, $url);   //设置网址
	    curl_setopt($curlObj, CURLOPT_RETURNTRANSFER, 1);  //将curl_exec的结果返回
	    curl_setopt($curlObj, CURLOPT_SSL_VERIFYPEER, FALSE);
	    curl_setopt($curlObj, CURLOPT_SSL_VERIFYHOST, FALSE);   
	    curl_setopt($curlObj, CURLOPT_HEADER, 0);         //是否输出返回头信息
	    $response = curl_exec($curlObj);   //执行
	    curl_close($curlObj);          //关闭会话
	    return json_decode($response,true);
	}
}