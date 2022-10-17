'use strict';

require(['hooks'], function (hooks) {
	hooks.on('action:ajaxify.end', ({ tpl_url }) => {
		if (tpl_url === 'login') {
			var replaceEl = $('.alt-logins .google a i');
			const pictureEl = document.createElement('picture');

			const sourceEl = document.createElement('source');
			sourceEl.setAttribute('srcset',
				config.relative_path + '/assets/plugins/nodebb-plugin-sso-google/images/1x/btn_google_signin_' + config['sso-google'].style + '_normal_web.png, ' +
				config.relative_path + '/assets/plugins/nodebb-plugin-sso-google/images/2x/btn_google_signin_' + config['sso-google'].style + '_normal_web@2x.png 2x'
			);
			sourceEl.setAttribute('type', 'image/png');

			const fallbackEl = document.createElement('img');
			fallbackEl.src = config.relative_path + '/assets/plugins/nodebb-plugin-sso-google/images/1x/btn_google_signin_' + config['sso-google'].style + '_normal_web.png';

			pictureEl.append(sourceEl);
			pictureEl.append(fallbackEl);
			// var replacement = document.createElement('img');
			// replacement.src = config.relative_path + '/plugins/nodebb-plugin-sso-google/images/btn_google_signin_' + config['sso-google'].style + '_normal_web.png';
			replaceEl.replaceWith(pictureEl);
		}
	});
});