'use strict';

$(window).on('action:script.load', function (ev, data) {
	data.scripts.push('sso-google/login');
});

define('sso-google/login', function () {
	var Login = {};

	Login.init = function () {
		var replaceEl = $('.alt-logins .google a i');
		var replacement = document.createElement('img');
		replacement.src = config.relative_path + '/plugins/nodebb-plugin-sso-google/images/btn_google_signin_' + config['sso-google'].style + '_normal_web.png';
		replaceEl.replaceWith(replacement);
	}

	return Login;
})