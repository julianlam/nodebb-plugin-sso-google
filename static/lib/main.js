'use strict';

require(['hooks'], function (hooks) {
	hooks.on('action:ajaxify.end', ({ tpl_url }) => {
		if (tpl_url === 'login') {
			var replaceEl = $('.alt-logins .google a i');
			var replacement = document.createElement('img');
			replacement.src = config.relative_path + '/plugins/nodebb-plugin-sso-google/images/btn_google_signin_' + config['sso-google'].style + '_normal_web.png';
			replaceEl.replaceWith(replacement);
		}
	});
});