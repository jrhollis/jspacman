class PacmanTitleScene extends ScriptScene {
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
}