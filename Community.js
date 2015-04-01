/**
 * @param {CommunityStructure|Community} com
 * @constructor
 */
function Community(com) {

    /** @type {CommunityStructure} */
    this.structure = com.structure ? com.structure : com;

    /** @type {Map.<Community, Number>} */
    this.connectionsWeight = new Map();

    /** @type {Map.<Community, Number>} */
    this.connectionsCount = new Map();

    /** @type {Set.<Number>} */
    this.nodes = new Set;

    this.weightSum = 0;


}

/**
 * @public
 * @returns {Number}
 */
Community.prototype.size = function() {
    return this.nodes.size;
};


/**
 * @param {Number} node
 */
Community.prototype.seed = function(node) {

    this.nodes.add(node);
    this.weightSum += this.structure.weights[node];

};

/**
 * @param {Number} nodeId
 * @returns {boolean}
 */
Community.prototype.add = function(nodeId) {

    this.nodes.add(nodeId);
    this.weightSum += this.structure.weights[nodeId];
    return true;

};

/**
 * @param {Number} node
 * @returns {boolean}
 */
Community.prototype.remove = function(node) {

    var result = this.nodes.delete(node);

    this.weightSum -= this.structure.weights[node];
    if (!this.nodes.size) {
        var index = this.structure.communities.indexOf(this);
        delete this.structure.communities[index];
    }

    return result;
};

module.exports = Community;
