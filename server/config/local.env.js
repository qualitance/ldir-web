'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
    SESSION_SECRET: 'ldrweb-secret',

    FACEBOOK_API_URL: 'https://graph.facebook.com/v2.3/',

    // Control debug level for modules using visionmedia/debug
    DEBUG: ''
};
