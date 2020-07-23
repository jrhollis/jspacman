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
        this.oneUpLabel = new Text(this, "1UP", 'white', 3*8, 0);
        this.highScoreLabel = new Text(this, "HIGH SCORE", 'white', 9*8, 0);
        this.highScoreText = new Text(this, this.highScore, 'white', 16*8, 8, 'right');
        this.twoUpLabel = new Text(this, "2UP", 'white', 22*8, 0);
        this.playerLabel = new Text(this, 'PLAYER ONE', 'blue', 9*8, 14*8);
        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.creditLabel.hide();
        this.credits = new Text(this, ""+Game.CREDITS, 'white', 9*8, 35*8, 'right');
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
        for (var i = 0; i < this.numPlayers; i++){
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

    get pelletsEaten() {
        var totalPellets = this.mazeClass.tiles.filter(t => t.pellet).length + this.mazeClass.tiles.filter(t => t.energizer).length;
        return totalPellets - this.pelletsLeft;
    }

    get pelletsLeft() {
        return this.pellets.length + this.energizers.length;
    }

    get highScore() {
        var score = parseInt(localStorage['highscore_' + Game.GAME_MODE]||'0');
        return !score?"":score;
    }

    loadPlayer(player) {
        this.curPlayer = player;
        this.pacman = this.players[player];
        this.playerLabel.text = 'PLAYER ' + (!player?"ONE":"TWO");
        this.level = this.pacman.level;
        if (this.level < 1) {
            this.level = 1;
            this.pacman.level = 1;
            this.nextLevel(true); //only play song on first ever start
        } else {
            //load in cached pellets
            this.pellets = this.pacman.pellets;
            this.energizers = this.pacman.energizers;
            this.resetLevel();
        }
    }

    nextLevel(newGame) {
        Sound.resetSiren();
        this.levelStarting = true;
        this.maze = Maze.getMaze(this);
        this.mazeClass = this.maze.constructor;

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
                this.pacman.lives--;
                this.nextLevel();
            });
        } else {
            this.readyText.show();
            this.resetLevel();
            this.useGlobalPelletLimit = false;
        }
    }

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

        this.energizers.forEach(e => {
            e.freeze();
        });
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
        //hack to catch copy actual game... need to address this
        this.scatterChase.tick();
        this.scatterChase.tick();
    }


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
                if (this.level == 2) {
                    SceneManager.pushScene(new CutScene1(this.context));
                } else if (this.level == 5) {
                    SceneManager.pushScene(new CutScene2(this.context));
                } else if (this.level == 9) {
                    SceneManager.pushScene(new CutScene3(this.context));
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

        //don't freeze eyes when freeze timer is on
        var updateGhostsLater = this.ghosts.filter(ghost => !(ghost.isEaten && !ghost.hidden));
        if (!this.levelComplete) {
            for (var i = 0; i < 2; i++) {
                this.ghosts.filter(ghost => ghost.isEaten && !ghost.hidden).forEach(ghost => ghost.tick());
            }
        }
        
        if (this.freezeTimer.tick()) {
            Sound.stop('siren');
            return;
        }
        if (this.levelComplete || this.levelStarting) {
            Sound.stopAll();
            return;
        }

        //sound check - if there are retreating ghosts play retreat
        if (this.pacman.isAlive) {
            if (Ghost.NUM_EATEN > 0) {
                Sound.stop('power_pellet');
                Sound.playLoop('retreating');
            } else {
                Sound.stop('retreating');
                if (Ghost.NUM_FRIGHTENED > 0) {
                    Sound.stop('siren');
                    Sound.playLoop('power_pellet');
                } else {
                    Sound.stop('power_pellet');
                    Sound.playLoop('siren');
                }
            }
        }

        if (this.eatenGhosts.length) {
            //who'd pacman eat last tick
            this.eatGhost(this.eatenGhosts.pop());
            return;
        }

        if (this.pacman.isDead) {
            this.freezeTimer.start(60, () => {
                var otherPlayer = (this.curPlayer+1)%this.numPlayers;
                if (this.pacman.lives < 0) {
                    //gloabls updates
                    Game.LAST_SCORES[Game.GAME_MODE][this.curPlayer] = this.pacman.score;
                    Game.CREDITS--;
                    //game over for this player
                    if (this.numPlayers == 2) {
                        //if two players and other player has lives, show playerlabel text
                        if (this.players[otherPlayer].lives >= 0) {
                            this.playerLabel.text = "PLAYER " + (this.curPlayer?"TWO":"ONE");
                            this.playerLabel.show();
                            this.gameOverText.show();
                            this.freezeTimer.start(90, () => {
                                this.gameOverText.hide();
                                this.loadPlayer(otherPlayer);
                            });
                            return; //not done yet
                        }
                    }
                    this.gameOverText.show();

                    //show the credits before exiting game scene
                    this.creditLabel.show();
                    this.credits.text = ""+Game.CREDITS;
                    this.credits.show();

                    this.freezeTimer.start(60, () => {
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
                    //only one player or one player left
                    this.resetLevel();
                }
            });
            return;
        }

        //update behavior
        this.scatterChase.tick();

        //update the frighten timers if they're running
        this.frightenTimer.tick();
        this.frightenFlashTimer.tick();

        //point sprites from fruit
        if (this.pointSprite) this.pointSprite.tick()

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
    }


    /**
     * called twice per tick. collision occurs between ghosts when pacman and
     * a ghost occupy the same tile. collision with items occurs when their
     * bboxes overlap
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
            //if center of pellet is in pacman hitbox, then eat
            if (this.pacman.collideItem(this.energizers[i])) {
                this.ateEnergizer = this.energizers[i];
                this.energizers.splice(i, 1);
                break;
            }
        }

        //fruit collision
        if (this.fruit && this.fruit.collide(this.pacman)) {
            //put a point sprite here
            this.pointSprite = new Points(this, this.fruit.position.x, this.fruit.position.y, this.fruit.points, 0);
            this.pacman.eatItem(this.fruit);
        }

        //ghosts with collision and/or free if personal pelletLimit is met
        for (var i = 0; i < this.ghosts.length; i++) {
            var ghost = this.ghosts[i]; //must be in a for-loop so we can break out if a ghost is eaten
            if (ghost.collide(this.pacman)) {
                if (ghost.isFrightened && !ghost.isEaten) {
                    //pac man eats a frightened ghost- pause game for 1 second and hide ghost+pacman to reveal score
                    this.eatenGhosts.push(ghost);
                    ghost.eaten();
                    // make sure two ghosts aren't eaten in the same frame.
                    // bail out here and wait until next frame to eat next ghost
                    return;
                } else if (!ghost.isEaten) {
                    // return; 
                    // //pac man dies. RIP pac man we hardly knew ye
                    this.ghosts.forEach(ghost => ghost.stop());
                    if (this.fruit && this.fruit.stop) this.fruit.stop(); //ms pacman
                    this.pacman.freeze();
                    this.pacman.stop();
                    Sound.stopAll();
                    this.freezeTimer.start(45, () => {
                        this.ghosts.forEach(ghost => ghost.hide());
                        this.pacman.die();
                    });
                }
            }
        }
    }


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

    //ghost functions
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
        var duration = this.pacman.energizedDuration.ticks,
            numFlashes = this.pacman.energizedDuration.flashes,
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


    eatGhost(ghost) {
        Sound.playOnce('eat_ghost');
        //when pacman eats a ghost, hide pacman and freeze other ghosts for a second
        this.pacman.hide();
        //immediately display the score
        this.ghostScore = new Points(this, ghost.position.x, ghost.position.y, this.numGhostsEaten, 1);
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


    eatPellet(pellet) {
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

        this.maze.draw();

        //draw hud
        this.scoreText[this.curPlayer].text = "" + (this.pacman.score || "00"); //update score
        this.highScoreText.text = ""+this.highScore; //update highscore text
        this.textSprites.forEach(t => t.draw());
        this.levelSprite.draw();
        this.livesSprite.draw();

        //draw point/score sprites
        if (this.pointSprite) this.pointSprite.draw();

        //draw items
        this.pellets.forEach(p => p.draw());
        this.energizers.forEach(e => e.draw());

        if (this.fruit) this.fruit.draw();

        //actors
        this.pacman.draw();
        this.ghosts.forEach(g => g.draw());

        if (this.ghostScore) this.ghostScore.draw();
    }
}