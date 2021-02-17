/**
 * Vector class with some helpful vector math functions. 
 * A Vector represents an x, y coordinate pair. could be tile 
 * location, pixel locations, whatever. 
 */
class Vector {
    //helpful vectors used for directions and tile math
    static ZERO = {x: 0, y: 0};
    static LEFT = {x: -1, y: 0};
    static RIGHT = {x: 1, y: 0};
    static UP = {x: 0, y: -1};
    static DOWN = {x: 0, y: 1};
    
    /**
     * add two coordinate pairs together
     * 
     * @param {*} v1 x,y coordinate pair
     * @param {*} v2 x,y coordinate pair
     */
    static add(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }
    /**
     * find the euclidian distance between two coordinate pairs
     * 
     * @param {*} v1 x,y coordinate pair
     * @param {*} v2 x,y coordinate pair
     */
    static distance(v1, v2) {
        return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
    }
    /**
     * invert the coordinate pair
     * 
     * @param {*} v x,y coordinate pair
     */
    static inverse(v) {
        return { x: -v.x, y: -v.y };
    }
    /**
     * create a copy of a coordinate pair
     * 
     * @param {*} v x,y coordinate pair
     */
    static clone(v) {
        return { x: v.x, y: v.y };
    }
    /**
     * see if two coordinate pairs are the same
     * 
     * @param {*} v1 x,y coordinate pair
     * @param {*} v2 x,y coordinate pair
     */
    static equals(v1, v2) {
        return v1.x == v2.x && v1.y == v2.y;
    }
}/**
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
}/**
 * the Sound class uses Web Audio API. One sound track for each game mode
 * contains all the sound effects for that respective game. this class
 * picks the sound track apart and plays snippets from each game's track as a
 * sound effect.
 * 
 * !!!!! In order for sound effects to work, this game must be loaded through
 * a web server because it loads the sound effects files via XMLHttpRequest
 */
class Sound {
    static initialize() {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        //load each sound track
        this.loadSound('res/pacman/sfx.ogg').then(buffer => this.sfx_0 = buffer);
        this.loadSound('res/mspacman/sfx.ogg').then(buffer => this.sfx_1 = buffer);
    }

    //list of currently running sounds. used for stopAll()
    static playing = {};

    //time offsets for each sound effect in the sfx.ogg file
    static sfx = [{    //GAME_PACMAN res/pacman/sfx.ogg
        siren0: { start: 17.125, end: 17.504 },
        siren1: { start: 18.51595, end: 18.788359 },
        siren2: { start: 19.84, end: 20.134 },
        siren3: { start: 21.14, end: 21.3985 },
        retreating: { start: 22.399, end: 22.663 },
        power_pellet: { start: 23.852, end: 23.988 },
        intermission: { start: 25.255, end: 30.418 },
        die: { start: 2.692, end: 4.184 },
        munch0: { start: 5.315, end: 5.394 },
        munch1: { start: 6.443, end: 6.525 },
        game_start: { start: 36.570, end: 40.776 },
        eat_ghost: { start: 8.794, end: 9.301 },
        extra_life: { start: 10.387, end: 12.351 },
        eat_fruit: { start: 13.463, end: 13.846 },
        credit: { start: 14.380, end: 14.595 }
    }, {   //GAME_MSPACMAN res/pacman/sfx.ogg
        credit: { start: 1.111, end: 1.357 },
        game_start: { start: 3.087, end: 7.313 },
        siren0: { start: 50.562, end: 50.695 },
        siren1: { start: 52.118, end: 52.269 },
        siren2: { start: 53.576, end: 53.743 },
        siren3: { start: 54.824, end: 55.008 },
        munch0: { start: 48.396, end: 48.526 },
        munch1: { start: 48.396, end: 48.526 },
        power_pellet: { start: 56.990, end: 95.991 },
        retreating: { start: 99.063, end: 99.664 },
        extra_life: { start: 100.148, end: 102.137 },
        eat_fruit: { start: 103.146, end: 103.533 },
        eat_ghost: { start: 106.292, end: 106.795 },
        fruit_bounce: {start: 107.293, end: 107.496 },
        die: { start: 104.427, end: 105.567 },
        act1: { start: 9.889, end: 18.470 },
        act2: { start: 19.049, end: 40.421 },
        act3: { start: 41.195, end: 46.171 }
    }];


    /**
     * siren pointer. as pellets are eaten, the siren will change
     */
    static siren = 0;
    static resetSiren() {
        this.siren = 0;
    }
    /**
     * determine which siren to play based on number of pellets remaining in maze.
     * when the siren is changed, the old siren must first be stopped.
     * @param {int} pelletsLeft pellets remaining on maze
     */
    static checkSiren(pelletsLeft) {
        //I think these are the pellet counts at which the siren
        //changes tone
        if (pelletsLeft > 108) {
            this.setSiren(0);
        } else if (pelletsLeft > 44) {
            this.setSiren(1);
        } else if (pelletsLeft > 12) {
            this.setSiren(2);
        } else {
            this.setSiren(3);
        }
    }
    static setSiren(siren) {
        if (this.siren != siren) {
            //siren change
            this.stop('siren');
        }
        this.siren = siren;
    }

    /**
     * siren pointer. as pellets are eaten, the siren will change
     * @param {*} fx sound effect name from this.sfx to play
     */
    static playLoop(fx) {
        if (fx == 'siren') {
            fx += this.siren;
        }
        //only play this clip once
        if (this.sfx[Game.GAME_MODE][fx].source) return;
        this.playing[fx] = true;
        var source = this.context.createBufferSource();
        source.buffer = this['sfx_' + Game.GAME_MODE];
        source.loop = true;
        var loop = this.sfx[Game.GAME_MODE][fx];
        source.loopStart = loop.start;
        source.loopEnd = loop.end;
        source.connect(this.context.destination);
        source.start(0, loop.start);
        this.sfx[Game.GAME_MODE][fx].source = source;
        source.addEventListener('ended', () => {
            delete this.sfx[Game.GAME_MODE][fx].source;
            delete this.playing[fx];
        });
        return source;
    }

    /**
     * this counter is only for pacman. his sound fx flips back and forth each time he eats a pellet
     */
    static munch = 0;

    /**
     * play sound effect one time
     * @param {} fx sound effect name from this.sfx to play
     */
    static playOnce(fx) {
        if (fx == 'munch') {
            this.stop('munch');
            fx += this.munch;
            this.munch = (this.munch + 1) % 2;
        }
        if (this.sfx[Game.GAME_MODE][fx].source) return;
        var source = this.context.createBufferSource();
        source.buffer = this['sfx_' + Game.GAME_MODE];
        var clip = this.sfx[Game.GAME_MODE][fx];
        source.connect(this.context.destination);
        source.start(0, clip.start, clip.end - clip.start);
        this.sfx[Game.GAME_MODE][fx].playing = true;
        this.sfx[Game.GAME_MODE][fx].source = source;
        source.addEventListener('ended', () => {
            delete this.sfx[Game.GAME_MODE][fx].source;
        });
        return source;
    }

    /**
     * stop a currently-playing sfx
     * @param {*} fx sound effect name from this.sfx to stop
     */
    static stop(fx) {
        if (fx == 'siren') {
            fx += this.siren;
        }
        if (this.sfx[Game.GAME_MODE][fx] && this.sfx[Game.GAME_MODE][fx].source) {
            this.sfx[Game.GAME_MODE][fx].source.stop();
        }
    }

    /**
     * stop all currently playing sound effects
     */
    static stopAll() {
        for (var fx in this.playing) {
            this.stop(fx);
        }
    }

    /**
     * unpauses all sounds
     */
    static resume() {
        if (this.context) this.context.resume();
    }

    /**
     * pauses all sounds
     */
    static suspend() {
        if (this.context) this.context.suspend();
    }


    /**
     * load a sound file into an audio buffer for processing
     * @param {*} url location of sound file
     */
    static loadSound(url) {
        return new Promise((resolve, reject) => {
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.onload = () => {
                this.context.decodeAudioData(request.response, function (buffer) {
                    resolve(buffer)
                });
            }
            request.send();
        });
    }
}/**
 * simple class that just keeps track of a countdown. when the
 * countdown is complete, fire the callback. used for ghost fright/flash timers, 
 * start/end of level sequences, and other game play timings
 */
class Timer {
    /**
     * nothing is passed to the constructor. a Timer doesn't do anything until
     * .start(...) is called on it with the countdown and callbacks passed to it there.
     */
    constructor() {}

    /**
     * define and start a timer countdown and an action to take at the end
     * of the countdown
     * 
     * @param {*} ticks number of ticks to set the countdown for
     * @param {*} callback callback to execute when tick countdown reaches zero
     */
    start(ticks, callback) {
        this.originalTicks = ticks;
        this.ticks = ticks;
        this.callback = callback;
        if (ticks <= 0) {
            //started with no or negative time, just do the call back immediately
            this.ticks = 0;
            this.callback.call(this);
        }
    }

    /**
     * start the timer back up
     * @param {*} ticks the number of ticks to set on the timer
     */
    reset(ticks) {
        this.ticks = ticks||this.originalTicks; 
    }

    /**
     * kill the timer
     */
    stop() {
        this.ticks = 0;
    }

    /**
     * countdown the timer. when time's up, execute the call back
     */
    tick() {
        if (this.ticks > 0) {
            this.ticks--;
            if (this.ticks == 0) {
                //time is up
                this.callback.call(this);
            }
        }
        return this.ticks > 0;
    }
}/**
 * this class reads key presses and keeps a two frame buffer 
 * since inputs appear to be delayed in the game
 */
class Input {
    //remember the last key pressed
    static lastKey = null;
    //frame delay buffer
    static buffer = [];
    //hash of currently pressed keys (hashkey = keycode)
    //and their state
    static keyState = {};

    /**
     * clear the key (frame delay) buffer
     */
    static reset() {
        Input.buffer = [];
    }

    /**
     * read key presses
     * @param {*} e key down event
     */
    static onKeyDown(e) {
        //tag this key state as pressed
        Input.keyState[''+e.keyCode] = 1;
        //remember the last key pressed
        Input.lastKey = e.keyCode;
        //if pressing arrow keys, prevent default so the web page doesn't scroll
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            e.preventDefault();
            return false;
        }
        //if space bar is pressed pause the game
        if (e.keyCode == 32) {
            GAME.pauseGame = !GAME.pauseGame;
            e.preventDefault();
            return false;
        }
        //if "F" key is pressed, pause and advance the game one frame
        if (e.keyCode == 70) {
            GAME.pauseGame = true;
            //render next frame
            Input.watch();
            SceneManager.update();
            e.preventDefault();
            return false;
        }
        // console.log(e.keyCode)
        //read the pressed key once if no keys are currently being pressed
        if (!Input.keyDown) {
            Input.keyPress = e.keyCode;
        }
        //a key is being pressed
        Input.keyDown = true;
    }

    /**
     * 
     * @param {*} e key up event
     */
    static onKeyUp(e) {
        delete Input.keyState[e.keyCode];
        delete Input.lastKey;
        //a key is no longer being pressed
        Input.keyDown = false;
    }

    /**
     * called every tick. keeps track of which keys
     * are pressed at this time and queues up the next direction
     * into the two frame delay buffer
     */
    static watch() {
        var nextDirection;
        if (Input.keyState['37'] || Input.keyState['65']) {
            nextDirection = Vector.LEFT;
        } else if (Input.keyState['39'] || Input.keyState['68']) {
            nextDirection = Vector.RIGHT;
        } else if (Input.keyState['38'] || Input.keyState['87']) {
            nextDirection = Vector.UP;
        } else if (Input.keyState['40'] || Input.keyState['83']) {
            nextDirection = Vector.DOWN;
        }
        Input.buffer.unshift(nextDirection);
        if (Input.buffer.length == 3) {
            Input.buffer.pop();
        }
    }

    /**
     * returns the last key pressed
     */
    static readKeyPress() {
        var k = this.keyPress;
        delete this.keyPress;
        return k;
    }

    /**
     * reads the key press from two frames ago
     */
    static readBuffer() {
        if (Input.buffer.length == 2) {
            return Input.buffer[1];
        } else {
            return null;
        }
    }
}

//swallow the key strokes
document.onkeydown = Input.onKeyDown;
document.onkeyup = Input.onKeyUp;/**
 * a scene instance holds a reference to the canvas context for drawing.
 * each different "screen" in the game will be represented by a scene or
 * subclass of scene.
 */
class Scene {
    constructor(context) {
        //save a reference to the canvas context
        this.context = context;
    }
    
    tick() {} //stub

    draw() {
        //clear the canvas on each draw
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}/**
 * ScriptScene keeps a ctr of each tick and will execute a
 * function from keyFrames if it is assigned to that tick. extend
 * this class for cutscenes and title scenes
 */
class ScriptScene extends Scene {
    /**
     * the constructor takes an object of tick timestamps and functions to execute at that
     * tick. timestamps can also have a few special values: 
     * 'end'    will end the scene and pop it from the SceneManager. 
     * 'loop'   will start the script over at the beginning
     * 
     * @param {*} context 
     * @param {*} keyFrames object of timestamps and functions to execute at that time
     * 
     */
    constructor(context, keyFrames) {
        super(context);
        this.keyFrames = keyFrames;
        //things to draw in this scene
        this.drawables = [];
        //things that move- pacmans, ghosts
        this.actors = [];
        //how many ticks has this scene been active
        this.ctr = 0;
    }

    tick() {
        //increment the tick ctr
        this.ctr++;
        //see if there's a callback to execute at this tick
        var keyFrame = this.keyFrames[this.ctr];
        if (keyFrame == 'loop') {
            //this scene is looped, start over now
            this.ctr = 0;
            keyFrame = this.keyFrames[this.ctr];
        }
        if (keyFrame == 'end') {
            //this scripted scene is done
            SceneManager.popScene();
        } else if (keyFrame) {
            //execute the keyframe function
            keyFrame.call(this);
        }
        for (var i = 0; i < 2; i++) {
            this.actors.forEach(a => a.tick());
        }
    }


    draw() {
        Scene.prototype.draw.call(this);
        this.drawables.forEach(d => d.draw());
    }

}/**
 * holds a list of scenes. will only update the scene
 * on the top of the stack (current scene)
 */
class SceneManager {
    //list of scenes
    static stack = [];

    /**
     * put a scene on top of the stack. becomes the current scene
     * @param {*} scene 
     */
    static pushScene(scene) {
        this.stack.push(scene);
    }

    /**
     * remove the current scene. the scene "below" it becomes 
     * current
     */
    static popScene() {
        this.stack.pop();
    }

    /**
     * remove the current scene from the stack and add a new one to it
     * @param {*} scene 
     */
    static replaceScene(scene) {
        this.popScene();
        this.pushScene(scene);
    }

    /**
     * return the last scene in the stack
     */
    static currentScene() {
        if (this.stack.length) {
            return this.stack[this.stack.length-1]
        } else {
            return null;
        }
    }

    /**
     * ticks and draws the current scene
     */
    static update() {
        var scene = this.currentScene();
        if (scene) {
            scene.tick();
            scene.draw();    
        }
    }
}class CreditsScene extends Scene {
    constructor(context) {
        super(context);

        this.pressEnter = new Text(this, "PRESS ENTER", 'pink', 9*8, 28*8);

        this.pacman = new Pacman(this, 7*8, 11.5*8);
        this.pacman.animation = Pacman.ANIM_SLOMO;
        this.pacman2 = new Pacman(this, 20*8, 11.5*8);
        this.pacman2.animation = Pacman.ANIM_SLOMO;
        this.pacmanText = new Text(this, "PACMAN", 'white', 11.5*8, 12*8);
        this.pacman.direction = Vector.RIGHT;

        this.mspacman = new MsPacman(this, 7*8, 17.5*8);
        this.mspacman.animation = Pacman.ANIM_SLOMO;
        this.mspacman2 = new MsPacman(this, 20*8, 17.5*8);
        this.mspacman2.animation = Pacman.ANIM_SLOMO;
        this.mspacmanText = new Text(this, "MS PACMAN", 'orange', 10*8, 18*8);
        this.mspacman.direction = Vector.RIGHT;

        this.canSelectGame = true;

        //set up the marquee
        this.pellets = [];
        for (var i = 4; i <= 24; i++) {
            this.pellets.push(new Pellet(this, i * 8, 4 * 8));
        }
        for (var i = 5; i <= 23; i++) {
            this.pellets.push(new Pellet(this, 24 * 8, i * 8));

        }
        for (var i = 24; i >= 4; i--) {
            this.pellets.push(new Pellet(this, i * 8, 24 * 8));
        }
        for (var i = 23; i >= 5; i--) {
            this.pellets.push(new Pellet(this, 4 * 8, i * 8));

        }
        this.colorIndex = [0, 10, 20, 30, 40, 50, 60, 70];
        this.colorCounter = 0;
    }

    tick() {
        //do the color changing thing on the marquee
        this.colorCounter++;
        if (this.colorCounter == 2) {
            this.colorCounter = 0;
            this.colorIndex = this.colorIndex.map(i => {
                delete this.pellets[i].color;
                var idx = (i+1) % this.pellets.length;
                this.pellets[idx].color = '#fc0d1b';
                return idx;
            });
        } 

        if (Input.lastKey == 13) { //enter
            //assign common class names to game distinct class for easy instantiation
            if (Game.GAME_MODE == Game.GAME_PACMAN) {
                TitleScene = PacmanTitleScene;
                StartScene = PacmanStartScene;
                CutScene1 = PacmanCutScene1;
                CutScene2 = PacmanCutScene2;
                CutScene3 =  PacmanCutScene3;
                LevelSprite = PacmanLevelSprite;
                PacClass = Pacman;
                Points = PacmanPoints;
                Fruit = PacmanFruit;
            } else {
                TitleScene = MsPacmanTitleScene;
                StartScene = MsPacmanStartScene;
                CutScene1 = MsPacmanCutScene1;
                CutScene2 = MsPacmanCutScene2;
                CutScene3 =  MsPacmanCutScene3;
                LevelSprite = MsPacmanLevelSprite;
                PacClass = MsPacman;
                Points = MsPacmanPoints;
                Fruit = MsPacmanFruit;
            }
            SceneManager.pushScene(new TitleScene(this.context));
            // now that the player has interacted with the website, the browser can play sounds, initialize them
            Sound.initialize();
            return;
        }
        
        //flips between selections whenever a key is down
        if ((Input.lastKey == 38 || Input.lastKey == 40) && this.canSelectGame) {
            Game.GAME_MODE = (Game.GAME_MODE + 1) % 2;
            this.canSelectGame = false;
        } else if (!Input.lastKey) {
            this.canSelectGame = true;
        }

        if (Game.GAME_MODE == Game.GAME_PACMAN) {
            this.pacman.unfreeze();
            this.mspacman.freeze();
            this.pacman2.unfreeze();
            this.mspacman2.freeze();
            this.pacmanText.color = 'white';
            this.mspacmanText.color = 'orange';
        } else {
            this.pacman.freeze();
            this.mspacman.unfreeze();
            this.pacman2.freeze();
            this.mspacman2.unfreeze();
            this.pacmanText.color = 'orange';
            this.mspacmanText.color = 'white';
        }
    }


    draw() {
        Scene.prototype.draw.call(this);
        this.pellets.forEach(p => p.draw());
        this.pacman.draw();
        this.pacman2.draw();
        this.pacmanText.draw();
        this.mspacman.draw();
        this.mspacman2.draw();
        this.mspacmanText.draw();
        this.pacmanText.draw();
        this.pressEnter.draw();
    }
}/**
 * the GameScene is where all the game play action occurs
 */
class GameScene extends Scene {

    //these correspond to the static ghost modes scatter/chase
    static MODE_CHASE = 0;
    static MODE_SCATTER = 1;

    constructor(context, numPlayers) {
        super(context);

        this.readyText = new Text(this, "READY!", 'yellow', 11 * 8, 20 * 8);
        this.gameOverText = new Text(this, "GAME  OVER", 'red', 9 * 8, 20 * 8);
        this.gameOverText.hide();
        this.scoreOneText = new Text(this, "00", 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, "00", 'white', 25 * 8, 1 * 8, 'right');
        if (numPlayers == 1) {
            this.scoreTwoText.hide();
        }
        this.oneUpLabel = new Text(this, "1UP", 'white', 3 * 8, 0);
        this.highScoreLabel = new Text(this, "HIGH SCORE", 'white', 9 * 8, 0);
        this.highScoreText = new Text(this, this.highScore, 'white', 16 * 8, 8, 'right');
        this.twoUpLabel = new Text(this, "2UP", 'white', 22 * 8, 0);
        this.playerLabel = new Text(this, 'PLAYER ONE', 'blue', 9 * 8, 14 * 8);
        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1 * 8, 35 * 8);
        this.creditLabel.hide();
        this.credits = new Text(this, "" + Game.CREDITS, 'white', 9 * 8, 35 * 8, 'right');
        this.credits.hide();

        this.textSprites = [
            this.readyText,
            this.gameOverText,
            this.scoreOneText,
            this.oneUpLabel,
            this.highScoreLabel,
            this.twoUpLabel,
            this.scoreTwoText,
            this.playerLabel,
            this.highScoreText,
            this.creditLabel,
            this.credits
        ];

        this.scoreText = [
            this.scoreOneText,
            this.scoreTwoText
        ];

