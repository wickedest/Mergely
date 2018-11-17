module.exports = function(api) {
	return {
		presets: [
			[
				"@babel/preset-env",
				{
					targets: {
						chrome: 59,
						edge: 13,
						firefox: 50,
						ie: 11
					},
					// for uglifyjs...
					forceAllTransforms: api.env("production"),
				},
			],
		],
	};
};
