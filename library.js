'use strict';

const nconf = require.main.require('nconf');
const passportGoogle = require('passport-google-oauth20').Strategy;

const User = require.main.require('./src/user');
const meta = require.main.require('./src/meta');
const db = require.main.require('./src/database');
const passport = require.main.require('passport');

const constants = Object.freeze({
	name: 'Google',
	admin: {
		route: '/plugins/sso-google',
		icon: 'fa-google-plus-square',
	},
});

const Google = module.exports;
Google.settings = {
	id: process.env.SSO_GOOGLE_CLIENT_ID || undefined,
	secret: process.env.SSO_GOOGLE_CLIENT_SECRET || undefined,
	autoconfirm: 0,
	style: 'light',
	disableRegistration: false,
};

Google.init = async function (data) {
	const hostHelpers = require.main.require('./src/routes/helpers');

	hostHelpers.setupAdminPageRoute(data.router, '/admin/plugins/sso-google', (req, res) => {
		res.render('admin/plugins/sso-google', {
			title: constants.name,
			baseUrl: nconf.get('url'),
		});
	});

	hostHelpers.setupPageRoute(data.router, '/deauth/google', [data.middleware.requireUser], (req, res) => {
		res.render('plugins/sso-google/deauth', {
			service: constants.name,
		});
	});
	data.router.post('/deauth/google', [data.middleware.requireUser, data.middleware.applyCSRF], hostHelpers.tryRoute(async (req, res) => {
		await Google.deleteUserData({
			uid: req.user.uid,
		});
		res.redirect(`${nconf.get('relative_path')}/me/edit`);
	}));

	const loadedSettings = await meta.settings.get('sso-google');
	if (loadedSettings.id) {
		Google.settings.id = loadedSettings.id;
	}
	if (loadedSettings.secret) {
		Google.settings.secret = loadedSettings.secret;
	}
	Google.settings.autoconfirm = loadedSettings.autoconfirm === 'on';
	Google.settings.style = loadedSettings.style;
	Google.settings.disableRegistration = loadedSettings.disableRegistration === 'on';
};

Google.filterConfigGet = function (data) {
	data['sso-google'] = {
		style: Google.settings.style || 'light',
	};
	return data;
};

Google.filterAuthInit = function (strategies) {
	if (Google.settings.id && Google.settings.secret) {
		passport.use(new passportGoogle({
			clientID: Google.settings.id,
			clientSecret: Google.settings.secret,
			callbackURL: `${nconf.get('url')}/auth/google/callback`,
			userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo', // https://github.com/jaredhanson/passport-google-oauth2/pull/51/files#diff-04c6e90faac2675aa89e2176d2eec7d8R102
			passReqToCallback: true,
		}, async (req, accessToken, refreshToken, profile, done) => {
			try {
				if (req?.user?.uid && req.user.uid > 0) {
					// Save Google-specific information to the user
					await Promise.all([
						User.setUserField(req.user.uid, 'gplusid', profile.id),
						db.setObjectField('gplusid:uid', profile.id, req.user.uid),
					]);
					return done(null, req.user);
				}

				const { queued, uid, message } = await Google.login(
					profile.id, profile.displayName, profile.emails[0].value, profile._json.picture
				);

				if (queued) {
					return done(null, false, { message });
				}

				done(null, { uid });
			} catch (err) {
				done(err);
			}
		}));

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

	return strategies;
};

Google.filterUserWhitelistFields = function (data) {
	data.whitelist.push('gplusid');
	return data;
};

Google.filterAuthList = async function (data) {
	const gplusid = await User.getUserField(data.uid, 'gplusid');
	if (gplusid) {
		data.associations.push({
			associated: true,
			url: `#`, // no public profile url for google
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
	return data;
};

Google.login = async function (req, gplusid, handle, email, picture) {
	let uid = await Google.getUidByGoogleId(gplusid);
	if (uid) { // Existing User
		return { uid };
	}

	uid = await User.getUidByEmail(email);
	if (uid) { // Link Google account to existing user with same email
		await Promise.all([
			User.setUserField(uid, 'gplusid', gplusid),
			db.setObjectField('gplusid:uid', gplusid, uid),
		]);
		return { uid };
	}

	if (Google.settings.disableRegistration) {
		throw new Error('[[error:sso-registration-disabled, Google]]');
	}

	return await User.createOrQueue(req, {
		gplusid, // passing to create so it can be saved in registration queue
		picture,
		username: handle,
		email: email,
	}, {
		emailVerification: Google.settings.autoconfirm ? 'verify' : 'send',
	});
};

// If registration queue is enabled this hook will be called,
// save gplusid and picture to registration queue along with other data from core
Google.addToApprovalQueue = async (hookData) => {
	// "data" is what will be saved to the registration queue
	// "userData" is sent from google
	await saveGoogleSpecificData(hookData.data, hookData.userData);
	return hookData;
};

// triggered when a user is created (either directly or from approval queue)
Google.filterUserCreate = async (hookData) => {
	// "user" is what will be saved to the database
	// "data" is sent from register page or from registration queue
	await saveGoogleSpecificData(hookData.user, hookData.data);
	return hookData;
};

async function saveGoogleSpecificData(targetObj, sourceObj) {
	const { gplusid, picture } = sourceObj;
	if (gplusid) {
		const uid = await Google.getUidByGoogleId(gplusid);
		if (uid) {
			throw new Error('[[error:sso-account-exists, Google]]');
		}
		targetObj.gplusid = gplusid;
		if (picture) {
			targetObj.picture = picture;
			targetObj.uploadedpicture = picture;
		}
	}
}

// fired after user creation, save gplusid => uid mapping
Google.actionUserCreate = async (hookData) => {
	const { uid } = hookData.user;
	const gplusid = await User.getUserField(uid, 'gplusid');
	if (gplusid) {
		await db.setObjectField('gplusid:uid', gplusid, uid);
	}
};

Google.filterUserGetRegistrationQueue = async (hookData) => {
	const { users } = hookData;
	users.forEach((user) => {
		if (user?.gplusid) {
			user.sso = {
				icon: 'fa-brands fa-google',
				name: constants.name,
			};
		}
	});
	return hookData;
};

Google.getUidByGoogleId = async function (gplusid) {
	return await db.getObjectField('gplusid:uid', gplusid);
};

Google.addAdminMenuItem = function (custom_header) {
	custom_header.authentication.push({
		route: constants.admin.route,
		icon: constants.admin.icon,
		name: constants.name,
	});
	return custom_header;
};

Google.deleteUserData = async function (data) {
	const { uid } = data;
	const gplusid = await User.getUserField(uid, 'gplusid');
	if (gplusid) {
		await db.deleteObjectField('gplusid:uid', gplusid);
		await db.deleteObjectField(`user:${uid}`, 'gplusid');
	}
};