        this.curPlayer = 0;
        //pellet arrays
        this.pellets = [];
        this.energizers = [];
        //determine number of players chosen then load the first one
        this.numPlayers = numPlayers;
        this.players = [];
        for (var i = 0; i < this.numPlayers; i++) {
            var pacman = new PacClass(this, 13.125 * 8, 25.5 * 8);
            pacman.level = -i;   //second player at level (not zero) so there's no beginning song and dance
            pacman.lives = 3; //start with three lives for first player only
            this.players.push(pacman);
        }
        //create ghost array / hash
        this.ghosts = [
            //these are in drawing order but in reverse order of priority for leaving the house
            new Clyde(this, 15 * 8, 16.5 * 8),
            new Inky(this, 11 * 8, 16.5 * 8),
            new Pinky(this, 13 * 8, 16.5 * 8),
            new Blinky(this, 13 * 8, 13.5 * 8)
        ];
        this.ghosts.Blinky = this.ghosts[3];
        this.ghosts.Pinky = this.ghosts[2];
        this.ghosts.Inky = this.ghosts[1];
        this.ghosts.Clyde = this.ghosts[0];
        this.scatterChase = new ScatterChase(this);

        //timers
        this.startLevelTimer = new Timer();
        this.lastPelletEatenTimer = new Timer();
        this.freezeTimer = new Timer();
        //frighten timers
        this.frightenTimer = new Timer();
        this.frightenFlashTimer = new Timer();
        //hud
        this.levelSprite = new LevelSprite(this);
        this.livesSprite = new LivesSprite(this);

        //set up the first level
        this.loadPlayer(0);

    }

    /**
     * count of pellets and energizers eaten this level
     */
    get pelletsEaten() {
        var totalPellets = this.mazeClass.tiles.filter(t => t.pellet).length + this.mazeClass.tiles.filter(t => t.energizer).length;
        return totalPellets - this.pelletsLeft;
    }

    /**
     * count pellets and energizers remaining on the maze board
     */
    get pelletsLeft() {
        return this.pellets.length + this.energizers.length;
    }

    /**
     * the high score for the current GAME_MODE
     */
    get highScore() {
        var score = Game.getHighScore(Game.GAME_MODE);
        return !score ? "" : score;
    }


    /**
     * sets the current player. if two player mode, load their last set of 
     * remaining pellets on to the maze.
     * 
     * @param {int} player index of player to load (0: player 1, 1: player 2)
     */
    loadPlayer(player) {
        this.curPlayer = player;
        this.pacman = this.players[player];
        this.playerLabel.text = 'PLAYER ' + (!player ? "ONE" : "TWO");
        this.level = this.pacman.level;
        if (this.level < 1) {
            //only play song when level is 0. it will come in as -1 for player 2
            var newGame = !this.level;
            this.level = 1;
            this.pacman.level = 1;
            this.nextLevel(newGame);
        } else {
            //load in cached pellets
            this.pellets = this.pacman.pellets;
            this.energizers = this.pacman.energizers;
            this.resetLevel();
        }
    }


    /**
     * called after level is completed or when starting a new game on level 1.
     * this loads pellets from the wall map.
     * 
     * @param {*} newGame are we coming into level 1?
     */
    nextLevel(newGame) {
        Sound.resetSiren();
        this.levelStarting = true;
        this.maze = Maze.getMaze(this);
        this.mazeClass = this.maze.constructor;

        // AI.loadMaze(this.mazeClass);

        this.ghosts.forEach(g => g.pelletCounter = 0);
        //populate pellets from maze data
        this.pellets = this.mazeClass.tiles.filter(t => t.pellet).map(t => new Pellet(this, t.x * 8, t.y * 8));
        //populate energizers
        this.energizers = this.mazeClass.tiles.filter(t => t.energizer).map(t => new Energizer(this, t.x * 8, t.y * 8));
        this.useGlobalPelletLimit = false;
        this.pacman.pellets = this.pellets;
        this.pacman.energizers = this.energizers;
        if (newGame) {
            Sound.playOnce('game_start');
            this.playerLabel.show();
            this.ghosts.forEach(g => g.hide());
            this.startLevelTimer.start(3 * 60, () => {
                if (!Game.PRACTICE_MODE) {
                    this.pacman.lives--;
                }
                this.nextLevel();
            });
        } else {
            this.readyText.show();
            this.resetLevel();
            this.useGlobalPelletLimit = false;
        }
    }


    /**
     * if pacman dies, come here. this resets actors. also called
     * after loading a new level.
     */
    resetLevel() {
        this.levelStarting = true;
        Ghost.NUM_EATEN = 0;
        Ghost.NUM_FRIGHTENED = 0;
        this.playerLabel.hide();
        this.readyText.show();
        this.useGlobalPelletLimit = true;
        this.eatenGhosts = [];
        this.globalPelletCounter = 0;
        //put entities back to their starting positions
        this.pacman.reset();
        this.ghosts.forEach(ghost => {
            ghost.reset()
            ghost.show();
        });
        //delete any fruit
        delete this.fruit;
        //abort any frighten timers
        this.frightenFlashTimer.stop();
        this.frightenTimer.stop();

        this.energizers.forEach(e => e.freeze());

        this.startLevelTimer.start(1.25 * 60, () => {
            this.levelComplete = false;
            this.readyText.hide();
            this.energizers.forEach(e => e.unfreeze());
            this.pacman.unfreeze();
            this.pacman.start();
            this.ghosts.forEach(g => {
                g.unfreeze();
                g.start();
            });
            Input.reset();

            this.lastPelletEatenTimer.start(this.maze.lastPelletEatenTimeout, () => {
                this.releaseNextGhost('timeup');
                this.lastPelletEatenTimer.reset();
            });
            this.levelStarting = false;
            Sound.playLoop('siren');
        });

        this.scatterChase.reset();
        //actual game seems to lose a tick immediately before starting up
        this.scatterChase.tick();
    }


    /**
     * called when all pellets are eaten and level is complete. mostly animation
     * timers. check for cutscenes after levels 2, 5, and 9. go on to next level
     */
    endLevel() {
        this.levelComplete = true;
        Ghost.NUM_EATEN = 0;
        Ghost.NUM_FRIGHTENED = 0;
        this.pacman.freeze();
        this.pacman.stop();
        this.ghosts.forEach(g => g.freeze());
        this.freezeTimer.start(60, () => {
            this.ghosts.forEach(g => g.hide());
            //flash map
            this.maze.finish();
            this.freezeTimer.start(96, () => {
                //intermissions
                if (!Game.SKIP_CUTSCENES) {
                    if (this.level == 2) {
                        SceneManager.pushScene(new CutScene1(this.context));
                    } else if (this.level == 5) {
                        SceneManager.pushScene(new CutScene2(this.context));
                    } else if (this.level == 9) {
                        SceneManager.pushScene(new CutScene3(this.context));
                    }
                }
                this.pacman.hide();
                this.freezeTimer.start(15, () => {
                    this.level++;
                    this.pacman.level = this.level;
                    this.nextLevel();
                })
            })
        });
    }


    tick() {
        //wait for the start level timer before doing anything
        if (this.startLevelTimer.tick()) return;

        //update eyes now in case freeze timer is active, do other ghosts later- after freeze timer code
        var updateGhostsLater = this.ghosts.filter(ghost => !(ghost.isEaten && !ghost.hidden));
        if (!this.levelComplete) {
            //don't freeze eyes even when freeze timer is on
            for (var i = 0; i < 2; i++) {
                this.ghosts.filter(ghost => ghost.isEaten && !ghost.hidden).forEach(ghost => ghost.tick());
            }
        }

        if (this.freezeTimer.tick()) {
            //if game play is frozen, stop the siren sound and bail the tick
            Sound.stop('siren');
            return;
        }
        if (this.levelComplete || this.levelStarting) {
            //if before or after level, make sure to stop all sounds
            Sound.stopAll();
            return;
        }

        //sound checks
        if (this.pacman.isAlive) {
            if (Ghost.NUM_EATEN > 0) {
                // if there are retreating ghosts play retreat
                Sound.stop('power_pellet');
                Sound.playLoop('retreating');
            } else {
                Sound.stop('retreating');
                if (Ghost.NUM_FRIGHTENED > 0) {
                    //are there frigthened ghosts? play power pellet sound
                    Sound.stop('siren');
                    Sound.playLoop('power_pellet');
                } else {
                    //else go back to playing the siren
                    Sound.stop('power_pellet');
                    Sound.playLoop('siren');
                }
            }
        }

        if (this.eatenGhosts.length) {
            //who'd pacman eat last tick? eat one now and go to next tick
            //the prevents pacman from eating two ghosts in the same tick
            this.eatGhost(this.eatenGhosts.pop());
            return;
        }

        //check for game over scenarios
        if (this.pacman.isDead) {
            //pacman is dead, start a timer and restart level, go to next player, or end game
            this.freezeTimer.start(60, () => {
                var otherPlayer = (this.curPlayer + 1) % this.numPlayers;
                if (this.pacman.lives < 0) {
                    //game over for this player
                    //save last score to this game_mode and player #
                    Game.LAST_SCORES[Game.GAME_MODE][this.curPlayer] = this.pacman.score;
                    //take away a credit
                    Game.CREDITS--;
                    if (this.numPlayers == 2) {
                        //if two players and other player has lives, show playerlabel text for game over
                        if (this.players[otherPlayer].lives >= 0) {
                            this.playerLabel.text = "PLAYER " + (this.curPlayer ? "TWO" : "ONE");
                            this.playerLabel.show();
                            this.gameOverText.show();
                            this.freezeTimer.start(90, () => {
                                this.gameOverText.hide();
                                this.loadPlayer(otherPlayer);
                            });
                            //not done yet, other player's turn
                            return;
                        }
                    }
                    //game over
                    this.gameOverText.show();

                    //show the credits before exiting game scene
                    this.creditLabel.show();
                    this.credits.text = "" + Game.CREDITS;
                    this.credits.show();

                    this.freezeTimer.start(90, () => {
                        if (!Game.CREDITS) {
                            //out of credits, go to title screen
                            SceneManager.replaceScene(new TitleScene(this.context));
                        } else {
                            //still have some credits, go back to start scene
                            SceneManager.replaceScene(new StartScene(this.context));
                        }
                        return;
                    })
                } else if (this.numPlayers > 1 && this.players[otherPlayer].lives >= 0) {
                    //switch players if other player has lives
                    this.loadPlayer(otherPlayer);
                } else {
                    //only one player playing
                    this.resetLevel();
                }
            });
            return;
        }

        //update ghost behavior
        this.scatterChase.tick();

        //update the frighten timers if they're running
        this.frightenTimer.tick();
        this.frightenFlashTimer.tick();

        //point sprites from fruit
        if (this.pointSprite) this.pointSprite.tick();

        //update actors twice per pick
        for (var i = 0; i < 2; i++) {
            //tick pacman
            this.pacman.tick();
            //tick ghosts
            updateGhostsLater.forEach(g => g.tick());
            //fruit timer countdown/movement
            if (this.fruit && this.pacman.isAlive) this.fruit.tick();
            //collision detect
            this.collisionDetect();
        }

        //check to see if pacman ate anything in the last updates
        if (this.atePellet || this.ateEnergizer) {
            if (this.ateEnergizer) {
                //frighten ghosts
                this.frightenGhosts();
            }

            //feed pacman
            this.eatPellet(this.atePellet || this.ateEnergizer);
            this.atePellet = false;
            this.ateEnergizer = false;
            //check to see if that was the last pellet
            if (!this.pelletsLeft) {
                Sound.stopAll();
                this.endLevel();
                return;
            }
        } else {
            //continue the countdown since the last pellet was eaten
            this.lastPelletEatenTimer.tick();
        }

        //change siren depending on pellets left
        Sound.checkSiren(this.pelletsLeft);

        //is a ghost ready to leave
        if (!this.useGlobalPelletLimit) {
            this.ghosts.forEach(ghost => {
                if (ghost.isReadyToLeaveHouse) {
                    ghost.leaveHouse();
                }
            });
        }


        // try {
        //     if (this.pacman.isAlive) {
        //         //get pacman's valid directions and evaluate the state
        //         AI.evaluate(this);
        //     }
        // } catch (ex) {
        //     //nothing
        //     console.log(ex)
        // }
    }


    /**
     * called twice per tick. collision occurs between ghosts when pacman and
     * a ghost occupy the same tile. collision with items occurs when their
     * hitboxes overlap
     */
    collisionDetect() {
        //no point in collision detected if pacman just kicked the bucket
        if (!this.pacman.isAlive) return;

        //pellet / energizer collision
        for (var i = 0; i < this.pellets.length; i++) {
            //if center of pellet is in pacman bbox, then eat
            if (this.pacman.collideItem(this.pellets[i])) {
                this.atePellet = this.pellets[i];
                this.pellets.splice(i, 1);
                break;
            }
        }
        for (var i = 0; i < this.energizers.length; i++) {
            //if center of pellet is inside pacman hitbox, then eat
            if (this.pacman.collideItem(this.energizers[i])) {
                this.ateEnergizer = this.energizers[i];
                this.energizers.splice(i, 1);
                break;
            }
        }

        //fruit collision
        if (this.fruit && this.fruit.collide(this.pacman)) {
            //put a point sprite at this location
            this.pointSprite = new Points(this, this.fruit, this.fruit.points);
            //feed it to pacman
            this.pacman.eatItem(this.fruit);
        }

        //pacman/ghosts collision
        for (var i = 0; i < this.ghosts.length; i++) {
            var ghost = this.ghosts[i];
            if (ghost.collide(this.pacman)) {
                if (ghost.isFrightened && !ghost.isEaten) {
                    //pac man eats a frightened ghost- pause game for 1 second and hide ghost+pacman to reveal score
                    this.eatenGhosts.push(ghost);
                    ghost.eaten();
                    // make sure two ghosts aren't eaten in the same frame.
                    // jump out here and wait until next frame to eat next ghost
                    return;
                } else if (!ghost.isEaten) {
                    if (Game.GOD_MODE) return;
                    // ghost was patrolling, pac man dies. RIP pac man we hardly knew ye
                    //everything stops for a little under a second
                    this.ghosts.forEach(ghost => ghost.stop());
                    if (this.fruit && this.fruit.stop) this.fruit.stop(); //ms pacman
                    this.pacman.freeze();
                    this.pacman.stop();
                    Sound.stopAll();
                    this.freezeTimer.start(45, () => {
                        //ghosts disappear and pacman starts die animation
                        this.ghosts.forEach(ghost => ghost.hide());
                        this.pacman.die();
                    });
                }
            }
        }
    }


    /**
     * check to see if it's time to release a ghost from the house
     * 
     * @param {*} reason possible values are 'timeup' from the lastPelletEaten timer or 
     *                   'pellet' to check pelletCounters of the ghosts
     */
    releaseNextGhost(reason) {
        for (var i = 3; i >= 0; i--) {
            var ghost = this.ghosts[i];
            if (ghost.isHome) {
                if (i == 3 || i == 2) {
                    //blinky and pinky always leave immediately unless using global dot counter
                    ghost.leaveHouse();
                    if (reason == 'timeup') {
                        break;
                    }
                } else if (reason == 'pellet') {
                    //release because ghost's dot limit was reached
                    ghost.pelletCounter++;
                    if (ghost.isReadyToLeaveHouse) {
                        ghost.leaveHouse();
                    }
                    break;
                } else if (reason == 'timeup') {
                    //releasing because pac-man hasn't eaten a pellet in a while
                    ghost.leaveHouse();
                    break;
                }
            }
        }
    }


    /**
     * put the ghosts into a frightened state. this reverses their direction,
     * slows them down, and suspends the scatter/chase behavior. frightened period
     * ends when timer runs out or all four ghosts have been devoured
     */
    frightenGhosts() {
        this.ghosts.forEach(ghost => ghost.frighten());
        //reset eaten counter
        this.numGhostsEaten = 0;
        //abort any previous frighten timers
        this.frightenFlashTimer.stop();
        this.frightenTimer.stop();
        //suspend scatter/chase behavior while frigthened
        this.scatterChase.suspend();
        //set up timers based on duration and # flashes for current level
        var fright = Ghost.getFrightenDuration(this.level),
            duration = fright.ticks,
            numFlashes = fright.flashes,
            flashDuration = numFlashes * 7 * 4;   //7 ticksPerFrame of flash animation, 4 is the numFrames
        this.frightenTimer.start(duration - flashDuration, () => {
            this.ghosts.forEach(ghost => {
                if (ghost.isFrightened) {
                    ghost.frightenFlash();
                }
            });
            //blue frighten is over, now flash for a duration that completes numFlashes
            this.frightenFlashTimer.start(flashDuration, () => {
                this.ghosts.forEach(ghost => {
                    if (ghost.isFrightened) {
                        //done being frightened. go back to whatever state is currently happening
                        //when becoming unfrightened, no reverse instruction should be generated
                        if (this.globalChaseMode == GameScene.MODE_CHASE) {
                            ghost.chase(true);
                        } else {
                            ghost.scatter(true);
                        }
                        this.numGhostsEaten = 0;
                        Ghost.NUM_FRIGHTENED = 0;
                    }
                });
                //return pac man to normal state
                this.pacman.patrol();
                //resume scatter/chase behavior
                this.scatterChase.resume();
            });
        });
    }


    /**
     * when a ghost is eaten, a score should be displayed with points increasing
     * by a multiplier base on how many were eaten in this frightened period.
     * 1 = 200, 2 = 400, 3 = 800, 4 = 1600. if all ghosts are eaten, the frightened
     * period ends.
     * 
     * @param {*} ghost ghost that was eaten
     */
    eatGhost(ghost) {
        Sound.playOnce('eat_ghost');
        //when pacman eats a ghost, hide pacman and freeze other ghosts for a second
        this.pacman.hide();
        //immediately display the score
        this.ghostScore = new Points(this, ghost, this.numGhostsEaten);
        this.ghosts.forEach(g => {
            if (g != ghost && !g.isEaten) {
                g.freeze();
            }
        });
        this.freezeTimer.start(60, () => {
            //unfreeze everything, resume play
            Ghost.NUM_EATEN++;
            Ghost.NUM_FRIGHTENED--;
            ghost.show();
            ghost.start();
            this.pacman.show();
            delete this.ghostScore;
            this.ghosts.forEach(g => g.unfreeze());
        });
        //increment score multiplier and add points to score
        this.numGhostsEaten++;
        this.pacman.addPoints(Math.pow(2, this.numGhostsEaten) * 100);
        if (this.numGhostsEaten == 4) {
            //all ghosts eaten, stop the noise
            this.numGhostsEaten = 0;
        }
    }


