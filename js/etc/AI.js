/**
 * https://github.com/AI-Repository/PACMAN-AI/blob/master/paper.pdf
 * 
 * 
 * BFS to nearest intersection in each direction. which is safe? which scores more points
 * tie breaker to current direction of travel
 *  
 * 
 * 
 * ========================
 * rule policy - target selection
 * ========================
 * if energized:
 *      chase nearest ghost - take into account distance from ghost and flashing
 *      if flashing and far (enough) away, then assume normal mode. how far away?
 * 
 * if normal mode && energizers on board:
 *      find safest path (has intersections, no ghosts) to fruit that would eat the most pellets
 *      find safest path (has intersections, no ghosts) to energizer that would eat the most pellets
 *      if stopped and near energizer, wait for ghosts to get closer before grabbing it (how close?)
 * 
 * if no energizers on board
 *      find safest path to nearest pellet
 * 
 * 
 * 
 * 
 * 
 * ==========================
 * definition of "SAFE":
 * ==========================
 * -- no ghosts is best
 * -- the more intersections (escape routes) on the path, the better
 * -- if ghost in path take into account the ghosts direction and distance
 * -- "distance threat" - distance at which a ghost's proximity should begin to be taken into account
 * 
 * 
 * ==========================
 * scoring "safeness"-- heuristics
 * ==========================
 * 
 * 
 * 
 * how to deal with stopped state, "waiting" "ambush"?
 * 
 * 
 */
class AI {
    static TURNS = [Vector.UP, Vector.DOWN, Vector.LEFT, Vector.RIGHT];
    static ROUTE_DEPTH_BASE = 4;
    static DIRECTION_THROTTLE = 8;

    static loadMaze(MazeCls) {
        this.ROUTE_DEPTH = this.ROUTE_DEPTH_BASE;
        delete this.paths;
        this.mazeCls = MazeCls;
        this.generateIntersectionNodes();
    }

    static generateIntersectionNodes() {
        this.graph = {};
        for (var x = 0; x < 28; x++) {
            for (var y = 0; y < 36; y++) {
                var tile = {x:x,y:y};
                if (this.mazeCls.isWalkableTile(tile)) {
                    var turnCount = 0;
                    for (var t = 0; t < this.TURNS.length; t++) {
                        var testTile = Vector.add(tile, this.TURNS[t]);
                        if (this.mazeCls.isWalkableTile(testTile)) {
                            turnCount++;
                        }
                    }
                    if (turnCount > 2) {
                        var key = tile.x + ',' + tile.y;
                        this.graph[key] = tile;
                    }
                }
            }
        }
    }


    static shortestPathBFS(fromTile, toTile) {
        var searchQueue = [fromTile],
            tileLookup = {},
            directions = AI.TURNS;
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

                //else tag this path with a ghost
                if (!this.mazeCls.isWallTile(testTile) && !tileLookup[tileKey]) {
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
    static analyze(pacman, scene) {
        var tileLookup = {},
            tile = pacman.tile,
            directions = AI.TURNS,
            firstGeneration = true,
            searchQueue = [tile],
            nearestPellet = null,
            nearestPellets = {},
            pelletHash = {},
            allPellets = [],
            energizerHash = {},
            nearestEnergizer = null,
            nearestEnergizers = {},
            allEnergizers = [],
            nearestFruit = false,
            ghostHash = {},
            nearestFrightenedGhosts = {},
            nearestGhosts = {},
            allGhosts = {},
            nearestIntersections = {},
            allIntersections = [];

        if (pacman.stopped) {
            //add zero vector to directions to evaluate the current tile (stay in place)
            directions.push(Vector.ZERO);
        };

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
                allIntersections.push(searchTile);
            }
            if (energizerHash[searchTileKey]) {
                if (!nearestEnergizer) {
                    nearestEnergizer = searchTile;
                }
                if (!nearestEnergizers[searchDirection]) {
                    nearestEnergizers[searchDirection] = searchTile;
                }
                allEnergizers.push(searchTile);
            }
            if (pelletHash[searchTileKey]) {
                if (!nearestPellet) {
                    nearestPellet = searchTile;
                }
                if (!nearestPellets[searchDirection]) {
                    nearestPellets[searchDirection] = searchTile;
                }
                allPellets.push(searchTile);
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
                if (!this.mazeCls.isWallTile(testTile) && !tileLookup[tileKey]) {
                    testTile.distance = searchTile.distance + 1;
                    if (firstGeneration) {
                        testTile.direction = directions[i];
                    } else {
                        testTile.direction = searchTile.direction;
                    }
                    //check for presence of ghost on this tile
                    testTile.path = searchTile.path.concat(directions[i]);
                    tileLookup[tileKey] = testTile;
                    searchQueue.push(testTile);
                }
            }
            firstGeneration = false;
        }

        return {
            nearestPellet: nearestPellet,
            nearestPellets: nearestPellets,
            nearestEnergizer: nearestEnergizer,
            nearestEnergizers: nearestEnergizers,
            allIntersections: allIntersections
        }
    }

