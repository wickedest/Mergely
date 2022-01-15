const diff = require('./diff');

onmessage = function (ev) {
	const { lhs, rhs } = ev;
	const compare = new diff(lhs, rhs, this.settings);
	const changes = DiffParser(compare.normal_form());
	postMessage(changes);
};
