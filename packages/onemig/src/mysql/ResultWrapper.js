import dump from '../dump';

export default class ResultWrapper {

    constructor(resultPromise) {
        this.result = resultPromise;
    }

    /**
     * @returns {Promise<TextRow>}
     */
    fetchRow() {
        return this.result.then(([[row], fields]) => row);
    }

    /**
     * @returns {Promise<TextRow[]>}
     */
    fetchAll() {
        return this.result.then(([rows, fields]) => rows);
    }

    /**
     * @returns {Promise<String|Number|Boolean|null>}
     */
    async fetchValue() {
        let [rows,fields] = await this.result;
        if(!rows.length) return null;
        return rows[0][fields[0].name];
    }

    /**
     * @returns {Promise<Array<String|Number|Boolean|null>>}
     */
    async fetchColumn() {
        let [rows,fields] = await this.result;
        if(!rows.length) return [];
        const name = fields[0].name;
        return rows.map(r => r[name]);
    }

    /**
     * @returns {Promise<{}>}
     */
    async fetchPairs() {
        let [rows,fields] = await this.result;
        if(fields.length !== 2) throw new Error(`fetchPairs expects exactly 2 columns`);
        if(!rows.length) return {};
        const key = fields[0].name;
        const val = fields[1].name;
        return rows.reduce((acc,row) => {
            acc[row[key]] = row[val];
            return acc;
        }, Object.create(null));
    }
}