    /**
     * feed the pellet to pacman to award points and/or energize. reset
     * the last pellet eaten timer and update the global pellet counter.
     * check to see if a ghost can be released by the global counter.
     * 
     * @param {*} pellet pellet that was eaten
     */
    eatPellet(pellet) {
        //feed to pacman and reset the last pellet eaten timer
        this.pacman.eatItem(pellet);
        this.lastPelletEatenTimer.reset(this.lastPelletEatenTimeout + 1);
        this.globalPelletCounter++;

        //check to see if eating this pellet triggers a fruit release (if fruit isn't already on the maze)
        if (!this.fruit && this.maze.isFruitReady()) {
            this.fruit = new Fruit(this);
        }

        //check the house to see if ghosts are ready to leave due to pellet counter
        if (this.useGlobalPelletLimit) {
            if (this.globalPelletCounter == 7) {
                this.ghosts.Pinky.leaveHouse();
            } else if (this.globalPelletCounter == 17) {
                this.ghosts.Pinky.leaveHouse();
                this.ghosts.Inky.leaveHouse();
            } else if ((this.level == 1 && this.globalPelletCounter == 92) ||
                (this.level == 2 && this.globalPelletCounter == 75) ||
                (this.level > 2 && this.globalPelletCounter == 32)) {
                //level 1 = 92
                //level 2 = 75
                //then 32
                if (this.ghosts.Clyde.isHome) {
                    //stop using the global dot limit and use personal dot counters again
                    this.useGlobalPelletLimit = false;
                }
                this.ghosts.Pinky.leaveHouse();
                this.ghosts.Inky.leaveHouse();
                this.ghosts.Clyde.leaveHouse();
            }
        } else {
            //check to see if ghosts need to be let free because of personal dot limit
            this.releaseNextGhost('pellet');
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        //flash the score label of the current player
        this.oneUpLabel.flash = this.curPlayer == 0;
        this.twoUpLabel.flash = this.curPlayer == 1;

        //draw the background maze image
        this.maze.draw();


        // var context = this.context;
        // for (var node in AI.nodes) {
        //     var tile = AI.nodes[node];
        //     context.beginPath();
        //     context.lineWidth = 1;
        //     context.strokeStyle = "#FF0000";
        //     context.strokeRect(tile.x*8, tile.y*8, 8, 8);
        // }

        //draw hud
        this.scoreText[this.curPlayer].text = "" + (this.pacman.score || "00"); //update score
        this.highScoreText.text = "" + this.highScore; //update highscore text
        this.textSprites.forEach(t => t.draw());
        this.levelSprite.draw();
        this.livesSprite.draw();

        //draw fruit point score sprites
        if (this.pointSprite) this.pointSprite.draw();

        // if (AI.paths && !this.levelComplete) {
        //     AI.drawPaths(this.context);
        // } else if (this.levelComplete) {
        //     delete AI.paths;
        // }

        //draw items
        this.pellets.forEach(p => p.draw());
        this.energizers.forEach(e => e.draw());

        //if there's a fruit, draw it
        if (this.fruit) this.fruit.draw();

        //draw actors
        this.pacman.draw();
        this.ghosts.forEach(g => g.draw());

        //if there's a ghost score, draw it
        if (this.ghostScore) this.ghostScore.draw();
    }
}//after level 2
class MsPacmanCutScene1 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.take = 1;
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_SLOMO;
                this.pacman.direction = Vector.RIGHT;
                this.pacman.stop();
                this.mspacman.hide();
                this.mspacman.animation = Pacman.ANIM_SLOMO;
                this.mspacman.direction = Vector.LEFT;
                this.mspacman.stop();
                this.pinky.freeze();
                this.pinky.hide();
                this.pinky.stop();
                this.inky.freeze();
                this.inky.hide();
                this.inky.stop();
                this.pinky.direction = {x: -1.15, y: 0};
                this.pinky.nextInstruction = Vector.LEFT;
                this.pinky.status = Ghost.STATUS_PATROL;
                this.pinky.mode = Ghost.MODE_CHASE;
                this.inky.direction = {x: 1.15, y: 0};
                this.inky.nextInstruction = Vector.RIGHT;
                this.inky.status = Ghost.STATUS_PATROL;
                this.inky.mode = Ghost.MODE_CHASE;
            },
            15: () => {
                //(act) 1... they meet
                this.act.show();
                this.theyMeet.show();
                Sound.playOnce('act1')
            },
            48: () => {
                this.take++;
            },
            55: () => {
                this.take++;
            },
            59: () => {
                this.theyMeet.hide();
            },

            61: () => {
                this.take--;
            },

            81: () => {
                this.take = 0;
                this.act.hide();
            },
            115: () => {
                //start the chase
                this.pacman.show();
                this.mspacman.show();
                this.pacman.start();
                this.mspacman.start();
                this.mspacman.unfreeze();
                this.pacman.unfreeze();
                this.pacman.animation.curFrame = 2;
            },
            150: () => {
                //ghost chase
                this.pinky.unfreeze();
                this.pinky.show();
                this.pinky.start();
                this.inky.unfreeze();
                this.inky.show();
                this.inky.start();
            },

            326: () => {
                this.mspacman.stop();
                this.pacman.stop();
                //set up for next pass
                this.mspacman.y = 16*8;
                this.mspacman.direction = Vector.RIGHT;
                this.pacman.y = 16*8;
                this.pacman.x = 29*8;
                this.pacman.direction = Vector.LEFT;
            }, 

            345: () => {
                this.pinky.stop();
                this.pinky.hide();
                this.inky.stop();
                this.inky.hide();
                this.pinky.y = this.mspacman.y
                this.pinky.direction = Vector.inverse(this.pinky.direction);
                this.pinky.nextInstruction = Vector.inverse(this.pinky.nextInstruction);
                this.inky.y = this.pacman.y;
                this.inky.direction = Vector.inverse(this.pinky.direction);
                this.inky.nextInstruction = Vector.inverse(this.pinky.nextInstruction);
                //send out the pacmen
                this.pacman.start();
                this.pacman.animation.curFrame = 2;
                this.mspacman.start();
            },

            380: () => {
                this.pinky.show();
                this.inky.show();
                this.pinky.start();
                this.inky.start();
            },

            448: () => {
                this.pacman.stop();
                this.mspacman.stop();
            },


            453: () => {
                this.pacman.direction = Vector.UP;
                this.mspacman.direction = Vector.UP;
                this.pacman.start();
                this.pacman.animation.curFrame = 2;
                this.mspacman.start();
            },


            472: () => {
                this.pinky.stop();
                this.inky.stop();
                this.inkyBounce = 0;
            },

            476: () => {
                //start inky bounce
                this.pinkyBounce = 0;
            },

            498: () => {
                //hide inky
                this.inkyBounce = -1;
                this.inky.hide();
            },

            500: () => {
                this.pacman.stop();
                this.mspacman.stop();
            },

            502: () => {
                this.pinkyBounce = -1;
                this.pinky.hide();
                //face each other
                this.mspacman.animation.curFrame = 1;
                this.pacman.animation.curFrame = 1;
                this.pacman.direction = Vector.LEFT;
                this.mspacman.direction = Vector.RIGHT;
                //show heart 488,160
                this.showHeart = true;
            },

            515: () => {
                this.pacman.freeze();
                this.mspacman.freeze();
            },

            630: 'end'
        });
        this.level = 2;
        this.levelSprite = new MsPacmanLevelSprite(this);
        this.act = new Text(this, "1", 'white', 9*8, 16*8);
        this.act.hide()
        this.theyMeet = new Text(this, "THEY MEET", 'white', 11*8, 15*8);
        this.theyMeet.hide();

        this.pacman = new Pacman(this, -1.5 * 8, 12.5 * 8);
        this.mspacman = new MsPacman(this, 28 * 8, 25.5 * 8);

        this.pinky = new Pinky(this, 28 * 8, 25.5 * 8); //follow mspacman
        this.pinkyBounce = -1;
        this.inky = new Inky(this, -1.5 * 8, 12.5 * 8); //follow pacman
        this.inkyBounce = -1;

        this.drawables = [
            this.act,
            this.theyMeet,
            this.levelSprite,
            this.pacman,
            this.mspacman,
            this.pinky,
            this.inky
        ];

        this.actors = [
            this.pacman, this.mspacman, this.pinky, this.inky
        ];
    }

    get bounce() {
        //cycle twice
        return [
            [1,1],[0,0],[1,1],[0,0],[0,0],[1,0],[0,0],[1,0],[0,-1],[1,0],[0,-1],[0,0],[1,0],[0,0]
        ]
    }
    

    tick() {
        ScriptScene.prototype.tick.call(this);
        if (this.pinkyBounce > -1) {
            var move = this.bounce[this.pinkyBounce];
            this.pinky.x -= move[0];
            this.pinky.y -= move[1];
            this.pinkyBounce = (this.pinkyBounce + 1) % this.bounce.length
        }
        if (this.inkyBounce > -1) {
            var move = this.bounce[this.inkyBounce];
            this.inky.x += move[0];
            this.inky.y -= move[1];
            this.inkyBounce = (this.inkyBounce + 1) % this.bounce.length
        }
    }

    draw() {
        ScriptScene.prototype.draw.call(this);
        var context = this.context;
        if (this.showHeart) {
            context.drawImage(RESOURCE.mspacman,
                488, 160, 16, 16, 109, (7.5*8), 16, 16
            );    
        }
        if (this.take) {
            var takeOffset = (this.take-1) * 32;
            context.drawImage(RESOURCE.mspacman,
                456 + takeOffset, 208, 32, 32, (6*8) + 2, (13*8) + 1, 32, 32
            );    
        }
    }
}class MsPacmanCutScene2 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.take = 1;
                this.pacman.stop();
                this.pacman.animation = Pacman.ANIM_SLOMO;
                this.mspacman.stop();
                this.mspacman.animation = Pacman.ANIM_SLOMO;
                this.pacman.hide();
                this.mspacman.hide();
                this.pacman.direction = {x: 1.9, y: 0};
                this.mspacman.direction = {x: 2.4, y: 0};
            },
            15: () => {
                //(act) 2
                this.act.show();
                this.theChase.show();
                Sound.playOnce('act2')
            },
            48: () => {
                this.take++;
            },
            55: () => {
                this.take++;
            },
            59: () => {
                this.theChase.hide();
            },

            61: () => {
                this.take--;
            },

            81: () => {
                this.take = 0;
                this.act.hide();
            },

            275: () => {
                //pacman go
                this.pacman.show();
                this.pacman.unfreeze();
                this.pacman.start();
            },
            310: () => { 
                //mspacman go
                this.mspacman.show();
                this.mspacman.unfreeze();
                this.mspacman.start();
            },

            550: () => {
                //come the other way
                this.mspacman.x = 28*8;
                this.mspacman.y = 25.5*8;
                this.mspacman.direction = {x: -1.9, y: 0};
            },
            585: () => {
                this.pacman.x = 28*8;
                this.pacman.y = 25.5*8;
                this.pacman.direction = {x: -2.4, y: 0};
            },
            800: () => {
                this.pacman.direction = {x: 1.9, y: 0};
                this.pacman.x = -1.5 * 8;
                this.pacman.y = 15.5 * 8;
            },
            835: () => {
                this.mspacman.direction = {x: 2.4, y: 0};
                this.mspacman.x = -1.5 * 8;
                this.mspacman.y = 15.5 * 8;
            },

            1065: () => {
                //ms pacman first now. super fast
                this.mspacman.x = 28*8;
                this.mspacman.y = 8.5*8;
                this.mspacman.direction = {x: -5, y: 0};
            },
            1080: () => {
                // pacman now. super fast
                this.pacman.x = 28*8;
                this.pacman.y = 8.5*8;
                this.pacman.direction = {x: -5, y: 0};
            },
            1120: () => {
                //and back the other way, pacman first
                this.pacman.direction = {x: 5, y: 0};
                this.pacman.x = -1.5 * 8;
                this.pacman.y = 28.5 * 8;
            },
            1135: () => {
                //finally ms pacman
                this.mspacman.direction = {x: 5, y: 0};
                this.mspacman.x = -1.5 * 8;
                this.mspacman.y = 28.5 * 8;
            },
            1355: 'end'
        });
        this.levelSprite = new MsPacmanLevelSprite(this);
        this.level = 5;
        this.act = new Text(this, "2", 'white', 9*8, 16*8);
        this.act.hide()
        this.theChase = new Text(this, "THE CHASE", 'white', 11*8, 15*8);
        this.theChase.hide();

        this.pacman = new Pacman(this, -1.5 * 8, 8.5 * 8);
        this.mspacman = new MsPacman(this, -1.5 * 8, 8.5 * 8);

        this.drawables = [
            this.act,
            this.theChase,
            this.levelSprite,
            this.mspacman,
            this.pacman
        ];

        this.actors = [this.pacman, this.mspacman];
    }
    

    draw() {
        ScriptScene.prototype.draw.call(this)
        if (this.take) {
            var takeOffset = (this.take-1) * 32;
            this.context.drawImage(RESOURCE.mspacman,
                456 + takeOffset, 208, 32, 32, (6*8) + 2, (13*8) + 1, 32, 32
            );    
        }
    }
}//after level 9
class MsPacmanCutScene3 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                Sound.playOnce('act3')
                this.take = 1;
                this.pacman.hide();
                this.pacman.direction = Vector.RIGHT;
                this.mspacman.hide();
                this.mspacman.direction = Vector.RIGHT;
            },
            15: () => {
                //(act) 3... junior
                this.act.show();
                this.juniorText.show();
            },
            48: () => {
                this.take++;
            },
            55: () => {
                this.take++;
            },
            59: () => {
                this.juniorText.hide();
            },

            61: () => {
                this.take--;
            },

            81: () => {
                this.take = 0;
                this.act.hide();
                this.pacman.animation.curFrame = 1;
                this.pacman.show();
                this.mspacman.animation.curFrame = 1;
                this.mspacman.show();
            },

            90: () => {
                //enter bird
                this.bird = 0;

            },

            150: () => {
                //drop the package
                this.junior = 'drop';
            },

            278: () => {
                this.junior = 'bounce';
            },

            305: () => {
                this.junior = 'baby';
            },

            400: 'end'
        });
        this.levelSprite = new MsPacmanLevelSprite(this);
        this.level = 9;
        this.act = new Text(this, "3", 'white', 9*8, 16*8);
        this.act.hide()
        this.juniorText = new Text(this, "JUNIOR", 'white', 11*8, 15*8);
        this.juniorText.hide();

        this.pacman = new Pacman(this, 4 * 8, 23.5 * 8);
        this.mspacman = new MsPacman(this, 6.5 * 8, 23.5 * 8);
        this.bird = -1;
        this.birdX = 28*8;
        this.birdY = 12*8;
        this.package = {x:this.birdX-2, y: this.birdY+6}
        this.junior = 'carry';
        this.bounceCtr = 0;

        this.drawables = [
            this.act,
            this.juniorText,
            this.levelSprite,
            this.pacman,
            this.mspacman
        ];

    }
    

    //the baby bounce pattern
    get bounce() {
        return [
            [0,0],[0,0],[0,0],[0,-1],[-1,-1],[0,-1],[0,-1],[-1,-1],[0,0],[0,0],[-1,1],[0,1],[0,0],[0,1],[0,0],[0,1],[-1,0],[0,1],[0,1],
            [0,0],[0,0],[-1,1],[0,0],[0,-1],[-1,-1],[0,0],[0,0],[0,0],[0,0],[-1,0],[0,0],[0,1],[0,0],[-1,0],[0,0],[0,0],[0,0],[0,0]
        ]
    }


    tick() {
        ScriptScene.prototype.tick.call(this);
        if (this.bird > -1) {
            this.birdX--;
        }
        if (this.junior == 'carry') {
            this.package.x = this.birdX-2;
        } else if (this.junior == 'drop') {
            this.package.y += 0.7;
            this.package.x -= 0.4;
        } else if (this.junior == 'bounce') {
            this.package.x += this.bounce[this.bounceCtr][0];
            this.package.y += this.bounce[this.bounceCtr][1];
            this.bounceCtr = this.bounceCtr + 1;
        }
    }

    draw() {
        ScriptScene.prototype.draw.call(this)
        var context = this.context;
        if (this.take) {
            var takeOffset = (this.take-1) * 32;
            context.drawImage(RESOURCE.mspacman,
                456 + takeOffset, 208, 32, 32, (6*8) + 2, (13*8) + 1, 32, 32
            );    
        }
        if (this.bird > -1) {
            this.bird = (this.bird + 1) % 16;
            var xOffset = Math.floor(this.bird/8) * 32; //488, 176
            context.drawImage(RESOURCE.mspacman,
                488 + xOffset, 176, 32, 16, this.birdX, this.birdY, 32, 16
            );
            //package
            var packageOffsetX = this.junior=='baby'?8:0
            context.drawImage(RESOURCE.mspacman,
                488+packageOffsetX, 200, 8, 8, Math.floor(this.package.x), Math.floor(this.package.y), 8, 8
            );
        }
    }
}class MsPacmanStartScene extends Scene {
    constructor(context) {
        super(context);
        this.p1HighScoreP2 = new Text(this, "1UP   HIGH SCORE   2UP", 'white', 3*8, 0);
        this.highScoreText = new Text(this, ""+Game.getHighScore(Game.GAME_MSPACMAN), 'white', 16*8, 8, 'right');
        this.scoreOneText = new Text(this, ""+(Game.LAST_SCORES[1][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, ""+Game.LAST_SCORES[1][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!Game.LAST_SCORES[1][1]) {
            this.scoreTwoText.hide();
        }

        this.pushStartButton = new Text(this, "PUSH START BUTTON", 'orange', 5*8, 16*8);
        this.onePlayerOnly = new Text(this, "1 PLAYER ONLY", 'orange', 7*8, 18*8);
        this.twoPlayers = new Text(this, "1 OR 2 PLAYERS", 'orange', 7*8, 18*8);
        this.twoPlayerMode = new Text(this, 'PRESS 2 KEY', 'yellow', 9*8, 20*8);
        this.twoPlayerMode.hide();
        // this.twoPlayers.hide();
        this.bonusPacman = new Text(this, "ADDITIONAL    AT 10000 pts", 'orange', 1*8, 24*8);
        this.copyright = new Text(this, "c MIDWAY MFG CO", 'red', 10*8, 29*8);
        this.dates = new Text(this, "1980/1981", 'red', 13*8, 31*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+Game.CREDITS, 'white', 9*8, 35*8, 'right');
    }

    tick() {
        var keyPress = Input.readKeyPress();
        if (Game.CREDITS > 0 && keyPress == 13) { //enter
            SceneManager.replaceScene(new GameScene(this.context, 1));
            return;
        } else if (Game.CREDITS > 1 && keyPress == 50) { //#2
            console.log('two players')
            SceneManager.replaceScene(new GameScene(this.context, 2));
            return;
        } else if (keyPress == 27) {
            //go back
            SceneManager.popScene();
            return;
        } else if (keyPress == 16) {
            Game.CREDITS++;
            Sound.playOnce('credit');
        }

        this.credits.text = ""+Game.CREDITS;
        if (Game.CREDITS > 1) {
            this.twoPlayers.show();
            this.twoPlayerMode.show();
            this.onePlayerOnly.hide();
        } else {
            this.twoPlayerMode.hide();
            this.twoPlayers.hide();
            this.onePlayerOnly.show();
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        this.p1HighScoreP2.draw();
        this.highScoreText.draw();
        this.scoreOneText.draw();
        this.scoreTwoText.draw();

        this.pushStartButton.draw();
        this.onePlayerOnly.draw();
        this.twoPlayers.draw();
        this.twoPlayerMode.draw();
        this.bonusPacman.draw();
        this.copyright.draw();
        this.dates.draw();

        this.context.drawImage(RESOURCE.mspacman,
            472, 0, 16, 16, 12*8, 23*8, 16, 16
        );
        this.context.drawImage(RESOURCE.mspacman,
            456, 248, 32, 32, 5*8, 28*8, 32, 32
        );


        //credits
        this.creditLabel.draw();
        this.credits.draw();
    }
}class MsPacmanTitleScene extends ScriptScene {
    constructor(context) {
        super(context,{
            1: () => {
                this.with.hide();
                this.with.text = 'WITH';
                this.actorName.hide();
                this.actorName.x = 12*8;
                this.actorName.color = 'red';
                this.actorName.text = 'BLINKY';
                this.ghosts.forEach(g => {
                    g.stop();
                    g.hide();
                    g.unfreeze();
                    g.mode = Ghost.MODE_CHASE;
                    g.animation = Ghost.ANIM_SCATTER_CHASE;
                    g.status = Ghost.STATUS_PATROL;
                    g.direction = Vector.LEFT;
                    g.nextInstruction = Vector.LEFT;
                    g.position = Vector.clone(g.startPosition);
                });

                this.mspacman.stop();
                this.mspacman.hide();
                this.mspacman.position = Vector.clone(this.mspacman.startPosition);
                this.mspacman.unfreeze();
                this.mspacman.animation = Pacman.ANIM_SLOMO;

            },
            60: () => {
                this.with.show();
                this.actorName.show();
                this.blinky.start();
                this.blinky.show();
            },
            244: () => {
                this.blinky.direction = Vector.UP;
                this.blinky.nextInstruction = Vector.UP;
            },
            308: () => {
                this.blinky.freeze();
                this.blinky.stop();
                this.with.hide();
                this.actorName.color = 'pink';
                this.actorName.text = 'PINKY';

                this.pinky.start();
                this.pinky.show();

            },
            492: () => {
                this.pinky.x = this.blinky.x;
                this.pinky.direction = Vector.UP;
                this.pinky.nextInstruction = Vector.UP;
            },
            541: () => {
                this.pinky.freeze();
                this.pinky.stop();
                this.actorName.color = 'blue';
                this.actorName.text = 'INKY';

                this.inky.start();
                this.inky.show();

            },
            725: () => {
                this.inky.x = this.blinky.x;
                this.inky.direction = Vector.UP;
                this.inky.nextInstruction = Vector.UP;
            },
            759: () => {
                this.inky.freeze();
                this.inky.stop();
                this.actorName.color = 'orange';
                this.actorName.text = 'SUE';
                this.actorName.x += 8;
                this.sue.start();
                this.sue.show();
            },
            943: () => {
                this.sue.x = this.blinky.x;
                this.sue.direction = Vector.UP;
                this.sue.nextInstruction = Vector.UP;
            },
            961: () => {
                this.sue.freeze();
                this.sue.stop();
                this.with.text = 'STARRING';
                this.with.show();
                this.actorName.color = 'yellow';
                this.actorName.text = 'MS PAC-MAN';
                this.actorName.x = this.with.x;

                this.mspacman.show();
                this.mspacman.start();
            },
            1071: () => {
                this.mspacman.freeze();
                this.mspacman.stop();
            },
            1200:'loop'

        });
        this.p1HighScoreP2 = new Text(this, "1UP   HIGH SCORE   2UP", 'white', 3*8, 0);
        this.highScoreText = new Text(this, ""+Game.getHighScore(Game.GAME_MSPACMAN), 'white', 16*8, 8, 'right');
        this.scoreOneText = new Text(this, ""+(Game.LAST_SCORES[1][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, ""+Game.LAST_SCORES[1][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!Game.LAST_SCORES[1][1]) {
            this.scoreTwoText.hide();
        }

        this.msPacmanTitle = new Text(this, '"MS PAC-MAN"', 'orange', 10*8, 7*8);


        // this.twoPlayers.hide();
        this.copyright = new Text(this, "c MIDWAY MFG CO", 'red', 10*8, 29*8);
        this.dates = new Text(this, "1980/1981", 'red', 13*8, 31*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+Game.CREDITS, 'white', 9*8, 35*8, 'right');

        this.with = new Text(this, "WITH", 'white', 10*8, 13.5*8);
        this.actorName = new Text(this, "BLINKY", 'red', 12*8, 17*8)
        
        //pellet marquee
        var pelletsTop = [],
            pelletsRight = [],
            pelletsBottom = [],
            pelletsLeft = [];
        for (var i = 0; i < 32; i++) {
            var t = new Pellet(this, (i * 4) + (7*8) + 4, 11 * 8);
            t.color = '#fc0d1b';
            pelletsTop.push(t);
            var b = new Pellet(this, (i * 4) + (7*8), 19 * 8);
            b.color = '#fc0d1b';
            pelletsBottom.push(b);
        }
        for (var i = 0; i < 16; i++) {
            var l = new Pellet(this, (7*8), (11*8)+(i*4));
            l.color = '#fc0d1b';
            pelletsLeft.push(l);
            var r = new Pellet(this, (32*4) + (7*8), (11*8)+(i*4)+4);
            r.color = '#fc0d1b';
            pelletsRight.push(r);
        }
        this.pellets = pelletsTop.concat(pelletsRight.concat(pelletsBottom.reverse().concat(pelletsLeft.reverse())));
        this.pelletCounters = [0,16,32,48,64,80];

        //actors
        this.blinky = new Blinky(this, 32*8, 20.5*8);
        this.pinky = new Pinky(this, 32*8, 20.5*8);
        this.inky = new Inky(this, 32*8, 20.5*8);
        this.sue = new Clyde(this, 32*8, 20.5*8);
        this.ghosts = [this.blinky, this.pinky, this.inky, this.sue];
        this.mspacman = new MsPacman(this, 32*8, 20.5*8);

        //hack to control ghost speed
        this.level = 20;

    }

    tick() {
        var keyPress = Input.readKeyPress();
        if (keyPress == 16) {
            //insert credit
            Game.CREDITS++;
            Sound.playOnce('credit');
            SceneManager.pushScene(new MsPacmanStartScene(this.context));
            return;
        } else if (keyPress == 27) {
            //esc key -- go back
            SceneManager.popScene();
            return;
        }
        this.credits.text = ""+Game.CREDITS;
        ScriptScene.prototype.tick.call(this);
        this.pelletCounters = this.pelletCounters.map(i => {
            this.pellets[i].color = '#fc0d1b';
            i--;
            if (i < 0) {
                i = this.pellets.length-1;
            }
            this.pellets[i].color = '#dedffe';
            return i;
        });

        for (var i = 0; i < 2; i++) {
            this.ghosts.forEach(g => g.tick());
            this.mspacman.tick();
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        this.p1HighScoreP2.draw();
        this.highScoreText.draw();
        this.scoreOneText.text = ""+(Game.LAST_SCORES[1][0]||"00");
        this.scoreTwoText.text = ""+Game.LAST_SCORES[1][1]||"00";
        if (Game.LAST_SCORES[1][1]) {
            this.scoreTwoText.show();
        }
        this.scoreOneText.draw();
        this.scoreTwoText.draw();

        this.pellets.forEach(p => p.draw());
        this.msPacmanTitle.draw();
        this.copyright.draw();
        this.dates.draw();

        this.with.draw();
        this.actorName.draw();
        //midway logo
        this.context.drawImage(RESOURCE.mspacman,
            456, 248, 32, 32, 5*8, 28*8, 32, 32
        );

        this.ghosts.forEach(g => g.draw());
        this.mspacman.draw();
        this.creditLabel.draw();
        this.credits.draw();
    }
}/**
 * after level 2
 * Blinky chases pacman from right to left off the screen. blinky comes back
 * left to right, frightened. pacman appears chasing him and is giant sized
 */
class PacmanCutScene1 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_NORMAL;
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.blinky.hide();
                this.blinky.status = Ghost.STATUS_PATROL;
                this.blinky.mode = Ghost.MODE_CHASE;
                this.blinky.animation = Ghost.ANIM_SCATTER_CHASE;
                this.blinky.direction = Vector.LEFT;
                this.blinky.nextInstruction = Vector.LEFT;
                this.blinky.position = Vector.clone(this.blinky.startPosition);
                this.blinky.stop();
            },
            100: () => {
                Sound.playOnce('intermission')

                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();

                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },
            310: () => {
                this.pacman.stop();
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_GIANT;
            },
            325: () => {
                this.blinky.stop();
                this.blinky.hide();
            },
            375: () => {
                this.blinky.direction = Vector.RIGHT;
                this.blinky.frighten();
                this.blinky.show();
                this.blinky.start();
            },
            430: () => { Sound.playOnce('intermission'); },
            540: () => {
                this.pacman.direction = Vector.RIGHT;
                this.pacman.y -= 16;
                this.pacman.show();
                this.pacman.start();
            },
            722: () => {
                this.blinky.stop();
                this.blinky.hide();
            },
            751: () => {
                this.pacman.hide();
                this.pacman.stop();
            },
            850: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.levelSprite = new PacmanLevelSprite(this);
        this.drawables = [
            this.pacman, this.blinky, this.levelSprite
        ];
        this.actors = [this.pacman, this.blinky];
        this.level = 2;
        this.pelletsLeft = 1; //engage cruise elroy 2
    }
}/**
 * after level 5
 * blinky chases pacman right to left. blinky's sheet gets caught on a nail
 * his sheet gets torn
 */
class PacmanCutScene2 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.rip = 0;
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_NORMAL;
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.blinky.hide();
                this.blinky.status = Ghost.STATUS_PATROL;
                this.blinky.mode = Ghost.MODE_CHASE;
                this.blinky.animation = Ghost.ANIM_SCATTER_CHASE;
                this.blinky.direction = Vector.LEFT;
                this.blinky.nextInstruction = Vector.LEFT;
                this.blinky.position = Vector.clone(this.blinky.startPosition);
                this.blinky.stop();

            },
            100: () => {
                Sound.playOnce('intermission');
                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();
            },

            175: () => {
                //here comes blinky
                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },

            290: () => {
                //exit stage: pacman
                this.pacman.stop();
                this.pacman.hide();
            },
            288: () => {
                //slow the ghost
                this.blinky.stop();
            },
            304: () => {
                this.blinky.x -= 1;
                this.rip = 1;
            },
            310: () => {
                this.blinky.x -= 1;
            },
            316: () => {
                this.blinky.x -= 1;
            },
            322: () => {
                this.blinky.x -= 1;
                this.rip = 2;
            },
            328: () => {
                this.blinky.x -= 1;
            },
            334: () => {
                this.blinky.x -= 1;
            },
            340: () => {
                this.blinky.x -= 1;
            },
            346: () => {
                this.blinky.x -= 1;
            },
            352: () => {
                this.blinky.x -= 1;
                this.rip = 3;
                this.blinky.freeze();
            },
            400: () => {
                this.rip = 4;
                this.blinky.x -= 1;
                this.blinky.direction = Vector.RIGHT;
                this.blinky.nextInstruction = Vector.RIGHT;
                this.blinky.animation = Blinky.ANIM_RIP;
                this.blinky.unfreeze();
            },
            430: () => { Sound.playOnce('intermission'); },
            520: () => {
                this.blinky.freeze();
            },
            599: () => {
                Sound.stop('intermission');
            },
            600: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.actors = [this.pacman, this.blinky];
        this.levelSprite = new PacmanLevelSprite(this);
        this.level = 5;
    }

    draw() {
        //don't use drawables because order is important
        ScriptScene.prototype.draw.call(this)
        this.pacman.draw();
        //draw the nail
        this.context.drawImage(RESOURCE.pacman,
            584, 96, 16, 16, 14*8, (19.5*8)-1, 16, 16
        );
        if (this.rip) {
            this.context.drawImage(RESOURCE.pacman,
                600 + ((this.rip-1) * 16), 96, 16, 16, 14*8, (19.5*8)-1, 16, 16
            );    
        }
        this.blinky.draw();
        this.levelSprite.draw();
    }}/**
 * after level 9
 * blinky chases pacman again right to left. he slinks back across
 * the screen naked, pulling his sheet behind him.
 */
class PacmanCutScene3 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.rip = 0;
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_NORMAL;
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.blinky.hide();
                this.blinky.status = Ghost.STATUS_PATROL;
                this.blinky.mode = Ghost.MODE_CHASE;
                this.blinky.animation = Blinky.ANIM_PATCH;
                this.blinky.direction = Vector.LEFT;
                this.blinky.nextInstruction = Vector.LEFT;
                this.blinky.position = Vector.clone(this.blinky.startPosition);
                this.blinky.stop();

            },
            100: () => {
                Sound.playOnce('intermission');
                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();
            },

            120: () => {
                //here comes blinky
                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },

            290: () => {
                //exit stage: pacman
                this.pacman.stop();
                this.pacman.hide();
            },

            320: () => {
                //exit stage: pacman
                this.blinky.stop();
                this.blinky.hide();
            },

            400: () => {
                this.blinky.animation = Blinky.ANIM_NAKED;
                this.blinky.direction = Vector.RIGHT;
                this.blinky.nextInstruction = Vector.RIGHT;
                this.blinky.show();
                this.blinky.start();
            },
            430: () => { Sound.playOnce('intermission'); },
            590: () => {
                this.blinky.hide();
                this.blinky.stop();
            },
            629: () => { Sound.stop('intermission'); },
            630: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.levelSprite = new PacmanLevelSprite(this);

        this.drawables = [
            this.pacman, this.blinky, this.levelSprite
        ];
        this.actors = [
            this.pacman, this.blinky
        ];
        this.level = 9;
        this.pelletsLeft = 1;
    }
}class PacmanStartScene extends Scene {
    constructor(context) {
        super(context);
        this.p1HighScoreP2 = new Text(this, "1UP   HIGH SCORE   2UP", 'white', 3*8, 0);
        this.highScoreText = new Text(this, ""+Game.getHighScore(Game.GAME_PACMAN), 'white', 16*8, 8, 'right');
        this.scoreOneText = new Text(this, ""+(Game.LAST_SCORES[0][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, ""+Game.LAST_SCORES[0][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!Game.LAST_SCORES[0][1]) {
            this.scoreTwoText.hide();
        }

        this.pushStartButton = new Text(this, "PUSH START BUTTON", 'orange', 5*8, 16*8);
        this.onePlayerOnly = new Text(this, "1 PLAYER ONLY", 'blue', 7*8, 20*8);
        this.twoPlayers = new Text(this, "1 OR 2 PLAYERS", 'blue', 7*8, 20*8);
        this.bonusPacman = new Text(this, "BONUS PAC-MAN FOR 10000 pts", 'peach', 1*8, 24*8);
        this.copyright = new Text(this, "c 1980 MIDWAY MFG.CO.", 'pink', 4*8, 28*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+Game.CREDITS, 'white', 9*8, 35*8, 'right');
    }

    tick() {
        var keyPress = Input.readKeyPress();
        if (Game.CREDITS > 0 && keyPress == 13) { //enter
            SceneManager.replaceScene(new GameScene(this.context, 1));
            return;
        } else if (Game.CREDITS > 1 && keyPress == 50) { //#2
            SceneManager.replaceScene(new GameScene(this.context, 2));
            return;
        } else if (keyPress == 27) {
            //go back
            SceneManager.popScene();
            return;
        } else if (keyPress == 16) {
            Game.CREDITS++;
            Sound.playOnce('credit');
        }

        this.credits.text = ""+Game.CREDITS;
        if (Game.CREDITS > 1) {
            this.twoPlayers.show();
            this.onePlayerOnly.hide();
        } else {
            this.twoPlayers.hide();
            this.onePlayerOnly.show();
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        this.p1HighScoreP2.draw();
        this.highScoreText.draw();
        this.scoreOneText.draw()
        this.scoreTwoText.draw();

        this.pushStartButton.draw();
        this.onePlayerOnly.draw();
        this.twoPlayers.draw();
        this.bonusPacman.draw();
        this.copyright.draw();

        //credits
        this.creditLabel.draw();
        this.credits.draw();
    }
}class PacmanTitleScene extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.blinkyGhost.hide();
                this.shadow.hide();
                this.blinky.hide();

                this.pinkyGhost.hide();
                this.speedy.hide();
                this.pinky.hide();

                this.inkyGhost.hide();
                this.bashful.hide();
                this.inky.hide();

                this.clydeGhost.hide();
                this.pokey.hide();
                this.clyde.hide();

                this.pellet.hide();
                this.pelletPoints.hide();
                this.energizer.hide();
                this.energizer.freeze();
                this.energizer.animation = 0;
                this.energizerPoints.hide();
                

                this.copyright.hide();

                //the action - set the actors in place
                //========================
                this.ghostsEaten = 0;
                this.a_energizer.hide();
                this.a_energizer.freeze();
                //reset the animation
                this.a_energizer.animation = 0;

                this.pacman.hide();
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.a_ghosts.forEach(g => {
                    g.hide();
                    g.unfreeze();
                    g.status = Ghost.STATUS_PATROL;
                    g.mode = Ghost.MODE_CHASE;
                    g.animation = Ghost.ANIM_SCATTER_CHASE;
                    g.direction = Vector.LEFT;
                    g.nextInstruction = Vector.LEFT;
                    g.position = Vector.clone(g.startPosition);
                    g.stop();
                });

            },

            20: () => { this.blinkyGhost.show(); },
            70: () => { this.shadow.show(); },
            100: () => { this.blinky.show(); },
            
            120: () => { this.pinkyGhost.show(); },
            170: () => { this.speedy.show(); },
            200: () => { this.pinky.show(); },

            220: () => { this.inkyGhost.show(); },
            270: () => { this.bashful.show(); },
            300: () => { this.inky.show(); },

            320: () => { this.clydeGhost.show(); },
            370: () => { this.pokey.show(); },
            400: () => { this.clyde.show(); },

            480: () => {
                this.pellet.show();
                this.pelletPoints.show();
                this.energizer.show();
                this.energizerPoints.show();
            },
            540: () => {
                this.a_energizer.show();
                this.copyright.show();
            },
            640: () => {
                this.energizer.unfreeze();
                this.a_energizer.unfreeze();
                // bring in the pac-man
                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();

                var ctr = 0
                this.a_ghosts.forEach(g => {
                    g.frameCtr = ctr += 2;
                    g.show();
                    g.unfreeze();
                    g.start();
                });
            },

            822: () => {
                this.pacman.direction = Vector.RIGHT;
            },

            1172: 'loop'
        });

        this.level = 'script';  //makes pacman move fast for the scripting action
        this.pauseUpdatesTimer = new Timer();


        this.p1HighScoreP2 = new Text(this, "1UP   HIGH SCORE   2UP", 'white', 3*8, 0);
        this.scoreOneText = new Text(this, ""+(Game.LAST_SCORES[0][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        //if there's a score_two_pacman
        this.scoreTwoText = new Text(this, ""+Game.LAST_SCORES[0][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!Game.LAST_SCORES[0][1]) {
            this.scoreTwoText.hide();
        }
        this.highScoreText = new Text(this, ""+Game.getHighScore(Game.GAME_PACMAN), 'white', 16*8, 8, 'right');
        this.characterNickname = new Text(this, 'CHARACTER / NICKNAME', 'white', 6*8, 5*8);

        //blinky
        this.blinkyGhost = new Blinky(this, 3*8, 6.5*8);
        this.blinkyGhost.nextInstruction = Vector.RIGHT;
        this.blinkyGhost.freeze();
        this.blinkyGhost.stop();
        this.shadow = new Text(this, '-SHADOW', 'red', 6*8, 7*8);
        this.blinky = new Text(this, '"BLINKY"', 'red', 17*8, 7*8);

        //pinky
        this.pinkyGhost = new Pinky(this, 3*8, 9.5*8);
        this.pinkyGhost.direction = Vector.RIGHT;
        this.pinkyGhost.freeze();
        this.pinkyGhost.stop();
        this.speedy = new Text(this, '-SPEEDY', 'pink', 6*8, 10*8);
        this.pinky = new Text(this, '"PINKY"', 'pink', 17*8, 10*8);

        //inky
        this.inkyGhost = new Inky(this, 3*8, 12.5*8);
        this.inkyGhost.direction = Vector.RIGHT;
        this.inkyGhost.freeze();
        this.inkyGhost.stop();
        this.bashful = new Text(this, '-BASHFUL', 'blue', 6*8, 13*8);
        this.inky = new Text(this, '"INKY"', 'blue', 17*8, 13*8);

        //clyde
        this.clydeGhost = new Clyde(this, 3*8, 15.5*8);
        this.clydeGhost.direction = Vector.RIGHT;
        this.clydeGhost.freeze();
        this.clydeGhost.stop();
        this.pokey = new Text(this, '-POKEY', 'orange', 6*8, 16*8);
        this.clyde = new Text(this, '"CLYDE"', 'orange', 17*8, 16*8);


        //pellet
        this.pellet = new Pellet(this, 9*8, 24*8);
        this.pelletPoints = new Text(this, "10 pts", 'white', 11*8, 24*8);
        //energizer
        this.energizer = new Energizer(this, 9*8, 26*8);
        this.energizer.freeze();
        this.energizerPoints = new Text(this, "50 pts", 'white', 11*8, 26*8);
        
        //copyright
        this.copyright = new Text(this, "c 1980 MIDWAY MFG.CO.", 'pink', 3*8, 31*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+Game.CREDITS, 'white', 9*8, 35*8, 'right');


        //the action
        this.a_energizer = new Energizer(this, 3*8, 20*8);
        this.pacman = new Pacman(this, 27.75*8, 19.5*8);

        this.a_blinky = new Blinky(this, 31*8, 19.5*8);
        this.a_pinky = new Pinky(this, 33*8, 19.5*8);
        this.a_inky = new Inky(this, 35*8, 19.5*8);
        this.a_clyde = new Clyde(this, 37*8, 19.5*8);
        this.a_ghosts = [this.a_blinky, this.a_pinky, this.a_inky, this.a_clyde];

    }
    

    tick() {
        var keyPress = Input.readKeyPress();
        if (keyPress == 16) {
            //insert credit
            Game.CREDITS++;
            Sound.playOnce('credit');
            SceneManager.pushScene(new PacmanStartScene(this.context));
            return;
        } else if (keyPress == 27) {
            //go back
            SceneManager.popScene();
            return;
        }

        ScriptScene.prototype.tick.call(this);
        this.credits.text = ""+Game.CREDITS;

        if (this.pauseUpdatesTimer.tick()) {
            return;
        }

        //two updates per tick for actors
        for (var i = 0; i < 2; i++) {
            this.a_ghosts.forEach(g => g.tick());
            this.pacman.tick();

            if (!this.a_energizer.hidden && this.pacman.collide(this.a_energizer)) {
                //eat pellet and turn around
                this.pacman.eatItem(this.a_energizer);
                this.a_energizer.hide();
                //terrify the ghosts
                this.a_ghosts.forEach(g => {
                    g.frighten();
                    g.direction = Vector.RIGHT;
                });

            }
            //collide ghosts with pacman
            this.a_ghosts.forEach(g => {
                if (!g.hidden && this.pacman.collide(g)) {
                    g.hide();
                    g.stop();
                    this.pacman.hide();
                    this.ghostScore = new PacmanPoints(this, g, this.ghostsEaten)
                    this.ghostsEaten++;
                    this.a_ghosts.forEach(gg => {
                        gg.freeze();
                    });
                    this.pauseUpdatesTimer.start(60, () => {
                        if (this.ghostsEaten != 0) {
                            this.pacman.show();
                        }
                        this.a_ghosts.forEach(gg => {
                            gg.unfreeze();
                        });
                        delete this.ghostScore;
                    });
                }
            })
        }
    }


    draw() {
        Scene.prototype.draw.call(this);
        this.p1HighScoreP2.draw();
        this.highScoreText.draw();
        this.scoreOneText.text = ""+(Game.LAST_SCORES[0][0]||"00");
        this.scoreTwoText.text = ""+Game.LAST_SCORES[0][1]||"00";
        if (Game.LAST_SCORES[0][1]) {
            this.scoreTwoText.show();
        }

        this.scoreOneText.draw();
        this.scoreTwoText.draw();
        this.characterNickname.draw();
        //blinky
        this.blinkyGhost.draw();
        this.shadow.draw();
        this.blinky.draw();
        //pinky
        this.pinkyGhost.draw();
        this.speedy.draw();
        this.pinky.draw();
        //inky
        this.inkyGhost.draw();
        this.bashful.draw();
        this.inky.draw();
        //clyde
        this.clydeGhost.draw();
        this.pokey.draw();
        this.clyde.draw();
        //pellet
        this.pellet.draw();
        this.pelletPoints.draw();
        //pellet
        this.energizer.draw();
        this.energizerPoints.draw();
        //copyright
        this.copyright.draw();
        //credits
        this.creditLabel.draw();
        this.credits.draw();

        this.a_energizer.draw();
        this.a_ghosts.forEach(g => {
            g.draw();
        });
        this.pacman.draw();
        if (this.ghostScore) this.ghostScore.draw();
    }
}/**
 * a Tile represents one 8x8 pixel tile of the Maze
 * 
    //from Maze.wallMap
    //. = wall
    //0 = open, but nothing on it
    //1 = pellet
    //2 = pellet + decision
    //3 = energizer
    //4 = decision only
    //5 = tunnel
    //6 = house
 */
class Tile {
    /**
     * 
     * @param {*} x tile X coordinate
     * @param {*} y tile Y coordinate
     * @param {*} type type of tile. see above for definitions of possible values
     *                 values are:  .,0,1,2,3,4,5,6
     */
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
    //maze wall
    get wall() {
        return this.type == '.';
    }
    //open tile. no pellets or anythign else on it
    get open() {
        return this.type == '0';
    }
    get pellet() {
        return this.type == '1' || this.type == '2';
    }
    get energizer() {
        return this.type == '3';
    }
    //tunnel tile - slows the ghosts
    get tunnel() {
        return this.type == '5';
    }
    //ghost house tile - slows the ghosts
    get house() {
        return this.type == '6';
    }
    //decision tiles are where the ghosts make their next move depending on their AI
    //these occur at most (but not all) intersections in the maze
    get decision() {
        return this.type == '4' || this.type == '2';
    }
    //true if pac-man can move over this tile
    get walkable() {
        return !this.house && !this.wall;
    }
}class Maze {

    /**
     * get the version of the maze based on the current level
     * 
     * @param {int} level current level of game
     */
    static getMazeIndex(level) {
        if (Game.GAME_MODE == Game.GAME_MSPACMAN) {
            if (level <= 2) {
                return 0;
            } else if (level <= 5) {
                return 1;
            } else if (level <= 9) {
                return 2;
            } else if (level <= 13) {
                return 3;
            } else if (level == 14) {
                return 2;
            } else {
                //rotate colors of mazes based on level
                if (level % 2) {
                    return 2;
                } else {
                    return 3;
                }
            }
        } else {
            //pacman always returns the same maze
            return 0;
        }
    }

    /**
     * get a maze instance for the current level. only ms pacman
     * will return different mazes. pacman just uses the same maze
     * for every level
     * 
     * @param {*} scene the game scene
     */
    static getMaze(scene) {
        if (Game.GAME_MODE == Game.GAME_MSPACMAN) {
            switch (Maze.getMazeIndex(scene.level)) {
                case 0:
                    return new MsPacman1(scene);
                case 1:
                    return new MsPacman2(scene);
                case 2:
                    return new MsPacman3(scene);
                case 3:
                    return new MsPacman4(scene);
            }
        } else {
            return new Pacman1(scene);
        }
    }


    /**
     * load the data from the wallmap strings into datastructures
     */
    static initialize() {
        for (var y = 0; y < this.wallMap.length; y++) {
            var row = this.wallMap[y];
            for (var x = 0; x < row.length; x++) {
                var tile = new Tile(x, y, row[x])
                this.tiles.push(tile);
                this.tileHash[x + ',' + y] = tile;
            }
        }
    }



    /**
     * helper functions for inspecting the Tile instance type
     */
    static isTileType(t, attr) {
        try {
            return this.tileHash[t.x + ',' + t.y][attr];
        } catch (ex) {
            return false; //out of bounds
        }
    }

    static isDecisionTile(t) {
        return this.isTileType(t, 'decision')
    }

    static isTunnelTile(t) {
        return this.isTileType(t, 'tunnel')
    }

    static isHouseTile(t) {
        return this.isTileType(t, 'house')
    }

    static isWalkableTile(t) {
        return this.isTileType(t, 'walkable') || this.isWarpTile(t);
    }

    static isWarpTile(t) {
        if (t.x < 0 && !this.isWallTile({ x: 0, y: t.y })) {
            //outside of maze bounds on the left and tile to the right is open (not wall)
            return true;
        } else if (t.x > 27 && !this.isWallTile({ x: 27, y: t.y })) {
            //outside of maze bounds on the right and tile to the left is open (not wall)
            return true;
        } else if (t.x < 0 || t.x > 27) {
            //in the maze somewhere
            return false;
        }
    }

    static isWallTile(t) {
        //wall tiles are the . on the wallMap, but also anything out of the maze bounds
        // that is not a warp tile
        if (this.isWarpTile(t)) {
            return false;
        }
        return this.isTileType(t, 'wall')
    }




    constructor(scene, resource) {
        this.scene = scene;
        this.resource = resource;
        this.context = scene.context;
        this.level = scene.level;

        //default for the number of pellets eaten to release a fruit
        this.fruitRelease = [70, 170];
        //flags for animating end of level flash
        this.complete = false;
        this.flashing = false;
        this.flashAnimation = { frames: 6, ticksPerFrame: 12, curFrame: 0, curFrameTicks: 0 };

    }

    /**
     * this is the number of ticks between when the last pellet eaten by pacman and a ghost is released
     */
    get lastPelletEatenTimeout() {
        return this.scene.level <= 4 ? 240 : 180;
    }

    /**
     * check the fruit release values. if pellets eaten is equal to one of those, release
     * a fruit.
     */
    isFruitReady() {
        //make sure a fruit isn't already on the board
        return this.fruitRelease.indexOf(this.scene.pelletsEaten) >= 0;
    }

    /**
     * Ms Pacman only. choose a random warp tile for the fruit to appear
     */
    chooseRandomFruitEntry() {
        var cls = this.constructor,
            choice = Math.floor(Math.random() * cls.WARP_TILES.length);
        return [cls.WARP_TILES[choice]].concat(cls.ENTER_TARGETS[choice]);
    }

    /**
     * Ms Pacman only. choose a random warp tile for the fruit to exit on
     */
    chooseRandomFruitExit() {
        var cls = this.constructor,
            choice = Math.floor(Math.random() * cls.WARP_TILES.length);
        return cls.EXIT_TARGETS[choice].concat(cls.WARP_TILES[choice]);
    }

    /**
     * called when the maze should start flashing animation
     */
    finish() {
        this.flashing = true; 
    }

    draw() {
        //if maze is complete:                 
        //pause, flash 3x between color and black and white scene 12 ticks each, all black screen, then reset
        var offsetx = this.textureOffset.x,
            offsety = this.textureOffset.y;
        if (this.flashing) {
            this.flashAnimation.curFrameTicks++;
            if (this.flashAnimation.curFrameTicks == this.flashAnimation.ticksPerFrame) {
                this.flashAnimation.curFrame++;
                this.flashAnimation.curFrameTicks = 0;
                if (this.flashAnimation.curFrame > this.flashAnimation.frames) {
                    //flashing is done
                    this.complete = true;
                }
            }
            if (this.flashAnimation.curFrame % 2) {
                //show black and white version
                offsety = Maze.getMazeIndex(this.scene.level) * 248;
                offsetx = 0;
            }
        }
        if (!this.complete) {
            this.context.drawImage(this.resource, offsetx, offsety, 224, 248, 0, 24, 224, 248);
        }
        if (this.flashing) {
            //open ghost house gate
            this.context.clearRect(13 * 8, 15 * 8, 16, 8);
        }
    }
}class MsPacman1 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.111111..1111111111..111111.', //4
        '.3....1..1........1..1....3.', //5
        '.1....1..1........1..1....1.', //6
        '.11211211211211211211211211.', //7
        '...1..1.....1..1.....1..1...', //8
        '...1..1.....1..1.....1..1...', //9
        '...1..1.....1..1.....1..1...', //10
        '5552..1112111..1112111..2555', //11
        '...1.....0........0.....1...', //12
        '...1.....0........0.....1...', //13
        '...2000004000000004000002...', //14
        '...1.....0...66...0.....1...', //15
        '...1.....0.666666.0.....1...', //16
        '...1..0004.666666.4000..1...', //17
        '...1..0..0.666666.0..0..1...', //18
        '...1..0..0........0..0..1...', //19
        '5552000..0004004000..0002555', //20
        '...1........0..0........1...', //21
        '...1........0..0........1...', //22
        '...2111112000..0002111112...', //23
        '...1.....1........1.....1...', //24
        '...1.....1........1.....1...', //25
        '.11211211211200211211211211.', //26
        '.1....1.....1..1.....1....1.', //27
        '.1....1.....1..1.....1....1.', //28
        '.1....1..1111..1111..1....1.', //29
        '.3....1..1........1..1....3.', //30
        '.1....1..1........1..1....1.', //31
        '.11111211211111111211211111.', //32
        '............................', //33
        '............................'  //34
    ];

    static tiles = [];
    static tileHash = {};

    //warp tiles (could find these programmatically)
    static WARP_TILES = [
        {x: -1, y: 10.5},
        {x: -1, y: 19.5},
        {x: 28, y: 10.5},
        {x: 28, y: 19.5}
    ];

    //fruit entrance sequences
    static ENTER_TARGETS = [
        [{x: 9, y: 11},{x: 9, y: 14}], //upper left
        [{x: 4, y: 26}, {x: 18, y: 26}, {x: 15, y: 20}], //lower left
        [{x: 24, y: 20}, {x: 18, y: 17}], //upper right
        [{x: 22, y: 23}, {x: 15, y: 20}] //lower right
    ];

    //fruit exit sequences
    static EXIT_TARGETS = [
        [{x: 9, y: 14}], //upper left
        [{x: 12, y: 20}, {x: 10, y: 23}], //lower left
        [{x: 15, y: 20}, {x: 18, y: 23}], //upper right
        [{x: 15, y: 20}, {x: 18, y: 23}] //lower right
    ];

    constructor(board) {
        super(board, RESOURCE.mspacman);
        this.pelletColor = '#dedffe';
        //release a fruit at these many pellets eaten (including energizers)
        this.fruitRelease = [64, 172];
    }

    get textureOffset() {
        //depends on level
        var scene = this.scene, 
            pacman = scene.pacman;
        if (scene.numPlayers == 1 && scene.level == 1 && (pacman.lives >= 2 || (!pacman.isAlive && pacman.lives == 1))) {
            //bug where maze is blue and red on first play for one player
            return {x: 0, y: 992};
        } else {
            return {x: 228, y: 0};
        }
    }
}
//inherit statics and load map
Object.assign(MsPacman1, Maze);
MsPacman1.initialize();class MsPacman2 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '5555555..1111111111..5555555', //4
        '......0..1........1..0......', //5
        '......0..1........1..0......', //6
        '.311112112111..111211211113.', //7
        '.1.......1..1..1..1.......1.', //8
        '.1.......1..1..1..1.......1.', //9
        '.1..111112..1..1..211111..1.', //10
        '.1..1....0..1111..0....1..1.', //11
        '.1..1....0........0....1..1.', //12
        '.111211..0........0..112111.', //13
        '......1..4000000004..1......', //14
        '......1..0...66...0..1......', //15
        '.111112..0.666666.0..211111.', //16
        '.1....1..0.666666.0..1....1.', //17
        '.1....2004.666666.4002....1.', //18
        '.111..1..0........0..1..111.', //19
        '...1..1..0040000400..1..1...', //20
        '...1..1....0....0....1..1...', //21
        '...1..1....0....0....1..1...', //22
        '...211211112....211112112...', //23
        '...1.......1....1.......1...', //24
        '...1.......1....1.......1...', //25
        '5552111..1120000211..1112555', //26
        '...1..1..1........1..1..1...', //27
        '...1..1..1........1..1..1...', //28
        '.311..2112111..1112112..113.', //29
        '.1....1.....1..1.....1....1.', //30
        '.1....1.....1..1.....1....1.', //31
        '.11111211111211211111211111.', //32
        '............................',
        '............................'
      // 0123456789012345678901234567 
    ];

    static tiles = [];
    static tileHash = {};

    //warp tiles (could find these programmatically)
    static WARP_TILES = [
        {x: -1, y: 3.5},
        {x: -1, y: 25.5},
        {x: 28, y: 3.5},
        {x: 28, y: 25.5}
    ];

    //fruit entrance sequences
    static ENTER_TARGETS = [
        [{x: 9, y: 14}], //upper left
        [{x: 4, y: 23}, {x: 16, y: 25}, {x: 16, y: 20}], //lower left
        [{x: 18, y: 17}], //upper right
        [{x: 22, y: 23}, {x: 16, y: 20}] //lower right
    ];

    //fruit exit sequences
    static EXIT_TARGETS = [
        [{x: 9, y: 17}, {x: 9, y: 7}, {x: 6, y: 6}], //upper left --
        [{x: 14, y: 26}, {x: 11, y: 25}, {x: 8, y: 23}], //lower left
        [{x: 18, y: 23}, {x: 23, y: 13}, {x: 26, y: 13}], //upper right --
        [{x: 18, y: 23}] //lower right --
    ];


    constructor(board) {
        super(board, RESOURCE.mspacman);
        this.pelletColor = '#e1df31';
        this.textureOffset = {x: 228, y: 248};
        this.fruitRelease = [64, 174];
    }
}
//inherit statics and load map data
Object.assign(MsPacman2, Maze);
MsPacman2.initialize();class MsPacman3 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.111111111..1111..111111111.', //4
        '.1.......1..1..1..1.......1.', //5
        '.3.......1..1..1..1.......3.', //6
        '.1..111212112..211212111..1.', //7
        '.1..1..1....1..1....1..1..1.', //8
        '.1112..1....1..1....1..2111.', //9
        '....1..1....1..1....1..1....', //10
        '....1..11211211211211..1....', //11
        '02112....0........0....21120', //12
        '.1..0....0........0....0..1.', //13
        '.1..00400400000000400400..1.', //14
        '.1....0..0...66...0..0....1.', //15
        '.1....0..0.666666.0..0....1.', //16
        '.200400..0.666666.0..004002.', //17
        '.1..0....0.666666.0....0..1.', //18
        '.1..0....0........0....0..1.', //19
        '.1..00400400400400400400..1.', //20
        '.1....0.....0..0.....0....1.', //21
        '.1....0.....0..0.....0....1.', //22
        '.112112..1111..1111..211211.', //23
        '...1..1..1........1..1..1...', //24
        '...1..1..1........1..1..1...', //25
        '.311..2112112002112112..113.', //26
        '.1....1.....1..1.....1....1.', //27
        '.1....1.....1..1.....1....1.', //28
        '.211112..1111..1111..211112.', //29
        '.1....1..1........1..1....1.', //30
        '.1....1..1........1..1....1.', //31
        '.111111..1111111111..111111.', //32
        '............................',
        '............................'
      // 0123456789012345678901234567  
    ];

    static tiles = [];
    static tileHash = {};

    //warp tiles (could find these programmatically)
    static WARP_TILES = [
        {x: -1, y: 11.5},
        {x: 28, y: 11.5}
    ];

    //fruit entrance sequences- are there only two entry sequences
    static ENTER_TARGETS = [
        [{x: 10, y: 14}], // left
        [{x: 26, y: 14}, {x: 16, y: 20}] // right
    ];

    //fruit exit sequences are there only two exit sequences
    static EXIT_TARGETS = [
        [{x: 12, y: 20}, {x: 8, y: 26}, {x: 1, y:23}], // left
        [{x: 15, y: 20}, {x: 19, y: 26}, {x: 26, y: 23}] // right
    ];

    constructor(board) {
        super(board, RESOURCE.mspacman);
    }


    get isAlternateVersion() {
        return !(this.level <= 13 || (this.level > 14 && !((this.level - 1) % 4)));
    }

    get pelletColor() {
        if (!this.isAlternateVersion) { 
            return '#fc0d1b';
        } else {
            return '#2dfffe';
        }
    }

    get textureOffset() {
        //depends on level
        if (!this.isAlternateVersion) { 
            // level 17, 19, 23, etc
            return {x: 228, y: 248*2};
        } else { 
            // alt color level 14, 15, 19, 23
            return {x: 228, y: 248*4};
        }
    }
}
//inherit statics and load map data
Object.assign(MsPacman3, Maze);
MsPacman3.initialize();class MsPacman4 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.11121111211111111211112111.', //4
        '.1..1....1........1....1..1.', //5
        '.3..1....1........1....1..3.', //6
        '.1..1....1..1111..1....1..1.', //7
        '.1..112112..1..1..211211..1.', //8
        '.1....1..1..1..1..1..1....1.', //9
        '.1....1..1..1..1..1..1....1.', //10
        '.112111..1112..2111..111211.', //11
        '...1........0..0........1...', //12
        '...1........0..0........1...', //13
        '...2111..0004004000..1112...', //14
        '...0..1..0...66...0..1..0...', //15
        '0000..1..0.666666.0..1..0000', //16
        '......2004.666666.4002......', //17
        '......1..0.666666.0..1......', //18
        '0000..1..0........0..1..0000', //19
        '...0..1..0004004000..1..0...', //20
        '...2112.....0..0.....2112...', //21
        '...1..1.....0..0.....1..1...', //22
        '...1..1112004..4002111..1...', //23
        '...1.....1..0..0..1.....1...', //24
        '...1.....1..0..0..1.....1...', //25
        '.112112112..0000..211211211.', //26
        '.1....1..1........1..1....1.', //27
        '.1....1..1........1..1....1.', //28
        '.1..111..1112112111..111..1.', //29
        '.3..1.......1..1.......1..3.', //30
        '.1..1.......1..1.......1..1.', //31
        '.111211111111..111111112111.', //32
        '............................',
        '............................'
      // 0123456789012345678901234567  
    ];

    //warp tiles (could find these programmatically)
    static WARP_TILES = [
        {x: -1, y: 15.5},
        {x: -1, y: 18.5},
        {x: 28, y: 15.5},
        {x: 28, y: 18.5}
    ];

    // fruit entrance sequences
    static ENTER_TARGETS = [
        [{x: 7, y: 8}, {x: 13, y: 14}], //upper left--
        [{x: 6, y: 21}, {x: 14, y: 26}, {x: 15, y: 20}], //lower left
        [{x: 18, y: 18}], //upper right--
        [{x: 20, y: 23}, {x: 15, y: 20}] //lower right--
    ];

    // fruit exit sequences
    static EXIT_TARGETS = [
        [{x: 7, y: 17}], //upper left --
        [{x: 11, y: 23}], //lower left --
        [{x: 15, y: 20}, {x: 18, y: 23}, {x: 22, y: 14}], //upper right
        [{x: 15, y: 20}, {x: 18, y: 23}] //lower right --
    ];

    static tiles = [];
    static tileHash = {};

    constructor(board) {
        super(board, RESOURCE.mspacman);
    }

    get isAlternateVersion() {
        return !(this.level <= 13 || (this.level > 13 && (this.level % 4)));
    }
    
    get pelletColor() {
        if (!this.isAlternateVersion) { // level 15, 19
            return '#d8d9f7';
        } else {
            return '#dedffe';
        }
    }

    get textureOffset() {
        //depends on level
        if (!this.isAlternateVersion) { // level 15, 19
            return {x: 228, y: 248*3};
        } else {
            //alt color -- 16, 20
            return {x: 228, y: 248*5};
        }
    }
}
//inherit statics and load map data
Object.assign(MsPacman4, Maze);
MsPacman4.initialize();//. = wall
//0 = open tile
//1 = pellet
//2 = pellet + decision
//3 = energizer
//4 = decision only
//5 = tunnel (slow tile)
//6 = ghost house (slow tile)

