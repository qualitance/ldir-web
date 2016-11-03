'use strict';

var path = require('path');
var _ = require('lodash');

var hostname = process.env.VIRTUAL_HOST;
function requiredProcessEnv(name) {
    if (!process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
    env: process.env.NODE_ENV,
    staticSite: process.env.STATIC_SITE,
    contact: {
        name: 'Lets Do It Romania',
        email: 'registruldeseurilor@letsdoitromania.ro'
    },

    // Authorities contact config
    authorities: {
        mail_from: 'primarii@letsdoitromania.ro',
        default_to: 'primaria@mailinator.com',
        reply_to: 'primaria@mailinator.com'
    },

    // Server IP
    ip: process.env.OPENSHIFT_NODEJS_IP ||
    process.env.IP ||
    undefined,

    //INSERT MANDRILL CREDENTIALS
    mandrill: {
        key: '' // prevent email sending by using a test key
    },
    // Root path of server
    root: path.normalize(__dirname + '/../../..'),

    // Server port
    port: process.env.PORT || 80,

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'ldr-web-secret'
    },

    //INSERT PUSH NOTIFICATIONS SERVER URL
    pushNotifications: {
        server: '',
        userPrefix: 'LDIR_SANDBOX_',
        strictSSL: true,
        preventSend: true
    },

    // List of user roles
    userRoles: ['volunteer', 'supervisor', 'admin'],

    // MongoDB connection options
    mongo: {
        uri: 'mongodb://mongo1,mongo2,mongo3/ldirweb-dev?replicaSet=rs&readPreference=primaryPreferred'
    },

    //INSERT AMAZON CREDENTIALS
    amazonBucket: '',
    amazonPrefix: '',
    amazonKey: '',
    amazonSecret: '',
    amazonRegion: '',

    images: {
        thumbnail_size: {
            width: 100,
            height: 100
        },
        image_size: {
            width: 800,
            height: 600
        },
        target_ratio: 1.33, // 4:3
        max_size: 10 * 1024 * 1024 // 10 Mb
    },

    defaultPaginationLimit: 10,

    phantomPath: './node_modules/phantomjs/lib/phantom/bin/phantomjs',

    //INSERT SENTRY URL
    sentryUrl: '',

    formDataParser: {
        fileSaveLocation: 'uploads/',
        fileUploadLimit: 3
    },

    //INSERT FACEBOOK CREDENTIALS
    facebook: { // use dev credentials for facebook
        clientID: '',
        clientSecret: '',
        callbackURL: hostname + '/auth/facebook/callback',
        apiURL: process.env.FACEBOOK_API_URL
    },
    temporary_storage: './server/storage/temp/',
    kue: {
        port: 6379,
        host: 'redis'
    },
    elasticHost: 'http://elasticsearch:9200',

    pile: {
        min_reported_days: 30
    }

};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
    require('./' + process.env.NODE_ENV + '.js') || {});
