'use strict';

var _ = require('lodash');
var Improve = require('./improve.model');

var env = require('../../config/environment');

var ImproveService = require('./improve.service');
var UtilsService = require('../../components/utils');

var isValid = function (field, max_length) {
    return typeof field === "string" && field.length < max_length;
};

/**
 * query:
 - id is the improve id; if specified, the improvement with that id is returned and every other param is ignored, otherwise, all the improvements are returned
 - date_start; if specified, only the impovements reported after date start are returned
 - date_end; if specified, only the impovements reported after date end are returned; both date_start and date_end can be used, or neither.
 - mail_to; if specified, an email report is sent to the address
 * @param req
 * @param res
 */
exports.find = function(req, res) {
    if(req.query.id){
        Improve.findById(req.query.id).populate('user').exec(function (err, improve) {
            if(err) { return handleError(res, err); }
            if(!improve) { return res.handleResponse(404); }
            return res.handleResponse(200, {success: improve});
        });
    }else{
        var date_start = req.query.date_start;
        var date_end = req.query.date_end;
        var page = req.query.page || 1;
        var limit = req.query.limit || env.defaultPaginationLimit;
        var mail_to = req.query.mail_to;

        //parse query object
        var query = {};

        //parse date start / date end into query object
        try{
            var date_query = {};
            if(date_start){
                date_start = new Date(date_start);
                date_query['$gt'] = date_start;
            }
            if(date_end){
                date_end = new Date(date_end);
                date_query['$lt'] = date_end;
            }
            if(!UtilsService.isEmptyObject(date_query)) query.date_added = date_query;
        }catch(ex){
            return res.handleResponse(400, {}, "improve_1");
        }

        //console.log(query);

        var cursor = Improve.find(query).populate('user');

        if(mail_to){
            cursor.exec(function (err, improves) {
                if(err){
                    return handleError(res, err);
                }else{
                    ImproveService.sendByEmail(improves, mail_to, {date_start: date_start, date_end: date_end}).then(
                        function (success) {
                            return res.handleResponse(200);
                        },
                        function (err) {
                            handleError(res, err);
                        }
                    );
                }
            });
        }else{
            cursor.paginate(page, limit, function (err, improves, total) {
                if(err) { return handleError(res, err); }
                res.setHeader('X-Total-Count', total);
                return res.handleResponse(200, {success: improves});
            });
        }
    }
};

/**
 * Create a new improvement to DB
 * @param req
 * @param res
 */
exports.create = function(req, res) {
    if(!isValid(req.body.description, 100) || !isValid(req.body.message, 500)){
        return res.handleResponse(422, {}, "improve_2");
    }
    var improve = new Improve({
        user: req.user._id,
        description: req.body.description,
        message: req.body.message,
        date_added: Date.now()
    });
    improve.save(function(err, improve) {
        if(err) { return handleError(res, err); }
        return res.handleResponse(201, {success: improve});
    });
};

function handleError(res, err) {
    console.log(err);
    return res.handleResponse(500);
}
