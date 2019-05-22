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
				<li>
					From the "Credentials" page, create a new "OAuth Client ID". (<a data-action="help-credentials" href="{config.relative_path}/plugins/nodebb-plugin-sso-google/images/credentials.png"><i class="fa fa-question-circle"></i> Where is this page?</a>)
					<ul>
						<li>The "Application Type" is "Web application"</li>
						<li>"Name" can be anything. Perhaps "NodeBB SSO" will suffice.</li>
						<li>"Authorized Javascript origins" can be left empty</li>
						<li>
							The "Authorised Redirect URI" is your NodeBB's URL with `/auth/google/callback` appended to it.
							<ul>
								<li>Our best guess for this site is <code>{baseUrl}/auth/google/callback</code></li>
								<li>When you enter this value into the text field, be sure to hit <code>Enter</code> to submit the URL before saving</li>
							</ul>
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
			<div class="form-group">
				<label for="style">Login Button Style</label>
				<select class="form-control" name="style" id="style" title="Login Button Style">
					<option value="light">Light</option>
					<option value="dark">Dark</option>
				</select>
			</div>
			<div class="checkbox">
				<label for="autoconfirm" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input type="checkbox" class="mdl-switch__input" id="autoconfirm" name="autoconfirm">
					<span class="mdl-switch__label">Skip email verification for people who register using SSO?</span>
				</label>
			</div>
			<div class="checkbox">
				<label for="disableRegistration" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input type="checkbox" class="mdl-switch__input" id="disableRegistration" name="disableRegistration" />
					<span class="mdl-switch__label">Disable user registration via SSO</span>
				</label>
			</div>
			<p class="help-block">
				Restricting registration means that only registered users can associate their account with this SSO strategy.
				This restriction is useful if you have users bypassing registration controls by using social media accounts, or
				if you wish to use the NodeBB registration queue.
			</p>
		</form>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
