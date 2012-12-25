var usersModule=angular.module("UsersModule",["ngResource"]);usersModule.config(["$routeProvider",function(e){e.when("/users",{templateUrl:"templates/users/index.html",controller:"usersCtrl"}).when("/users/add",{templateUrl:"templates/users/add.html",controller:"userAddCtrl"}).when("/users/detail/:id",{templateUrl:"templates/users/detail.html",controller:"userDetailCtrl"}).when("/users/edit/:id",{templateUrl:"templates/users/detail.html",controller:"userEditCtrl"}).otherwise({redirectTo:"/404"})}]);usersModule.factory("Users",function(e){return e("api/users/:id",{},{query:{method:"GET",isArray:!0}})});usersModule.controller("usersCtrl",function(e,t){e.filters={query:"",orderBy:"firstname",order:!1};e.view="block";e.userDelete=function(n){if(confirm("Delete '"+n.firstname+"' ?")){var r=e.$parent.getUser(n._id),i=jQuery.inArray(r,e.users);e.users.splice(i,1);t.delete({id:n._id})}}});usersModule.controller("userAddCtrl",function(e,t,n){e.newUser={type:"user"};e.addUser=function(){n.save(e.newUser,function(t){e.users.push(t);e.newUser=angular.copy({})});t.path("/users")}});usersModule.controller("userDetailCtrl",function(e,t,n,r){e.user=r.get({id:n.id});e.currentId=n.id});