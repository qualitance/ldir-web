'use strict';

var Comment = require('./comment.model');

/**
 * Returns an array of all the comments for the pile with the specified ID
 * @param req
 * @param res
 */
exports.show = function (req, res) {
    if(req.query.pile){
        Comment.find({pile: req.query.pile}, function (err, comments) {
            if(err){
                res.handleResponse(500);
            }else{
                res.handleResponse(200, {success: comments});
            }
        });
    }else{
        res.handleResponse(400);
    }
};

/**
 * Adds a comment to the pile with the specified id. The owner of the comment is the user making the query
 * @param req
 * @param res
 */
exports.create = function (req, res) {
    if(req.query.pile){
        //TODO: exclude "images" field from body
        var comment = new Comment(req.body);
        comment.user = req.user._id;
        comment.pile = req.query.pile;
        comment.created_at = Date.now();
        comment.save(function (err, comment) {
            if(err){
                res.handleResponse(500, {error: err});
            }else{
                res.handleResponse(200, {success: comment});
            }
        });
    }else{
        res.handleResponse(400);
    }
};
