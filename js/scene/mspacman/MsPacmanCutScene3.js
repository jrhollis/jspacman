//after level 9
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
}