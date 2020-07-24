class MsPacmanCutScene2 extends ScriptScene {
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
}