    /**
     * looks at the maze state and scores it
     * @param {*} state state of the game
     */
    static evaluate(scene) {
        if (scene.levelComplete) return;
        //wait x frames after making a direction change
        if (this.directionThrottle) {
            this.directionThrottle--;
            return;
        }
        //get stuck on warp tiles, just skip them
        if (this.mazeCls.isWarpTile(scene.pacman.tile)) return;
        //create a ghost hash
        this.ghostHash = {};
        scene.ghosts.forEach(g => {
            this.ghostHash[g.tile.x + ',' + g.tile.y] = g;
        });
        this.energizerHash = {};
        //create a hash of things in the maze so we don't have to keep searching their array for them
        scene.energizers.forEach(e => {
            this.energizerHash[e.tile.x + ',' + e.tile.y] = e;
        });
        this.pelletHash = {};
        scene.pellets.forEach(p => {
            this.pelletHash[p.tile.x + ',' + p.tile.y] = p;
        });
        this.fruitHash = {};
        if (scene.fruit) {
            this.fruitHash[scene.fruit.tile.x + ',' + scene.fruit.tile.y] = scene.fruit;
        }
        var startTile = Vector.clone(scene.pacman.tile),
            leaves = [],
            paths = [];

        //if didn't see a pellet in search field, there must be one out there, get shortest path to nearest
        this.sawThing = false;
        //double route finding depth to locate ghosts /fruit better
        this.ROUTE_DEPTH = this.ROUTE_DEPTH_BASE * ((scene.fruit || scene.pacman.isEnergized)?2:1); 
        AI.createRouteTree(scene, startTile, 0, leaves);
        //score each path in the routeTree
        AI.scoreRoutes(scene, startTile, 1, paths);
        this.paths = startTile;

        // console.log(paths);


        paths.sort((p1, p2) => p2.score - p1.score);
        var safeRoutes = paths.filter(p => p[0].safe > 0),
            dangerousRoutes = paths.filter(p => p[0].safe == 0),
            unsafeRoutes = paths.filter(p => p[0].safe < 0);

        var pacmanOldDirection = Vector.clone(scene.pacman.direction);
        if (!this.sawThing) {
            //didn't see a pellet in the search horizon and safe from ghosts, find the closest a pellet and go to it
            //not chasing something else like ghost or fruit
            if (!this.locatePellet) {
                var state = this.analyze(scene.pacman, scene);
                this.locatePellet = (state.nearestPellet||state.nearestEnergizer);    
            }
            if (this.locatePellet) {
                var path = this.shortestPathBFS(scene.pacman.tile, this.locatePellet).path,
                    testTile = Vector.add(scene.pacman.tile, path[0]),
                    choices = [];
                //is direction safe?
                for (var i = 0; i < AI.paths.children.length; i++) {
                    if (Vector.equals(testTile, AI.paths.children[i])) {
                        if (AI.paths.children[i].safe > 0) {
                            if (!Vector.equals(scene.pacman.direction, path[0])) {
                                this.directionThrottle = this.DIRECTION_THROTTLE;
                            }
                            scene.pacman.direction = path[0];
                            return;
                        }
                        choices.push(AI.paths.children[i]);
                    } else {
                        choices.push(AI.paths.children[i]);
                    }
                }
                if (choices.length) {
                    //shortest route not safe, choose another and find new route to pellet
                    this.sawThing = false;
                    choices.sort((c1, c2) =>  c2.safe - c1.safe);
                    // console.log('chose', choices[0]);
                    scene.pacman.direction = choices[0].direction;
                }
            }
        } else {
            if (this.sawThing) {
                delete this.locatePellet;
            }
            // console.log(paths);
            var choosePaths;
            if (safeRoutes.length) {
                choosePaths = safeRoutes;
            } else if (dangerousRoutes.length) {
                choosePaths = dangerousRoutes;
            } else if (unsafeRoutes.length) {
                choosePaths = unsafeRoutes;
            }

            //prefer current direction
            var direction = scene.pacman.direction,
                topScore = choosePaths[0].score,
                bestCurDirection = [],
                bestDiffDirection = [];
            for (var i = 0; i < choosePaths.length; i++) {
                if (choosePaths[i].score == topScore && Vector.equals(choosePaths[i][0].direction, direction)) {
                    //maintain current direction
                    bestCurDirection.push(choosePaths[i])
                } else if (choosePaths[i].score == topScore) {
                    //keep top best
                    bestDiffDirection.push(choosePaths[i]);
                }
            }
            if (bestCurDirection.length) {
                //chose random best?
                var choice = Math.floor(Math.random() * bestCurDirection.length);
                bestCurDirection[choice].forEach(t => t.chosen = true);
                //else just choose first path
                scene.pacman.direction = bestCurDirection[choice][0].direction;
            } else if (bestDiffDirection.length) {
                //chose random best?
                var choice = Math.floor(Math.random() * bestDiffDirection.length);
                bestDiffDirection[choice].forEach(t => t.chosen = true);
                //else just choose first path
                scene.pacman.direction = bestDiffDirection[choice][0].direction;
            }
        }
        if (!Vector.equals(pacmanOldDirection, scene.pacman.direction)) {
            //change direction, wait before changing again
            this.directionThrottle = this.DIRECTION_THROTTLE;
        }
    }




