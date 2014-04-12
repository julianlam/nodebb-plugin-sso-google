<h1><i class="fa fa-google-plus-square"></i> Google Accounts Social Authentication</h1>
<hr />

<form class="sso-google">
	<div class="alert alert-warning">
		<p>
			Create a <strong>Google Application</strong> via the
			<a href="https://code.google.com/apis/console/">API Console</a> and then paste
			your application details here.
		</p>
		<br />
		<input type="text" name="id" title="Client ID" class="form-control input-lg" placeholder="Client ID"><br />
		<input type="text" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret"><br />
	</div>
</form>

<button class="btn btn-lg btn-primary" type="button" id="save">Save</button>

<script>
	require(['settings'], function(Settings) {
		Settings.load('sso-google', $('.sso-google'));

		$('#save').on('click', function() {
			Settings.save('sso-google', $('.sso-google'));
		});
	});
</script>