class Pacman1 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.111112111111..111111211111.', //4
        '.1....1.....1..1.....1....1.', //5
        '.3....1.....1..1.....1....3.', //6
        '.1....1.....1..1.....1....1.', //7
        '.21111211211211211211211112.', //8
        '.1....1..1........1..1....1.', //9
        '.1....1..1........1..1....1.', //10
        '.111112..1111..1111..211111.', //11
        '......1.....0..0.....1......', //12
        '......1.....0..0.....1......', //13
        '......1..0000000000..1......', //14
        '......1..0...66...0..1......', //15
        '......1..0.666666.0..1......', //16
        '5555552004.666666.4002555555', //17
        '......1..0.666666.0..1......', //18
        '......1..0........0..1......', //19
        '......1..4000000004..1......', //20
        '......1..0........0..1......', //21
        '......1..0........0..1......', //22
        '.111112112111..111211211111.', //23
        '.1....1.....1..1.....1....1.', //24
        '.1....1.....1..1.....1....1.', //25
        '.311..2112111001112112..113.', //26
        '...1..1..1........1..1..1...', //27
        '...1..1..1........1..1..1...', //28
        '.112111..1111..1111..111211.', //29
        '.1..........1..1..........1.', //30
        '.1..........1..1..........1.', //31
        '.11111111111211211111111111.', //32
        '............................', //33          
        '............................', //34          
    ];

    static tiles = [];
    static tileHash = {};

    constructor(scene) {
        super(scene, RESOURCE.pacman);
        this.pelletColor = '#fcb4aa';
    }

    get textureOffset() {
        return { x: 228, y: 0 };
    }
}
//inherit statics and load map
Object.assign(Pacman1, Maze);
Pacman1.initialize();/**
 * base class for just about anything drawn on the canvas- except the maze backgrounds
 */
