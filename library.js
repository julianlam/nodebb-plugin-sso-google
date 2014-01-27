(function(module) {
	"use strict";

	var User = module.parent.require('./user'),
		db = module.parent.require('../src/database'),
		passport = module.parent.require('passport'),
  		passportGoogle = require('passport-google-oauth').OAuth2Strategy,
  		fs = module.parent.require('fs'),
  		path = module.parent.require('path'),
  		nconf = module.parent.require('nconf');

	var constants = Object.freeze({
		'name': "Google",
		'admin': {
			'route': '/google',
			'icon': 'fa-google-plus-square'
		}
	});

	var Google = {};

	Google.getStrategy = function(strategies) {
		if (meta.config['social:google:id'] && meta.config['social:google:secret']) {
			passport.use(new passportGoogle({
				clientID: meta.config['social:google:id'],
				clientSecret: meta.config['social:google:secret'],
				callbackURL: nconf.get('url') + '/auth/google/callback'
			}, function(accessToken, refreshToken, profile, done) {
				Google.login(profile.id, profile.displayName, profile.emails[0].value, function(err, user) {
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
				icon: 'google-plus',
				scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
			});
		}

		return strategies;
	};

	Google.login = function(gplusid, handle, email, callback) {
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

	Google.addMenuItem = function(custom_header) {
		custom_header.authentication.push({
			"route": constants.admin.route,
			"icon": constants.admin.icon,
			"name": constants.name
		});

		return custom_header;
	}

	Google.addAdminRoute = function(custom_routes, callback) {
		fs.readFile(path.resolve(__dirname, './static/admin.tpl'), function (err, template) {
			custom_routes.routes.push({
				"route": constants.admin.route,
				"method": "get",
				"options": function(req, res, callback) {
					callback({
						req: req,
						res: res,
						route: constants.admin.route,
						name: constants.name,
						content: template
					});
				}
			});

			callback(null, custom_routes);
		});
	};

	module.exports = Google;
}(module));