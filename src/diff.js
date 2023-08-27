const Encoder = require('./encoder.js');

const SMS_TIMEOUT_SECONDS = 1.0;

function diff(lhs, rhs, opts) {
	const {
		ignorews = false,
		ignoreaccents = false,
		ignorecase = false,
		split = 'lines'
	} = opts || {};
	const options = {
		ignorews,
		ignoreaccents,
		ignorecase,
		split
	};

	const encoder = new Encoder();
	const lhsCodes = encoder.encode(lhs, options);
	const rhsCodes = encoder.encode(rhs, options);
	const lhsCtx = {
		codes: lhsCodes.codes,
		length: lhsCodes.length,
		parts: lhsCodes.parts,
		modified: {}
	};
	const rhsCtx = {
		codes: rhsCodes.codes,
		length: rhsCodes.length,
		parts: rhsCodes.parts,
		modified: {}
	};
	const vector_d = [];
	const vector_u = [];
	this._lcs(lhsCtx, 0, lhsCodes.length, rhsCtx, 0, rhsCodes.length, vector_u, vector_d);
	this._optimize(lhsCtx);
	this._optimize(rhsCtx);
	this.items = this._create_diffs(lhsCtx, rhsCtx, options);
	this.sides = {
		lhs: lhsCtx,
		rhs: rhsCtx
	};
};

diff.prototype.changes = function() {
	return this.items;
};

diff.prototype.normal_form = function() {
	let nf = '';
	for (let index = 0; index < this.items.length; ++index) {
		const item = this.items[index];
		let lhs_str = '';
		let rhs_str = '';
		let change = 'c';
		if (item.lhs_deleted_count === 0 && item.rhs_inserted_count > 0) change = 'a';
		else if (item.lhs_deleted_count > 0 && item.rhs_inserted_count === 0) change = 'd';

		if (item.lhs_deleted_count === 1) lhs_str = item.lhs_start + 1;
		else if (item.lhs_deleted_count === 0) lhs_str = item.lhs_start;
		else lhs_str = (item.lhs_start + 1) + ',' + (item.lhs_start + item.lhs_deleted_count);

		if (item.rhs_inserted_count === 1) rhs_str = item.rhs_start + 1;
		else if (item.rhs_inserted_count === 0) rhs_str = item.rhs_start;
		else rhs_str = (item.rhs_start + 1) + ',' + (item.rhs_start + item.rhs_inserted_count);
		nf += lhs_str + change + rhs_str + '\n';

		const lhs_lines = this.sides.lhs.parts;
		const rhs_lines = this.sides.rhs.parts;
		if (rhs_lines && lhs_lines) {
			let i;
			// if rhs/lhs lines have been retained, output contextual diff
			for (i = item.lhs_start; i < item.lhs_start + item.lhs_deleted_count; ++i) {
				nf += '< ' + lhs_lines[i] + '\n';
			}
			if (item.rhs_inserted_count && item.lhs_deleted_count) nf += '---\n';
			for (i = item.rhs_start; i < item.rhs_start + item.rhs_inserted_count; ++i) {
				nf += '> ' + rhs_lines[i] + '\n';
			}
		}
	}
	return nf;
};

diff.prototype._lcs = function(lhs_ctx, lhs_lower, lhs_upper, rhs_ctx, rhs_lower, rhs_upper, vector_u, vector_d) {
	while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs_ctx.codes[lhs_lower] === rhs_ctx.codes[rhs_lower]) ) {
		++lhs_lower;
		++rhs_lower;
	}
	while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs_ctx.codes[lhs_upper - 1] === rhs_ctx.codes[rhs_upper - 1]) ) {
		--lhs_upper;
		--rhs_upper;
	}
	if (lhs_lower === lhs_upper) {
		while (rhs_lower < rhs_upper) {
			rhs_ctx.modified[ rhs_lower++ ] = true;
		}
	}
	else if (rhs_lower === rhs_upper) {
		while (lhs_lower < lhs_upper) {
			lhs_ctx.modified[ lhs_lower++ ] = true;
		}
	}
	else {
		const sms = this._sms(lhs_ctx, lhs_lower, lhs_upper, rhs_ctx, rhs_lower, rhs_upper, vector_u, vector_d);
		this._lcs(lhs_ctx, lhs_lower, sms.x, rhs_ctx, rhs_lower, sms.y, vector_u, vector_d);
		this._lcs(lhs_ctx, sms.x, lhs_upper, rhs_ctx, sms.y, rhs_upper, vector_u, vector_d);
	}
};

