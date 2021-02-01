/**
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
}