module.exports = function(api) {
	return {
		env: {
			test: {
				plugins: [ 'istanbul' ]
			}
		},
		presets: [
			[
				'@babel/preset-env',
				{
					targets: {
						browsers: [
							"ie 11",
							"last 5 edge versions",
							"last 5 safari versions",
							"last 10 chrome versions",
							"last 10 firefox versions"
						]
					},
					// for uglifyjs...
					forceAllTransforms: api.env('production')
				}
			]
		],
		retainLines: true
	};
};
