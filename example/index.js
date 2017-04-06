var dot = require('ngraph.fromdot')
    , Modularity = require('../Modularity')
    , centrality = require('ngraph.centrality')
    ;

global.toArray = function(map) {
    var result = [];
    map.forEach(function (v, i) {
        result.push([i,v]);
    });
    return result;
};
var g  = dot('digraph G {  }');
g.addLink('a','b', {weight:1});
g.addLink('b','c', {weight:1});
g.addLink('c','a', {weight:1});
g.addLink('c','k', {weight:10});
g.addLink('k','d', {weight:10});
g.addLink('d','e', {weight:1});
g.addLink('e','f', {weight:1});
g.addLink('f','d', {weight:1});

var modularity = new Modularity(1,true);

var communities = modularity.execute(g);

console.dir(communities);
