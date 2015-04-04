/*
 Copyright 2008-2011 Gephi
 Authors : Patick J. McSweeney <pjmcswee@syr.edu>, Sebastien Heymann <seb@gephi.org>
 Website : http://www.gephi.org

 This file is part of Gephi.

 DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.

 Copyright 2011 Gephi Consortium. All rights reserved.

 The contents of this file are subject to the terms of either the GNU
 General Public License Version 3 only ("GPL") or the Common
 Development and Distribution License("CDDL") (collectively, the
 "License"). You may not use this file except in compliance with the
 License. You can obtain a copy of the License at
 http://gephi.org/about/legal/license-notice/
 or /cddl-1.0.txt and /gpl-3.0.txt. See the License for the
 specific language governing permissions and limitations under the
 License.  When distributing the software, include this License Header
 Notice in each file and include the License files at
 /cddl-1.0.txt and /gpl-3.0.txt. If applicable, add the following below the
 License Header, with the fields enclosed by brackets [] replaced by
 your own identifying information:
 "Portions Copyrighted [year] [name of copyright owner]"

 If you wish your version of this file to be governed by only the CDDL
 or only the GPL Version 3, indicate your decision by adding
 "[Contributor] elects to include this software in this distribution
 under the [CDDL or GPL Version 3] license." If you do not indicate a
 single choice of license, a recipient has the option to distribute
 your version of this file under either the CDDL, the GPL Version 3 or
 to extend the choice of license to its licensees as provided above.
 However, if you add GPL Version 3 code and therefore, elected the GPL
 Version 3 license, then the option applies only if the new code is
 made subject to such option by the copyright holder.

 Contributor(s): Thomas Aynaud <taynaud@gmail.com>

 Portions Copyrighted 2011 Gephi Consortium.
 */
var CommunityStructure = require('./CommunityStructure')
    , centrality = require('ngraph.centrality')
    ;

/**
 * @constructor
 */
function Modularity (resolution, useWeight) {
    this.isRandomized = false;
    this.useWeight = useWeight;
    this.resolution = resolution || 1.;
    /**
     * @type {CommunityStructure}
     */
    this.structure = null;
}

/**
 * @param {IGraph} graph
 */
Modularity.prototype.execute = function (graph/*, AttributeModel attributeModel*/) {


    this.structure = new CommunityStructure(graph, this.useWeight);

    var comStructure = new Array(graph.getNodesCount());

    var computedModularityMetrics = this.computeModularity(
        graph
        , this.structure
        , comStructure
        , this.resolution
        , this.isRandomized
        , this.useWeight
    );

    var result = {};
    this.structure.map.forEach(function (i, node) {
        result[node] = comStructure[i];
    });

    return result;

};


/**
 *
 * @param {IGraph} graph
 * @param {CommunityStructure} theStructure
 * @param {Array.<Number>} comStructure
 * @param {Number} currentResolution
 * @param {Boolean} randomized
 * @param {Boolean} weighted
 * @returns {Object.<String, Number>}
 */
Modularity.prototype.computeModularity = function(graph, theStructure, comStructure,  currentResolution, randomized, weighted) {


    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    var totalWeight = theStructure.graphWeightSum;
    var nodeDegrees = theStructure.weights.slice();


    var /** @type {Object.<String, Number>} */ results = Object.create(null);


    var someChange = true;

    while (someChange) {
        someChange = false;
        var localChange = true;
        while (localChange) {
            localChange = false;
            var start = 0;
            if (randomized) {
                //start = Math.abs(rand.nextInt()) % theStructure.N;
                start = getRandomInt(0,theStructure.N);
            }
            var step = 0;
            for (var i = start; step < theStructure.N; i = (i + 1) % theStructure.N) {
                step++;
                var bestCommunity = this.updateBestCommunity(theStructure, i, currentResolution);
                if ((theStructure.nodeCommunities[i] != bestCommunity) && (bestCommunity != null)) {
                    theStructure.moveNodeTo(i, bestCommunity);
                    localChange = true;
                }

            }

            someChange = localChange || someChange;

        }

        if (someChange) {
            theStructure.zoomOut();
        }
    }

    this.fillComStructure(graph, theStructure, comStructure);

    /*
    //TODO: uncomment when finalQ will be implemented
    var degreeCount = this.fillDegreeCount(graph, theStructure, comStructure, nodeDegrees, weighted);


    var computedModularity = this._finalQ(comStructure, degreeCount, graph, theStructure, totalWeight, 1., weighted);
    var computedModularityResolution = this._finalQ(comStructure, degreeCount, graph, theStructure, totalWeight, currentResolution, weighted);

    results["modularity"] =  computedModularity;
    results["modularityResolution"] =  computedModularityResolution;
    */

    return results;
};


