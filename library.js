'use strict';

(function (module) {
	const User = require.main.require('./src/user');
	const meta = require.main.require('./src/meta');
	const db = require.main.require('./src/database');
	const passport = require.main.require('passport');
	const passportGoogle = require('passport-google-oauth20').Strategy;
	const nconf = require.main.require('nconf');
	const async = require.main.require('async');
	const winston = require.main.require('winston');

	const authenticationController = require.main.require('./src/controllers/authentication');

	const constants = Object.freeze({
		name: 'Google',
		admin: {
			route: '/plugins/sso-google',
			icon: 'fa-google-plus-square',
		},
	});

	const Google = {
		settings: {
			id: process.env.SSO_GOOGLE_CLIENT_ID || undefined,
			secret: process.env.SSO_GOOGLE_CLIENT_SECRET || undefined,
			autoconfirm: 0,
			style: 'light',
			disableRegistration: false,
		},
	};

	Google.init = function (data, callback) {
		const hostHelpers = require.main.require('./src/routes/helpers');

		function render(req, res) {
			res.render('admin/plugins/sso-google', {
				baseUrl: nconf.get('url'),
			});
		}

		data.router.get('/admin/plugins/sso-google', data.middleware.admin.buildHeader, render);
		data.router.get('/api/admin/plugins/sso-google', render);

		hostHelpers.setupPageRoute(data.router, '/deauth/google', data.middleware, [data.middleware.requireUser], (req, res) => {
			res.render('plugins/sso-google/deauth', {
				service: 'Google',
			});
		});
		data.router.post('/deauth/google', [data.middleware.requireUser, data.middleware.applyCSRF], (req, res, next) => {
			Google.deleteUserData({
				uid: req.user.uid,
			}, (err) => {
				if (err) {
					return next(err);
				}

				res.redirect(`${nconf.get('relative_path')}/me/edit`);
			});
		});

		meta.settings.get('sso-google', (_, loadedSettings) => {
			if (loadedSettings.id) {
				Google.settings.id = loadedSettings.id;
			}
			if (loadedSettings.secret) {
				Google.settings.secret = loadedSettings.secret;
			}
			Google.settings.autoconfirm = loadedSettings.autoconfirm === 'on';
			Google.settings.style = loadedSettings.style;
			Google.settings.disableRegistration = loadedSettings.disableRegistration === 'on';
			callback();
		});
	};

	Google.exposeSettings = function (data, callback) {
		data['sso-google'] = {
			style: Google.settings.style || 'light',
		};

		callback(null, data);
	};

	Google.getStrategy = function (strategies, callback) {
		if (Google.settings.id && Google.settings.secret) {
			passport.use(new passportGoogle({
				clientID: Google.settings.id,
				clientSecret: Google.settings.secret,
				callbackURL: `${nconf.get('url')}/auth/google/callback`,
				userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo', // https://github.com/jaredhanson/passport-google-oauth2/pull/51/files#diff-04c6e90faac2675aa89e2176d2eec7d8R102
				passReqToCallback: true,
			}, ((req, accessToken, refreshToken, profile, done) => {
				if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
					// Save Google-specific information to the user
					User.setUserField(req.user.uid, 'gplusid', profile.id);
					db.setObjectField('gplusid:uid', profile.id, req.user.uid);
					return done(null, req.user);
				}

				Google.login(profile.id, profile.displayName, profile.emails[0].value, profile._json.picture, (err, user) => {
					if (err) {
						return done(err);
					}

					authenticationController.onSuccessfulLogin(req, user.uid, (err) => {
						done(err, !err ? user : null);
					});
				});
			})));

			strategies.push({
				name: 'google',
				url: '/auth/google',
				callbackURL: '/auth/google/callback',
				icon: constants.admin.icon,
				icons: {
					normal: 'fa-brands fa-google',
					square: 'fa-brands fa-google',
					svg: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 48 48" class="LgbsSe-Bz112c"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>`,
				},
				labels: {
					login: '[[social:sign-in-with-google]]',
					register: '[[social:sign-up-with-google]]',
				},
				color: '#1DA1F2',
				scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
				prompt: 'select_account',
			});
		}

		callback(null, strategies);
	};

	Google.appendUserHashWhitelist = function (data, callback) {
		data.whitelist.push('gplusid');
		setImmediate(callback, null, data);
	};

	Google.getAssociation = function (data, callback) {
		User.getUserField(data.uid, 'gplusid', (err, gplusid) => {
			if (err) {
				return callback(err, data);
			}

			if (gplusid) {
				data.associations.push({
					associated: true,
					url: `https://plus.google.com/${gplusid}/posts`,
					deauthUrl: `${nconf.get('url')}/deauth/google`,
					name: constants.name,
					icon: constants.admin.icon,
				});
			} else {
				data.associations.push({
					associated: false,
					url: `${nconf.get('url')}/auth/google`,
					name: constants.name,
					icon: constants.admin.icon,
				});
			}

			callback(null, data);
		});
	};

	Google.login = function (gplusid, handle, email, picture, callback) {
		Google.getUidByGoogleId(gplusid, (err, uid) => {
			if (err) {
				return callback(err);
			}

			if (uid !== null) {
				// Existing User
				callback(null, {
					uid: uid,
				});
			} else {
				// New User
				const success = function (uid) {
					const autoConfirm = Google.settings.autoconfirm;
					if (autoConfirm) {
						User.email.confirmByUid(uid);
					}
					// Save google-specific information to the user
					User.setUserField(uid, 'gplusid', gplusid);
					db.setObjectField('gplusid:uid', gplusid, uid);

					// Save their photo, if present
					if (picture) {
						User.setUserField(uid, 'uploadedpicture', picture);
						User.setUserField(uid, 'picture', picture);
					}

					callback(null, {
						uid: uid,
					});
				};

				User.getUidByEmail(email, (err, uid) => {
					if (err) {
						return callback(err);
					}

					if (!uid) {
						// Abort user creation if registration via SSO is restricted
						if (Google.settings.disableRegistration) {
							return callback(new Error('[[error:sso-registration-disabled, Google]]'));
						}

						User.create({ username: handle, email: email }, (err, uid) => {
							if (err) {
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

	Google.getUidByGoogleId = function (gplusid, callback) {
		db.getObjectField('gplusid:uid', gplusid, (err, uid) => {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
	};

	Google.addMenuItem = function (custom_header, callback) {
		custom_header.authentication.push({
			route: constants.admin.route,
			icon: constants.admin.icon,
			name: constants.name,
		});

		callback(null, custom_header);
	};

	Google.deleteUserData = function (data, callback) {
		const { uid } = data;

		async.waterfall([
			async.apply(User.getUserField, uid, 'gplusid'),
			function (oAuthIdToDelete, next) {
				db.deleteObjectField('gplusid:uid', oAuthIdToDelete, next);
			},
			function (next) {
				db.deleteObjectField(`user:${uid}`, 'gplusid', next);
			},
		], (err) => {
			if (err) {
				winston.error(`[sso-google] Could not remove OAuthId data for uid ${uid}. Error: ${err}`);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = Google;
}(module));
