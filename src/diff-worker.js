const diff = require('./diff');
const DiffParser = require('./diff-parser');

onmessage = function (ev) {
	console.log('onmessage', ev.data);
	const { lhs, rhs } = ev.data;
	const compare = new diff(lhs, rhs, this.settings);
	const changes = DiffParser(compare.normal_form());
	console.log(changes);
	postMessage(changes);
};