class Sprite {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.context = scene.context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        /**
         * an animation is a json object containing up to 6 values:
         * i.e.{ frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
         * 
         * frames           - total number of frames that make up this animation
         * ticksPerFrame    - number of ticks to display a single from of the animation before moving on to the next frame
         * curFrame         - the frame that this animation is currently on
         * curFrameTicks    - counter for the number ticks of the current animation frame
         * textureX         - X texture coordinate on the sprite sheet resource of the first frame of this animation
         * textureY         - Y texture coordinate on the sprite sheet resource of the first frame of this animation
         * 
         * textures for each frame are assumed to be horizontally lined up on the sprite sheet with each frame
         * being the same width (this.width). If the there is no texture (like with the Energizer pellets), the texture
         * coordinates can be omitted
         * 
         */
        this.animations = [];
        //the pointer to the current animation in the this.animations array
        this.currentAnimation = 0;
    }

    //return pixel position on the screen
    get position() {
        return {x: this.x, y: this.y};
    }
    //set x and y in one go
    set position(position) {
        this.x = position.x;
        this.y = position.y;
    }
    //mid point of the sprite rectangle
    get centerPixel() {
        return {x: this.position.x + (this.width/2), y: this.position.y + (this.height/2)}; 
    }
    //determine which tile this actor occupies. look at their center pixel coordinate
    get tile() {
        var center = this.centerPixel;
        return {x: Math.floor((center.x) / 8), y: Math.floor((center.y) / 8)};
    }

    //don't draw this sprite
    hide() {
        this.hidden = true;
    }
    //draw it
    show() {
        this.hidden = false;
    }

    //stop this sprite from animating
    freeze() {
        this.frozen = true;
    }
    //resume animation
    unfreeze() {
        this.frozen = false;
    }

    //actors collide if they occupy the same tile
    collide(actor) {
        return (this.tile.x == actor.tile.x && this.tile.y == actor.tile.y)
    }


    //set a new current animation and reset animation counters
    set animation(index) {
        this.currentAnimation = index;
        //reset animation info
        this.animation.curFrame = 0;
        this.animation.curFrameTicks = 0;
    }
    //gets the current animation
    get animation() {
        return this.animations[this.currentAnimation];
    }


    /**
     * nothing is really drawn here, but the current animation (if there is one) has its
     * counter updated.
     */
    draw() {
        //don't animate if hidden or frozen
        if (this.hidden || this.frozen) return;
        // update animation counters if there this is animated
        if (this.animations.length) {
            var currentAnimation = this.animations[this.currentAnimation];
            //if animating
            if (currentAnimation.ticksPerFrame > 0 && currentAnimation.frames > 1) {
                //increment time spent on the current frame (milliseconds)
                currentAnimation.curFrameTicks++;
                //convert secPerFrame to milliseconds for comparison
                //is the time on the current frame more than secPerFrame? if so, time to move on to next frame
                if (currentAnimation.curFrameTicks >= currentAnimation.ticksPerFrame) {
                    //go to the next frame in the animation
                    currentAnimation.curFrame = (currentAnimation.curFrame + 1) % currentAnimation.frames;
                    currentAnimation.curFrameTicks = 0;
                }
            }
        }
    }
}/**
 * render text strings to the canvas in various colors. 
 * 
 * see res/text.png for sprite sheet
 */

