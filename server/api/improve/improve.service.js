'use strict';

var Q = require('q');

var env = require('../../config/environment');

var pdf = require('html-pdf');
var Mustache = require('mustache');
var fs = require('fs');

var amazon = require('../../components/amazon');
var UtilsService = require('../../components/utils');
var mailer = require('../../components/mailer');

var fillTemplate = function (template, vars) {
    return Mustache.render(template, vars);
};

/**
 * @name generateIssuesTable
 * @function
 * @description generates table with improve records
 * @param {Array} improves
 * @returns {String} ret
 */
var generateIssuesTable = function (improves) {
    var ret = '';
    var singeIssueTemplate, templateVars;
    singeIssueTemplate = fs.readFileSync('./server/storage/html_templates/issues_report/single_issue.html').toString();
    for (var i = 0; i < improves.length; i++) {
        templateVars = {
            nr_ord: i + 1,
            title: improves[i].message,
            description: improves[i].description
        };
        ret += fillTemplate(singeIssueTemplate, templateVars);
    }
    return ret;
};

/**
 * @name renderPDF
 * @function
 * @description generates pdf with improves table in given date range
 * @param {Array} improves
 * @param {Object} dates
 * @returns {Promise}
 */
var renderPDF = function (improves, dates) {
    var deferred = Q.defer();
    var htmlTemplate = fs.readFileSync('./server/storage/html_templates/issues_report/template.html').toString();
    var templateOptions = {
        issues: generateIssuesTable(improves),
        date_start: UtilsService.formatDate(dates.date_start, {language: 'en'}),
        date_end: UtilsService.formatDate(dates.date_end, {language: 'en'})
    };
    var renderedTemplate = fillTemplate(htmlTemplate, templateOptions);
    var pdfOptions = {format: 'Letter', phantomPath: env.phantomPath};
    pdf.create(renderedTemplate, pdfOptions).toBuffer(function (err, buffer) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            deferred.resolve(buffer);
        }
    });
    return deferred.promise;
};

/**
 * @name uploadPDF
 * @function
 * @description uploads pdf to S3
 * @param {Array} improves
 * @param {Object} dates
 * @returns {Promise}
 */
var uploadPDF = function (improves, dates) {
    var deferred = Q.defer();
    renderPDF(improves, dates).then(
        function (buffer) {
            var dateOptions = {
                dateSeparator: '_',
                includeTime: true,
                includeTimeOffset: true
            };
            var date = UtilsService.formatDate(new Date(), dateOptions);
            var key = 'issues/exports/' + date + '.pdf';
            amazon.addObjectS3(key, buffer, function (err, path) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(path);
                }
            })
        },
        function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};

/**
 * @name sendByEmail
 * @function
 * @description sends email with upload link
 * @param {Array} improves
 * @param {Object} mail_to
 * @param {Object} dates
 * @returns {Promise}
 */
exports.sendByEmail = function (improves, mail_to, dates) {
    var deferred = Q.defer();
    mail_to = mail_to.split(',');
    var formattedEmails = [];
    for (var i = 0; i < mail_to.length; i++) formattedEmails.push({email: mail_to[i]});
    uploadPDF(improves, dates).then(
        function (path) {
            mailer.send(
                'issues_export',
                formattedEmails,
                [{name: 'DOWNLOAD_LINK', content: path}],
                ['issues_export'],
                null,
                {subject: 'Issues report'}
            ).then(
                function () {
                    deferred.resolve('Email sent');
                },
                function (err) {
                    deferred.reject(err);
                }
            );
        },
        function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};
