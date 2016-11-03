'use strict';

var hostname = 'http://ldiro.qlt.li';

// Development specific configuration
// ==================================
module.exports = {
    // MongoDB connection options
    mongo: {
        uri: 'mongodb://localhost/ldrweb-dev'
    },

    //INSERT AMAZON CREDENTIALS
    amazonBucket: '',
    amazonPrefix: '',
    amazonKey: 'A',
    amazonSecret: '',

    //INSERT MANDRILL CREDENTIALS
    mandrill: {
        key: ''
    },

    //INSERT PUSH NOTIFICATIONS SERVER URL
    pushNotifications: {
        server: '',
        userPrefix: 'LDIR_TEST_',
        strictSSL: false
    },

    contact: {
        name: 'Lets Do It Romania',
        email: 'primarii@letsdoitromania.ro'
    },

    //INSERT FACEBOOK CREDENTIALS
    facebook: {
        clientID: '',
        clientSecret: '',
        callbackURL: hostname + '/auth/facebook/callback',
        apiURL: process.env.FACEBOOK_API_URL
    },

    temporary_storage: './server/storage/temp/',

    elasticHost: 'http://elasticsearch:9200',

    pile: {
        min_reported_days: 1
    },

    //INSERT SENTRY URL
    sentryUrl: ''

};
