<div class="col-12 col-sm-8 col-offset-sm-2 col-md-6 col-offset-md-3">
	<div class="card">
		<div class="card-header">
			<span class="h4">[[user:sso.dissociate-confirm-title]]</span>
		</div>
		<div class="card-body">
			[[user:sso.dissociate-confirm, {service}]]

			<hr>

			<form method="post">
				<input type="hidden" name="_csrf" value="{config.csrf_token}" />
				<button class="btn btn-danger">[[user:sso.dissociate]]</button>
			</form>
		</div>
	</div>
</div>