class Text extends Sprite {
    //this string mirrors the placement of letters in res/text.png
    static TEXT_MAP = [
        "ABCDEFGHIJKLMNO ",
        "PQRSTUVWXYZ!cpts", //c is copyright symbol and pts is the "pts" (points) abbreviation
        '0123456789/-".'
    ]

    /**
     * 
     * @param {*} scene scene to render the text on
     * @param {*} text string of text to render
     * @param {*} color color of rendered text. values are: red, pink, blue, orange, peach, yellow
     * @param {*} x pixel location to render text
     * @param {*} y pixel location to render text
     * @param {*} align alignment of text: values are left (default) and right
     */
    constructor(scene, text, color, x, y, align) {
        super(scene, x, y);
        this.text = text;
        this.color = color;
        this.align = align || 'left';
        //a simple counter for flash "animation" instead of using animations array
        this.flashCtr = 0;
    }

    /**
     * the Y offset of the text.png texture that corresponds to the color
     * of the text
     */
    get colorOffset() {
        return (['red','pink','blue','orange','peach','yellow'].indexOf(this.color) + 1) * 32;
    }

    /**
     * by finding the location of the letter in the textmap string, this calculates the x,y 
     * coordinate of the given letter as it appears on res/text.png
     * 
     * @param {*} letter find the x,y coordinate on sprite sheet of this letter. 
     *                   Y coord is added with color offset later
     */
    getLetterCoordinates(letter) {
        for (var i = 0; i < Text.TEXT_MAP.length; i++) {
            var letterIndex = Text.TEXT_MAP[i].indexOf(letter);
            if (letterIndex > -1) {
                return { x: letterIndex * 8, y: i * 8 };
            }
        }
    }

    draw() {
        if (this.hidden) return;
        //flashing is used for the 1/2 player scores only. 
        if (this.flashCtr < 16) {
            //flash on for 16 frames, then off for 16
            for (var i = 0; i < this.text.length; i++) {
                //go through this.text letter by letter and find the corresponding sprite
                var letterCoords = this.getLetterCoordinates(this.text[i]),
                    alignX = 0;
                //calculate text alignment offset for this letter
                if (this.align == 'right') {
                    alignX = ((this.text.length - 1) * 8);
                }
                //draw the letter in sequence
                this.context.drawImage(RESOURCE.text,
                    letterCoords.x, letterCoords.y + this.colorOffset, 8, 8,
                    this.x + (i * 8) - alignX, this.y, 8, 8
                );
            }
        }
        //cycle the flash counter if flash flag is true
        if (this.flash) {
            this.flashCtr = (this.flashCtr + 1) % 32;
        } else {
            //other wise leave counter at zero so text always gets drawn
            this.flashCtr = 0;
        }
    }
}/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class PacmanPoints extends Sprite {
    /**
     * 
     * @param {*} scene 
     * @param {*} item thing that was eaten (fruit or ghost)
     * @param {*} score if fruit, the actual score, if ghost, the number of ghosts eaten 
     *                  during energized/fright period
     */
    constructor (scene, item, score) {
        super(scene, item.x, item.y, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 456, y: 144};
        //keep on the board for 2 seconds
        this.ticksToLive = 80; 
        this.score = score;  
        this.item = item;      
    }

    /**
     * if eaten, just set ticksToLive to zero so it doesn't draw, and then
     * gets deleted from the maze in the next tick
     */
    eaten() {
        this.ticksToLive = 0;
    }

    tick() {
        this.ticksToLive--;
        if (this.ticksToLive < 0) {
            //pull self from the scene
            delete this.scene.pointSprite;
        }
    }

    /**
     * find the points value sprite on the sprite sheet. some score sprites
     * are wider than 16 pixels, so take that into account
     */
    get textureOffsets() {
        switch(this.score) {
            //fruit
            case 100:
                return {x: 0, y: 0, w: 16};
            case 300:
                return {x: 16, y: 0, w: 16};
            case 500:
                return {x: 32, y: 0, w: 16};
            case 700:
                return {x: 48, y: 0, w: 16};
            case 1000:
                return {x: 64, y: 0, w: 18};
            case 2000:
                return {x: 60, y: 16, w: 24};
            case 3000:
                return {x: 60, y: 32, w: 24};
            case 5000:
                return {x: 60, y: 48, w: 24};
            default:
                //ghosts 1,2,3, or 4
                return {x: 16 * this.score, y: -16, w: 16};
        }
    }

    /**
     * as long as this sprite has ticksToLive, draw it
     */
    draw() {
        if (this.ticksToLive > 0) {
            //do x/y offset based on board.level
            var offset = this.textureOffsets;
            this.context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, offset.w, 16,
                this.x - ((offset.w - 16) / 2), this.y, offset.w, 16  
            );
        }
    }
}/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class MsPacmanPoints extends PacmanPoints {

    constructor (scene, item, score) {
        super(scene, item, score); //always appear below ghost house
        this.textureOffset = {x: 504, y: 16};
    }

    /**
     * find the coordinates of the points value sprite on the sprite sheet.
     */
    get textureOffsets() {
        if (this.item.fruit) {
            switch(this.score) {
                //fruit
                case 100:
                    return {x: 0, y: 0};
                case 200:
                    return {x: 16, y: 0};
                case 500:
                    return {x: 32, y: 0};
                case 700:
                    return {x: 48, y: 0};
                case 1000:
                    return {x: 64, y: 0};
                case 2000:
                    return {x: 80, y: 0};
                case 5000:
                    return {x: 96, y: 0};
            }
        } else {
            //ghost scores
            return {x: -16 * (3-this.score), y: 112};
        }
    }

    /**
     * as long as this sprite has ticksToLive, draw it
     */
    draw() {
        if (this.ticksToLive > 0) {
            var offset = this.textureOffsets;
            this.context.drawImage(RESOURCE.mspacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, 16, 16,
                this.x, this.y, 16, 16  
            );
        }
    }
}/** 
* the row of pacmans or ms pacmans that appear below the maze indicating 
* how many lives the player has remaining. maxes out at 5
*/
class LivesSprite extends Sprite {
    constructor(scene) {
        super(scene, 0, 0, 16, 16);
        if (Game.GAME_MODE == Game.GAME_PACMAN) {
            this.resource = RESOURCE.pacman;
            this.textureOffset = { x: 587, y: 16 };
        } else {
            this.resource = RESOURCE.mspacman;
            this.textureOffset = { x: 472, y: 0 };
        }
    }

    draw() {
        //can only draw a maximum of 5 pacman lives
        for (var i = 0; i < Math.min(this.scene.pacman.lives, 5); i++) {
            this.context.drawImage(this.resource,
                this.textureOffset.x, this.textureOffset.y, this.width, this.height,
                (i + 1) * this.width, 272, this.width, this.height
            );
        }
    }
}/*
* the row of fruit that appears below the maze indicating which level
* the player is on.
*
* the order of appearance of fruit in ms pacman starting at level 1:
* cherry, strawberry, orange, pretzel, apple, pear, banana
*
* unlike pacman fruits are not pushed off the board as levels progress.
* after banana (level 7) the MsPacmanLevelSprite fruits do not change
*/

class MsPacmanLevelSprite extends Sprite {
    constructor(scene) {
        super(scene, 0, 0, 16, 16);
        this.textureOffset = {x: 504, y: 0};
    }

    draw() {
        //ms pacman doesn't repeat fruit, and doesn't push earlier fruit off screen
        for (var i = 0; i < Math.min(Math.max(this.scene.level,1), 7); i++) {
            this.context.drawImage(RESOURCE.mspacman,
                this.textureOffset.x + (i * 16), this.textureOffset.y, this.width, this.height,
                196 - (i * 16), 272, this.width, this.height  
            );
        }
    }
}/**
* the row of fruit that appears below the maze indicating which level
* the player is on. 
*
* the order of fruit appearance in pacman starting at level 1 is:
* cherry, strawberry, orange, orange, apple, apple, pineapple, pineapple,
* galaxian boss, galaxian boss, bell, bell, keys until forever
*
* as levels progress, earlier fruit is pushed off the board. a
* maximum of 7 fruits are displayed at one time
*/

class PacmanLevelSprite extends Sprite {
    constructor(scene) {
        super(scene, 0, 0, 16, 16);
        this.textureOffset = {x: 488, y: 48};
    }

    draw() {
        var fruits = [],
            level = Math.max(this.scene.level, 1);
        // pacman differs from ms pacman here. it pushes earlier fruit off the screen
        for (var i = level; i >= level-6; i--) {
            if (i < 1) break;
            fruits.unshift(PacmanFruit.getFruitIndex(i));
        }
        //play math games to line the fruit up nicely on the bottom of the screen
        for (var i = 0; i < fruits.length; i++) {
            var offsetX = fruits[i] * 16,
                dstX = (24 - (2*i)) * 8;
            this.context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, this.width, this.height,
                dstX, 272, this.width, this.height  
            );
        }
    }
}/**
 * base class for pacmans, ghosts, and ms pacman fruit. actor is
 * a base class for anything that moves around a scene
 */
class Actor extends Sprite {

    //turn preferences priority list- used by ghosts and ms pacman fruit.
    //if there's a tie for which valid turns to make at a decision point, choose the first 
    //one of the matches in this list
    static TURN_PREFERENCE = [Vector.LEFT, Vector.UP, Vector.RIGHT, Vector.DOWN];

    constructor(scene, x, y, width, height) {
        super(scene, x, y, width, height);
        this.startPosition = { x: x, y: y };
        //frame counter keeps track of which value to select from speedControl string
        //this gets incremented twice per tick and loops back to zero after 31
        this.frameCtr = 0;
    }

    /**
     * return the actor to it's starting place
     */
    reset() {
        this.show();
        this.freeze();
        this.position = Vector.clone(this.startPosition);
        this.direction = Vector.clone(this.startDirection);
        this.frameCtr = 0;
    }

    /**
     * look at a tile on the map and determine what the ghost's (ms pacman fruit) next move should be 
     * if/when it reaches that tile
     * @param {*} atTile  the tile at which to base the calculation
     */
    calculateNextInstruction(atTile) {
        var choice = -1,
            closest = Infinity,
            validChoices = [];    //keep track of non-wall hitting moves for random selection (i.e. frightened mode)
        //cycle through the turn preferences list: UP, LEFT, DOWN, RIGHT
        for (var i = 0; i < Actor.TURN_PREFERENCE.length; i++) {
            var testDirection = Actor.TURN_PREFERENCE[i];
            // can't reverse go back the way we just came
            if (!Vector.equals(Vector.inverse(this.direction), testDirection)) {
                //calculate distance from testTile to targetTile and check if it's the closest
                var testTile = Vector.add(atTile, testDirection),
                    distance = Vector.distance(testTile, this.targetTile);
                if (this.scene.mazeClass.isWalkableTile(testTile)) {
                    //this is a valid turn to make
                    validChoices.push(i);
                    if (distance < closest) {
                        //this choice gets the ghost the closest so far
                        choice = i;
                        closest = distance;
                    }
                }
            }
        }
        // when ghost is frightened override turn choice with random selection from validChoices
        if (!this.isEaten && (this.isFrightened || this.randomScatter)) {
            choice = validChoices[Math.floor(Math.random() * validChoices.length)];
        }
        //set next direction to be the choice the ghost just made
        return Actor.TURN_PREFERENCE[choice];
    }
    
    //is this actor centered on a tile?
    get isTileCenter() {
        return this.tile.x*8 == this.x+4 && this.tile.y*8 == this.y+4;
    }

    //start and stop movement (but not animation)
    stop() {
        this.stopped = true;
    }
    start() {
        this.stopped = false;
    }

    /**
     * this gets called twice per frame.
     */
    tick() {
        if (!this.stopped) {
            //update position of actor
            this.x += (this.speed * this.direction.x);
            this.y += (this.speed * this.direction.y);

            //counter used for speed control
            this.frameCtr = (this.frameCtr+1) % 32;

            //warp tunnel wrap-around- if actor goes through tunnel, 
            // make them loop out from the other side
            if (this.tile.x == 30 && this.direction.x == 1) {
                this.x = (-3 * 8)+2;
            } else if (this.tile.x == -2 && this.direction.x == -1) {
                this.x = (30 * 8)-2;
            }
        }
    }

    /**
     * get the value at index:frameCtr from the speedControl string. this will be how
     * many pixels the actor should move next half tick
     */
    get speed() {
        try {
            return parseInt(this.speedControl[this.frameCtr]);
        } catch(ex) {
            return 0;
        }
    }
}class Pacman extends Actor {
    //STATUS INDICATORS
    //normal movement around maze
    static MODE_PATROL = 0;
    //after eating an energizer
    static MODE_ENERGIZED = 1;
    //in the process of dying where he folds up into nothing
    static MODE_DYING = 2;
    //all done dying
    static MODE_DEAD = 3;

    //ANIMATIONS
    //normal maze chomping
    static ANIM_NORMAL = 0;
    //folding up and disappearing
    static ANIM_DIE = 1;
    //used for cutscene 1 in pacman where he's pacman becomes a giant for some reason
    static ANIM_GIANT = 2;
    //used for menu and cut scene. slows mouth chomping animation to half-speed
    static ANIM_SLOMO = 3;

    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        //always starts facing left
        this.startDirection = Vector.LEFT;
        this.animations = [
            //normal --TODO: it seems chopming animations are dependent on speed control
            { frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 },
            //die
            { frames: 14, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 504, textureY: 0 },
            //giant 32 x 32
            { frames: 4, ticksPerFrame: 3, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 16 },
            //slo-mo - same as normal but don't chomp so fast
            { frames: 4, ticksPerFrame: 4, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
        ];
        this.score = 0;
        this.reset();
    }

    reset() {
        Actor.prototype.reset.call(this);
        this.stop();
        this.animation = Pacman.ANIM_NORMAL;
        this.mode = Pacman.MODE_PATROL;
    }


    //despite being a 16x16 sprite, pacman's hitbox (when eating pellets) appears to be adjusted somehow
    get hitBox() {
        return { x: this.centerPixel.x - 7, y: this.centerPixel.y - 7, w: 14, h: 15 }
    }

    get centerPixel() {
        return { x: this.x + 7, y: this.y + 7 };
    }

    /**
     * see if pacman collided with a pellet
     * 
     * @param {*} pellet test hitbox against pacman
     */
    collideItem(pellet) {
        var pelletHitbox = pellet.hitBox;
        return ((pelletHitbox.x > this.hitBox.x && pelletHitbox.x + pelletHitbox.w < this.hitBox.x + this.hitBox.w) &&
            (pelletHitbox.y > this.hitBox.y + 1 && pelletHitbox.y + pelletHitbox.h < this.hitBox.y + this.hitBox.h));
    }

    /**
     * pacman is out in the maze and there is no fright timer.
     */
    patrol() {
        if (this.isAlive) {
            this.animation = Pacman.ANIM_NORMAL;
            this.mode = Pacman.MODE_PATROL;    
        }
    }
    get isPatrolling() {
        return this.mode == Pacman.MODE_PATROL;
    }


    /**
     * pacman eats an item such as a pellet, energizer, or fruit. when eating a pellet, pacman
     * freezes for one frame, and freezes for 3 when eating an energizer. The freeze delay counter
     * is because the freeze happens after one tick.
     * @param {*} item the thing that pacman ate
     */
    eatItem(item) {
        if (item.pellet) {
            this.freezeDelay = 2;
            this.freezeHalfTicks = 2;
            this.atePellet = true;
            Sound.playOnce('munch');
        } else if (item.energizer) {
            this.freezeDelay = 2;
            this.freezeHalfTicks = 6;
            this.mode = Pacman.MODE_ENERGIZED; //speed him up
            this.atePellet = true;
        } else if (item.fruit) {
            item.eaten();
            Sound.playOnce('eat_fruit');
        }
        this.addPoints(item.points);
    }
    get isEnergized() {
        return this.mode == Pacman.MODE_ENERGIZED;
    }


    /**
     * add points to pac-man's score. check for extra life.
     * extra life every 10k points
     * @param {*} points 
     */
    addPoints(points) {
        var prevScore = Math.floor(this.score / 10000);
        this.score += points;
        //award extra life for every 10k increment of points
        var newScore = Math.floor(this.score / 10000);
        if (prevScore != newScore) {
            Sound.playOnce('extra_life');
            this.lives++;
        }
        //set high score
        if (this.score > this.scene.highScore && !Game.PRACTICE_MODE) {
            Game.setHighScore(Game.GAME_MODE, this.score);
        }
    }


    /**
     * kill the pac-man. stores the current maze's pellet arrays
     * to pac-man and then begins die animation
     */
    die() {
        //point up and open mouth to begin die animation
        this.freeze();
        this.animation.curFrame = 2;
        this.direction = Vector.UP;
        //cache the scene's pellets/energizer in side this pacman instance
        this.pellets = Array.from(this.scene.pellets);
        this.energizers = Array.from(this.scene.energizers);
        //after getting caught, the game freezes for 0.5 seconds before starting die animation
        this.scene.freezeTimer.start(30, () => {
            Sound.playOnce('die');
            this.unfreeze();
            this.mode = Pacman.MODE_DYING;
            this.animation = Pacman.ANIM_DIE;
            if (!Game.PRACTICE_MODE) {
                Math.max(--this.lives, -1); //min lives of zero
            }
        });
    }
    get isDying() {
        return this.mode == Pacman.MODE_DYING;
    }
    get isDead() {
        return this.mode == Pacman.MODE_DEAD;
    }
    get isAlive() {
        return !this.isDead && !this.isDying;
    }

    //for pacman cut scene 1
    get isGiant() {
        return this.currentAnimation == Pacman.ANIM_GIANT;
    }


    tick() {
        //pacman freezes when eating pellets (1 tick) and energizers (3 ticks)
        //freeze delay timer is here because the actual freezing is delayed
        //by a frame (2 ticks)
        if (!this.freezeDelay) {
            if (this.freezeHalfTicks) {
                this.freezeHalfTicks--;
                return;
            }
        } else {
            this.freezeDelay--;
        }

        Actor.prototype.tick.call(this);

        //scripting or dead, no maze stuff here
        if (!this.scene.maze || !this.isAlive) return;  

        //get the direction for this frame by reading the input buffer or continue current direction if no input
        var inputDirection = Input.readBuffer() || this.direction;
        //check for wall contact
        //look at 5 pixels over from center point in direction pac-man is moving. if it is a wall tile, then stop
        var centerPoint = this.centerPixel,
            nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 },
            nextTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
        if (!this.scene.mazeClass.isWalkableTile(nextTile)) {
            //this move would hit a wall, try to continue in same direction of travel
            inputDirection = this.direction;
        } else {
            //path is open, start moving again
            this.unfreeze();
            this.start();
        }

        //try again with original direction - if there's a wall here too, stop
        nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 };
        nextTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
        if (!this.scene.mazeClass.isWalkableTile(nextTile)) {
            //this move would hit a wall, try to continue in same direction of travel
            this.freeze();
            this.stop();
            //pac man never stops with his mouth closed. ms pacman does, though
            if (this.animation.curFrame == 0 && Game.GAME_MODE == Game.GAME_PACMAN) {
                this.animation.curFrame = 2;
            }
        }

        var oppositeDirection = Vector.equals(inputDirection, Vector.inverse(this.direction));
        this.direction = inputDirection;

        //make sure to keep pacman centered in the maze path
        if (!this.stopped && !oppositeDirection) {

            //get the coordinate of center lane
            var centerX = (this.tile.x * 8) + 3,
                centerY = (this.tile.y * 8) + 3;

            //keep pac-man in his lane. fudge over to center line depending on direction of travel
            //this code re-aligns pacman to the center of the maze lane after cutting a corner.
            //have to use half pixels (0.5) because of the two updates per tick thing
            if (this.direction.x) {
                if (this.centerPixel.y > centerY) {
                    this.y -= 0.5;
                } else if (this.centerPixel.y < centerY) {
                    this.y += 0.5;
                }
            }
            if (this.direction.y) {
                if (this.centerPixel.x > centerX) {
                    this.x -= 0.5;
                } else if (this.centerPixel.x < centerX) {
                    this.x += 0.5;
                }
            }
        }
    }


    /**
     * offset on sprite sheet according to which direction pac-man
     * is facing
     */
    get directionalOffsetY() {
        //right, left, up, down
        if (this.direction.x >= 1) {
            return 0;
        } else if (this.direction.x <= -1) {
            return 16;
        } else if (this.direction.y <= -1) {
            return 32;
        } else if (this.direction.y >= 1) {
            return 48;
        }
    }


    /**
     * offset on sprite sheet for the frame pac-man is
     * on in his eating animation
     */
    get frameOffsetX() {
        switch(this.animation.curFrame) {
            case 3:
                return -1;
            default:
                return -this.animation.curFrame;
        }
    }


    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.context,
            animation = this.animation;

        if (this.isAlive) {
            //draw chomping animation
            var curFrame = animation.curFrame,
                frameOffsetX = this.frameOffsetX,
                directionalOffsetY = this.directionalOffsetY,
                width = this.width,
                height = this.height;

            if (curFrame == 0) {
                //closed mouth uses only one texture, no matter direction
                directionalOffsetY = 0;
            }

            if (this.isGiant) {
                directionalOffsetY = 16;
                width = 32;
                height = 32;
                frameOffsetX *= -32;
            } else {
                frameOffsetX *= 16;
            }
            //do directional stuff and modular back and forth for animation
            context.drawImage(RESOURCE.pacman,
                animation.textureX + frameOffsetX, directionalOffsetY, width, height,
                this.x, this.y, width, height
            );
        } else {
            //dying animation
            context.drawImage(RESOURCE.pacman,
                animation.textureX + (animation.curFrame * 16), 0, 16, 16,
                this.x, this.y, 16, 16
            );
            if (animation.curFrame == 13) {
                //dead
                this.freeze();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }


    /**
     * these strings indicate how many pixels to move pacman at a given tick. two consecutive digits are applied
     * each tick, allowing for sub tick granularity with respect to movement. 
     * i.e. on level 1 if pacman is patrolling, in one tick he will update his positiong twice moving 0 pixels in the first
     * half tick and 1 pixel in the next, for a total of 1 pixel in the tick. as the game speeds up, this
     * allows for pac-man (and ghosts) to move more than 1 pixel per tick without flying off the rails.
     * 
     * for info on pacman speeds, etc see: https://www.gamasutra.com/db_area/images/feature/3938/tablea1.png
     */
    get speedControl() {
        // TODO: something odd going on when pacman moves up. doesn't follow these patterns. pixel rounding??
        //on average I think it works out, but not pixel perfect
        if (this.stopped || !this.isAlive) {
            return '00000000000000000000000000000000';
        } else if (this.isPatrolling) {
            if (this.scene.level == 1) {
                return '01010101010101010101010101010101'; //16/32 = 60 px/sec
            } else if (this.scene.level <= 4) {
                return '11010101011010101101010101101010'; //18/32 = 67.5 px/sec
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101'; //20/32 = 75
            } else {
                return '11010101011010101101010101101010'; //18/32 = 67.5
            }
        } else if (this.isEnergized) {
            if (this.scene.level == 1) {
                return '11010101011010101101010101101010'; //18/32 = 67.5
            } else if (this.scene.level <= 4) {
                return '11010110010110101010110110110101'; //19/32 = 71.25
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101'; //20/32 = 75
            } else {
                //there is no "energized" state for pacman at this point as the 
                //energizers don't frighten the ghosts- just use patrolling speed
                return '11010101011010101101010101101010'; //not ever used
            }
        }
    }
}/**
 * Ms Pac-man's class. See Pacman.js
 */
