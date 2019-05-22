'use strict';
/* globals $, app, socket, require */

define('admin/plugins/sso-google', ['settings'], function(Settings) {

	var ACP = {};

	ACP.init = function() {
		Settings.load('sso-google', $('.sso-google-settings'));

		$('#save').on('click', function() {
			Settings.save('sso-google', $('.sso-google-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'sso-google-saved',
					title: 'Settings Saved',
					message: 'Please rebuild and restart your NodeBB to apply these settings, or click on this alert to do so.',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});

		$('a[data-action="help-credentials"]').on('click', function () {
			bootbox.alert({
				title: 'Where is the Credentials page?',
				message: '<img src="' + config.relative_path + '/plugins/nodebb-plugin-sso-google/images/credentials.png" />'
			});
			return false;
		});
	};

	return ACP;
});