#!/usr/bin/env nodejs

var http = require('http');
var express = require('express');
path = require('path');
var assert = require('assert');

MongoClient = require('mongodb').MongoClient,
Server = require('mongodb').Server,
CollectionDriver = require('./collectionDriver').CollectionDriver;

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


var mongoHost = 'localHost'; //A
var mongoPort = 27017; 
var collectionDriver;
 
var mongoClient = new MongoClient(new Server(mongoHost, mongoPort)); //B
var url = 'mongodb://' + mongoHost + ':' + mongoPort 

mongoClient.connect(url, function(err, db) {
	if (err) {
		(console.error("Cannot connect for some reason"));
		process.exit(1);
	}
	assert.equal(null, err);
	console.log("Conncected correctly to server");
	//var db = mongoClient.db("MyDatabase");  //E
  	collectionDriver = new CollectionDriver(db); //F
});

//mongoClient.open(function(err, mongoClient) { //C
//  if (!mongoClient) {
//      console.error("Error! Exiting... Must start MongoDB first");
//      process.exit(1); //D
//  }
//  var db = mongoClient.db("MyDatabase");  //E
//  collectionDriver = new CollectionDriver(db); //F
//});


app.use(express.static(path.join(__dirname, 'public')));

app.get('/:collection', function(req, res) { //A

console.log("/:collection " + req.params.collection );   
var params = req.params; //B
   collectionDriver.findAll(req.params.collection, function(error, objs) { //C
    	  if (error) { res.send(400, error); } //D
	      else { 
	          if (req.accepts('html')) { //E
    	          res.render('data',{objects: objs, collection: req.params.collection}); //F              
			} else {
	          res.set('Content-Type','application/json'); //G
            	res.send(200, objs); //H
              }
         }
   	});
});
 
app.get('/:collection/:entity', function(req, res) { //I
   
console.log("/:collection/:entity " + req )
   var params = req.params;
   var entity = params.entity;
   var collection = params.collection;
   if (entity) {
       collectionDriver.get(collection, entity, function(error, objs) { //J
          if (error) { res.send(400, error); }
          else { res.send(200, objs); } //K
       });
   } else {
      res.send(400, {error: 'bad url', url: req.url});
   }
});

app.use(function (req,res) { //1
    res.render('404', {url:req.url}); //2
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
