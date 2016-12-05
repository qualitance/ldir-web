'use strict';

var mongoose = require('mongoose'),
    mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['facebook'];

var Image = require('../image/image.model');
var County = require('../county/county.model');

var MailService = require('../../components/mailer');

var env = require('../../config/environment');

var deepPopulate = require('mongoose-deep-populate');

var UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    lowercase: true
  },
  phone: {type: String, select: false},
  address: {type: String, select: false},
  created_at: {
    type: Date,
    default: Date.now,
    es_indexed: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    es_indexed: true
  },
  image: {
    type: Schema.Types.ObjectId,
    ref: 'Image',
    select: false
  },
  county: {
    type: Schema.Types.ObjectId,
    ref: 'County',
    es_indexed: true
  },
  pile_count: {
    type: Number,
    default: 0,
    es_indexed: true
  },
  role: {
    type: String,
    enum: ['volunteer', 'supervisor', 'admin'],
    default: 'volunteer',
    es_indexed: true
  },
  status: {
    type: String,
    default: 'pending',
    es_indexed: true
  },
  deactivatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
  },
  // retine daca userul are parola setata
  pass: {
    type: Boolean,
    default: false
  },
  flags: {
      // retine daca userul accepta sa primeasca newslettere
      newsletter: {
          type: Boolean,
          default: true
      },
      // retine daca userul accepta sa primeasca notificari pe telefon
      receivePushNotifications: {
          type: Boolean,
          default: true
      },
      // retine daca userul accepta cache & sync pentru harta
      sync: {
          type: Boolean,
          default: true
      },
      //remembers status of viewed initial presentations on mobile and web app
      viewedPresentations: {
          mobile: {
              type: Boolean,
              default: false
          },
          web: {
              type: Boolean,
              default: false
          }
      }
  },
  hashedPassword: {type: String, select: false},
  provider: {
      type: String,
      es_indexed: true
  },
  salt: {type: String, select: false},
  facebook: {type: Object, select: false},
  temporaryToken: {
      token: {type: String, select: false},
      expires: {type: Date, select: false}
  },
  createToken: {type: String, select: false},
  language: {type: String, default: "ro", enum: ["ro", "en"]},
});



/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
    if(this.hashedPassword) this.pass = true;
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'first_name': this.first_name,
      'last_name': this.last_name,
      'role': this.role,
      'status': this.status
    };
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty email
UserSchema
  .path('email')
  .validate(function(email) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    if(typeof email === 'string' && email.length > 0){
        return true;
    }else{
        return false;
    }
  }, 'Email cannot be blank');

// Validate email is not taken
UserSchema
  .path('email')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({email: value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified email address is already in use.');

var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */

UserSchema.post('init', function () {
    //remember current role, so that we can verify whether it was changed or not
    this.oldRole = this.role;
    this.oldStatus = this.status;
});

UserSchema.pre('save', function (next) {
  if(this.oldStatus && this.oldStatus !== this.status && this.status === "inactive" && this.updatedBy) {
      this.deactivatedBy = this.updatedBy._id;
  }
  this.updated_at = new Date();
  next();
});

UserSchema.post('save', function () {
    if(this.oldRole && this.oldRole !== this.role){
        MailService.events.roleChanged(this._id, this.role);
    }
    if(this.oldStatus && this.oldStatus !== this.status){
        MailService.events.statusChanged(this._id, this.status);
    }
});

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {

    var encryptedPass = this.encryptPassword(plainText);
    return encryptedPass && (encryptedPass === this.hashedPassword);
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64').replace(/[^\w\s]/gi, '');
  },

    generateTemporaryToken: function () {
        return {
            token: crypto.randomBytes(32).toString('base64').replace(/[^\w\s]/gi, ''),
            expires: Date.now() + 3600000 //1 hour from now
        };
    },

    generateCreateToken: function () {
        return crypto.randomBytes(64).toString('base64').replace(/[^\w\s]/gi, '');
    },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};
UserSchema.plugin(deepPopulate, {
    whitelist: ["county", "image", "county.country"]
});

//elastic search setup
UserSchema.plugin(mongoosastic, {hosts: [env.elasticHost]});

module.exports = mongoose.model('User', UserSchema);
