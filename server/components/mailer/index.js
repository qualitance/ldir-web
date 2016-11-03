var config = require('../../config/environment');
var mandrill = require('mandrill-api/mandrill');
var mc = new mandrill.Mandrill(config.mandrill.key);
var Q = require('q');
var env = require('../../config/environment');

var UtilsService = require('../utils');

var MailSubjects = require('../../storage/language/emailSubjects');

var VariableTranslations = {
    "NEW_ROLE": require('../../storage/language/userRoles'),
    "NEW_USER_STATUS": require('../../storage/language/userStatuses'),
    'NEW_PILE_STATUS': require('../../storage/language/pileStatuses')
};

var send = function (template, to, vars, tags, from, options) {

    //validate params
    if (typeof tags === 'string') {
        tags = [tags];
    }
    if (!UtilsService.isArray(to)) {
        to = [to];
    }
    options = options || {};

    var params = {
        'template_name': template,
        'template_content': [],
        'message': {
            'to': to,
            'important': true,
            'track_opens': null,
            'track_clicks': null,
            'auto_text': null,
            'auto_html': null,
            'inline_css': null,
            'url_strip_qs': null,
            'preserve_recipients': null,
            'view_content_link': null,
            'tracking_domain': null,
            'signing_domain': null,
            'return_path_domain': null,
            'merge': true,
            'global_merge_vars': vars,
            'tags': tags,
            'headers': {}
        },
        'async': true
    };

    if (from) {
        if (from.email) {
            params.message.from_email = from.email;
            params.message.from_name = from.name;
        } else {
            params.message.from_email = from;
        }
    } else {
        params.message.from_email = env.contact.email;
        params.message.from_name = env.contact.name;
    }

    if (options.attachments) {
        params.message.attachments = options.attachments;
    }
    if (options.subject) {
        params.message.subject = options.subject;
    }
    if (options.replyTo) {
        params.message.headers['Reply-To'] = options.replyTo;
    }

    var deferred = Q.defer();

    mc.messages.sendTemplate(params, function (result) {
        deferred.resolve(result);
    }, function (err) {
        deferred.reject(err);
    });

    return deferred.promise;

};

exports.send = send;

var sendToExistingUser = function (user_id, template, vars, tags, from, options) {
    var User = require('../../api/user/user.model');
    var deferred = Q.defer();

    var newsletterTemplates = ['pile_status_changed'];

    User.findOne({_id: user_id}, function (err, user) {
        if (err) {
            deferred.reject({data: err});
        } else if (!user) {
            deferred.reject({code: 'mailer_1'});
        } else if ((newsletterTemplates.indexOf(template) >= 0 && user.flags.newsletter) || newsletterTemplates.indexOf(template) < 0) {
            vars = vars || [];
            vars.push({name: 'FIRST_NAME', content: user.first_name});
            vars.push({name: 'LAST_NAME', content: user.last_name});
            vars.push({name: 'LANG', content: user.language});
            vars = tranlateVariables(vars, user.language);
            //get the translated subject
            if (options.subject) {
                options.subject = MailSubjects[user.language][options.subject]
            }
            send(
                template,
                {name: user.first_name + ' ' + user.last_name, email: user.email},
                vars,
                tags,
                from,
                options
            ).then(
                function (success) {
                    deferred.resolve(success);
                },
                function (err) {
                    deferred.reject({data: err});
                }
            );
        } else {
            deferred.reject({code: 'mailer_2'});
        }
    });
    return deferred.promise;
};

function tranlateVariables(vars, lang) {
    vars = vars || [];
    for (var i = 0; i < vars.length; i++) {
        var name = vars[i].name;
        if (VariableTranslations[name]) {
            vars[i].content = VariableTranslations[name][lang][vars[i].content];
        }
    }
    return vars;
}

exports.sendToExistingUser = sendToExistingUser;

exports.events = {
    roleChanged: function (user_id, new_role) {
        sendToExistingUser(
            user_id,
            'user_role_changed_multilang',
            [{name: 'NEW_ROLE', content: new_role}],
            ['user_role_changed'],
            null,
            {subject: 'role_changed'}
        );
    },
    statusChanged: function (user_id, new_status) {
        sendToExistingUser(
            user_id,
            'user_status_changed_multilang',
            [{name: 'NEW_USER_STATUS', content: new_status}],
            ['user_status_changed'],
            null,
            {subject: 'user_status_changed'}
        );
    },
    pileStatusChanged: function (owner_id, new_status) {
        sendToExistingUser(
            owner_id,
            'pile_status_changed_multilang',
            [{name: 'NEW_PILE_STATUS', content: new_status}],
            ['pile_status_changed'],
            null,
            {subject: 'pile_status_changed'}
        );
    }
};
