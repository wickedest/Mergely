var JsUnit = (function () {
	var JsUnit = {
		modules : {},
		config : {
			onStartModule: function(module) { },
			onEndModule: function(module) { },
			onStartTest: function(module, test) { },
			onEndTest: function(module, test) { },
			onResult: function(module, test) { },
		}
	};
	JsUnit.PASSED = 'passed';
	JsUnit.FAILED = 'failed';

	JsUnit._mixin = function(src, dest) {
		return $.extend({}, src, dest);
	}

	JsUnit.module = function(name) {
		this.modules[name] = {name: name, tests:[]};
		this._module = name;
	}

	JsUnit.test = function(name, run) {
		var module = this.modules[this._module];
		module.tests.push({
			name: name,
			run: run,
			assertions: []
		});
	}

	JsUnit._assert = function(result, value, message, passed) {
		var stack = [];
		if (!passed) {
			if (printStackTrace != undefined) {
				var trace = printStackTrace();
				for (key in trace) {
					stack.push({
						method: trace[key].split('@')[0],
						location: trace[key].split('@')[1]
					});
				}
			}
			else {
				console.warn('missing required library:','https://raw.github.com/eriwen/javascript-stacktrace/master/stacktrace.js');
			}
		}
		this._running.assertions.push({
			expected: value,
			message: message,
			stack: stack,
			passed: function() { return passed; }
		});
	}

	JsUnit.equal = function(result, value, message) {
		JsUnit._assert(result, value, message || 'Result was not equal as expected', result == value);
	}

	JsUnit.notEqual = function(result, value, message) {
		JsUnit._assert(result, value, message || 'Result did not evaluate to false as expected', result != value);
	}

	JsUnit.okay = function(result, message) {
		JsUnit._assert(result, null, message || 'Result did not evaluate to true as expected', !(!result));
	}
	JsUnit.throws = function(func, message) {
		try {
			func();
		}
		catch (err) {
			return;
		}
		JsUnit.okay(false, message || 'Did not throw as expected');
	}

	JsUnit.run = function(config) {
		var settings = this._mixin(this.config, config);
		for (var mkey in this.modules) {
			var module = this.modules[mkey];
			settings.onStartModule(module);
			for (var tkey in module.tests) {
				var test = module.tests[tkey];
				var tthis = this;
				test.rerun = function() {
					try {
						settings.onStartTest(module, this);
						tthis._running = this;
						this.assertions = [];
						var success = true;
						this.passed = function() { return success; }
						this.run();
						for (var akey in this.assertions) {
							var assertion = this.assertions[akey];
							success &= assertion.passed();
						}
						settings.onResult(module, this);
						settings.onEndTest(module, this);
					}
					catch (ex) {
						console.log('Exception', ex);
						this.ex = ex;
						success = false;
						settings.onResult(module, this);
						settings.onEndTest(module, this);
					}
				}
				test.rerun();
			}
			settings.onEndModule(module);
		}
	}

	JsUnit.getCurrentUrl = function(changes) {
		var options = {
			protocol: window.document.location.protocol,
			host: window.document.location.hostname,
			port: window.document.location.port,
			path: window.document.location.pathname,
			user: '',
			pass: ''
		};
		options = JsUnit._mixin(options, changes);
		var userpass = (options.user && options.pass) ? (options.user + ':' + options.pass + '@') : '';
		if (options.protocol.substr(-1) != ':') options.protocol += ':';
		return options.protocol + '//' + userpass + options.host + ':' + options.port + options.path;
	}

	JsUnit.include = function(file) {
		if (document.createElement && document.getElementsByTagName) {
			var head = document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.setAttribute('type', 'text/javascript');
			script.setAttribute('src', file);
			script.setAttribute('async', 'async');
			head.appendChild(script);
		}
		else {
			console.error('Failed to include', file);
		}
	}

	JsUnit.start = function() {
		this.run({
			onStartModule: function(module) {
				var test;
				for (var i = 0; i < module.tests.length; ++i) {
					// add all the tests
					test = module.tests[i];
					var node = $('<tr id="' + test.name + '"><td>' + module.name + '</td><td>' + test.name + '</td><td class="state"><span class="details" title=""></span></td><td><button>retry</button></td><td class="stack"></td></tr>');
					$('#tests').append(node);
					// closure
					(function(y) {
						$('#' + y.name + ' button').click(function(){
							//test = module.tests[i];
							console.log('test', y.name);
							console.log('test.rerun', y, y.rerun);
							console.log('rerunning', y);
							y.rerun();
							return false;
						});
					})(test);
				}
			},
			
			onResult: function(module, test) {
				var id = '#' + test.name;
				var message = '';
				var stack = '';
				var state = 'passed';
				if (!test.passed()) {
					$(id + ' .stack').html('<span>stack</span>');
					state = 'failed';
					if (test.ex) {
						message += test.ex + '\n' + test.ex.stack;
					}
					for (var i in test.assertions) {
						var assertion = test.assertions[i];
						if (!assertion.passed()) {
							message += assertion.message.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
							message += '<br />';
							for (var key in assertion.stack) {
								stack += assertion.stack[key].location + '<br />';
							}
						}
					}
				}
				$(id + ' .state').attr('class', ' state ' + state);
				$(id + ' .details').attr('title', message).html(state);
				$(id + ' .stack').attr('title', stack);
				$(id + ' .stack').tipTip({delay: 100, fadeIn:0, fadeOut:100, defaultPosition: 'left', maxWidth: '640px'});
				$(id + ' .details').tipTip({delay: 100, fadeIn:0, fadeOut:100, defaultPosition: 'right'})
			}
		});
	}
	return JsUnit;
}());
