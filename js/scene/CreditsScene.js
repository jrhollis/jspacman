class CreditsScene extends Scene {
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
}