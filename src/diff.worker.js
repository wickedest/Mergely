const diff = require('./diff');
const DiffParser = require('./diff-parser');

onmessage = function (ev) {
	if (!ev.data) {
		return;
	}
	const { lhs, rhs, options } = ev.data;
	const compare = new diff(lhs, rhs, options);
	const changes = DiffParser(compare.normal_form());
	postMessage(changes);
};
