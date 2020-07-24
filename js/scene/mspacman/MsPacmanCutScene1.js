//after level 2
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
}