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
require 'vendor/exceptions.php';
require 'vendor/config.php';

\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim($SLIM_CONFIG);

// set a new connector to the CouchDB server
try {
	$app->db = new couchClient(COUCHDB_URL,COUCHDB_DB);
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
$app->get('/api/users', function () use($app) {
	
	try{
		$view = $app->db->getView('users','list');
	
		$data = getItems($view);

		foreach($data as &$z){
			$z->fullname = "{$z->firstname} {$z->lastname}";

			$z->incomes = rand(0,1000);
			$z->outcomes = rand(-200,0);
		}
		
		echo json_encode($data);

	} catch(Exception $e){
		$app->error($e);
		echo json_encode($e->getMessage());
	}
});

$app->delete('/api/users/:id', function ($id) use($app) {
	try {
		$doc = $app->db->getDoc($id);
	} catch (Exception $e) {
		echo json_encode(array(
				"status"=>"500",
				"message"=>$e->getMessage(),
				"errorCode"=>$e->getCode()
			)
		);
	}
	
	try {
		$a = $app->db->deleteDoc($doc);
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
$app->post("/api/users/:id",function($id) use($app){
	try {
	    $user = $app->db->getDoc($id);
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
		$app->db->updateDoc();
	
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
$app->post('/api/users', function () use($app) {
    $user_data = json_decode($app->request()->getBody());
    $user = new couchDocument($app->db);
    $user->set($user_data);

    echo json_encode($user->getFields());
});



$app->get('/api/users/:id', function ($id) use($app) {
	$doc = $app->db->revs()->getDoc($id);
	
	if($doc->type == "user"){
		$doc->fullname = "{$doc->firstname} {$doc->lastname}";
	} else {
		$app->error(new BadTypeException("User",0));
	}
	
	echo json_encode($doc);
});




/** EVENTS **/

$app->get('/api/events', function () use($app) {
	$eventsView = $app->db->revs()->getView('events','list');
	$events = getItems($eventsView);
	
	foreach($events as &$event){
		$event->expenses = fetchExpenses($app, $event->_id);
	}

	echo json_encode($events);
});

$app->get('/api/events/:id', function ($id) use($app) {
	
	$doc = $app->db->revs()->getDoc($id);
	if($doc->type == "event"){
		$doc->expenses = fetchExpenses($app, $id);
		echo json_encode($doc);
	} else {
		$app->error(new BadTypeException("Event",0));
	}
	
});

$app->post('/api/events', function () use($app) {
    $_event = json_decode($app->request()->getBody());
    $event = new couchDocument($app->db);
    $event->set($_event);

    echo json_encode($event->getFields());
});

/** EXPENSES **/

$app->get('/api/expenses', function () use($app) {
	$view = $app->db->revs()->getView('expenses','list');
	
	$data = getItems($view);
	echo json_encode($data);
});

$app->get('/api/expenses/:id', function ($id) use($app) {
	
	$doc = $app->db->revs()->getDoc($id);
	
	if($doc->type == "expense"){
		echo json_encode($doc);
	} else {
		$app->error(new BadTypeException("Expense",0));
	}
});

$app->post('/api/expenses', function () use($app) {
    $_obj = json_decode($app->request()->getBody());
    $obj = new couchDocument($app->db);
    $obj->set($_obj);

    echo json_encode($obj->getFields());
});

$app->delete('/api/expenses/:id', function ($id) use($app) {
	try {
		$doc = $app->db->getDoc($id);
	} catch (Exception $e) {
		echo json_encode(array(
				"status"=>"500",
				"message"=>$e->getMessage(),
				"errorCode"=>$e->getCode()
			)
		);
	}
	
	try {
		$a = $app->db->deleteDoc($doc);
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

/** Returns the revision of a document **/
$app->get('/api/rev/:id',function($id) use($app) {
	$req = $app->request();
	$rev = $req->get('rev');

	if(isset($rev) && $rev != "undefined" ){
		try {
			$doc = $app->db->revs()->rev($rev)->getDoc($id);
		} catch ( Exception $e ) {
			if ( $e->getCode() == 404 ) {
			   $doc = array('status'=>404,'message'=>"Document '{$id}' or revision {$rev} does not exist !");
			}
		}
	}

	echo json_encode($doc);

});

// PUT route
$app->put('/put', function () {
    echo 'This is a PUT route';
});

// DELETE route
$app->delete('/users/:id', function ($id) {
    echo 'This is a DELETE route';
});


$app->run();

/** HELPERS **/

function getItems($items){
	$data = array();
	foreach ($items->rows as $row) {
		$data[] = $row->value;
	};
	return $data;
}
/**
*	retourne les dépenses associées à l'évenement dont l'id est passé en paramètre
*	@return array 
**/
function fetchExpenses($app, $EventId = null){
	$result = array();
	$expensesView = $app->db->getView('expenses','list');
	foreach(getItems($expensesView) as $expense){
		if(isset($expense->event_id) && $expense->event_id  == $EventId){
			$result[] = $expense->_id;
		}
	};

	return $result;
}