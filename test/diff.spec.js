const diff = require('../src/diff');

describe('diff', () => {
    it('should insert one line when lhs is empty and rhs has no line ending', () => {
        const _diff = new diff('', 'hello', { split: 'lines' });
        const changes = _diff.changes();
        console.log(changes);
        // with lhs_start at 1, the insert is at the end
        expect(changes).to.deep.equal([{
            lhs_start: 1,
            rhs_start: 1,
            lhs_deleted_count: 0,
            rhs_inserted_count: 0
        }]);
    });
});
