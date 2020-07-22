class AI {
    //create a node/edge graph representation of the maze. this will be used for path finding by the ai agents
    static generatePathGraph() {
        var directions = [Vector.UP, Vector.DOWN, Vector.LEFT, Vector.RIGHT];
        //inspect the maze- every intersection is a node
        //special cases 12,14 and 15,14 and 12,26 and 15,26, not decision tiles, but are intersections
        var nodes = {};
        //finally all the decision tiles are nodes 
        Maze.tiles.filter(t => t.decision).forEach((t) => {
            nodes[t.x + ',' + t.y] = {};
        });
        //"crawl" the maze from each node to generate path graph edge weights
        for (var coords in nodes) {
            var tile = { x: parseInt(coords.split(',')[0]), y: parseInt(coords.split(',')[1]) };
            //find the 3 or 4 open directions out from this node and travel along
            // the path until reaching another node
            for (var i = 0; i < directions.length; i++) {
                var tempTile = Vector.add(tile, directions[i]),
                    sceneTile = Maze.tileHash[tempTile.x + ',' + tempTile.y];
                if (!sceneTile || (sceneTile && (!sceneTile.walkable || sceneTile.tunnel))) {
                    continue;
                }
                //found a traversable tile. see where it leads
                var lastDirection = Vector.clone(directions[i]),
                    distance = 1;
                while (!nodes[tempTile.x + ',' + tempTile.y]) {
                    for (var j = 0; j < directions.length; j++) {
                        //don't double back
                        if (Vector.equals(Vector.inverse(lastDirection), directions[j])) {
                            continue;
                        }
                        var testTile = Vector.add(tempTile, directions[j]);
                        //find the open tile
                        var sceneTile = this.tileHash[testTile.x + ',' + testTile.y];
                        if (!sceneTile || sceneTile.walkable) {
                            //!scenetile would be a warp
                            distance++;
                            tempTile = testTile;
                            lastDirection = directions[j];
                            break;
                        }
                    }
                }
                var tempTileHashKey = tempTile.x + ',' + tempTile.y;
                nodes[coords][tempTileHashKey] = distance;
            }
        }
        this.graph = nodes;
    }

    static shortestPathBFS(fromTile, toTile) {
        var searchQueue = [fromTile],
            tileLookup = {},
            directions = [Vector.UP, Vector.DOWN, Vector.LEFT, Vector.RIGHT];
        fromTile.path = [];
        tileLookup[fromTile.x + ',' + fromTile.y] = fromTile;
        while (searchQueue.length) {
            var searchTile = searchQueue.shift();
            if (Vector.equals(searchTile, toTile)) {
                searchQueue = [];
                return {
                    path: searchTile.path,
                    distance: searchTile.path.length
                }
            }
            for (var i = 0; i < directions.length; i++) {
                var testTile = Vector.add(searchTile, directions[i]);
                //special case warps
                if (testTile.x < 0) {
                    testTile.x = 27;
                } else if (testTile.x > 27) {
                    testTile.x = 0;
                }
                var tileKey = testTile.x + ',' + testTile.y;
                if (Maze.tileHash[tileKey].walkable && !tileLookup[tileKey]) {
                    testTile.path = searchTile.path.concat(directions[i]);
                    tileLookup[tileKey] = testTile;
                    searchQueue.push(testTile);
                }
            }
        }
    }


    //non-recursivce BFS of the maze. search until all objects are
    //found. keep track of initial direction from the passed in tile for
    //each searched tile
    static analyze(tile, scene) {
        var tileLookup = {},
            directions = [Vector.UP, Vector.DOWN, Vector.LEFT, Vector.RIGHT],
            firstGeneration = true,
            searchQueue = [tile],
            nearestPellets = {},
            pelletHash = {},
            energizerHash = {},
            nearestEnergizers = {},
            nearestFruit = false,
            ghostHash = {},
            nearestFrightenedGhosts = {},
            nearestGhosts = {},
            allGhosts = {},
            nearestIntersections = {};
        //create a hash of things in the maze so we don't have to keep searching their array for them
        scene.energizers.forEach(e => {
            energizerHash[e.tile.x + ',' + e.tile.y] = e;
        });
        scene.pellets.forEach(p => {
            pelletHash[p.tile.x + ',' + p.tile.y] = p;
        });
        scene.ghosts.forEach(g => {
            var ghostHashKey = g.tile.x + ',' + g.tile.y;
            ghostHash[ghostHashKey] = ghostHash[ghostHashKey] || {};
            ghostHash[ghostHashKey][g.name] = g;
        })
        //check the initial tile for things? or no need to
        tile.distance = 0;
        tile.path = [];
        tileLookup[tile.x + ',' + tile.y] = tile;
        while (searchQueue.length) {
            //take tile off front of search queue
            var searchTile = searchQueue.shift(),
                searchDirection = searchTile.direction ? searchTile.direction.x + ',' + searchTile.direction.y : '0,0',
                searchTileKey = searchTile.x + ',' + searchTile.y;

            if (this.graph[searchTileKey] && !Vector.equals(scene.pacman.tile, searchTile)) {
                if (!nearestIntersections[searchDirection]) {
                    nearestIntersections[searchDirection] = searchTile;
                }
            }
            if (energizerHash[searchTileKey]) {
                if (!nearestEnergizers[searchDirection]) {
                    nearestEnergizers[searchDirection] = searchTile;
                }
            }
            if (pelletHash[searchTileKey]) {
                if (!nearestPellets[searchDirection]) {
                    nearestPellets[searchDirection] = searchTile;
                }
            }
            if (!nearestFruit && scene.fruit && Vector.equals(scene.fruit, searchTile)) {
                nearestFruit = searchTile;
            }
            var ghosts = ghostHash[searchTileKey];
            if (ghosts) {
                for (var name in ghosts) {
                    var ghost = ghosts[name];
                    if (ghost.isFrightened) {
                        if (!nearestFrightenedGhosts[searchDirection]) {
                            nearestFrightenedGhosts[searchDirection] = searchTile
                        }
                    } else if (!ghost.isEaten && !ghost.isFrightened) {
                        if (!nearestGhosts[searchDirection]) {
                            nearestGhosts[searchDirection] = searchTile;
                        }
                    }
                    if (!ghost.isFrightened) {
                        allGhosts[name] = {
                            distance: searchTile.distance,
                            direction: searchTile.direction
                        };
                    }
                }
                searchTile.ghosts = ghosts;
            }

            for (var i = 0; i < directions.length; i++) {
                var testTile = Vector.add(searchTile, directions[i]);
                //special case warps
                if (testTile.x < 0) {
                    testTile.x = 27;
                } else if (testTile.x > 27) {
                    testTile.x = 0;
                }
                var tileKey = testTile.x + ',' + testTile.y;
                if (this.tileHash[tileKey].walkable && !tileLookup[tileKey]) {
                    testTile.distance = searchTile.distance + 1;
                    if (firstGeneration) {
                        testTile.direction = directions[i];
                    } else {
                        testTile.direction = searchTile.direction;
                    }
                    testTile.path = searchTile.path.concat(directions[i]);
                    tileLookup[tileKey] = testTile;
                    searchQueue.push(testTile);
                }
            }
            firstGeneration = false;
        }

        //figure out which direction (if any) moves pacman away from ALL ghosts on average
        //look at each ghost and determine which first direction is on the shortest path to it
        //plus the distance
        var ghostDistance = {},
            allGhostCount = Object.keys(allGhosts).length;
        if (allGhostCount) {
            for (var name in allGhosts) {
                directions.forEach(d => {
                    var testTile = Vector.add(d, tile);
                    if (Maze.isWalkableTile(testTile)) {
                        var directionKey = d.x + ',' + d.y;
                        if (!ghostDistance[directionKey]) {
                            ghostDistance[directionKey] = {
                                direction: testTile,
                                distance: 0
                            };
                        }
                        ghostDistance[directionKey].distance += (this.shortestPathBFS(testTile, scene.ghosts[name].tile).distance / allGhostCount);
                    }
                });
            }
        }

        //dot density cloud



        return {
            energizers: Object.values(nearestEnergizers).sort((a, b) => a.distance - b.distance),
            pellets: Object.values(nearestPellets).sort((a, b) => a.distance - b.distance),
            fruit: nearestFruit,
            ghosts: Object.values(nearestGhosts).sort((a, b) => a.distance - b.distance),
            allghosts: allGhosts,
            avgghostdistance: ghostDistance,
            frightenedGhosts: Object.values(nearestFrightenedGhosts).sort((a, b) => a.distance - b.distance),
            intersections: Object.values(nearestIntersections).sort((a, b) => a.distance - b.distance)
        }
    }
}