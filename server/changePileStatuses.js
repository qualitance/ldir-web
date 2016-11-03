process.env.NODE_ENV = process.env.NODE_ENV || "development";
var config = require('./config/environment');

var mongoose = require('mongoose');

// connect to DB
mongoose.connect(config.mongo.uri, config.mongo.options);

var Pile = require('./api/pile/pile.model');

console.log("Start updating piles from status allocated to status pending...");

Pile.update({status: "allocated"}, {$set: {status: "pending"}}, {multi: true}, function(err, wRes){
    if(err){
        console.log(err);
        process.exit(1);
    }else{
        console.log("Updated " + wRes + " piles");
        process.exit(0);
    }
});