/**
 * @param {CommunityStructure} theStructure
 * @param {Number} i
 * @param {Number} currentResolution
 * @returns {Community}
 */
Modularity.prototype.updateBestCommunity = function(theStructure,  i, currentResolution) {
    var best = this.q(i, theStructure.nodeCommunities[i], theStructure, currentResolution);
    var bestCommunity = theStructure.nodeCommunities[i];
    //var /*Set<Community>*/ iter = theStructure.nodeConnectionsWeight[i].keySet();
    theStructure.nodeConnectionsWeight[i].forEach(function (_$$val, com) {

        var qValue = this.q(i, com, theStructure, currentResolution);
        if (qValue > best) {
            best = qValue;
            bestCommunity = com;
        }

    }, this);
    return bestCommunity;
};

/**
 *
 * @param {IGraph} graph
 * @param {CommunityStructure} theStructure
 * @param {Array.<Number>} comStructure
 * @returns {Array.<Number>}
 */
Modularity.prototype.fillComStructure = function(graph, theStructure, comStructure) {

    var count = 0;

    theStructure.communities.forEach(function (com) {

        com.nodes.forEach(function (node) {

            var hidden = theStructure.invMap.get(node);
            hidden.nodes.forEach( function (nodeInt){
                comStructure[nodeInt] = count;
            });

        });
        count++;

    });


    return comStructure;
};

/**
 * @param {IGraph} graph
 * @param {CommunityStructure} theStructure
 * @param {Array.<Number>} comStructure
 * @param {Array.<Number>} nodeDegrees
 * @param {Boolean} weighted
 * @returns {Array.<Number>}
 */
Modularity.prototype.fillDegreeCount = function(graph, theStructure, comStructure, nodeDegrees, weighted) {

    var degreeCount = new Array(theStructure.communities.length);
    var degreeCentrality = centrality.degree(graph);

    graph.forEachNode(function(node){

        var index = theStructure.map.get(node);
        if (weighted) {
            degreeCount[comStructure[index]] += nodeDegrees[index];
        } else {
            degreeCount[comStructure[index]] += degreeCentrality[node.id];
        }

    });
    return degreeCount;

};


/**
 *
 * @param {Array.<Number>} struct
 * @param {Array.<Number>} degrees
 * @param {IGraph} graph
 * @param {CommunityStructure} theStructure
 * @param {Number} totalWeight
 * @param {Number} usedResolution
 * @param {Boolean} weighted
 * @returns {Number}
 */
Modularity.prototype._finalQ = function(struct, degrees, graph, theStructure, totalWeight, usedResolution, weighted) {

    //TODO: rewrite for wighted version of algorithm
    throw new Error("not implemented properly");
    var  res = 0;
    var  internal = new Array(degrees.length);

    graph.forEachNode(function(n){
        var n_index = theStructure.map.get(n);

        graph.forEachLinkedNode(n.id, function(neighbor){
            if (n == neighbor) {
                return;
            }
            var neigh_index = theStructure.map.get(neighbor);
            if (struct[neigh_index] == struct[n_index]) {
                if (weighted) {
                    //throw new Error("weighted aren't implemented");
                    //internal[struct[neigh_index]] += graph.getEdge(n, neighbor).getWeight();
                } else {
                    internal[struct[neigh_index]]++;
                }
            }
        }.bind(this), false);

    }.bind(this));

    for (var i = 0; i < degrees.length; i++) {
        internal[i] /= 2.0;
        res += usedResolution * (internal[i] / totalWeight) - Math.pow(degrees[i] / (2 * totalWeight), 2);//HERE
    }
    return res;
};



/**
 *
 * @param {Number} nodeId
 * @param {Community} community
 * @param {CommunityStructure} theStructure
 * @param {Number} currentResolution
 * @returns {Number}
 */
Modularity.prototype.q = function(nodeId, community, theStructure, currentResolution) {

    var edgesToFloat = theStructure.nodeConnectionsWeight[nodeId].get(community);
    var edgesTo = 0;
    if (edgesToFloat != null) {
        edgesTo = edgesToFloat;
    }
    var weightSum = community.weightSum;
    var nodeWeight = theStructure.weights[nodeId];
    var qValue = currentResolution * edgesTo - (nodeWeight * weightSum) / (2.0 * theStructure.graphWeightSum);
    if ((theStructure.nodeCommunities[nodeId] == community) && (theStructure.nodeCommunities[nodeId].size() > 1)) {
        qValue = currentResolution * edgesTo - (nodeWeight * (weightSum - nodeWeight)) / (2.0 * theStructure.graphWeightSum);
    }
    if ((theStructure.nodeCommunities[nodeId] == community) && (theStructure.nodeCommunities[nodeId].size() == 1)) {
        qValue = 0.;
    }
    return qValue;

};

module.exports = Modularity;