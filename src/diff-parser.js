const changeExp = new RegExp(/(^(?![><\-])*\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);

function DiffParser(diff) {
	const changes = [];
	let change_id = 0;
	// parse diff
	const diff_lines = diff.split(/\n/);
	for (var i = 0; i < diff_lines.length; ++i) {
		if (diff_lines[i].length == 0) continue;
		const change = {};
		const test = changeExp.exec(diff_lines[i]);
		if (test == null) continue;
		// lines are zero-based
		const fr = test[1].split(',');
		change['lhs-line-from'] = fr[0] - 1;
		if (fr.length == 1) change['lhs-line-to'] = fr[0] - 1;
		else change['lhs-line-to'] = fr[1] - 1;
		const to = test[3].split(',');
		change['rhs-line-from'] = to[0] - 1;
		if (to.length == 1) change['rhs-line-to'] = to[0] - 1;
		else change['rhs-line-to'] = to[1] - 1;
		change['op'] = test[2];
		changes[change_id++] = change;
	}
	return changes;
};

module.exports = DiffParser;
