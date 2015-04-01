"use strict";
var Community = require('./Community')
    , ModEdge= require('./ModEdge')
    ;

/**
 *
 * @param {IGraph} graph
 * @param useWeight
 * @param {CommunityStructure} structure
 * @constructor
 */
function CommunityStructure(graph, useWeight) {

    //this.graph = graph;
    this.N = graph.getNodesCount();
    this.graphWeightSum = 0;
    this.structure = this;

    /** @type {Map.<Number, Community>} */
    this.invMap = new Map();

    /** @type {Array.< Map.<Community, Number> >} */
    this.nodeConnectionsWeight = new Array(this.N);

    /** @type {Array.< Map.<Community, Number> >} */
    this.nodeConnectionsCount = new Array(this.N);

    /** @type {Array.<Community>} */
    this.nodeCommunities = new Array(this.N);

    /** @type {Map.<Node, Number>} */
    this.map = new Map();

    /** @type {Array.< Array.<ModEdge> >} */
    this.topology = new Array(this.N);

    /** @type {Array.<Community>} */
    this.communities =  [];

    /**@type {Array.<Number>} */
    this.weights = new Array(this.N);

    var index = 0;

    graph.forEachNode(function(node){

        this.map.set(node, index);
        this.nodeCommunities[index] = new Community(this);
        this.nodeConnectionsWeight[index] = new Map();
        this.nodeConnectionsCount[index] = new Map();
        this.weights[index] = 0;
        this.nodeCommunities[index].seed(index);
        var hidden = new Community(this);
        hidden.nodes.add(index);
        this.invMap.set(index, hidden);
        this.communities.push(this.nodeCommunities[index]);
        index++;

    }.bind(this));

    graph.forEachNode(function(node){
        var node_index = this.map.get(node);
        this.topology[node_index] = [];

        graph.forEachLinkedNode(node.id, function(neighbor){
            if (node == neighbor) {
                return;
            }
            var neighbor_index = this.map.get(neighbor);
            var weight = 1;

            if (useWeight) {
                throw new Error("useWeight aren't implemented");
                //weight =  graph.getEdge(node, neighbor).getWeight();
            }

            this.weights[node_index] += weight;
            var /** @type {ModEdge} */ me = new ModEdge(node_index, neighbor_index, weight);
            this.topology[node_index].push(me);
            var /** @type {Community} **/ adjCom = this.nodeCommunities[neighbor_index];
            this.nodeConnectionsWeight[node_index].set(adjCom, weight);
            this.nodeConnectionsCount[node_index].set(adjCom, 1);
            this.nodeCommunities[node_index].connectionsWeight.set(adjCom, weight);
            this.nodeCommunities[node_index].connectionsCount.set(adjCom, 1);
            this.nodeConnectionsWeight[neighbor_index].set(this.nodeCommunities[node_index], weight);
            this.nodeConnectionsCount[neighbor_index].set(this.nodeCommunities[node_index], 1);
            this.nodeCommunities[neighbor_index].connectionsWeight.set(this.nodeCommunities[node_index], weight);
            this.nodeCommunities[neighbor_index].connectionsCount.set(this.nodeCommunities[node_index], 1);
            this.graphWeightSum += weight;
        }.bind(this));

    }.bind(this));

    this.graphWeightSum /= 2.0;
}


/**
 * @param {Number} node
 * @param {Community} to
 */
