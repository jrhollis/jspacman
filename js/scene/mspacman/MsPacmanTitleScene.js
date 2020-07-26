class MsPacmanTitleScene extends ScriptScene {
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
}