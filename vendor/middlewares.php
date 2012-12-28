<?php
require 'Slim/Middleware.php';

class AuthMiddleware extends \Slim\Middleware {

	public function call() {
		$this->next->call();
	}
}

class JSONMiddleware extends \Slim\Middleware{
    
    public function call()
    {
        //The Slim application
        $app = $this->app;

        //The Environment object
        $env = $app->environment();

        //The Request object
        $req = $app->request();
        
        //The Response object
        $res = $app->response();
        

        if($req->isAjax()){
        	$res['Content-Type'] = "application/json";
        } else {
            $res['Content-Type'] = "text/html";
        }

        $this->next->call();
    }
}


?>