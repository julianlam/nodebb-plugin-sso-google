<div class="col-12 col-sm-8 col-offset-sm-2 col-md-6 col-offset-md-3">
	<div class="card">
		<div class="card-header">
			<span class="h4">{{tx("user:sso.dissociate-confirm-title")}}</span>
		</div>
		<div class="card-body">
			{{tx("user:sso.dissociate-confirm", service)}}

			<hr>

			<form method="post">
				<input type="hidden" name="_csrf" value="{config.csrf_token}" />
				<button class="btn btn-danger">{{tx("user:sso.dissociate")}}</button>
			</form>
		</div>
	</div>
</div>