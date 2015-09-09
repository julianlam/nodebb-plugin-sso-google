<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">Google+ SSO</div>
	<div class="col-sm-10 col-xs-12">
		<div class="alert alert-info">
			<ol>
				<li>
					Create a <strong>Google Application</strong> via the
					<a href="https://code.google.com/apis/console/">API Console</a> and then paste
					your application details here.
				</li>
				<li>Ensure you have the "Google+ API" enabled in your API console settings.</li>
				<li>The appropriate "Redirect URI" is your NodeBB's URL with `/auth/google/callback` appended to it.</li>
			</ol>
		</div>
		<form role="form" class="sso-google-settings">
			<div class="form-group">
				<label for="app_id">Client ID</label>
				<input type="text" name="id" title="Client ID" class="form-control input-lg" placeholder="Client ID">
			</div>
			<div class="form-group">
				<label for="secret">Secret</label>
				<input type="text" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret">
			</div>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input type="checkbox" class="mdl-switch__input" name="autoconfirm">
					<span class="mdl-switch__label">Skip email verification for people who register using SSO?</span>
				</label>
			</div>
		</form>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
