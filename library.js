(function(module) {
	"use strict";

	var User = module.parent.require('./user'),
		meta = module.parent.require('./meta'),
		db = module.parent.require('../src/database'),
		passport = module.parent.require('passport'),
  		passportGoogle = require('passport-google-oauth').OAuth2Strategy,
  		fs = module.parent.require('fs'),
  		path = module.parent.require('path'),
  		nconf = module.parent.require('nconf'),
        async = module.parent.require('async');

	var constants = Object.freeze({
		'name': "Google",
		'admin': {
			'route': '/plugins/sso-google-confirmed',
			'icon': 'fa-google-plus-square'
		}
	});

	var Google = {};

	Google.init = function(data, callback) {
		function render(req, res, next) {
			res.render('admin/plugins/sso-google-confirmed', {});
		}

		data.router.get('/admin/plugins/sso-google-confirmed', data.middleware.admin.buildHeader, render);
		data.router.get('/api/admin/plugins/sso-google-confirmed', render);

		callback();
	}

	Google.getStrategy = function(strategies, callback) {
		meta.settings.get('sso-google-confirmed', function(err, settings) {
			if (!err && settings['id'] && settings['secret']) {
				passport.use(new passportGoogle({
					clientID: settings['id'],
					clientSecret: settings['secret'],
					callbackURL: nconf.get('url') + '/auth/google/callback'
				}, function(accessToken, refreshToken, profile, done) {
					Google.login(profile.id, profile.displayName, profile.emails[0].value, profile._json.picture, function(err, user) {
						if (err) {
							return done(err);
						}
						done(null, user);
					});
				}));

				strategies.push({
					name: 'google',
					url: '/auth/google',
					callbackURL: '/auth/google/callback',
					icon: 'fa-google-plus-square',
					scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
				});
			}

			callback(null, strategies);
		});
	};

	Google.login = function(gplusid, handle, email, picture, callback) {
		Google.getUidByGoogleId(gplusid, function(err, uid) {
			if(err) {
				return callback(err);
			}

			if (uid !== null) {
				// Existing User
				callback(null, {
					uid: uid
				});
			} else {
				// New User
				var success = function(uid) {
					// Save google-specific information to the user
					User.setUserField(uid, 'gplusid', gplusid);
					db.setObjectField('gplusid:uid', gplusid, uid);
					User.setUserField(uid, 'email:confirmed', 1);
					
					// Save their photo, if present
					if (picture) {
						User.setUserField(uid, 'uploadedpicture', picture);
						User.setUserField(uid, 'picture', picture);
					}
					
					callback(null, {
						uid: uid
					});
				};

				User.getUidByEmail(email, function(err, uid) {
					if(err) {
						return callback(err);
					}

					if (!uid) {
						User.create({username: handle, email: email}, function(err, uid) {
							if(err) {
								return callback(err);
							}

							success(uid);
						});
					} else {
						success(uid); // Existing account -- merge
					}
				});
			}
		});
	};

	Google.getUidByGoogleId = function(gplusid, callback) {
		db.getObjectField('gplusid:uid', gplusid, function(err, uid) {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
	};

	Google.addMenuItem = function(custom_header, callback) {
		custom_header.authentication.push({
			"route": constants.admin.route,
			"icon": constants.admin.icon,
			"name": constants.name
		});

		callback(null, custom_header);
	}

	Google.deleteUserData = function(uid, callback) {
		async.waterfall([
			async.apply(User.getUserField, uid, 'gplusid'),
			function(oAuthIdToDelete, next) {
				db.deleteObjectField('gplusid:uid', oAuthIdToDelete, next);
			}
		], function(err) {
			if (err) {
				winston.error('[sso-google-confirmed] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = Google;
}(module));
