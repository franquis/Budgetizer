<?php
/**
*	@see https://github.com/dready92/PHP-on-Couch !!!
*	@author Franquis franquis@gmail.com
*	@see http://codingthis.com/programming/php/using-the-slim-php-framework-for-developing-rest-apis/
**/

require 'vendor/CouchDB/couch.php';
require 'vendor/CouchDB/couchClient.php';
require 'vendor/CouchDB/couchDocument.php';
require 'vendor/Slim/Slim.php';
require 'vendor/middlewares.php';
require 'vendor/config.php';

\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim($SLIM_CONFIG);

// set a new connector to the CouchDB server
try {
	$db = new couchClient(COUCHDB_URL,COUCHDB_DB);
} catch (Exception $e) {
   $app->flashNow('error',"Connexion to CouchDB failed!<br/><code>{$e->getMessage()}</code>");
}

/* Default settings */
$app->error(function (\Exception $e) use ($app) {
	$req = $app->request();
	if($app->request()->isAjax()) {
		echo $e->getMessage();		
    } else {
		$app->render('error.php',array("error"=>$e->getMessage()));
    }
});
$app->notFound(function () use ($app) {
    $app->render('404.html');
});



$app->add(new \JSONMiddleware());

/* Routes */
$app->get('/', function() use ($app){
	$res = $app->response();
	$app->render('main.html');
});

$app->get('/login',function() use($app){
	$app->render('signin.php');
});
/*
@todo authentification middleware...
*/


/* USERS */
$app->get('/api/users', function () use($app, $db) {
	
	try{
		$view = $db->getView('users','list');
	
		$data = array();
		foreach($view->rows as $u){
			$z = $u->value;
			$z->fullname = "{$z->firstname} {$z->lastname}";

			// Temp

			$z->incomes = rand(0,1000);
			$z->outcomes = rand(-200,0);
			
			$data[] = $z;
		}
		
		echo json_encode($data);

	} catch(Exception $e){
		$app->error($e);
		echo json_encode($e->getMessage());
	}
});

$app->delete('/api/users/:id', function ($id) use($app,$db) {
	try {
		$doc = $db->getDoc($id);
	} catch (Exception $e) {
		echo json_encode(array(
				"status"=>"500",
				"message"=>$e->getMessage(),
				"errorCode"=>$e->getCode()
			)
		);
	}
	
	try {
		$a = $db->deleteDoc($doc);
		echo json_encode($a);
	} catch (Exception $e) {
		echo json_encode(array(
				"status"=>"500",
				"message"=>$e->getMessage(),
				"errorCode"=>$e->getCode()
			)
		);
	}


});
// POST route (update)
$app->post("/api/users/:id",function($id) use($app,$db){
	try {
	    $user = $db->getDoc($id);
	} catch (Exception $e) {
	    echo json_encode(array(
				"status"=>"500",
				"message"=>$e->getMessage(),
				"errorCode"=>$e->getCode()
			)
		);
	}
	try {
		$user_data = json_decode($app->request()->getBody());
		$db->updateDoc();
	
	} catch (Exception $e) {
	    echo json_encode(array(
				"status"=>"500",
				"message"=>$e->getMessage(),
				"errorCode"=>$e->getCode()
			)
		);
	}


});

// POST route (creation)
$app->post('/api/users', function () use($app,$db) {
    $user_data = json_decode($app->request()->getBody());
    $user = new couchDocument($db);
    $user->set($user_data);

    echo json_encode($user->getFields());
});



$app->get('/api/users/:id', function ($id) use($app, $db) {
	
	$req = $app->request();
	$rev = $req->get('rev');
	
	if(isset($rev) && $rev != "undefined" ){
		try {
			$doc = $db->revs()->rev($rev)->getDoc($id);
		} catch ( Exception $e ) {
			if ( $e->getCode() == 404 ) {
			   $doc = array('status'=>404,'message'=>"Document '{$id}' or revision {$rev} does not exist !");
			}
		}
	} else {
		$doc = $db->revs()->getDoc($id);
		$doc->fullname = "{$doc->firstname} {$doc->lastname}";
	}
	
	echo json_encode($doc);
});




/** EVENTS **/

$app->get('/api/events', function () use($app, $db) {
	$view = $db->revs()->getView('events','list');
	
	$data = array();
	foreach($view->rows as $u){
		$data[] = $u->value;
	}
	
	echo json_encode($data);
});

$app->get('/api/events/:id', function ($id) use($app, $db) {
	$req = $app->request();
	$rev = $req->get('rev');
	
	if(isset($rev) && $rev != "undefined" ){
		try {
			$doc = $db->revs()->rev($rev)->getDoc($id);
		} catch ( Exception $e ) {
			if ( $e->getCode() == 404 ) {
			   $doc = array('status'=>404,'message'=>"Document '{$id}' or revision {$rev} does not exist !");
			}
		}
	} else {
		$doc = $db->revs()->getDoc($id);
	}
	
	echo json_encode($doc);
});

$app->post('/api/events', function () use($app,$db) {
    $_event = json_decode($app->request()->getBody());
    $event = new couchDocument($db);
    $event->set($_event);

    echo json_encode($event->getFields());
});








$app->get('/api/tags', function () use($app, $db) {
	$view = $db->getView('tags','list');
	
	$data = array();
	foreach($view->rows as $u){
		$data[] = $u->value;
	}
	
	echo json_encode($data);
});




// POST route
$app->post('/api/tasks', function () use($app,$db) {
    $data = json_decode($app->request()->getBody());
    $document = new couchDocument($db);
    $document->set($data);

    echo json_encode($document->getFields());
});

// PUT route
$app->put('/put', function () {
    echo 'This is a PUT route';
});

// DELETE route
$app->delete('/users/:id', function ($id) {
    echo 'This is a DELETE route';
});

/**
 * Step 4: Run the Slim application
 *
 * This method should be called last. This executes the Slim application
 * and returns the HTTP response to the HTTP db.
 */
$app->run();

