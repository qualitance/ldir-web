'use strict';

var hostname = process.env.VIRTUAL_HOST;

// Production specific configuration
// =================================
module.exports = {

    amazonBucket: '',
    amazonPrefix: '',
    amazonKey: '',
    amazonSecret: '',
    amazonRegion: '',

    mandrill: {
        key: ''
    },
    pushNotifications: {
        server: '',
        userPrefix: '',
        strictSSL: true,
        preventSend: false
    },

    contact: {
        name: 'Lets Do It Romania',
        email: ''
    },

    facebook: {
        clientID: '',
        clientSecret: '',
        callbackURL: '',
        apiURL: process.env.FACEBOOK_API_URL
    },

    pile: {
        min_reported_days: 30
    },

    authorities: {
        mail_from: '',
        default_to: '',
        reply_to: ''
    }
};
