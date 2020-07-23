class Maze {

    static getMazeIndex(scene) {
        //get the version of the maze based on the current level
        if (Game.GAME_MODE == Game.GAME_MSPACMAN) {
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
            //pacman always returns the same maze
            return 0;
        }
    }

    static getMaze(scene) {
        if (Game.GAME_MODE == Game.GAME_MSPACMAN) {
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

    isFruitReady() {
        //make sure a fruit isn't already on the board
        return this.fruitRelease.indexOf(this.scene.pelletsEaten) >= 0;
    }

    chooseRandomFruitEntry() {
        var cls = this.constructor,
            choice = Math.floor(Math.random() * cls.WARP_TILES.length);
        return [cls.WARP_TILES[choice]].concat(cls.ENTER_TARGETS[choice]);
    }

    chooseRandomFruitExit() {
        var cls = this.constructor,
            choice = Math.floor(Math.random() * cls.WARP_TILES.length);
        return cls.EXIT_TARGETS[choice].concat(cls.WARP_TILES[choice])
    }

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