class MsPacman extends Pacman {
    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        this.animations = [
            //normal
            { frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 },
            //die
            { frames: 11, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 472, textureY: 48 },
            //giant 32 x 32 --pacman only
            { },
            //slo-mo - same as normal but don't chomp so fast
            { frames: 4, ticksPerFrame: 4, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
        ];
    }

    /**
     * ms pacman starts die animation pointing down
     */
    die() {
        Pacman.prototype.die.call(this);
        this.animation.curFrameTicks = 0;
        this.animation.curFrame = 1;
        this.direction = Vector.DOWN;
        this.nextDirection = Vector.DOWN;
    }

    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.context,
            animation = this.animation;

        if (this.isAlive) {
            //chomping animation
            context.drawImage(RESOURCE.mspacman,
                animation.textureX + (this.frameOffsetX * 16), this.directionalOffsetY, 16, 16,
                this.x, this.y, 16, 16
            );
        } else {
            //dying animation- should spin, down,left,up,right, down,left,up,right, down,left,up
            this.direction = Actor.TURN_PREFERENCE[animation.curFrame % 4];
            context.drawImage(RESOURCE.mspacman,
                animation.textureX, this.directionalOffsetY, 16, 16,
                this.x, this.y, 16, 16
            );
            if (animation.curFrame == 9) {
                //dead - stop animating
                this.freeze();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }
}// https://www.youtube.com/watch?v=sQK7PmR8kpQ ms pacman ghost ai
class Ghost extends Actor {
    static MODE_CHASE = 0;
    static MODE_SCATTER = 1;
    static MODE_FRIGHT = 2;
    static MODE_EATEN = 3;

    static STATUS_LEAVE_HOME = 0;
    static STATUS_ENTER_HOME = 1;
    static STATUS_HOME = 2;
    static STATUS_PATROL = 3;

    static ANIM_SCATTER_CHASE = 0;
    static ANIM_FRIGHT = 1;
    static ANIM_FRIGHT_FLASH = 2;
    static ANIM_EATEN = 3;

    //global counters to keep track during one frighten period
    static NUM_EATEN = 0;
    static NUM_FRIGHTENED = 0;

    //entrance and exit to the ghost house
    static HOUSE_DOOR = { x: 13, y: 14 };
    static LEAVE_TARGET = { x: 13 * 8, y: 13.5 * 8 };


    /**
     * total duration of energize/frighten. time is in seconds, flashes are 
     * 28 ticks each-- 4 frames, 7 ticks per frame. on most later levels, ghosts 
     * never frighten and only reverse direction
     * 
     */
    static getFrightenDuration(level) {
        var time = 0,
            flashes = 0;
        if (level <= 5) {
            time = 7 - level;
            flashes = 5;
        } else if (level == 6 || level == 10) {
            time = 5;
            flashes = 5;
        } else if (level <= 8 || level == 11) {
            time = 2;
            flashes = 5;
        } else if (level == 14) {
            time = 3;
            flashes = 5;
        } else if (level == 17 || level > 18) {
            time = 0;
            flashes = 0;
        } else if (level == 9 || level <= 18) {
            time = 1;
            flashes = 3;
        }
        return {
            ticks: time * 60,
            flashes: flashes
        }
    }

    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        
        //when eaten, ghosts should return to their houseTarget (usually their startPosition, except Blinky)
        this.houseTarget = this.startPosition;
        this.animations = [
            //normal movement
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 456, textureY: 64 },
            //frighten just blue
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 64 },
            //frighten (flash blue / white)
            { frames: 4, ticksPerFrame: 7, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 64 },
            //eaten (eyes)
            { frames: 1, ticksPerFrame: 0, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 80 }
        ];
        this.currentAnimation = 0;
        //pellet counter for release from ghost house
        this.pelletCounter = 0;
    }


    /**
     * return ghosts to their starting positions and states
     */
    reset() {
        Actor.prototype.reset.call(this);
        this.nextInstruction = Vector.clone(this.direction);
        this.status = Ghost.STATUS_HOME; // EXCEPT BLINKY
        this.mode = Ghost.MODE_SCATTER;
        this.animation = Ghost.ANIM_SCATTER_CHASE;
        this.targetTile = this.calculateTargetTile();
        delete this.reverseInstruction;
    }

    /**
     * when not using global pellet count, use this as a personal ghost counter.
     * it is number of pellets that must be eaten before this ghost can leave the house
     * only clyde and inky have values here. see their subclasses
     */
    get pelletLimit() {
        return 0;
    }


    /**
     * check to see if ghost is on a tunnel tile
     */
    get inTunnel() {
        try {
            return this.scene.mazeClass.isTunnelTile(this.tile);
        } catch (ex) {
            return false;
        }
    }

    /**
     * frighten the ghosts if they're not eaten. frightened ghosts
     * get a reverse instruction.
     */
    frighten() {
        //reverse the ghost, even if they're eaten (eyes)
        this.reverse();
        if (!this.isEaten) {
            //eaten ghosts (eyes) can't be frightened
            this.mode = Ghost.MODE_FRIGHT;
            this.animation = Ghost.ANIM_FRIGHT;
            Ghost.NUM_FRIGHTENED++;
        }
    }
    /**
     * start the flashin'
     */
    frightenFlash() {
        this.animation = Ghost.ANIM_FRIGHT_FLASH;
    }
    get isFrightened() {
        return this.mode == Ghost.MODE_FRIGHT;
    }


    /**
     * turn the ghost around at the next tile center, if possible
     */
    reverse() {
        this.reverseInstruction = Vector.inverse(this.direction);;
        //tag as a reverse instruction so we know later when it becomes the next instruction
        this.reverseInstruction.reverse = true;
    }


    /**
     * make the ghost scatter pacman. called by the scatterchase instance
     */
    scatter() {
        if (!this.isEaten) {
            this.reverse();
            this.mode = Ghost.MODE_SCATTER;
            this.animation = Ghost.ANIM_SCATTER_CHASE;
            //point to this ghost's scatter target
            this.targetTile = this.calculateTargetTile();
        }
    }
    get isScattering() {
        return this.mode == Ghost.MODE_SCATTER;
    }



    /**
     * make the ghost chase pacman. called by the scatterchase instance
     * @param {*} noReverse sometimes chase needs to be called without the reverse instruction
     *                      i.e. when frigthen state ends
     */
    chase(noReverse) {
        if (!this.isEaten) {
            if (!noReverse) {
                this.reverse();
            }
            this.mode = Ghost.MODE_CHASE;
            this.animation = Ghost.ANIM_SCATTER_CHASE;
            this.targetTile = this.calculateTargetTile();
        }
    }
    get isChasing() {
        return this.mode == Ghost.MODE_CHASE;
    }


    /**
     * called when pacman eats this ghost
     */
    eaten() {
        //ghost hides for a moment while a score sprite is displayed in its place
        this.hide();
        this.stop();
        this.mode = Ghost.MODE_EATEN;
        this.targetTile = Ghost.HOUSE_DOOR;
        this.animation = Ghost.ANIM_EATEN;
    }
    get isEaten() {
        return this.mode == Ghost.MODE_EATEN;
    }


    /**
     * direct the ghost to leave the house. if they are not already home
     * point the ghost in the direction of the exit point (x axis first)
     * and slowly migrate to the LEAVE_TARGET
     */
    leaveHouse() {
        if (this.isHome) {
            //turn and face exit point immediately
            if (this.position.x > Ghost.LEAVE_TARGET.x) {
                this.direction = Vector.LEFT;
            } else if (this.position.x < Ghost.LEAVE_TARGET.x) {
                this.direction = Vector.RIGHT;
            } else if (this.position.y > Ghost.LEAVE_TARGET.y) {
                this.direction = Vector.UP;
            }
            //ghost's status updated to leaving home
            this.status = Ghost.STATUS_LEAVE_HOME;
        }
    }
    get isReadyToLeaveHouse() {
        return this.isHome && this.pelletCounter >= this.pelletLimit;
    }
    get isHome() {
        return this.status == Ghost.STATUS_HOME;
    }
    get isEnteringHome() {
        return this.status == Ghost.STATUS_ENTER_HOME;
    }
    get isLeavingHome() {
        return this.status == Ghost.STATUS_LEAVE_HOME;
    }



    /**
     * these are the global cases for setting a ghost's target tile. the specific
     * target tile calculations of each respective ghosts are made in their subclass
     */
    calculateTargetTile() {
        if (this.isScattering) {
            return this.scatterTargetTile;
        } else if (this.isFrightened) {
            return this.scatterTargetTile; //this doesn't matter since turns are random, just need a value
        } else if (this.isEaten) {
            return Ghost.HOUSE_DOOR;
        }
    }


    /**
     * one (half) tick of the game. this is where the meat of the ghosts' game mechanics lies. this tells
     * the ghost how to move based on its location, mode, and status. for instance, if the ghost is 
     * leaving home, it's pointed to the LEAVE_TARGET and gradually moves there with each tick of the game.
     */
    tick() {

        if (!this.scene.maze) {
            Actor.prototype.tick.call(this);
            return;
        }
        //update the target tile
        this.targetTile = this.calculateTargetTile();

        if (this.isHome) {
            //ghost is home in the ghost house
            //bounce up and down off walls when stuck in the house
            if (Math.ceil(this.position.y) <= 128) {
                this.direction = Vector.DOWN;
            } else if (Math.floor(this.position.y) >= 136) {
                this.direction = Vector.UP;
            }
        } else if (this.isEnteringHome) {
            //entering house - find this.houseTarget
            //go down and then over (if necessary) in that order
            if (this.position.y < this.houseTarget.y) {
                this.direction = Vector.DOWN;
            } else if (this.position.x < this.houseTarget.x) {
                this.direction = Vector.RIGHT;
            } else if (this.position.x > this.houseTarget.x) {
                this.direction = Vector.LEFT;
            } else {
                //back on the home target- turn back to ghost
                this.status = Ghost.STATUS_HOME;
                this.animation = Ghost.ANIM_SCATTER_CHASE;
                this.direction = Vector.UP;
                this.mode = this.scene.globalChaseMode;
                Ghost.NUM_EATEN--;
            }
        } else if (this.isLeavingHome) {
            if (!this.isEaten) {
                //leaving house - find leave target
                // go left/right first, then up in that order
                if (this.position.x > Ghost.LEAVE_TARGET.x) {
                    this.direction = Vector.LEFT;
                } else if (this.position.x < Ghost.LEAVE_TARGET.x) {
                    this.direction = Vector.RIGHT;
                } else if (this.position.y > Ghost.LEAVE_TARGET.y) {
                    this.direction = Vector.UP;
                } else {
                    //made it out of the house, patrol time
                    this.status = Ghost.STATUS_PATROL;
                    this.direction = Vector.LEFT;
                    this.exitingHouse = true;
                    //if there was a reverse instruction given when in the house, queue it up next
                    if (this.reverseInstruction) {
                        this.nextInstruction = Vector.RIGHT;
                        delete this.reverseInstruction;
                    } else {
                        this.nextInstruction = Vector.LEFT;
                    }
                    if (!this.isFrightened) {
                        //inherit the current scatter/chase mode
                        this.mode = this.scene.globalChaseMode;
                    }
                }
            } else {
                //got eaten on the way out of the house, go back inside
                this.status = Ghost.STATUS_ENTER_HOME;
            }
        } else if (this.isTileCenter && !this.madeInstruction) {
            //hit the center of a tile. time to execute the next turn/instruction
            //made instruction is important here because if a ghost is on center
            //tile for more than one tick, we don't want to re-calc an instruction
            this.madeInstruction = true;    //clear this after leaving tileCenter
            // execute pending instruction
            if (this.reverseInstruction) {
                //check validity of move, if not valid, go back in the previous direction
                var nextTile = Vector.add(this.tile, this.reverseInstruction);
                if (this.scene.mazeClass.isWallTile(nextTile)) {
                    this.nextInstruction = Vector.inverse(this.lastDirection);
                } else {
                    this.nextInstruction = Vector.clone(this.reverseInstruction);
                }
                delete this.reverseInstruction;
            }
            this.lastDirection = Vector.clone(this.direction);
            this.direction = Vector.clone(this.nextInstruction);
            // look ahead to next tile and calculate next instruction from there
            var nextTile = Vector.add(this.tile, this.direction),
                futureTile = Vector.add(nextTile, this.direction);
            if (this.scene.mazeClass.isDecisionTile(nextTile) || this.scene.mazeClass.isWallTile(futureTile)) {
                this.nextInstruction = this.calculateNextInstruction(nextTile);
            }
            if (!this.nextInstruction) {
                //the above did not generate a valid move. could happen due to a reverse instruction at an inopportune time
                //calculate a next move from this tile, or just keep the current direction
                var nextDirection = this.calculateNextInstruction(this.tile) || this.direction;
                this.nextInstruction = Vector.clone(nextDirection);
            }
        } else {
            if (!this.isTileCenter) {
                //off center tile, unset the madeInstruction flag
                this.madeInstruction = false;
            }
            //below is an eaten ghost in search of home
            if (this.isEaten && !this.isEnteringHome) {
                //eaten ghost looking for entrance to house
                if (Vector.equals(this.position, Ghost.LEAVE_TARGET)) {
                    //found entrance, time to go in
                    this.direction = Vector.DOWN;
                    this.status = Ghost.STATUS_ENTER_HOME;
                }
            } else if (this.exitingHouse) {
                //now that the ghost has popped out of the house, make sure its y position is snapped to the maze lane
                this.y = ((this.tile.y - 1) * 8) + 4;
                this.exitingHouse = false;
            }
        }
        Actor.prototype.tick.call(this);

    }


    /**
     * the interesting thing here is that the ghosts telegraph their turn a few pixels
     * before the execute the turn. the draw method takes into account a pending instruction
     * and moves the ghost's eyes in that direction while it is patrolling the maze.
     */
    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        //figure out texture sheet offsets then draw
        var context = this.context, //canvas 2d context for drawing
            animation = this.animation,
            directionalOffsetX = 0, //could potentially share these values with pacman 
            offsetY = 0;
        //non-frighten animations move eyes in the nextDirection. ghosts' eyes move first before they make a turn
        if (!this.isFrightened) {
            offsetY = this.textureOffsetY;
            var eyes;
            if (this.isHome || this.isLeavingHome) {
                //eyes agree with the ghosts direction
                eyes = this.direction;
            } else if (this.madeInstruction || this.nextInstruction.reverse) {
                //eyes should agree with direction
                eyes = this.direction;
            } else {
                //eyes look in the ghost's next move direction
                eyes = this.nextInstruction || this.direction;
            }
            //add an x offset to the textureX to point eyes frames
            if (eyes.x == -1) {
                directionalOffsetX = 32;
            } else if (eyes.y == -1) {
                directionalOffsetX = 64;
            } else if (eyes.y == 1) {
                directionalOffsetX = 96;
            }
            //get the eyes only
            if (this.mode == Ghost.MODE_EATEN) {
                offsetY = 0;
                directionalOffsetX /= 2;
            }
        }
        //draw to canvas
        context.drawImage(RESOURCE.pacman,
            animation.textureX + directionalOffsetX + (animation.curFrame * this.width), 
            animation.textureY + offsetY, this.width, this.height, //clip from source
            this.x, this.y, this.width, this.height
        );
    }

    /**
     * these strings represent the amount of pixels a ghost should move per half tick during
     * a period of 16 ticks (two updates per tick).  this.frameCtr keeps track of the position in the speed control
     * string. this.frameCtr gets incremented in tick() each executed (unfrozen) frame
     * 
     */
    get speedControl() {

        try {
            if (this.isEaten) {
                return '11111111111111111111111111111111';
            } else if (this.isHome||this.isLeavingHome) {
                return '00010001000100010001000100010001';
            } else if (this.inTunnel) {
                //tunnel, home
                if (this.scene.level == 1) {
                    return '00100010001000100010001000100010';
                } else if (this.scene.level <= 4) {
                    return '01001000001001000010001010010001';
                } else {
                    return '10010010001001001001001000100100';
                }
            } else if (this.isFrightened) {
                //frightened
                if (this.scene.level == 1) {
                    return '10010010001001001001001000100100';
                } else if (this.scene.level <= 4) {
                    return '10010010001001000010010101001001;'
                } else if (this.scene.level <= 20) {
                    return '00100101001001010010010100100101';
                } else {
                    //not used, no frigthen state at these levels
                    return '01001000001001000010001010010001';
                }
            } else if (this.elroy == 1) {
                //elroy 1 - Blinky only
                if (this.scene.level == 1) {
                    return '10101010101010101010101010101010';
                } else if (this.scene.level <= 4) {
                    return '11010101011010101101010101101010';
                } else {
                    return '01101101011011010110110101101101';
                }
            } else if (this.elroy == 2) {
                //elroy 2 - Blinky only
                if (this.scene.level == 1) {
                    return '101010100110101001010101110101010';
                } else if (this.scene.level <= 4) {
                    return '101101011001011010101011011011010';
                } else {
                    return '101101100110110101101101110110110';
                }
            }
        } catch (ex) {
            //scene is not part of a maze, is scripted
            console.log(ex)
        }

        //normal patrol
        if (this.scene.level == 1) {
            return '10101010001010100101010101010101';
        } else if (this.scene.level <= 4) {
            return '10101010011010100101010111010101';
        } else if (this.scene.level <= 20) {
            return '11010110010110101010110110110101';
        } else {
            return '11010110010110101010110110110101';
        }
    }
}/**
 * Blinky is a special ghost. He appears in the pac-man cut scenes with his own
 * animations. he also has a "cruise elroy" state where he speeds up when there
 * are few pellets left on the maze.
 */
class Blinky extends Ghost {
    //extra animations for cut scenes
    static ANIM_RIP = 4;
    static ANIM_PATCH = 5;
    static ANIM_NAKED = 6;
    
