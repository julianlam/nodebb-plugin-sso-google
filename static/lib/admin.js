define('admin/plugins/sso-google', ['settings'], function(Settings) {
	'use strict';
	/* globals $, app, socket, require */

	var ACP = {};

	ACP.init = function() {
		Settings.load('sso-google', $('.sso-google-settings'));

		$('#save').on('click', function() {
			Settings.save('sso-google', $('.sso-google-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'sso-google-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});