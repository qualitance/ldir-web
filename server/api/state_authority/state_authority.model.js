'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var StateAuthoritySchema = new Schema({
  name: String,
  info: String
});

module.exports = mongoose.model('StateAuthority', StateAuthoritySchema);
