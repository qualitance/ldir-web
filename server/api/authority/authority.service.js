'use strict';

var env = require('../../config/environment');

var Authority = require('./authority.model');

var mailer = require('../../components/mailer');

var UtilsService = require('../../components/utils');

var Q = require('q');

/**
 * Check if authority_id is a valid one
 * @param authority_id
 * @param authority_city
 * @returns {*}
 */
exports.validateAuthorityId = function (authority_id, authority_city) {
    var deferred = Q.defer();
    Authority.findOne({_id: authority_id, city: authority_city}, function (err, authority) {
        if(err || !authority){
            deferred.reject({code:"authority_1"});
        }else{
            deferred.resolve(authority._id);
        }
    });
    return deferred.promise;
};

/**
 * Mail to authority the allocated pile
 * @param authority_id
 * @param buffer
 * @returns {*}
 */
exports.sendToAuthority = function (authority_id, buffer) {
  var deferred = Q.defer();
  Authority.findOne({_id: authority_id}).populate("city").exec(function (err, authority) {
    if(err){
      deferred.reject({data:err});
    }else if(!authority){
      deferred.reject({data:authority_id, code:"authority_2"});
    }else{
      var mail_to = authority.fax;
      mailer.send(
        "pile_allocated",
        {
          email: mail_to
        },
        [{
          name: "UAT",
          content: authority.city.name
        }],
        "pile_allocated",
        env.authorities.mail_from,
        {
          attachments: [{
            type: "application/pdf",
            name: "Raportare_primaria_"+authority.city.name+"_"+UtilsService.formatDate(new Date())+".pdf",
            content: buffer.toString('base64')
          }],
          subject: "Let's do It Romania",
          replyTo: env.authorities.reply_to
        }
      ).then(
        function () {
          deferred.resolve();
        },
        function (err) {
          console.log(err);
          deferred.reject({data:err});
        }
      );
    }
  });
  return deferred.promise;
};