CommunityStructure.prototype.addNodeTo = function(node, to) {

    to.add(node);
    this.nodeCommunities[node] = to;

    var nodeTopology = this.topology[node];
    for (var topologyKey in nodeTopology) {

        //noinspection JSUnfilteredForInLoop
        var /** @type {ModEdge} */ e = nodeTopology[topologyKey];

        var neighbor = e.target;


        //Remove Node Connection to this community
        var neighEdgesTo = this.nodeConnectionsWeight[neighbor].get(to);
        if (neighEdgesTo === undefined) {
            this.nodeConnectionsWeight[neighbor].set(to, e.weight);
        } else {
            this.nodeConnectionsWeight[neighbor].set(to, neighEdgesTo + e.weight);
        }

        var neighCountEdgesTo = this.nodeConnectionsCount[neighbor].get(to);
        if (neighCountEdgesTo === undefined) {
            this.nodeConnectionsCount[neighbor].set(to, 1);
        } else {
            this.nodeConnectionsCount[neighbor].set(to, neighCountEdgesTo + 1);
        }


        var /** @type {Community} */ adjCom = this.nodeCommunities[neighbor];
        var wEdgesto = adjCom.connectionsWeight.get(to);
        if (wEdgesto === undefined) {
            adjCom.connectionsWeight.set(to, e.weight);
        } else {
            adjCom.connectionsWeight.set(to, wEdgesto + e.weight);
        }

        var cEdgesto = adjCom.connectionsCount.get(to);
        if (cEdgesto === undefined) {
            adjCom.connectionsCount.set(to, 1);
        } else {
            adjCom.connectionsCount.set(to, cEdgesto + 1);
        }

        var nodeEdgesTo = this.nodeConnectionsWeight[node].get(adjCom);
        if (nodeEdgesTo === undefined) {
            this.nodeConnectionsWeight[node].set(adjCom, e.weight);
        } else {
            this.nodeConnectionsWeight[node].set(adjCom, nodeEdgesTo + e.weight);
        }

        var nodeCountEdgesTo = this.nodeConnectionsCount[node].get(adjCom);
        if (nodeCountEdgesTo === undefined) {
            this.nodeConnectionsCount[node].set(adjCom, 1);
        } else {
            this.nodeConnectionsCount[node].set(adjCom, nodeCountEdgesTo + 1);
        }

        if (to != adjCom) {
            var comEdgesto = to.connectionsWeight.get(adjCom);
            if (comEdgesto === undefined) {
                to.connectionsWeight.set(adjCom, e.weight);
            } else {
                to.connectionsWeight.set(adjCom, comEdgesto + e.weight);
            }

            var comCountEdgesto = to.connectionsCount.get(adjCom);
            if (comCountEdgesto === undefined) {
                to.connectionsCount.set(adjCom, 1);
            } else {
                to.connectionsCount.set(adjCom, comCountEdgesto + 1);
            }

        }
    }
};

/**
 * @param {Number} node
 * @param {Community} source
 */
CommunityStructure.prototype.removeNodeFrom = function(node, source) {

    var community = this.nodeCommunities[node];


    var nodeTopology = this.topology[node];
    for (var topologyKey in nodeTopology) {

        //noinspection JSUnfilteredForInLoop
        var /** @type {ModEdge} */ e = nodeTopology[topologyKey];

        var neighbor = e.target;

        //Remove Node Connection to this community
        var edgesTo = this.nodeConnectionsWeight[neighbor].get(community);
        var countEdgesTo = this.nodeConnectionsCount[neighbor].get(community);

        if ((countEdgesTo - 1) == 0) {
            this.nodeConnectionsWeight[neighbor].delete(community);
            this.nodeConnectionsCount[neighbor].delete(community);
        } else {
            this.nodeConnectionsWeight[neighbor].set(community, edgesTo - e.weight);
            this.nodeConnectionsCount[neighbor].set(community, countEdgesTo - 1);
        }


        //Remove Adjacency Community's connection to this community
        var adjCom = this.nodeCommunities[neighbor];
        var oEdgesto = adjCom.connectionsWeight.get(community);
        var oCountEdgesto = adjCom.connectionsCount.get(community);
        if ((oCountEdgesto - 1) == 0) {
            adjCom.connectionsWeight.delete(community);
            adjCom.connectionsCount.delete(community);
        } else {
            adjCom.connectionsWeight.set(community, oEdgesto - e.weight);
            adjCom.connectionsCount.set(community, oCountEdgesto - 1);
        }

        if (node == neighbor) {
            continue;
        }

        if (adjCom != community) {

            var comEdgesto = community.connectionsWeight.get(adjCom);
            var comCountEdgesto = community.connectionsCount.get(adjCom);

            if (comCountEdgesto - 1 == 0) {
                community.connectionsWeight.delete(adjCom);
                community.connectionsCount.delete(adjCom);
            } else {
                community.connectionsWeight.set(adjCom, comEdgesto - e.weight);
                community.connectionsCount.set(adjCom, comCountEdgesto - 1);
            }

        }

        var nodeEdgesTo = this.nodeConnectionsWeight[node].get(adjCom);
        var nodeCountEdgesTo = this.nodeConnectionsCount[node].get(adjCom);

        if ((nodeCountEdgesTo - 1) == 0) {
            this.nodeConnectionsWeight[node].delete(adjCom);
            this.nodeConnectionsCount[node].delete(adjCom);
        } else {
            this.nodeConnectionsWeight[node].set(adjCom, nodeEdgesTo - e.weight);
            this.nodeConnectionsCount[node].set(adjCom, nodeCountEdgesTo - 1);
        }

    }

    source.remove(node);
};

