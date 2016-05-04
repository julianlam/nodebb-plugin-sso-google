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

	var authenticationController = module.parent.require('./controllers/authentication');

	var constants = Object.freeze({
		'name': "Google",
		'admin': {
			'route': '/plugins/sso-google',
			'icon': 'fa-google-plus-square'
		}
	});

	var Google = {};

	Google.init = function(data, callback) {
		function render(req, res, next) {
			res.render('admin/plugins/sso-google', {});
		}

		data.router.get('/admin/plugins/sso-google', data.middleware.admin.buildHeader, render);
		data.router.get('/api/admin/plugins/sso-google', render);

		callback();
	}

	Google.getStrategy = function(strategies, callback) {
		meta.settings.get('sso-google', function(err, settings) {
			if (!err && settings['id'] && settings['secret']) {
				passport.use(new passportGoogle({
					clientID: settings['id'],
					clientSecret: settings['secret'],
					callbackURL: nconf.get('url') + '/auth/google/callback',
					passReqToCallback: true
				}, function(req, accessToken, refreshToken, profile, done) {
					if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
						// Save Google-specific information to the user
						User.setUserField(req.user.uid, 'gplusid', profile.id);
						db.setObjectField('gplusid:uid', profile.id, req.user.uid);
						return done(null, req.user);
					}

					Google.login(profile.id, profile.displayName, profile.emails[0].value, profile._json.picture, function(err, user) {
						if (err) {
							return done(err);
						}

						authenticationController.onSuccessfulLogin(req, user.uid);
						done(null, user);
					});
				}));

				strategies.push({
					name: 'google',
					url: '/auth/google',
					callbackURL: '/auth/google/callback',
					icon: constants.admin.icon,
					scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
					prompt: 'select_account'
				});
			}

			callback(null, strategies);
		});
	};

	Google.getAssociation = function(data, callback) {
		User.getUserField(data.uid, 'gplusid', function(err, gplusid) {
			if (err) {
				return callback(err, data);
			}

			if (gplusid) {
				data.associations.push({
					associated: true,
					url: 'https://plus.google.com/' + gplusid + '/posts',
					name: constants.name,
					icon: constants.admin.icon
				});
			} else {
				data.associations.push({
					associated: false,
					url: nconf.get('url') + '/auth/google',
					name: constants.name,
					icon: constants.admin.icon
				});
			}

			callback(null, data);
		})
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
					meta.settings.get('sso-google', function(err, settings) {
						var autoConfirm = settings && settings['autoconfirm'] === "on" ? 1 : 0;
						User.setUserField(uid, 'email:confirmed', autoConfirm);
						// Save google-specific information to the user
						User.setUserField(uid, 'gplusid', gplusid);
						db.setObjectField('gplusid:uid', gplusid, uid);

						// Save their photo, if present
						if (picture) {
							User.setUserField(uid, 'uploadedpicture', picture);
							User.setUserField(uid, 'picture', picture);
						}

						callback(null, {
							uid: uid
						});

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

	Google.deleteUserData = function(data, callback) {
		var uid = data.uid;

		async.waterfall([
			async.apply(User.getUserField, uid, 'gplusid'),
			function(oAuthIdToDelete, next) {
				db.deleteObjectField('gplusid:uid', oAuthIdToDelete, next);
			}
		], function(err) {
			if (err) {
				winston.error('[sso-google] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = Google;
}(module));