    static createRouteTree(scene, tile, depth, leaves) {
        if (depth <= AI.ROUTE_DEPTH) {
            depth++;
            for (var i = 0; i < this.TURNS.length; i++) {
                var testTile = Vector.add(tile, this.TURNS[i]);
                if (testTile.x < -1) testTile.x = 29;
                if (testTile.x > 29) testTile.x = -1;
                if ((!tile.parent || !Vector.equals(testTile, tile.parent)) && this.mazeCls.isWalkableTile(testTile)) {
                    //go this way
                    testTile.direction = this.TURNS[i];
                    testTile.parent = tile;
                    tile.children = tile.children || [];
                    tile.children.push(testTile);
                    this.createRouteTree(scene, testTile, depth, leaves);
                }
            }
        } else {
            leaves.push(tile);
        }
    }


    static scoreRoutes(scene, tile, safe, paths) {
        tile.safe = safe;
        //DFS looking for ghosts
        var key = tile.x + ',' + tile.y,
            ghost = this.ghostHash[key];
        if (ghost && !ghost.isFrightened && !ghost.isEaten) {
            safe = -1;
            //walk back up tree and mark unsafe
            tile.safe = -1;
            var parentTile = tile.parent,
                tsafe = safe,
                movingAway = this.ghostMovingAway(ghost, scene.pacman);
            while (parentTile) {
                if (movingAway && parentTile.children.length > 1 && parentTile.safe > 0) {
                    //intersection... if it was safe and ghost is not chasing, mark as dangerous now
                    tsafe = 0;
                }
                parentTile.safe = tsafe;
                parentTile = parentTile.parent;
            }
        }

        if (tile.children) {
            for (var i = 0; i < tile.children.length; i++) {
                this.scoreRoutes(scene, tile.children[i], safe, paths);
            }
        } else {
            //at a leaf, walk back up tree and keep track of path
            var path = [],
                score = 0,
                distance = 1;
            do {
                if (tile.parent) {
                    //this omits pacman's current tile
                    path.unshift(tile);
                }
                var key = tile.x + ',' + tile.y,
                    ghost = this.ghostHash[key],
                    fruit = this.fruitHash[key],
                    tscore = 0;
                if (this.pelletHash[key]) {
                    //proximity into account
                    this.sawThing = true;
                    tscore += (10 * distance);
                } else if (this.energizerHash[key] && !scene.pacman.isEnergized) {
                    this.sawThing = true;
                    if (safe < 1) {
                        //if not safe, make energizers very valuable
                        tscore += 1000;
                    } else {
                        tscore += 50;
                    }
                } else if (fruit) {
                    this.sawThing = true;
                    tscore += (10 * fruit.points * distance);
                }

                if (tile.children && tile.children.length > 1) {
                    //more escape routes. favor this
                    tscore += ((tile.children.length-2) * 10);
                }

                if (ghost) {
                    if (ghost.isFrightened) {
                        this.sawThing = true;
                        tscore += (500*distance);
                    } else if (!ghost.isEaten) {
                        if (!this.ghostMovingAway(ghost, scene.pacman)) {
                            tscore -= (100*distance);
                        }
                    }
                }
                tile.score = tscore;
                score += tscore;
                tile = tile.parent;
                distance++;
            } while (tile);
            path.score = score;
            paths.push(path);
        }
    }

    static ghostMovingAway(ghost, pacman) {
        var movingAway = false;
        if (ghost.direction.x) {
            movingAway = ((ghost.x < pacman.x && ghost.direction.x < 0) ||  (ghost.x > pacman.x && ghost.direction.x > 0));
        } else if (ghost.direction.y) {
            movingAway = ((ghost.y < pacman.y && ghost.direction.y < 0) ||  (ghost.y > pacman.y && ghost.direction.y > 0));
        }
        return movingAway;
    }


    static drawPaths(context, tile) {
        tile = tile || this.paths;
        context.beginPath();
        context.lineWidth = 1;
        if (tile.chosen) {
            context.strokeStyle = "#0000FF";
        } else if (tile.safe < 0) {
            //unsafe
            context.strokeStyle = "#FF0000";
        } else if (tile.safe > 0) {
            //safe
            context.strokeStyle = "#00FF00";
        } else {
            //danger
            context.strokeStyle = "#FFA500";
        }
        context.strokeRect(tile.x * 8, tile.y * 8, 8, 8);
        if (tile.children) {
            for (var i = 0; i < tile.children.length; i++) {
                this.drawPaths(context, tile.children[i]);
            }
        }
    }
}