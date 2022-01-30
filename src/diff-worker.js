const diff = require('./diff');
const DiffParser = require('./diff-parser');

onmessage = function (ev) {
	if (!ev.data) {
		return;
	}
	const { lhs, rhs } = ev.data;
	const compare = new diff(lhs, rhs, this.settings);
	const changes = DiffParser(compare.normal_form());
	postMessage(changes);
};