diff.prototype._sms = function(lhs_ctx, lhs_lower, lhs_upper, rhs_ctx, rhs_lower, rhs_upper, vector_u, vector_d) {
	const timeout = Date.now() + SMS_TIMEOUT_SECONDS * 1000;
	const max = lhs_ctx.length + rhs_ctx.length + 1;
	const kdown = lhs_lower - rhs_lower;
	const kup = lhs_upper - rhs_upper;
	const delta = (lhs_upper - lhs_lower) - (rhs_upper - rhs_lower);
	const odd = (delta & 1) != 0;
	const offset_down = max - kdown;
	const offset_up = max - kup;
	const maxd = ((lhs_upper - lhs_lower + rhs_upper - rhs_lower) / 2) + 1;
	vector_d[ offset_down + kdown + 1 ] = lhs_lower;
	vector_u[ offset_up + kup - 1 ] = lhs_upper;
	const ret = { x:0, y:0 }
	let x;
	let y;
	let k;
	for (let d = 0; d <= maxd; ++d) {
		if (SMS_TIMEOUT_SECONDS && Date.now() > timeout) {
			// bail if taking too long
			return { x: lhs_lower, y: rhs_upper };
		}
		for (k = kdown - d; k <= kdown + d; k += 2) {
			if (k === kdown - d) {
				x = vector_d[ offset_down + k + 1 ];//down
			}
			else {
				x = vector_d[ offset_down + k - 1 ] + 1;//right
				if ((k < (kdown + d)) && (vector_d[ offset_down + k + 1 ] >= x)) {
					x = vector_d[ offset_down + k + 1 ];//down
				}
			}
			y = x - k;
			// find the end of the furthest reaching forward D-path in diagonal k.
			while ((x < lhs_upper) && (y < rhs_upper) && (lhs_ctx.codes[x] === rhs_ctx.codes[y])) {
				x++; y++;
			}
			vector_d[ offset_down + k ] = x;
			// overlap ?
			if (odd && (kup - d < k) && (k < kup + d)) {
				if (vector_u[offset_up + k] <= vector_d[offset_down + k]) {
					ret.x = vector_d[offset_down + k];
					ret.y = vector_d[offset_down + k] - k;
					return (ret);
				}
			}
		}
		// Extend the reverse path.
		for (k = kup - d; k <= kup + d; k += 2) {
			// find the only or better starting point
			if (k === kup + d) {
				x = vector_u[offset_up + k - 1]; // up
			} else {
				x = vector_u[offset_up + k + 1] - 1; // left
				if ((k > kup - d) && (vector_u[offset_up + k - 1] < x))
					x = vector_u[offset_up + k - 1]; // up
			}
			y = x - k;
			while ((x > lhs_lower) && (y > rhs_lower) && (lhs_ctx.codes[x - 1] === rhs_ctx.codes[y - 1])) {
				// diagonal
				x--;
				y--;
			}
			vector_u[offset_up + k] = x;
			// overlap ?
			if (!odd && (kdown - d <= k) && (k <= kdown + d)) {
				if (vector_u[offset_up + k] <= vector_d[offset_down + k]) {
					ret.x = vector_d[offset_down + k];
					ret.y = vector_d[offset_down + k] - k;
					return (ret);
				}
			}
		}
	}
	throw "the algorithm should never come here.";
};

diff.prototype._optimize = function(ctx) {
	let start = 0;
	let end = 0;
	while (start < ctx.length) {
		while ((start < ctx.length) && (ctx.modified[start] === undefined || ctx.modified[start] === false)) {
			start++;
		}
		end = start;
		while ((end < ctx.length) && (ctx.modified[end] === true)) {
			end++;
		}
		if ((end < ctx.length) && (ctx.codes[start] === ctx.codes[end])) {
			ctx.modified[start] = false;
			ctx.modified[end] = true;
		}
		else {
			start = end;
		}
	}
};

diff.prototype._create_diffs = function(lhs_ctx, rhs_ctx, options) {
	const items = [];
	let lhs_start = 0;
	let rhs_start = 0;
	let lhs_line = 0;
	let rhs_line = 0;

	while (lhs_line < lhs_ctx.length || rhs_line < rhs_ctx.length) {
		if ((lhs_line < lhs_ctx.length) && (!lhs_ctx.modified[lhs_line])
			&& (rhs_line < rhs_ctx.length) && (!rhs_ctx.modified[rhs_line])) {
			// equal lines
			lhs_line++;
			rhs_line++;
		}
		else {
			// maybe deleted and/or inserted lines
			lhs_start = lhs_line;
			rhs_start = rhs_line;

			while (lhs_line < lhs_ctx.length && (rhs_line >= rhs_ctx.length || lhs_ctx.modified[lhs_line]))
				lhs_line++;

			while (rhs_line < rhs_ctx.length && (lhs_line >= lhs_ctx.length || rhs_ctx.modified[rhs_line]))
				rhs_line++;

			if ((lhs_start < lhs_line) || (rhs_start < rhs_line)) {
				// store a new difference-item
				let deleted_count;
				let inserted_count;
				let lhs_start = lhs_line;
				let rhs_start = rhs_line;
				if (options.split === 'lines') {
					lhs_start = lhs_line;
					rhs_start = rhs_line;
					deleted_count = lhs_line - lhs_start;
					inserted_count = rhs_line - rhs_start;
				} else {
					const ditem_lhs_start = (lhs_start >= lhs_ctx.length)
						? lhs_ctx.length
						: lhs_ctx.parts[lhs_start].from;
					const ditem_rhs_start = (rhs_start >= rhs_ctx.length)
						? rhs_ctx.length
						: rhs_ctx.parts[rhs_start].from;

					const ditem_lhs_end = (lhs_line >= lhs_ctx.length)
						? lhs_ctx.length
						: lhs_ctx.parts[lhs_line].from;
					const ditem_rhs_end = (rhs_line >= rhs_ctx.length)
						? rhs_ctx.length
						: rhs_ctx.parts[rhs_line];
					// const delim_len = (options.split === 'words') ? 1 : 0;
					// const ditemLhs

					deleted_count = ditem_lhs_end - ditem_lhs_start;
					inserted_count = ditem_rhs_end - ditem_rhs_start;
					lhs_start = ditem_lhs_start;
					rhs_start = ditem_rhs_start;
				}
				items.push({
					lhs_start: lhs_start,
					rhs_start: rhs_start,
					lhs_deleted_count: deleted_count,
					rhs_inserted_count: inserted_count
				});
			}
		}
	}
	return items;
};

module.exports = diff;
