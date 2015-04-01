var dot = require('ngraph.fromdot')
    , Modularity = require('../Modularity')
    , centrality = require('ngraph.centrality')
    ;

var g  = dot('digraph G { a -> b; b -> c; c -> a; a -> d; d -> e; e -> f; f -> d; f -> g; g -> e; }');
var modularity = new Modularity;

var communities = modularity.execute(g);

console.dir(communities);