/**
 * @param {Number} node
 * @param {Community} to
 */
CommunityStructure.prototype.moveNodeTo = function(node, to) {

    var source = this.nodeCommunities[node];
    this.removeNodeFrom(node, source);
    this.addNodeTo(node, to);

};



CommunityStructure.prototype.zoomOut = function() {
    var realCommunities = this.communities.reduce(function(arr, value) {
        arr.push(value);
        return arr;
    }, []);
    var M = realCommunities.length; // size
    var /** @type Array.< Array.<ModEdge> > */ newTopology = new Array(M);
    var index = 0;

    this.nodeCommunities = new Array(M);
    this.nodeConnectionsWeight = new Array(M);
    this.nodeConnectionsCount = new Array(M);

    var /** @type Map.<Number, Community>*/ newInvMap = new Map();
    realCommunities.forEach(function(com) {

        var  weightSum = 0;
        this.nodeConnectionsWeight[index] = new Map();
        this.nodeConnectionsCount[index] = new Map();
        newTopology[index] = [];
        this.nodeCommunities[index] = new Community(com);
        //var iter = com.connectionsWeight.keySet();

        var hidden = new Community(this.structure);

        com.nodes.forEach(function (nodeInt) {

            var oldHidden = this.invMap.get(nodeInt);
            oldHidden.nodes.forEach(hidden.nodes.add.bind(hidden.nodes));

        }, this);

        newInvMap.set(index, hidden);
        com.connectionsWeight.forEach( function(weight, adjCom ) {

            var target = realCommunities.indexOf(adjCom);
            if (target == index) {
                weightSum += 2. * weight;
            } else {
                weightSum += weight;
            }
            var e = new ModEdge(index, target, weight);
            newTopology[index].push(e);

        }, this);

        this.weights[index] = weightSum;
        this.nodeCommunities[index].seed(index);

        index++;

    }.bind(this));

    this.communities = [];

    for (var i = 0; i < M; i++) {
        var com = this.nodeCommunities[i];
        this.communities.push(com);
        for (var ei in newTopology[i]) {
            //noinspection JSUnfilteredForInLoop
            var e = newTopology[i][ei];
            this.nodeConnectionsWeight[i].set(this.nodeCommunities[e.target], e.weight);
            this.nodeConnectionsCount[i].set(this.nodeCommunities[e.target], 1);
            com.connectionsWeight.set(this.nodeCommunities[e.target], e.weight);
            com.connectionsCount.set(this.nodeCommunities[e.target], 1);
        }

    }

    this.N = M;
    this.topology = newTopology;
    this.invMap = newInvMap;

};

module.exports = CommunityStructure;

/*class CommunityStructure {

    HashMap<Modularity.Community, Float>[] nodeConnectionsWeight;
    HashMap<Modularity.Community, Integer>[] nodeConnectionsCount;
    HashMap<Node, Integer> map;
    Community[] nodeCommunities;
    Graph graph;
    double[] weights;
    double graphWeightSum;
    LinkedList<ModEdge>[] topology;
    LinkedList<Community> communities;
    int N;
    HashMap<Integer, Community> invMap;


}*/
