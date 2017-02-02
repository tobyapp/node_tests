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

var bodyParser = require('body-parser')
app.use(bodyParser.json());

var mongoHost = 'localHost'; //A
var mongoPort = 27017;
var collectionDriver;
const errorCode = "400"
const succCode = "200"

var mongoClient = new MongoClient(new Server(mongoHost, mongoPort)); //B
var url = 'mongodb://' + mongoHost + ':' + mongoPort

mongoClient.connect(url, function(err, db) {
	if (err) {
		(console.error("Cannot connect for some reason"));
		process.exit(1);
	}
	assert.equal(null, err);
	console.log("Conncected correctly to server");
  	collectionDriver = new CollectionDriver(db); //F
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/:collection', function(req, res) { //A

console.log("/:collection " + req.params.collection );
var params = req.params; //B
   collectionDriver.findAll(req.params.collection, function(error, objs) { //C
    	  if (error) { res.status(errorCode).send(error); } //D
	      else {
	          if (req.accepts('html')) { //E
    	          res.render('data',{objects: objs, collection: req.params.collection}); //F
			} else {
	          res.set('Content-Type','application/json'); //G
              res.status(succCode).send(objs);
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
          if (error) { res.status(errorCode).send(error); }
          else { res.status(succCode).send(objs); } //K
       });
   } else {
      //res.send(errorCode, {error: 'bad url', url: req.url});
      res.status(errorCode).send({error: 'bad url', url: req.url});
   }
});

app.post('/:collection', function(req, res) { //A
    var object = req.body;
    var collection = req.params.collection
    console.log("collection: " + collection);
    console.log("object" + object);
    collectionDriver.save(collection, object, function(err,docs) {
          if (err) { res.status(errorCode).send(err); }
          else { res.status(succCode).send(docs); } //B
     });
});

app.put('/:collection/:entity', function(req, res) { //A
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       collectionDriver.update(collection, req.body, entity, function(error, objs) { //B
          if (error) { res.status(errorCode).send(error); }
          else { res.status(succCode).send(objs); } //C
       });
   } else {
       var error = { "message" : "Cannot PUT a whole collection" };
       res.status(errorCode).send(error);
   }
});

app.delete('/:collection/:entity', function(req, res) { //A
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       collectionDriver.delete(collection, entity, function(error, objs) { //B
          if (error) { res.status(errorCode).send(error); }
          else { res.status(succCode).send(objs); } //C 200 b/c includes the original doc
       });
   } else {
       var error = { "message" : "Cannot DELETE a whole collection" };
       res.status(succCode).send(error);
   }
});

app.use(function (req,res) { //1
    res.render('404', {url:req.url}); //2
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