    constructor(scene, x, y) {
        super(scene, x, y);
        this.name = 'Blinky';
        //since blinky doesn't start in the house, need to assign him a target inside
        this.houseTarget = { x: 13 * 8, y: 16.5 * 8 };
        this.startDirection = Vector.LEFT;
        this.scatterTargetTile = { x: 25, y: 0 };
        this.textureOffsetY = 0;
        //add some extra animations for the pacman cut scenes
        this.animations = this.animations.concat([ 
            //rip sheet animation for cut scene 2
            { frames: 2, ticksPerFrame: 70, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 112 },
            //patched sheet --use direction offset cutscene 3
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 112 },
            //naked cutscene 3
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 128 }
        ]);
        this.reset();
    }


    /**
     * blinky starts outside of the house on reset
     */
    reset() {
        Ghost.prototype.reset.call(this);
        this.status = Ghost.STATUS_PATROL;
    }


    /**
     * in ms pac-man blinky starts each level in random scatter mode
     */
    get randomScatter() {
        return this.scene.scatterChase.randomScatter;
    }

    /**
     * Blinky targets pacman directly
     */
    calculateTargetTile() {
        if (this.isChasing) {
            return Vector.clone(this.scene.pacman.tile);
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }


    /**
     * blinky should always leave home immediately
     */
    tick() {
        if (this.isHome) {
            this.leaveHouse()
        }
        Ghost.prototype.tick.call(this)
    }


    draw() {
        if (this.currentAnimation == Blinky.ANIM_NAKED) {
            //this is for the third cutscene of pacman. just update animation without any maze logic
            Sprite.prototype.draw.call(this);
            var animation = this.animation;
            this.context.drawImage(RESOURCE.pacman,
                animation.textureX + (animation.curFrame * 32), animation.textureY, 32, this.height, //clip from source
                this.position.x-16, this.position.y, 32, this.height
            );
        } else {
            Ghost.prototype.draw.call(this);
        }
    }


    /**
     * Blinky has a "cruise elroy state" where his speed increases slightly when 
     * there are few dots left in the maze.
     * 
     */
    get elroy() {
        if (this.scene.pelletsLeft > 0) {
            if (this.scene.pelletsLeft <= this.elroy2PelletsLeft) {
                return 2;
            } else if (this.scene.pelletsLeft <= this.elroy1PelletsLeft) {
                return 1;
            }
        }
        return 0;
    }


    /**
     * elroy1 threshold is double elroy2
     */
    get elroy1PelletsLeft() {
        return this.elroy2PelletsLeft * 2;
    }
    get elroy2PelletsLeft() {
        if (this.scene.level == 1) {
            return 10;
        } else if (this.scene.level == 2) {
            return 15;
        } else if (this.scene.level <= 5) {
            return 20;
        } else if (this.scene.level <= 8) {
            return 25;
        } else if (this.scene.level <= 11) {
            return 30;
        } else if (this.scene.level <= 14) {
            return 40;
        } else if (this.scene.level <= 18) {
            return 50;
        } else {
            return 60;
        }
    }
}class Pinky extends Ghost {
    constructor(scene, x ,y) {
        super(scene, x, y);
        this.name = 'Pinky';
        this.startDirection = Vector.DOWN;
        this.textureOffsetY = 16;
        this.scatterTargetTile = { x: 2, y: 0 };
        this.reset();
    }

    /**
     * in ms pac-man pinky starts each level in random scatter mode
     */
    get randomScatter() {
        return this.scene.scatterChase.randomScatter;
    }

    /**
     * Pinky targets four tiles in front of the pacman in pacman's direction of travel. Also
     * takes into account a bug with the targeting scheme in the original arcade game.
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var pacmanDirection = this.scene.pacman.direction,
                targetTile = Vector.clone(this.scene.pacman.tile);
            targetTile.x += (pacmanDirection.x * 4)
            targetTile.y += (pacmanDirection.y * 4);
            //emulate the overflow bug in the original arcade game where if pacman is moving up, target tile also moves left 4 tiless
            if (pacmanDirection.y < 0) {
                targetTile.x -= 4;
            }
            return targetTile;
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }
}class Inky extends Ghost {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.name = 'Inky';
        this.startDirection = Vector.UP;
        this.textureOffsetY = 32;
        this.scatterTargetTile = { x: 27, y: 35 };
        this.reset();
    }

    /**
     * inky leave the ghost house after 30 pellets eaten on level 1 only
     */
    get pelletLimit() {
        return this.scene.level==1?30:0;
    }


    /**
     * inky looks two tiles in front of pacman, draws a vector from blinky to that spot and doubles it
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var blinkyTile = this.scene.ghosts.Blinky.tile,
                pacmanTile = this.scene.pacman.tile,
                pacmanDirection = this.scene.pacman.direction,
                targetTile = { 
                    x: pacmanTile.x + (pacmanDirection.x * 2), 
                    y: pacmanTile.y + (pacmanDirection.y * 2) 
                };
            //emulate overflow bug where if pacman is moving up, target tile also moves left 2 tiless
            if (pacmanDirection.y < 0) {
                targetTile.x -= 2;
            }
            this.ptile = Vector.clone(targetTile);
            //now draw a vector from blinky to that target and double the length to get new target
            targetTile.x += (targetTile.x - blinkyTile.x);
            targetTile.y += (targetTile.y - blinkyTile.y);
            return targetTile;
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }

}class Clyde extends Ghost {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.name = 'Clyde';
        this.startDirection = Vector.UP;
        this.textureOffsetY = 48;
        this.scatterTargetTile = { x: 0, y: 35 };
        this.reset();
    }

    /**
     * Clyde leaves the house after 60 pellets are eaten on level 1
     * and after 50 on level 2
     */
    get pelletLimit() {
        if (this.scene.level == 1) {
            return 60;
        } else if (this.scene.level == 2) {
            return 50;
        }
        return 0;
    }

    /**
     * Clyde will target pacman directly when more than 8 tiles away from him. if he
     * gets closer than that, he will target his scatter tile
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var pacmanTile = this.scene.pacman.tile,
                distance = Vector.distance(this.tile, pacmanTile);
            if (distance > 8) {
                // target pacman tile
                return Vector.clone(pacmanTile);
            } else {
                // move to scatter target
                return this.scatterTargetTile;
            }
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }
}/**
 * this class dictates to the scene which scatter or chase phase the
 * ghosts should be in at a given moment. basically a glorified timer.
 * the durations of each scatter/chase phase are dependent on the 
 * current level
 */
class ScatterChase {
    constructor(scene){
        this.scene = scene;
        this.reset();
     }

     /**
      * phase 0 scatter in ms pacman is random movements for pinky and blinky
      */
     get randomScatter() {
        return Game.GAME_MODE == Game.GAME_MSPACMAN && this.phase == 0 &&  this.phaseTimesRemaining.scatter > 0;
    }

    /**
     * reset the phase and timers
     */
    reset() {
        this.phase = 0;
        this.setTimers();
        this.suspended = false;
        this.scene.globalChaseMode = GameScene.MODE_SCATTER;
    }

    /**
     * set the countdowns for the current phase
     */
    setTimers() {
        var phaseTimes = this['phase'+this.phase];
        this.phaseTimesRemaining = {
            scatter: phaseTimes.scatter,
            chase: phaseTimes.chase,
        };
    }

    /**
     * progress to the next phase in the sequence. replenish countdowns
     * 
     */
    nextPhase() {
        this.phase++;
        this.setTimers();
    }

    /**
     * scatter/chase suspends when ghosts are frightened
     */
    suspend() {
        this.suspended = true;
    }
    resume() {
        this.suspended = false;
    }

    get phase0() {
        //phase 0 timer appears to start slightly before maze characters move/update
        return {
            scatter: this.scene.level<=4?420:300, //7 else 5 seconds
            chase: 1200 //20 seconds
        }
    }
    get phase1() {
        //same as phase0
        return this.phase0;
    }

    get phase2() {
        var chase;
        if (this.scene.level == 1) {
            chase = 1200; //20 sec
        } else if (this.scene.level <= 4)
            chase = 61980; //1033 seconds
        else {
            chase = 62220; //1037 seconds
        }
        return {
            scatter: 420, //7 seconds
            chase: chase
        }
    }
    get phase3() {
        return {
            scatter: this.scene.level==1?420:1, //7 else 1/60 sec
            chase: Infinity  //forever
        }
    }

    tick() {
        //don't count down if scatter/chase is suspended
        if (this.suspended) return;

        //check scatter timeleft first
        if (this.phaseTimesRemaining.scatter > 0) {
            //continue scattering
            this.phaseTimesRemaining.scatter--;;
            if (this.phaseTimesRemaining.scatter == 0) {
                //scatter phase complete, start chasing
                this.scene.globalChaseMode = GameScene.MODE_CHASE;
                this.scene.ghosts.forEach(ghost => ghost.chase());
            }
        } else if (this.phaseTimesRemaining.chase > 0) {
            //chase mode happening
            this.phaseTimesRemaining.chase--;
            if (this.phaseTimesRemaining.chase == 0) {
                //enter next phase
                this.nextPhase();
                this.scene.globalChaseMode = GameScene.MODE_SCATTER;
                this.scene.ghosts.forEach(ghost => ghost.scatter());
            }
        }
    }
}class Pellet extends Sprite {
    constructor (scene, x, y) {
        super(scene, x, y, 8, 8);
        this.points = 10;
        this.pellet = true;
    }
    
    get pelletColor() {
        return this.color||(this.scene.maze||{}).pelletColor || "#fcb4aa";
    }

    get hitBox() {
        return {x: this.x + 3, y: this.y + 3, w: 2, h: 2}
    }

    draw () {
        if (this.hidden) return;
        //doesn't animate, just draw
        var context = this.context;
        context.beginPath();
        context.fillStyle = this.pelletColor;
        context.fillRect(this.x + 3, this.y + 3, 2, 2);
        context.fill();

        // context.beginPath();
        // context.lineWidth = 1;
        // context.strokeStyle = "#FF0000";
        // var tile = this.hitBox;
        // context.strokeRect(tile.x, tile.y, tile.w, tile.h);

    }
}/**
 * The big pellet. Energizes pacman and frightens/reverses the ghost when eaten
 */
class Energizer extends Pellet {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.animations = [
            //on texture coords. this will just be a flashing circle
            {frames: 2, ticksPerFrame: 10, curFrame: 0, curFrameTicks: 0}
        ];
        this.points = 50;
        this.pellet = false;
        this.energizer = true;
    }

    draw() {
        if (this.hidden) return;
        //animate this thing
        Sprite.prototype.draw.call(this);
        //since energizers flash, only draw when animation frame is 0
        //there is no sprite sheet / texture involved here
        if (this.animation.curFrame == 0) {
            //draw energizer on the canvas
            var context = this.context;
            context.fillStyle = this.pelletColor;
            // drawing a circle anti-aliases on canvas. doesn't fit aesthetic.. use rectangles
            context.fillRect(this.x + 1, this.y + 1, 6, 6);
            context.fillRect(this.x, this.y + 2, 8, 4);
            context.fillRect(this.x + 2, this.y, 4, 8);
            context.fill();
        }
    }
}/**
 * Ms Pacman fruit behaves quite differently from Pacman fruit. It enters through
 * a random tunnel, makes its way toward the center of the maze, does one loop
 * around the ghost house and then chooses a random tunnel to exit through.
 */
class MsPacmanFruit extends Actor {
    static MODE_ENTER = 0;
    static MODE_LOOP = 1;
    static MODE_EXIT = 2;

    //this is a point inside the ghost house that causes the fruit to do the lap 
    //around the house when targeted
    static HOUSE_TARGET = { x: 13, y: 18 };

    constructor(scene) {
        super(scene, -16, -16, 16, 16);
        this.fruit = true;
        this.level = this.scene.level;
        if (this.level > 7) {
            //after level 7, randomly choose fruit
            this.level = Math.floor(Math.random() * 7);
        }
        this.textureOffset = { x: 504, y: 0 };
        //the fruit bounces up and down as it moves. this counter keeps track of that bounce
        this.bounceCtr = 0;
        //fruit enters through one of 2 or 4 set paths (depending on maze)
        this.mode = MsPacmanFruit.MODE_ENTER;
        this.enterSequence = this.scene.maze.chooseRandomFruitEntry();
        //place at spawn point
        this.x = this.enterSequence[0].x * 8;
        this.y = this.enterSequence[0].y * 8;
        this.direction = this.x < 1 ? Vector.RIGHT : Vector.LEFT;
        this.x -= this.direction.x * 4; //nudge off the screen
        //skip the first tile in the sequence which is the spawn point (a warp tile)
        this.turn = 1;
        this.targetTile = this.enterSequence[this.turn];
    }

    get speedControl() {
        return '00100010001000100010001000100010';
    }

    get hitBox() {
        return { x: this.x + 4, y: this.y + 4, w: 8, h: 8 }
    }

    get points() {
        return [100,200,500,700,1000,2000,5000][this.level-1];
    }

    eaten() {
        delete this.scene.fruit;
    }

    get isExiting() {
        return this.mode == MsPacmanFruit.MODE_EXIT;
    }
    get isEntering() {
        return this.mode == MsPacmanFruit.MODE_ENTER;
    }
    get isLooping() {
        return this.mode == MsPacmanFruit.MODE_LOOP;
    }
    get isDone() {
        return this.mode == MsPacmanFruit.MODE_DONE;
    }

    tick() {
        Actor.prototype.tick.call(this);        
        if (!this.frozen) {
            this.bounceCtr++;
            //play bounce sound when fruit hits the "floor"
            if (this.bounceCtr%8 == 0) {
                Sound.playOnce('fruit_bounce');
            }
        }
        
        if (this.isTileCenter && !this.madeInstruction) {
            if (this.isEntering && Vector.equals(this.tile, this.enterSequence[this.turn])) {
                if (this.turn < this.enterSequence.length - 1) {
                    this.targetTile = this.enterSequence[++this.turn];
                } else {
                    //mark this- once a full loop is made, choose an exit sequence
                    this.loopTarget = Vector.clone(this.targetTile);
                    //recycle this counter for the exit sequence
                    this.turn = 0;
                    //start looping
                    this.mode = MsPacmanFruit.MODE_LOOP;
                    //target ghost house
                    this.targetTile = MsPacmanFruit.HOUSE_TARGET;
                }
                this.madeInstruction = true;
            } else if (this.isLooping && Vector.equals(this.tile, this.loopTarget)) {
                //completed a lap around the ghost house now
                //randomly choose an exit sequence
                this.exitSequence = this.scene.maze.chooseRandomFruitExit();
                this.mode = MsPacmanFruit.MODE_EXIT;
                this.targetTile = this.exitSequence[this.turn];
                if (Vector.equals(this.targetTile, this.tile)) {
                    //already on the exit point. go to next in sequence
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && Vector.equals(this.tile, this.targetTile)) {
                //made it to the next target of the exit sequence
                if (this.turn < this.exitSequence.length - 1) {
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && (this.tile.x < 0 || this.tile.x > 27)) {
                //fruit has left the building, delete it from the scene
                delete this.scene.fruit;
            }
            //navigate the maze
            var centerPoint = this.centerPixel,
                nextPixel = { x: centerPoint.x + this.direction.x * 5, y: centerPoint.y + this.direction.y * 5 },
                testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };

            //this move would hit a wall, try to continue in same direction of travel
            if (this.scene.mazeClass.isWallTile(testTile) || this.scene.mazeClass.isHouseTile(testTile) || this.scene.mazeClass.isDecisionTile(this.tile)) {
                this.direction = this.calculateNextInstruction(this.tile);
                this.madeInstruction = true;
            }
        } else {
            if (!this.isTileCenter) {
                //off tile center, clear the last instruction
                delete this.madeInstruction;
            }
        }
    }

    draw() {
        Actor.prototype.draw.call(this);
        var offsetX = (this.level - 1) * 16,
            offsetBounce = 1.5 * Math.sin((this.bounceCtr / 16) * Math.PI) - 0.5;  //bounce the fruit up and down
        this.context.drawImage(RESOURCE.mspacman,
            this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
            this.x, this.y + offsetBounce, 16, 16
        );
    }
}/**
 * Pacman only fruit. This fruit doesn't do anything except spawn at the same
 * place in the maze, twice per maze, and hang around for 9.33 to 10 seconds
 */
 class PacmanFruit extends Sprite {
    static POINTS = [100, 300, 500, 700, 1000, 2000, 3000, 5000];
    static getFruitIndex(level) {
        switch(level) {
            case 1:
                return 0;     //cherry
            case 2: 
                return 1;     //strawberry
            case 3:
            case 4:
                return 2;     //orange
            case 5:
            case 6:
                return 3;     //apple
            case 7:
            case 8:
                return 4;    //melon
            case 9:
            case 10:
                return 5;    //galaxian boss
            case 11:
            case 12:
                return 6;    //bell
            default:
                return 7;    //keys
        }
    }

    constructor (scene) {
        super(scene, 13*8, 19.5*8, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 488, y: 48};
        //half ticks because fruit is updated twice per tick
        this.halfTicksToLive = 2 * 60 * ((Math.random() * (2/3)) + (28/3));   //10ish second timer (should be random between 9.33333 and 10)
        this.fruit = true;
    }

    /**
     * amount of points this fruit is worth
     */
    get points() {
        return PacmanFruit.POINTS[PacmanFruit.getFruitIndex(this.scene.level)];
    }

    get hitBox() {
        return {x: this.position.x + 6, y: this.position.y, w: 2, h: 8}
    }

    /**
     * returns true if hitbox intersects with pacman's hitbox
     * @param {*} pacman duh
     */
    collide(pacman) {
        return (pacman.centerPixel.x <= this.hitBox.x+this.hitBox.w && pacman.centerPixel.x >= this.hitBox.x && 
                pacman.centerPixel.y <= this.hitBox.y+this.hitBox.h && pacman.centerPixel.y >= this.hitBox.y);
    }

    /**
     * the fruit was eaten, leave it for dead
     */
    eaten() {
        this.halfTicksToLive = 0;
    }

    /**
     * count down half ticks until it's time to remove the fruit
     */
    tick() {
        this.halfTicksToLive--;
        if (this.halfTicksToLive < 0) {
            //delete self from board
            delete this.scene.fruit;
        }
    }

    draw() {
        if (this.halfTicksToLive > 0) {
            var offsetX = PacmanFruit.getFruitIndex(this.scene.level) * 16;
            this.context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
                this.x, this.y, 16, 16  
            );
        }
    }
}/**
 * Game class creates a canvas and fires up a game loop.
 */
class Game {
    //pacman cannot die!
    static GOD_MODE = false;
    // static GOD_MODE = true;

    //skip cutscenes
    static SKIP_CUTSCENES = false;
    // static SKIP_CUTSCENES = false;

    //pacman can't run out of lives
    // static PRACTICE_MODE = true;
    static PRACTICE_MODE = false;

    //which game mode is being played
    static GAME_PACMAN = 0;
    static GAME_MSPACMAN = 1;
    static GAME_MODE = 0; //pacman

    //credits to play.. for fun I guess
    static CREDITS = 0;

    //last game's scores for each player and each game mode
    static LAST_SCORES = [
        [0,null],   //pacman
        [0,null]    //mspacman
    ];

    //used of local storage doesn't work
    static TEMP_HIGH_SCORE = 0;

    /**
     * retrieve the current high score
     * @param {*} mode game mode
     */
    static getHighScore(mode) {
        try {
            return parseInt(localStorage['highscore_' + mode]||'0');
        } catch(ex) {
            //if localStorage not available, just take the last high score
            var oldHigh =  Math.max(...this.LAST_SCORES[mode]),
                high = Math.max(oldHigh, this.TEMP_HIGH_SCORE);
            return high;
        }
    }

    /**
     * check to set a new high score
     * @param {*} mode  game mode
     * @param {*} score score of the game
     */
    static setHighScore(mode, score) {
        try {
            localStorage['highscore_' + mode] = score;
        } catch(ex) {
            //localStorage not available
        } finally {
            this.TEMP_HIGH_SCORE = Math.max(this.TEMP_HIGH_SCORE, score);
        }
    }

    /**
     * 
     * @param {*} el element to attach the canvas to. defaults to document.body
     * @param {int} scale how many times larger to make the screen. default is 2
     */
    constructor(el, scale) {
        this.el = (el?document.getElementById(el):document.body)||document.body;

        //pause controls. space bar will pause/unpause the game. see Input.js
        this.pauseGame = false;
        this.wasPaused = false;

        //create the canvas and scale it so it's not so tiny
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d'),
        this.scale = scale || 2.0;
        this.canvas.width = 224*this.scale;
        this.canvas.height = 288*this.scale;
        
        //turn off antialiasing on the scaling
        this.context.webkitImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.imageSmoothingEnabled = false;
        this.context.scale(this.scale, this.scale)
        
        //draw black background on canvas
        this.canvas.style.background = 'black';
        this.canvas.style.border = 'solid';
        this.el.appendChild(this.canvas);

        //set up scene manager with credits scene as initial scene
        SceneManager.pushScene(new CreditsScene(this.context));

        //start game loop
        this.fpsLimit = 60;
        this.previousDelta = 0;
        window.requestAnimationFrame((d)=>this.loop(d));
    }



    /**
     * the game loop. where the magic happens
     */
    loop(currentDelta) {
        //lock to ~60fps
        var delta = currentDelta - this.previousDelta;

        if (this.fpsLimit && delta < 1000 / this.fpsLimit) {
            window.requestAnimationFrame((d)=>this.loop(d));
            return;
        }

        //if not paused, play the action
        if (!this.pauseGame) {
            Input.watch();
            SceneManager.update();  
        }

        //deal with sound engine when pausing
        if (this.pauseGame && !this.wasPaused) {
            Sound.suspend();
        } else if (!this.pauseGame && this.wasPaused) {
            Sound.resume();
        }
        this.wasPaused = this.pauseGame;

        //request another frame to continue the game loop
        window.requestAnimationFrame((d)=>this.loop(d));
        this.previousDelta = currentDelta;
    }
}
//MS PACMAN


//great guide!!
//https://gamefaqs.gamespot.com/arcade/583976-ms-pac-man/faqs/1298
//http://spyhunter007.com/the_1983_ms_pacman_bozeman_montana_think_tank.htm
//https://www.retrogamer.net/retro_games80/the-making-of-ms-pac-man/


//AI papers
// http://www.cs.nott.ac.uk/~pszgxk/papers/cig2010.pdf
// http://lisc.mae.cornell.edu/LISCpapers/TCIAGGregModelBasedPacmanJune2017.pdf
// https://www.researchgate.net/publication/221157530_A_simple_tree_search_method_for_playing_Ms_Pac-Man


//these will be set when player picks a game mode    
var TitleScene, StartScene, CutScene1, CutScene2, CutScene3, LevelSprite, PacClass, Points, Fruit;    //these will be set when player picks a game mode    

//load resources (sprite sheets)
var RESOURCE = {
    mspacman: new Image(),
    pacman: new Image(),
    text: new Image()
}
RESOURCE.mspacman.src = 'res/mspacman/mspacman.png';
RESOURCE.pacman.src = 'res/pacman/pacman.png';
RESOURCE.text.src = 'res/text.png';

var GAME = new Game(null, 2);