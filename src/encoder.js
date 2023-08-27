class Encoder {
    constructor() {
        this._maxCode = 0;
        this._codes = {};
    }

    encode(text, options) {
        let exp;
        let fudge = 0;
        if (options.split === 'chars') {
            exp = /./g;
            fudge = 1;
        } else if (options.split === 'words') {
            exp = /\s+/g;
        } else {
            exp = /\n/g;
        }
        let match;
        let p0 = -1;
        const parts = [];
        while ((match = exp.exec(text)) !== null) {
            const from = (options.split === 'lines') ? parts.length : p0 + 1;
            const to = (options.split === 'lines') ? parts.length + 1 : match.index + fudge;
            const item = {
                from,
                to,
                text: text.substr(p0 + 1, match.index - p0 - 1 + fudge)
            };
            parts.push(item);
            p0 = match.index;
        }
        const from = (options.split === 'lines') ? parts.length : p0 + 1;
        const to = (options.split === 'lines') ? parts.length + 1 : text.length;
        parts.push({
            from,
            to,
            text: text.substr(p0 + 1)
        });
        const hash = this._hash(parts, options)
        return {
            codes: hash.codes,
            parts: hash.parts,
            length: Object.keys(hash.codes).length
        };
    }

    _hash(parts, options) {
        const codes = {};
        let i = 0;
        for (const part of parts) {
            let text = part.text;

            if (options.ignorews) {
                text = text.replace(/\s+/g, '');
            }
            if (options.ignorecase) {
                text = text.toLowerCase();
            }
            if (options.ignoreaccents) {
                text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }
            const code = this._codes[text];
            if (code !== undefined) {
                codes[i] = code;
            } else {
                ++this._maxCode;
                this._codes[text] = this._maxCode;
                codes[i] = this._maxCode;
            }
            i += 1;
        }
        return {
            codes,
            parts
        };
    }
}

module.exports = Encoder;
