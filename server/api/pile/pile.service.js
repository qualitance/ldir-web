'use strict';

var Pile = require('./pile.model');

var Q = require('q');

var env = require('../../config/environment');

var pdf = require('html-pdf');
var Mustache = require('mustache');
var fs = require('fs');
var async = require('async');

var amazon = require('../../components/amazon');
var mailer = require('../../components/mailer');
var UtilsService = require('../../components/utils');

exports.addImage = function (pile_id, image_id) {
    var deferred = Q.defer();
    Pile.update({_id: pile_id}, {$addToSet: {images: image_id}}, function (err, wres) {
        if (err) {
            deferred.reject({data: err});
        } else {
            deferred.resolve(wres);
        }
    });
    return deferred.promise;
};

exports.addScreenshot = function (pile_id, image_id) {
    var deferred = Q.defer();
    Pile.update({_id: pile_id}, {screenshot: image_id}, function (err, wres) {
        if (err) {
            deferred.reject({data: err});
        } else {
            deferred.resolve(wres);
        }
    });
    return deferred.promise;
};

exports.removeImage = function (image_id) {
    var deferred = Q.defer();
    Pile.update({images: {$in: [image_id]}}, {$pull: {images: image_id}}, {multi: true}, function (err) {
        if (err) {
            deferred.reject({data: err});
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

exports.getUserId = function (pile_id) {
    var deferred = Q.defer();
    Pile.findOne({_id: pile_id}, function (err, pile) {
        if (err) {
            deferred.reject({data: err});
        } else if (!pile) {
            deferred.reject({code: 'pile_10'});
        } else {
            deferred.resolve(pile.user);
        }
    });
    return deferred.promise;
};

exports.getPileIds = function (user_id, county_id) {
    var deferred = Q.defer();
    if (user_id) {
        var q = {user: user_id};
        if (county_id) q = {$or: [q, {county: county_id}]};
        Pile.distinct('_id', {$and: [q, {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]}]}).exec(function (err, pile_ids) {
            if (err) {
                deferred.reject({data: err});
            } else {
                deferred.resolve(pile_ids);
            }
        });
    } else {
        deferred.reject({code: 'pile_12'});
    }
    return deferred.promise;
};

exports.getPilesIdsInCounty = function (county_id) {
    var deferred = Q.defer();
    if (county_id) {
        Pile.distinct('_id', {$and: [{county: county_id}, {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]}]}).exec(function (err, pile_ids) {
            if (err) {
                deferred.reject({data: err});
            } else {
                deferred.resolve(pile_ids);
            }
        });
    } else {
        deferred.reject({code: 'pile_13'});
    }
    return deferred.promise;
};

exports.countByUserAndStatus = function (user, status) {
    var deferred = Q.defer();
    var query = {status: status};
    if (user.role === 'volunteer') {
        query['user'] = user._id;
    }
    if (user.role === 'supervisor') {
        query['county'] = user.county;
    }

    Pile.count({$and: [query, {$or: [{is_hidden: false}, {is_hidden: {$exists: false}}]}]}, function (err, count) {
        if (err) {
            deferred.reject({data: err});
        } else {
            deferred.resolve(count);
        }
    });
    return deferred.promise;
};

//===================================================================================================================== EXPORT PDF

var createHtmlImages = function (images) {
    var imagesCount = images.length;
    var imageLength = imagesCount === 1 ? 100 : 50;
    var maxHeight = imagesCount < 3 ? 700 : 350;
    var imgHTML = '';
    for (var i = 0; i < imagesCount; i++) {
        imgHTML += '<div class="block' + imageLength + '"><img src="' + images[i].src + '" style="width:100%; max-height: ' + maxHeight + 'px"></div>';
    }
    return imgHTML;
};

var createHtmScreenshot = function (screenshot) {
    var screenshotHTML = '';
    if (screenshot) {
        screenshotHTML += '<img src="' + screenshot.src + '">';
    }
    return screenshotHTML;
};

var formatPileSize = function (pile_size) {
    var idx = pile_size - 1;
    if (idx < 0) idx = 0;
    var sizes = ['foarte mici', 'mici', 'medii', 'mari', 'foarte mari'];
    return sizes[idx];
};

var exportAsPDF = function (pile_id) {
    var deferred = Q.defer();
    Pile.findOne({_id: pile_id}).populate('images county city allocated.authority screenshot').exec(function (err, pile) {
        if (err) {
            deferred.reject({data: err});
        } else if (!pile) {
            deferred.reject({code: 'pile_10'});
        } else if (!pile.allocated || !pile.allocated.authority || !pile.allocated.authority.name) {
            deferred.reject({code: 'pile_14'});
        } else {
            var htmlTemplate = fs.readFileSync('./server/storage/html_templates/pile_report/template.html').toString();
            var signatureTemplate = fs.readFileSync('./server/storage/html_templates/pile_report/signature.html').toString();
            var templateOptions = {
                nr_ord: 'ID' + pile.nr_ord + '_' + pile.allocated.nr_ord,
                authority: {
                    name: pile.city.name.toString()
                },
                pile: {
                    created_at: UtilsService.formatDate(pile.created_at),
                    county: pile.county.name.toString(),
                    city: pile.city.name.toString(),
                    location: {
                        lat: UtilsService.decToDms(pile.location.lat, 'lat'),
                        lng: UtilsService.decToDms(pile.location.lng, 'lng')
                    },
                    size: formatPileSize(pile.size)
                },
                sysdate: UtilsService.formatDate(new Date()),
                signature: signatureTemplate,
                images: createHtmlImages(pile.images),
                screenshot: createHtmScreenshot(pile.screenshot)
            };

            var renderedTemplate = Mustache.render(htmlTemplate, templateOptions);
            var pdfOptions = {
                height: '11.7in',
                width: '8.3in',
                border: '0.3in',
                phantomPath: env.phantomPath
            };
            pdf.create(renderedTemplate, pdfOptions).toBuffer(function (err, buffer) {
                if (err) {
                    console.log(err);
                    deferred.reject({data: err});
                } else {
                    deferred.resolve(buffer);
                }
            });
        }
    });
    return deferred.promise;
};

exports.generateAuthorityReport = function (pile_id) {
    var deferred = Q.defer();
    exportAsPDF(pile_id).then(
        function (buffer) {
            var key = 'authorities/piles/' + pile_id + '.pdf';
            amazon.addObjectS3(key, buffer, function (err, path) {
                if (err) {
                    deferred.reject({data: err});
                } else {
                    Pile.update({_id: pile_id}, {$set: {"allocated.file_path": path}}, function (err) {
                        if (err) {
                            deferred.reject({data: err});
                        } else {
                            deferred.resolve(buffer);
                        }
                    });
                }
            });
        },
        function (err) {
            deferred.reject({data: err});
        }
    );
    return deferred.promise;
};

exports.notifyDueDatePassed = function () {
    var deferred = Q.defer();
    Pile.find({
        "status": 'reported',
        "allocated.due_date": {$lt: Date.now()},
        "allocated.notified": {$ne: true}
    }).populate('allocated.user').exec(function (err, piles) {
        if (err) {
            deferred.reject({data: err});
        } else {
            var emailsSent = 0;
            async.each(piles, function (pile, callback) {
                try {
                    var allocated_by = pile.allocated.user;
                    //email user
                    mailer.sendToExistingUser(
                        allocated_by._id,
                        'pile_due_date_expired_multilang',
                        [{name: 'PILE_NUMBER', content: pile.nr_ord}],
                        'pile_due_date_expired',
                        null,
                        {subject: 'due_date_expired'}
                    ).then(
                        function (success) {
                            emailsSent++;
                            //update pile model
                            Pile.update({_id: pile._id}, {$set: {"allocated.notified": true}}, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback();
                                }
                            });
                        },
                        function (err) {
                            callback(err);
                        }
                    );
                } catch (ex) {
                    callback(ex);
                }
            }, function (err) {
                if (err) {
                    deferred.reject({data: err});
                } else {
                    deferred.resolve(emailsSent);
                }
            });
        }
    });
    return deferred.promise;
};

exports.parseFormData = function (req, res, next) {
    //the "multer" plugin parses our form data request and places any text field on req.body[field]
    if (req.body.pile) {
        req.body = req.body.pile;
    }
    next();
};
