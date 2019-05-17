<?php
header( 'Content-Type:text/html;charset=utf-8 ');
ini_set("display_errors", "On");
error_reporting(E_ALL | E_STRICT);
include('HTQClient.class.php');

$HTQClient = new HTQClient('sbvrgrgbg10rgye5y5ebfbgdyyhdgsrg','usbvbhu0srfefeafrrgy5rgrgrfrfegsrg');

$ret = $HTQClient->addQueue("php_test2","real_time");
var_dump($ret);

$ret = $HTQClient->addTask("php_test2","http://127.0.0.1/test.php");
var_dump($ret);

$ret = $HTQClient->allQueue();
var_dump($ret);

$ret = $HTQClient->countQueue('php_test2');
var_dump($ret);

//$ret = $HTQClient->deleteQueue("php_test");
//var_dump($ret);