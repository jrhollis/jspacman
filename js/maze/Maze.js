class Maze {

    static getMazeIndex(scene) {
        if (GAME_MODE == GAME_MSPACMAN) {
            if (scene.level <= 2) {
                return 0;
            } else if (scene.level <= 5) {
                return 1;
            } else if (scene.level <= 9) {
                return 2;
            } else if (scene.level <= 13) {
                return 3;
            } else if (scene.level == 14) {
                return 2;
            } else {
                //rotate based on level
                if (scene.level % 2) {
                    return 2;
                } else {
                    return 3;
                }
            }
        } else {
            return 0;
        }
    }

    static getMaze(scene) {
        if (GAME_MODE == GAME_MSPACMAN) {
            //based on level, create a maze instance and return it
            switch (Maze.getMazeIndex(scene)) {
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

    //create a node/edge graph representation of the maze. this will be used for path finding by the ai agents
    static generatePathGraph() {
        var directions = [Vector.UP, Vector.DOWN, Vector.LEFT, Vector.RIGHT];
        //inspect the maze- every intersection is a node
        //special cases 12,14 and 15,14 and 12,26 and 15,26, not decision tiles, but are intersections
        var nodes = {};
        //finally all the decision tiles are nodes 
        this.tiles.filter(t => t.decision).forEach((t) => {
            nodes[t.x + ',' + t.y] = {};
        });
        //"crawl" the maze from each node to generate path graph edge weights
        for (var coords in nodes) {
            var tile = { x: parseInt(coords.split(',')[0]), y: parseInt(coords.split(',')[1]) };
            //find the 3 or 4 open directions out from this node and travel along
            // the path until reaching another node
            for (var i = 0; i < directions.length; i++) {
                var tempTile = Vector.add(tile, directions[i]),
                    sceneTile = this.tileHash[tempTile.x + ',' + tempTile.y];
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
                if (this.tileHash[tileKey].walkable && !tileLookup[tileKey]) {
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
                    if (this.isWalkableTile(testTile)) {
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


    /**
     * load the data from the wallmap strings into datastructures
     */
    static initialize() {
        for (var i = 0; i < this.wallMap.length; i++) {
            var row = this.wallMap[i];
            for (var t = 0; t < row.length; t++) {
                var tile = new Tile(t, i, row[t])
                this.tiles.push(tile);
                this.tileHash[t + ',' + i] = tile;
            }
        }
    }

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
            return true;
        } else if (t.x > 27 && !this.isWallTile({ x: 27, y: t.y })) {
            return true;
        } else if (t.x < 0 || t.x > 27) {
            return false;
        }
    }

    static isWallTile(t) {
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
        this.fruitRelease = [70, 170];
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

    get frightenDuration() {
        var time = 0,
            level = this.scene.level,
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

    isFruitReady() {
        return this.fruitRelease.indexOf(this.scene.pelletsEaten) >= 0;
    }

    chooseRandomFruitEntry() {
        var choice = Math.floor(Math.random() * this.warpTiles.length);
        return [this.warpTiles[choice]].concat(this.enterTargets[choice]);
    }

    chooseRandomFruitExit() {
        var choice = Math.floor(Math.random() * this.warpTiles.length);
        return this.exitTargets[choice].concat(this.warpTiles[choice])
    }

    finish() {
        this.flashing = true; //mspacman only
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
                    this.complete = true;
                }
            }
            if (this.flashAnimation.curFrame % 2) {
                //show black and white version
                offsety = Maze.getMazeIndex(this.scene) * 248;
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
}