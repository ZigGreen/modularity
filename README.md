# Modularity 

Community detection algorithm based on graph modularity metric.
It is code adaptation of [Gephi](https://github.com/gephi/gephi) [Modularity.java](https://github.com/gephi/gephi/blob/master/modules/StatisticsPlugin/src/main/java/org/gephi/statistics/plugin/Modularity.java) to javascript.

# usage

``` javascript
var dot = require('ngraph.fromdot')
    , Modularity = require('../Modularity')
    , centrality = require('ngraph.centrality')
    ;

var g  = dot('digraph G { a -> b; b -> c; c -> a; a -> d; d -> e; e -> f; f -> d; f -> g; g -> e; }');
var modularity = new Modularity;

var communities = modularity.execute(g);

console.dir(communities);
```

# install

With [npm](https://npmjs.org):

```
npm install ngraph.modularity --save
```

# license

MIT