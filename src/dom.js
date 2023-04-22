
/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function getColors(el) {
	// get current diff border color from user-defined css
	const text = `
<div style="display:none" class="mergely-editor">
	<div class="mergely current start"></div>
	<div class="mergely start end rhs a CodeMirror-linebackground"></div>
	<div class="mergely start end lhs d CodeMirror-linebackground"></div>
	<div class="mergely start end lhs c CodeMirror-linebackground"></div>
	<div class="mergely ch rhs a"></div>
	<div class="mergely ch rhs ina"></div>
	<div class="mergely ch lhs d"></div>
	<div class="mergely ch lhs ind"></div>
</div>
`;
	const node = htmlToElement(text);
	el.appendChild(node);
	const currentStyle = window.getComputedStyle(node.children[0]);
	const aStyle = window.getComputedStyle(node.children[1]);
	const dStyle = window.getComputedStyle(node.children[2]);
	const cStyle = window.getComputedStyle(node.children[3]);
	const achStyle = window.getComputedStyle(node.children[4]);
	const ainStyle = window.getComputedStyle(node.children[5]);
	const dchStyle = window.getComputedStyle(node.children[6]);
	const dinStyle = window.getComputedStyle(node.children[7]);

	const colors = {
		current: {
			border: currentStyle.borderTopColor
		},
		a: {
			border: aStyle.borderTopColor,
			bg: aStyle.backgroundColor,
			fg: aStyle.color,
			ch: achStyle.color,
			in: ainStyle.color
		},
		d: {
			border: dStyle.borderTopColor,
			bg: dStyle.backgroundColor,
			fg: dStyle.color,
			ch: dchStyle.color,
			in: dinStyle.color
		},
		c: {
			border: cStyle.borderTopColor,
			bg: cStyle.backgroundColor,
			fg: cStyle.color,
		}
	};
	node.remove();
	return colors;
}

function getMergelyContainer({ clazz = '' }) {
	const classes = [ 'mergely-editor', clazz ]
	return htmlToElement(`\
<div class="${classes.join(' ')}" style="display:flex;height:100%;position:relative;"></div>`);
}

function getMarginTemplate({ id }) {
	return htmlToElement(`\
<div class="mergely-margin">
	<canvas id="${id}-margin" width="8px"></canvas>
</div>`);
}

function getEditorTemplate({ id }) {
	return htmlToElement(`\
<textarea id="${id}" class="mergely-column"></textarea>`);
}

function getCenterCanvasTemplate({ id }) {
	return htmlToElement(`\
<div class="mergely-canvas">
	<canvas id="${id}-lhs-rhs-canvas" width="28px"></canvas>
</div>`);
}

function getSplash({ notice, left, top }) {
	return htmlToElement(`\
<div class="mergely-splash" style="left: ${left}px; top: ${top}px">
	<p>
		<span class="mergely-icon"></span>
		This software is a Combined Work using Mergely and is covered by the
		${notice} license. For the full license, see
		<a target="_blank" href="http://www.mergely.com">http://www.mergely.com/license</a>.
	</p>
</div>`);
}

module.exports = {
    htmlToElement,
    getColors,
    getMergelyContainer,
    getMarginTemplate,
    getEditorTemplate,
    getCenterCanvasTemplate,
    getSplash
};
