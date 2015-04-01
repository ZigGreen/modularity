/**
 *
 * @param s
 * @param t
 * @param w
 * @constructor
 */
function ModEdge(s, t, w) {
    /** @type {Number} */
    this.source = s;
    /** @type {Number} */
    this.target = t;
    /** @type {Number} */
    this.weight = w;
}

module.exports = ModEdge;
