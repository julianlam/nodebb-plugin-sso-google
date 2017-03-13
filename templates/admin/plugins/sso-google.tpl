<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">Google+ SSO</div>
	<div class="col-sm-10 col-xs-12">
		<div class="alert alert-info">
			<strong>Quick Start</strong>
			<ol>
				<li>
					Create a <strong>New Project</strong> via the
					<a href="https://code.google.com/apis/console/">API Manager <i class="fa fa-external-link"></i></a>
				</li>
				<li>Ensure you have the "Google+ API" enabled in your API console settings. To enable, press "Enable API" from the project dashboard and select "Google+ API"</li>
				<li>
					From the "Credentials" page, create a new OAuth 2.0 Client ID.
					<ul>
						<li>The "Application Type" is "Web application"</li>
						<li>"Name" can be anything. Perhaps "NodeBB SSO" will suffice.</li>
						<li>
							The "Authorised Redirect URI" is your NodeBB's URL with `/auth/google/callback` appended to it.
							(e.g. <code>http://example.org/auth/google/callback</code>
						</li>
					</ul>
				</li>
				<li>You will be shown a screen containing your <strong>Client ID</strong> and <strong>Client Secret</strong>. Paste those two values below.</li>
				<li>Save and restart NodeBB via the ACP Dashboard</li>
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
