class Input {
    static lastKey = null;
    static buffer = [];
    static keyState = {};

    static reset() {
        Input.buffer = [];
    }

    static onKeyDown(e) {
        Input.keyState[''+e.keyCode] = 1;
        Input.lastKey = e.keyCode;
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            e.preventDefault();
            return false;
        }

        if (e.keyCode == 32) {
            pauseGame = !pauseGame;
            e.preventDefault();
            return false;
        }
        if (e.keyCode == 70) {
            pauseGame = true;
            //render next frame
            SceneManager.update();
            e.preventDefault();
            return false;
        }
        // console.log(e.keyCode)
        //read once
        if (!Input.keyDown) {
            Input.keyPress = e.keyCode;
        }
        Input.keyDown = true;
    }

    static onKeyUp(e) {
        delete Input.keyState[e.keyCode];
        delete Input.lastKey;
        Input.keyDown = false;
    }

    static watch() {
        //two frame delay- stop- change direction
        var nextDirection;
        if (Input.keyState['37']) {
            nextDirection = Vector.LEFT;
        } else if (Input.keyState['39']) {
            nextDirection = Vector.RIGHT;
        } else if (Input.keyState['38']) {
            nextDirection = Vector.UP;
        } else if (Input.keyState['40']) {
            nextDirection = Vector.DOWN;
        }
        Input.buffer.unshift(nextDirection);
        if (Input.buffer.length == 3) {
            Input.buffer.pop();
        }
    }


    static readKeyPress() {
        var k = this.keyPress;
        delete this.keyPress;
        return k;
    }


    static readBuffer() {
        if (Input.buffer.length == 2) {
            return Input.buffer[1];
        } else {
            return null;
        }
    }
}

//swallow the key strokes
document.onkeydown = Input.onKeyDown;
document.onkeyup = Input.onKeyUp;class Sound {
    static initialize() {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();

        this.loadSound('res/pacman/sfx.ogg').then(buffer => this.sfx_0 = buffer);
        this.loadSound('res/mspacman/sfx.ogg').then(buffer => this.sfx_1 = buffer);
    }

    //list of currently running sounds. used for stopAll()
    static playing = {}

    //time offsets for each sound effect in the sfx.ogg file
    static sfx = [{    //GAME_PACMAN res/pacman/sfx.ogg
        siren0: { start: 17.125, end: 17.504 },
        siren1: { start: 18.51595, end: 18.788359 },
        siren2: { start: 19.84, end: 20.134 },
        siren3: { start: 21.14, end: 21.3985 },
        retreating: { start: 22.399, end: 22.663 },
        power_pellet: { start: 23.852, end: 23.988 },
        intermission: { start: 25.255, end: 30.418 },
        die: { start: 2.692, end: 4.184 },
        munch0: { start: 5.315, end: 5.394 },
        munch1: { start: 6.443, end: 6.525 },
        game_start: { start: 36.570, end: 40.776 },
        eat_ghost: { start: 8.794, end: 9.301 },
        extra_life: { start: 10.387, end: 12.351 },
        eat_fruit: { start: 13.463, end: 13.846 },
        credit: { start: 14.380, end: 14.595 }
    }, {   //GAME_MSPACMAN res/pacman/sfx.ogg
        credit: { start: 1.111, end: 1.357 },
        game_start: { start: 3.087, end: 7.313 },
        siren0: { start: 50.562, end: 50.695 },
        siren1: { start: 52.118, end: 52.269 },
        siren2: { start: 53.576, end: 53.743 },
        siren3: { start: 54.824, end: 55.008 },
        munch0: { start: 48.396, end: 48.526 },
        munch1: { start: 48.396, end: 48.526 },
        power_pellet: { start: 56.990, end: 95.991 },
        retreating: { start: 99.063, end: 99.664 },
        extra_life: { start: 100.148, end: 102.137 },
        eat_fruit: { start: 103.146, end: 103.533 },
        eat_ghost: { start: 106.292, end: 106.795 },
        fruit_bounce: {start: 107.293, end: 107.496 },
        die: { start: 104.427, end: 105.567 },
        act1: { start: 9.889, end: 18.470 },
        act2: { start: 19.049, end: 40.421 },
        act3: { start: 41.195, end: 46.171 }
    }];


    //siren pointer. as pellets are eaten, the siren will change
    static siren = 0;
    static resetSiren() {
        this.siren = 0;
    }
    /**
     * determine which siren to play based on number of pellets remaining in maze.
     * when the siren is changed, the old siren must first be stopped.
     * @param {int} pelletsLeft 
     */
    static checkSiren(pelletsLeft) {
        if (pelletsLeft > 108) {
            this.setSiren(0);
        } else if (pelletsLeft > 44) {
            this.setSiren(1);
        } else if (pelletsLeft > 12) {
            this.setSiren(2);
        } else {
            this.setSiren(3);
        }
    }
    static setSiren(siren) {
        if (this.siren != siren) {
            //siren change
            this.stop('siren');
        }
        this.siren = siren;
    }

    //play a sfx in a loop
    static playLoop(fx) {
        if (fx == 'siren') {
            fx += this.siren;
        }
        //only play this clip once
        if (this.sfx[GAME_MODE][fx].source) return;
        this.playing[fx] = true;
        var source = this.context.createBufferSource();
        source.buffer = this['sfx_' + GAME_MODE];
        source.loop = true;
        var loop = this.sfx[GAME_MODE][fx];
        source.loopStart = loop.start;
        source.loopEnd = loop.end;
        source.connect(this.context.destination);
        source.start(0, loop.start);
        this.sfx[GAME_MODE][fx].source = source;
        source.addEventListener('ended', () => {
            delete this.sfx[GAME_MODE][fx].source;
            delete this.playing[fx];
        });
        return source;

    }

    //this counter is only for pacman. his sound fx flips back and forth each time he eats a pellet
    static munch = 0;

    //play a sfx one time
    static playOnce(fx) {
        if (fx == 'munch') {
            this.stop('munch');
            fx += this.munch;
            this.munch = (this.munch + 1) % 2;
        }
        if (this.sfx[GAME_MODE][fx].source) return;
        var source = this.context.createBufferSource();
        source.buffer = this['sfx_' + GAME_MODE];
        var clip = this.sfx[GAME_MODE][fx];
        source.connect(this.context.destination);
        source.start(0, clip.start, clip.end - clip.start);
        this.sfx[GAME_MODE][fx].playing = true;
        this.sfx[GAME_MODE][fx].source = source;
        source.addEventListener('ended', () => {
            delete this.sfx[GAME_MODE][fx].source;
        });
        return source;
    }

    //stop a currently-playing sfx
    static stop(fx) {
        if (fx == 'siren') {
            fx += this.siren;
        }
        if (this.sfx[GAME_MODE][fx] && this.sfx[GAME_MODE][fx].source) {
            this.sfx[GAME_MODE][fx].source.stop();
        }
    }

    //stop all currently playing sfx
    static stopAll() {
        for (var fx in this.playing) {
            this.stop(fx);
        }
    }

    static resume() {
        if (this.context)
            this.context.resume();
    }

    static suspend() {
        if (this.context)
            this.context.suspend();
    }


    static loadSound(url) {
        return new Promise((resolve, reject) => {
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.onload = () => {
                this.context.decodeAudioData(request.response, function (buffer) {
                    resolve(buffer)
                });
            }
            request.send();
        });
    }
}class Tile {
    //from Maze.wallMap
    //. = wall
    //0 = open, but nothing on it
    //1 = pellet
    //2 = pellet + decision
    //3 = energizer
    //4 = decision only
    //5 = tunnel
    //6 = house
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    get wall() {
        return this.type == '.';
    }
    get open() {
        return this.type == '0';
    }
    get pellet() {
        return this.type == '1' || this.type == '2';
    }
    get energizer() {
        return this.type == '3';
    }
    get tunnel() {
        return this.type == '5';
    }
    get house() {
        return this.type == '6';
    }
    get decision() {
        return this.type == '4' || this.type == '2';
    }
    get walkable() {
        return !this.house && !this.wall;
    }
}class Timer {
    constructor() {}

    start(ticks, callback, wait) {
        this.wait = wait;
        this.originalTicks = ticks;
        this.ticks = ticks; //one frame delay on starts
        this.callback = callback;
        if (ticks <= 0) {
            //started with no or negative time, just do the call back
            this.ticks = 0;
            this.callback.call(this);
        }
    }

    reset(ticks) {
        this.ticks = ticks||this.originalTicks; 
    }

    stop() {
        this.ticks = 0;
    }

    tick() {
        if (this.ticks > 0) {
            this.ticks--;
            if (this.ticks == 0) {
                //time is up
                this.callback.call(this);
            }
        }
        return this.wait || this.ticks > 0;
    }
}//represents an x, y pair. could be tile location, pixel locations, whatever
class Vector {
    static ZERO = {x: 0, y: 0};
    static LEFT = {x: -1, y: 0};
    static RIGHT = {x: 1, y: 0};
    static UP = {x: 0, y: -1};
    static DOWN = {x: 0, y: 1};
    static add(t1, t2) {
        return { x: t1.x + t2.x, y: t1.y + t2.y };
    }
    static distance(t1, t2) {
        return Math.sqrt(Math.pow(t1.x - t2.x, 2) + Math.pow(t1.y - t2.y, 2));
    }
    static inverse(v) {
        return { x: -v.x, y: -v.y };
    }
    static clone(v) {
        return { x: v.x, y: v.y };
    }
    static equals(v1, v2) {
        return v1.x==v2.x && v1.y == v2.y;
    }
}class Scene {
    constructor(context) {
        this.context = context;
    }
    
    tick() {}

    draw() {
        this.context.clearRect(0, 0, SCREEN.width, SCREEN.height);
    }
}class ScriptScene extends Scene {
    constructor(context, keyFrames) {
        super(context);
        this.keyFrames = keyFrames;
        this.ctr = 0;
    }

    tick() {
        this.ctr++;
        //if ctr > scene length
        var keyFrame = this.keyFrames[this.ctr];
        if (keyFrame == 'loop') {
            //start over
            this.ctr = 0;
            keyFrame = this.keyFrames[this.ctr];
        }
        if (keyFrame == 'end') {
            SceneManager.popScene();
        } else if (keyFrame) {
            keyFrame.call(this);
        }
    }

}class SceneManager {
    static stack = [];

    static pushScene(scene) {
        this.stack.push(scene);
    }

    static popScene() {
        this.stack.pop();
    }

    static replaceScene(scene) {
        this.popScene();
        this.pushScene(scene);
    }

    static currentScene() {
        if (this.stack.length) {
            return this.stack[this.stack.length-1]
        } else {
            return null;
        }
    }

    static update() {
        Input.watch();
        var scene = this.currentScene();
        if (scene) {
            scene.tick();
            scene.draw();    
        }
    }
}class CreditsScene extends Scene {
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
            if (GAME_MODE == GAME_PACMAN) {
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
        
        if ((Input.lastKey == 38 || Input.lastKey == 40) && this.canSelectGame) {
            GAME_MODE = (GAME_MODE + 1) % 2;
            this.canSelectGame = false;
        } else if (!Input.lastKey) {
            this.canSelectGame = true;
        }

        if (GAME_MODE == GAME_PACMAN) {
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
}class GameScene extends Scene {

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
        this.credits = new Text(this, ""+CREDITS, 'white', 9*8, 35*8, 'right');
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

        this.curPlayer = 0;
        this.scoreText = [
            this.scoreOneText,
            this.scoreTwoText
        ]
        //level will get incremented in nextLevel call at end of constructor
        this.level = 1;
        //pellet arrays
        this.pellets = [];
        this.energizers = [];
        //determine number of players chosen then load the first one
        this.numPlayers = numPlayers;
        this.players = [];
        for (var i = 0; i < this.numPlayers; i++){
            var pacman = new PacClass(this, 13.125 * 8, 25.5 * 8);
            pacman.level = -i;   //second player at level (not zero) so there's no beginning song and dance
            pacman.lives = 3-i; //start with three lives for first player only
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
        var score = parseInt(localStorage['highscore_' + GAME_MODE]||'0');
        return !score?"":score;
    }

    loadPlayer(player) {
        this.curPlayer = player;
        //if this players[player].lives <= 0, then try other player
        this.pacman = this.players[player];
        this.playerLabel.text = 'PLAYER ' + (!player?"ONE":"TWO");
        this.level = this.pacman.level;
        if (this.level < 1) {
            var newGame = !this.level;
            this.level = 1;
            this.pacman.level = 1;
            this.nextLevel(newGame); //only play song on first ever start
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
        this.tickCount = 0;
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
            this.energizers.forEach(e => {
                e.unfreeze();
            });
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
        this.tickCount++;

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
                    LAST_SCORES[GAME_MODE][this.curPlayer] = this.pacman.score;
                    CREDITS--;
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
                    this.credits.text = ""+CREDITS;
                    this.credits.show();

                    this.freezeTimer.start(60, () => {
                        if (!CREDITS) {
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
            this.lastPelletEatenTimer.reset();
            this.atePellet = false;
            this.ateEnergizer = false;
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

        this.pacman.hide();
        this.ghostScore = new Points(this, ghost.position.x, ghost.position.y, this.numGhostsEaten, 1);
        this.ghosts.forEach(g => {
            if (g != ghost && !g.isEaten) {
                g.freeze();
            }
        });
        this.freezeTimer.start(60, () => {
            Ghost.NUM_EATEN++;
            Ghost.NUM_FRIGHTENED--;
            ghost.show();
            ghost.start();
            this.pacman.show();
            delete this.ghostScore;
            this.ghosts.forEach(g => g.unfreeze());
        });
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

        //check to see if eating this pellet triggers a fruit release
        if (this.maze.isFruitReady()) {
            this.fruit = new Fruit(this);
        }

        //check the house to see if ghosts are ready to leave
        if (this.useGlobalPelletLimit) {
            if (this.globalPelletCounter == 7) {
                this.ghosts.Pinky.leaveHouse();
            } else if (this.globalPelletCounter == 17) {
                this.ghosts.Inky.leaveHouse();
            } else if (this.globalPelletCounter == 32) {
                if (this.ghosts.Clyde.inHome) {
                    //stop using the global dot limit and use personal dot counters again
                    this.useGlobalPelletLimit = false;
                }
                this.ghosts.Clyde.leaveHouse();
            }
        } else {
            //check to see if ghosts need to be let free because of personal dot limit
            this.releaseNextGhost('pellet');
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        this.oneUpLabel.flash = this.curPlayer == 0;
        this.twoUpLabel.flash = this.curPlayer == 1

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
}//after level 2
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
        ]
    }

    get bounce() {
        //cycle twice
        return [
            [1,1],[0,0],[1,1],[0,0],[0,0],[1,0],[0,0],[1,0],[0,-1],[1,0],[0,-1],[0,0],[1,0],[0,0]
        ]
    }
    

    tick() {
        ScriptScene.prototype.tick.call(this);
        for (var i = 0; i < 2; i++) {
            this.pacman.tick();
            this.mspacman.tick();
            this.inky.tick();
            this.pinky.tick();
        }
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
        this.drawables.forEach(d => d.draw());
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
}class MsPacmanCutScene2 extends ScriptScene {
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
            1110: () => {
                this.pacman.direction = {x: 5, y: 0};
                this.pacman.x = -1.5 * 8;
                this.pacman.y = 28.5 * 8;
            },
            1125: () => {
                this.mspacman.direction = {x: 5, y: 0};
                this.mspacman.x = -1.5 * 8;
                this.mspacman.y = 28.5 * 8;
            },
            1350: 'end'
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
    }
    

    tick() {
        ScriptScene.prototype.tick.call(this);
        for (var i = 0; i < 2; i++) {
            this.pacman.tick();
            this.mspacman.tick();
        }
    }

    draw() {
        ScriptScene.prototype.draw.call(this)
        this.drawables.forEach(d => d.draw());
        if (this.take) {
            var takeOffset = (this.take-1) * 32,
                context = this.context;
            context.drawImage(RESOURCE.mspacman,
                456 + takeOffset, 208, 32, 32, (6*8) + 2, (13*8) + 1, 32, 32
            );    
        }
    }
}//after level 9
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
        this.drawables.forEach(d => d.draw());
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
}class MsPacmanStartScene extends Scene {
    constructor(context) {
        super(context);
        this.p1HighScoreP2 = new Text(this, "1UP   HIGH SCORE   2UP", 'white', 3*8, 0);
        this.highScoreText = new Text(this, localStorage['highscore_1'], 'white', 16*8, 8, 'right');
        this.scoreOneText = new Text(this, ""+(LAST_SCORES[1][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, ""+LAST_SCORES[1][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!LAST_SCORES[1][1]) {
            this.scoreTwoText.hide();
        }

        this.pushStartButton = new Text(this, "PUSH START BUTTON", 'orange', 5*8, 16*8);
        this.onePlayerOnly = new Text(this, "1 PLAYER ONLY", 'orange', 7*8, 18*8);
        this.twoPlayers = new Text(this, "1 OR 2 PLAYERS", 'orange', 7*8, 18*8);
        // this.twoPlayers.hide();
        this.bonusPacman = new Text(this, "ADDITIONAL    AT 10000 pts", 'orange', 1*8, 24*8);
        this.copyright = new Text(this, "c MIDWAY MFG CO", 'red', 10*8, 29*8);
        this.dates = new Text(this, "1980/1981", 'red', 13*8, 31*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+CREDITS, 'white', 9*8, 35*8, 'right');
    }

    tick() {
        var keyPress = Input.readKeyPress();
        if (CREDITS > 0 && keyPress == 13) { //enter
            SceneManager.replaceScene(new GameScene(this.context, 1));
            return;
        } else if (CREDITS > 1 && keyPress == 50) { //#2
            SceneManager.replaceScene(new GameScene(this.context, 2));
            return;
        } else if (keyPress == 27) {
            //go back
            SceneManager.popScene();
            return;
        } else if (keyPress == 16) {
            CREDITS++;
            Sound.playOnce('credit');
        }

        this.credits.text = ""+CREDITS;
        if (CREDITS > 1) {
            this.twoPlayers.show();
            this.onePlayerOnly.hide();
        } else {
            this.twoPlayers.hide();
            this.onePlayerOnly.show();
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        this.p1HighScoreP2.draw();
        this.highScoreText.draw();
        this.scoreOneText.draw();
        this.scoreTwoText.draw();

        this.pushStartButton.draw();
        this.onePlayerOnly.draw();
        this.twoPlayers.draw();
        this.bonusPacman.draw();
        this.copyright.draw();
        this.dates.draw();

        context.drawImage(RESOURCE.mspacman,
            472, 0, 16, 16, 12*8, 23*8, 16, 16
        );
        context.drawImage(RESOURCE.mspacman,
            456, 248, 32, 32, 5*8, 28*8, 32, 32
        );


        //credits
        this.creditLabel.draw();
        this.credits.draw();
    }
}class MsPacmanTitleScene extends ScriptScene {
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
        this.highScoreText = new Text(this, localStorage['highscore_1'], 'white', 16*8, 8, 'right');
        this.scoreOneText = new Text(this, ""+(LAST_SCORES[1][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, ""+LAST_SCORES[1][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!LAST_SCORES[1][1]) {
            this.scoreTwoText.hide();
        }

        this.msPacmanTitle = new Text(this, '"MS PAC-MAN"', 'orange', 10*8, 7*8);


        // this.twoPlayers.hide();
        this.copyright = new Text(this, "c MIDWAY MFG CO", 'red', 10*8, 29*8);
        this.dates = new Text(this, "1980/1981", 'red', 13*8, 31*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+CREDITS, 'white', 9*8, 35*8, 'right');

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
            CREDITS++;
            Sound.playOnce('credit');
            SceneManager.pushScene(new MsPacmanStartScene(this.context));
            return;
        } else if (keyPress == 27) {
            //esc key -- go back
            SceneManager.popScene();
            return;
        }
        this.credits.text = ""+CREDITS;
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
        this.scoreOneText.text = ""+(LAST_SCORES[1][0]||"00");
        this.scoreTwoText.text = ""+LAST_SCORES[1][1]||"00";
        if (LAST_SCORES[1][1]) {
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
        context.drawImage(RESOURCE.mspacman,
            456, 248, 32, 32, 5*8, 28*8, 32, 32
        );

        this.ghosts.forEach(g => g.draw());
        this.mspacman.draw();
        this.creditLabel.draw();
        this.credits.draw();
    }
}//after level 2
class PacmanCutScene1 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {

                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_NORMAL;
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.blinky.hide();
                this.blinky.status = Ghost.STATUS_PATROL;
                this.blinky.mode = Ghost.MODE_CHASE;
                this.blinky.animation = Ghost.ANIM_SCATTER_CHASE;
                this.blinky.direction = Vector.LEFT;
                this.blinky.nextInstruction = Vector.LEFT;
                this.blinky.position = Vector.clone(this.blinky.startPosition);
                this.blinky.stop();
            },
            100: () => {
                Sound.playOnce('intermission')


                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();

                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },
            310: () => {
                this.pacman.stop();
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_GIANT;
            },
            325: () => {
                this.blinky.stop();
                this.blinky.hide();
            },
            375: () => {
                this.blinky.direction = Vector.RIGHT;
                this.blinky.frighten();
                this.blinky.show();
                this.blinky.start();
            },
            430: () => { Sound.playOnce('intermission'); },
            540: () => {
                this.pacman.direction = Vector.RIGHT;
                this.pacman.y -= 16;
                this.pacman.show();
                this.pacman.start();
            },
            722: () => {
                this.blinky.stop();
                this.blinky.hide();
            },
            751: () => {
                this.pacman.hide();
                this.pacman.stop();
            },
            850: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.levelSprite = new PacmanLevelSprite(this);
        this.level = 2;
        this.pelletsLeft = 1; //engage cruise elroy 2
    }
    

    tick() {
        ScriptScene.prototype.tick.call(this);
        for (var i = 0; i < 2; i++) {
            this.pacman.tick();
            this.blinky.tick();
        }
    }

    draw() {
        ScriptScene.prototype.draw.call(this)
        this.pacman.draw();
        this.blinky.draw();
        this.levelSprite.draw();
    }
}//after level 5 https://www.youtube.com/watch?v=v8BT43ZWSTY
class PacmanCutScene2 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.rip = 0;
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_NORMAL;
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.blinky.hide();
                this.blinky.status = Ghost.STATUS_PATROL;
                this.blinky.mode = Ghost.MODE_CHASE;
                this.blinky.animation = Ghost.ANIM_SCATTER_CHASE;
                this.blinky.direction = Vector.LEFT;
                this.blinky.nextInstruction = Vector.LEFT;
                this.blinky.position = Vector.clone(this.blinky.startPosition);
                this.blinky.stop();

            },
            100: () => {
                Sound.playOnce('intermission');
                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();
            },

            175: () => {
                //here comes blinky
                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },

            290: () => {
                //exit stage: pacman
                this.pacman.stop();
                this.pacman.hide();
            },
            288: () => {
                //slow the ghost
                this.blinky.stop();
            },
            304: () => {
                this.blinky.x -= 1;
                this.rip = 1;
            },
            310: () => {
                this.blinky.x -= 1;
            },
            316: () => {
                this.blinky.x -= 1;
            },
            322: () => {
                this.blinky.x -= 1;
                this.rip = 2;
            },
            328: () => {
                this.blinky.x -= 1;
            },
            334: () => {
                this.blinky.x -= 1;
            },
            340: () => {
                this.blinky.x -= 1;
            },
            346: () => {
                this.blinky.x -= 1;
            },
            352: () => {
                this.blinky.x -= 1;
                this.rip = 3;
                this.blinky.freeze();
            },
            400: () => {
                this.rip = 4;
                this.blinky.x -= 1;
                this.blinky.direction = Vector.RIGHT;
                this.blinky.nextInstruction = Vector.RIGHT;
                this.blinky.animation = Blinky.ANIM_RIP;
                this.blinky.unfreeze();
            },
            430: () => { Sound.playOnce('intermission'); },
            520: () => {
                this.blinky.freeze();
            },
            599: () => {
                Sound.stop('intermission');
            },
            600: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.levelSprite = new PacmanLevelSprite(this);
        this.level = 5;

    }

    tick() {
        ScriptScene.prototype.tick.call(this);
        for (var i = 0; i < 2; i++) {
            this.pacman.tick();
            this.blinky.tick();
        }
    }

    draw() {
        ScriptScene.prototype.draw.call(this)
        this.pacman.draw();
        //draw the nail
        context.drawImage(RESOURCE.pacman,
            584, 96, 16, 16, 14*8, (19.5*8)-1, 16, 16
        );
        if (this.rip) {
            context.drawImage(RESOURCE.pacman,
                600 + ((this.rip-1) * 16), 96, 16, 16, 14*8, (19.5*8)-1, 16, 16
            );    
        }
        this.blinky.draw();
        this.levelSprite.draw();
    }}//after level 9
class PacmanCutScene3 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.rip = 0;
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_NORMAL;
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.blinky.hide();
                this.blinky.status = Ghost.STATUS_PATROL;
                this.blinky.mode = Ghost.MODE_CHASE;
                this.blinky.animation = Blinky.ANIM_PATCH;
                this.blinky.direction = Vector.LEFT;
                this.blinky.nextInstruction = Vector.LEFT;
                this.blinky.position = Vector.clone(this.blinky.startPosition);
                this.blinky.stop();

            },
            100: () => {
                Sound.playOnce('intermission');
                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();
            },

            120: () => {
                //here comes blinky
                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },

            290: () => {
                //exit stage: pacman
                this.pacman.stop();
                this.pacman.hide();
            },

            320: () => {
                //exit stage: pacman
                this.blinky.stop();
                this.blinky.hide();
            },

            400: () => {
                this.blinky.animation = Blinky.ANIM_NAKED;
                this.blinky.direction = Vector.RIGHT;
                this.blinky.nextInstruction = Vector.RIGHT;
                this.blinky.show();
                this.blinky.start();
            },
            430: () => { Sound.playOnce('intermission'); },
            582: () => {
                this.blinky.hide();
                this.blinky.stop();
            },
            629: () => { Sound.stop('intermission'); },
            630: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.levelSprite = new PacmanLevelSprite(this);
        this.level = 9;
        this.pelletsLeft = 1;

    }

    tick() {
        ScriptScene.prototype.tick.call(this);
        for (var i = 0; i < 2; i++) {
            this.pacman.tick();
            this.blinky.tick();
        }
    }

    draw() {
        ScriptScene.prototype.draw.call(this)
        this.pacman.draw();
        this.blinky.draw();
        this.levelSprite.draw();
    }
}class PacmanStartScene extends Scene {
    constructor(context) {
        super(context);
        this.p1HighScoreP2 = new Text(this, "1UP   HIGH SCORE   2UP", 'white', 3*8, 0);
        this.highScoreText = new Text(this, localStorage['highscore_0'], 'white', 16*8, 8, 'right');
        this.scoreOneText = new Text(this, ""+(LAST_SCORES[0][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, ""+LAST_SCORES[0][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!LAST_SCORES[0][1]) {
            this.scoreTwoText.hide();
        }

        this.pushStartButton = new Text(this, "PUSH START BUTTON", 'orange', 5*8, 16*8);
        this.onePlayerOnly = new Text(this, "1 PLAYER ONLY", 'blue', 7*8, 20*8);
        this.twoPlayers = new Text(this, "1 OR 2 PLAYERS", 'blue', 7*8, 20*8);
        this.bonusPacman = new Text(this, "BONUS PAC-MAN FOR 10000 pts", 'peach', 1*8, 24*8);
        this.copyright = new Text(this, "c 1980 MIDWAY MFG.CO.", 'pink', 4*8, 28*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+CREDITS, 'white', 9*8, 35*8, 'right');
    }

    tick() {
        var keyPress = Input.readKeyPress();
        if (CREDITS > 0 && keyPress == 13) { //enter
            SceneManager.replaceScene(new GameScene(this.context, 1));
            return;
        } else if (CREDITS > 1 && keyPress == 50) { //#2
            SceneManager.replaceScene(new GameScene(this.context, 2));
            return;
        } else if (keyPress == 27) {
            //go back
            SceneManager.popScene();
            return;
        } else if (keyPress == 16) {
            CREDITS++;
            Sound.playOnce('credit');
        }

        this.credits.text = ""+CREDITS;
        if (CREDITS > 1) {
            this.twoPlayers.show();
            this.onePlayerOnly.hide();
        } else {
            this.twoPlayers.hide();
            this.onePlayerOnly.show();
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        this.p1HighScoreP2.draw();
        this.highScoreText.draw();
        this.scoreOneText.draw()
        this.scoreTwoText.draw();

        this.pushStartButton.draw();
        this.onePlayerOnly.draw();
        this.twoPlayers.draw();
        this.bonusPacman.draw();
        this.copyright.draw();

        //credits
        this.creditLabel.draw();
        this.credits.draw();
    }
}class PacmanTitleScene extends ScriptScene {
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
        this.scoreOneText = new Text(this, ""+(LAST_SCORES[0][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        //if there's a score_two_pacman
        this.scoreTwoText = new Text(this, ""+LAST_SCORES[0][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!LAST_SCORES[0][1]) {
            this.scoreTwoText.hide();
        }
        this.highScoreText = new Text(this, localStorage['highscore_0'], 'white', 16*8, 8, 'right');
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
        this.credits = new Text(this, ""+CREDITS, 'white', 9*8, 35*8, 'right');


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
            CREDITS++;
            Sound.playOnce('credit');
            SceneManager.pushScene(new PacmanStartScene(this.context));
            return;
        } else if (keyPress == 27) {
            //go back
            SceneManager.popScene();
            return;
        }

        ScriptScene.prototype.tick.call(this);
        this.credits.text = ""+CREDITS;

        if (this.pauseUpdatesTimer.tick()) {
            return;
        }

        //two updates per tick for actors
        for (var i = 0; i < 2; i++) {
            this.a_ghosts.forEach(g => {
                g.tick();
            });

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
                    this.ghostScore = new PacmanPoints(this, g.position.x, g.position.y, this.ghostsEaten)
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
        this.scoreOneText.text = ""+(LAST_SCORES[0][0]||"00");
        this.scoreTwoText.text = ""+LAST_SCORES[0][1]||"00";
        if (LAST_SCORES[0][1]) {
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
}class Maze {

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
}class MsPacman1 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.111111..1111111111..111111.', //4
        '.3....1..1........1..1....3.', //5
        '.1....1..1........1..1....1.', //6
        '.11211211211211211211211211.', //7
        '...1..1.....1..1.....1..1...', //8
        '...1..1.....1..1.....1..1...', //9
        '...1..1.....1..1.....1..1...', //10
        '5552..1112111..1112111..2555', //11
        '...1.....0........0.....1...', //12
        '...1.....0........0.....1...', //13
        '...2000004000000004000002...', //14
        '...1.....0...66...0.....1...', //15
        '...1.....0.666666.0.....1...', //16
        '...1..0004.666666.4000..1...', //17
        '...1..0..0.666666.0..0..1...', //18
        '...1..0..0........0..0..1...', //19
        '5552000..0004004000..0002555', //20
        '...1........0..0........1...', //21
        '...1........0..0........1...', //22
        '...2111112000..0002111112...', //23
        '...1.....1........1.....1...', //24
        '...1.....1........1.....1...', //25
        '.11211211211200211211211211.', //26
        '.1....1.....1..1.....1....1.', //27
        '.1....1.....1..1.....1....1.', //28
        '.1....1..1111..1111..1....1.', //29
        '.3....1..1........1..1....3.', //30
        '.1....1..1........1..1....1.', //31
        '.11111211211111111211211111.', //32
        '............................', //33
        '............................'  //34
    ];

    static tiles = [];
    static tileHash = {};

    constructor(board) {
        super(board, RESOURCE.mspacman);

        this.pelletColor = '#dedffe';

        //release a fruit at these many pellets eaten (including energizers)
        this.fruitRelease = [64, 172];

        //warp tiles (could find these programmatically)
        this.warpTiles = [
            {x: -1, y: 10.5},
            {x: -1, y: 19.5},
            {x: 28, y: 10.5},
            {x: 28, y: 19.5}
        ];

        //fruit entrance sequences
        this.enterTargets = [
            [{x: 9, y: 11},{x: 9, y: 14}], //upper left
            [{x: 4, y: 26}, {x: 18, y: 26}, {x: 15, y: 20}], //lower left
            [{x: 24, y: 20}, {x: 18, y: 17}], //upper right
            [{x: 22, y: 23}, {x: 15, y: 20}] //lower right
        ];

        //fruit exit sequences
        this.exitTargets = [
            [{x: 9, y: 14}], //upper left
            [{x: 12, y: 20}, {x: 10, y: 23}], //lower left
            [{x: 15, y: 20}, {x: 18, y: 23}], //upper right
            [{x: 15, y: 20}, {x: 18, y: 23}] //lower right
        ];
    }

    get textureOffset() {
        //depends on level
        var pacman = this.scene.pacman;
        if (this.scene.level <= 1 && (pacman.lives >= 2 || (!pacman.isAlive && pacman.lives == 1))) {
            return {x: 0, y: 992};
        } else {
            return {x: 228, y: 0};
        }
    }

}
//inherit statics and load map
Object.assign(MsPacman1, Maze);
MsPacman1.initialize();class MsPacman2 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '5555555..1111111111..5555555', //4
        '......0..1........1..0......', //5
        '......0..1........1..0......', //6
        '.311112112111..111211211113.', //7
        '.1.......1..1..1..1.......1.', //8
        '.1.......1..1..1..1.......1.', //9
        '.1..111112..1..1..211111..1.', //10
        '.1..1....0..1111..0....1..1.', //11
        '.1..1....0........0....1..1.', //12
        '.111211..0........0..112111.', //13
        '......1..4000000004..1......', //14
        '......1..0...66...0..1......', //15
        '.111112..0.666666.0..211111.', //16
        '.1....1..0.666666.0..1....1.', //17
        '.1....2004.666666.4002....1.', //18
        '.111..1..0........0..1..111.', //19
        '...1..1..0040000400..1..1...', //20
        '...1..1....0....0....1..1...', //21
        '...1..1....0....0....1..1...', //22
        '...211211112....211112112...', //23
        '...1.......1....1.......1...', //24
        '...1.......1....1.......1...', //25
        '5552111..1120000211..1112555', //26
        '...1..1..1........1..1..1...', //27
        '...1..1..1........1..1..1...', //28
        '.311..2112111..1112112..113.', //29
        '.1....1.....1..1.....1....1.', //30
        '.1....1.....1..1.....1....1.', //31
        '.11111211111211211111211111.', //32
        '............................',
        '............................'
      // 0123456789012345678901234567 
    ];

    static tiles = [];
    static tileHash = {};

    constructor(board) {
        super(board, RESOURCE.mspacman);
        
        this.pelletColor = '#e1df31';
        this.textureOffset = {x: 228, y: 248};
        this.fruitRelease = [64, 174];

        //warp tiles (could find these programmatically)
        this.warpTiles = [
            {x: -1, y: 3.5},
            {x: -1, y: 25.5},
            {x: 28, y: 3.5},
            {x: 28, y: 25.5}
        ];

        //fruit entrance sequences
        this.enterTargets = [
            [{x: 9, y: 14}], //upper left
            [{x: 4, y: 23}, {x: 16, y: 25}, {x: 16, y: 20}], //lower left
            [{x: 18, y: 17}], //upper right
            [{x: 22, y: 23}, {x: 16, y: 20}] //lower right
        ];

        //fruit exit sequences
        this.exitTargets = [
            [{x: 9, y: 17}, {x: 9, y: 7}, {x: 6, y: 6}], //upper left --
            [{x: 14, y: 26}, {x: 11, y: 25}, {x: 8, y: 23}], //lower left
            [{x: 18, y: 23}, {x: 23, y: 13}, {x: 26, y: 13}], //upper right --
            [{x: 18, y: 23}] //lower right --
        ];
    }
}
//inherit statics and load map data
Object.assign(MsPacman2, Maze);
MsPacman2.initialize();class MsPacman3 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.111111111..1111..111111111.', //4
        '.1.......1..1..1..1.......1.', //5
        '.3.......1..1..1..1.......3.', //6
        '.1..111212112..211212111..1.', //7
        '.1..1..1....1..1....1..1..1.', //8
        '.1112..1....1..1....1..2111.', //9
        '....1..1....1..1....1..1....', //10
        '....1..11211211211211..1....', //11
        '02112....0........0....21120', //12
        '.1..0....0........0....0..1.', //13
        '.1..00400400000000400400..1.', //14
        '.1....0..0...66...0..0....1.', //15
        '.1....0..0.666666.0..0....1.', //16
        '.200400..0.666666.0..004002.', //17
        '.1..0....0.666666.0....0..1.', //18
        '.1..0....0........0....0..1.', //19
        '.1..00400400400400400400..1.', //20
        '.1....0.....0..0.....0....1.', //21
        '.1....0.....0..0.....0....1.', //22
        '.112112..1111..1111..211211.', //23
        '...1..1..1........1..1..1...', //24
        '...1..1..1........1..1..1...', //25
        '.311..2112112002112112..113.', //26
        '.1....1.....1..1.....1....1.', //27
        '.1....1.....1..1.....1....1.', //28
        '.211112..1111..1111..211112.', //29
        '.1....1..1........1..1....1.', //30
        '.1....1..1........1..1....1.', //31
        '.111111..1111111111..111111.', //32
        '............................',
        '............................'
      // 0123456789012345678901234567  
    ];

    static tiles = [];
    static tileHash = {};

    constructor(board) {
        super(board, RESOURCE.mspacman);
        
        //warp tiles (could find these programmatically)
        this.warpTiles = [
            {x: -1, y: 11.5},
            {x: -1, y: 11.5},
            {x: 28, y: 11.5},
            {x: 28, y: 11.5}
        ];

        //fruit entrance sequences- are there only two entry sequences
        this.enterTargets = [
            [{x: 10, y: 14}], // left
            [{x: 10, y: 14}], // left
            [{x: 26, y: 14}, {x: 16, y: 20}], // right
            [{x: 26, y: 14}, {x: 16, y: 20}] // right
        ];

        //fruit exit sequences are there only two exit sequences?
        this.exitTargets = [
            [{x: 12, y: 20}, {x: 8, y: 26}, {x: 1, y:23}], // left
            [{x: 12, y: 20}, {x: 8, y: 26}, {x: 1, y:23}], // left
            [{x: 15, y: 20}, {x: 19, y: 26}, {x: 18, y: 17}], // right
            [{x: 15, y: 20}, {x: 19, y: 26}, {x: 18, y: 17}] // right
        ];
    }


    get isAlternateVersion() {
        return !(this.level <= 13 || (this.level > 14 && !((this.level - 1) % 4)));
    }

    get pelletColor() {
        if (!this.isAlternateVersion) { 
            return '#fc0d1b';
        } else {
            return '#2dfffe';
        }
    }

    get textureOffset() {
        //depends on level
        if (!this.isAlternateVersion) { 
            // level 17, 19, 23, etc
            return {x: 228, y: 248*2};
        } else { 
            // alt color level 14, 15, 19, 23
            return {x: 228, y: 248*4};
        }
    }
}
//inherit statics and load map data
Object.assign(MsPacman3, Maze);
MsPacman3.initialize();class MsPacman4 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.11121111211111111211112111.', //4
        '.1..1....1........1....1..1.', //5
        '.3..1....1........1....1..3.', //6
        '.1..1....1..1111..1....1..1.', //7
        '.1..112112..1..1..211211..1.', //8
        '.1....1..1..1..1..1..1....1.', //9
        '.1....1..1..1..1..1..1....1.', //10
        '.112111..1112..2111..111211.', //11
        '...1........0..0........1...', //12
        '...1........0..0........1...', //13
        '...2111..0004004000..1112...', //14
        '...0..1..0...66...0..1..0...', //15
        '0000..1..0.666666.0..1..0000', //16
        '......2004.666666.4002......', //17
        '......1..0.666666.0..1......', //18
        '0000..1..0........0..1..0000', //19
        '...0..1..0004004000..1..0...', //20
        '...2112.....0..0.....2112...', //21
        '...1..1.....0..0.....1..1...', //22
        '...1..1112004..4002111..1...', //23
        '...1.....1..0..0..1.....1...', //24
        '...1.....1..0..0..1.....1...', //25
        '.112112112..0000..211211211.', //26
        '.1....1..1........1..1....1.', //27
        '.1....1..1........1..1....1.', //28
        '.1..111..1112112111..111..1.', //29
        '.3..1.......1..1.......1..3.', //30
        '.1..1.......1..1.......1..1.', //31
        '.111211111111..111111112111.', //32
        '............................',
        '............................'
      // 0123456789012345678901234567  
    ];

    static tiles = [];
    static tileHash = {};

    constructor(board) {
        super(board, RESOURCE.mspacman);
        
        //warp tiles (could find these programmatically)
        this.warpTiles = [
            {x: -1, y: 15.5},
            {x: -1, y: 18.5},
            {x: 28, y: 15.5},
            {x: 28, y: 18.5}
    ];

        // fruit entrance sequences
        this.enterTargets = [
            [{x: 7, y: 8}, {x: 13, y: 14}], //upper left--
            [{x: 6, y: 21}, {x: 14, y: 26}, {x: 15, y: 20}], //lower left
            [{x: 18, y: 18}], //upper right--
            [{x: 20, y: 23}, {x: 15, y: 20}] //lower right--
        ];

        // fruit exit sequences
        this.exitTargets = [
            [{x: 7, y: 17}], //upper left --
            [{x: 11, y: 23}], //lower left --
            [{x: 15, y: 20}, {x: 18, y: 23}, {x: 22, y: 14}], //upper right
            [{x: 15, y: 20}, {x: 18, y: 23}] //lower right --
        ];
    }

    get isAlternateVersion() {
        return !(this.level <= 13 || (this.level > 13 && (this.level % 4)));
    }
    
    get pelletColor() {
        if (!this.isAlternateVersion) { // level 15, 19
            return '#d8d9f7';
        } else {
            return '#dedffe';
        }
    }

    get textureOffset() {
        //depends on level
        if (!this.isAlternateVersion) { // level 15, 19
            return {x: 228, y: 248*3};
        } else {
            //alt color -- 16, 20
            return {x: 228, y: 248*5};
        }
    }
}
//inherit statics and load map data
Object.assign(MsPacman4, Maze);
MsPacman4.initialize();//. = wall
//0 = open tile
//1 = pellet
//2 = pellet + decision
//3 = energizer
//4 = decision only
//5 = tunnel (slow tile)
//6 = ghost house (slow tile)

class Pacman1 extends Maze {
    static wallMap = [
        '............................', //0
        '............................', //1
        '............................', //2
        '............................', //3
        '.111112111111..111111211111.', //4
        '.1....1.....1..1.....1....1.', //5
        '.3....1.....1..1.....1....3.', //6
        '.1....1.....1..1.....1....1.', //7
        '.21111211211211211211211112.', //8
        '.1....1..1........1..1....1.', //9
        '.1....1..1........1..1....1.', //10
        '.111112..1111..1111..211111.', //11
        '......1.....0..0.....1......', //12
        '......1.....0..0.....1......', //13
        '......1..0000000000..1......', //14
        '......1..0...66...0..1......', //15
        '......1..0.666666.0..1......', //16
        '5555552004.666666.4002555555', //17
        '......1..0.666666.0..1......', //18
        '......1..0........0..1......', //19
        '......1..4000000004..1......', //20
        '......1..0........0..1......', //21
        '......1..0........0..1......', //22
        '.111112112111..111211211111.', //23
        '.1....1.....1..1.....1....1.', //24
        '.1....1.....1..1.....1....1.', //25
        '.311..2112111001112112..113.', //26
        '...1..1..1........1..1..1...', //27
        '...1..1..1........1..1..1...', //28
        '.112111..1111..1111..111211.', //29
        '.1..........1..1..........1.', //30
        '.1..........1..1..........1.', //31
        '.11111111111211211111111111.', //32
        '............................', //33          
        '............................', //34          
    ];

    static tiles = [];
    static tileHash = {};

    constructor(scene) {
        super(scene, RESOURCE.pacman);
        this.pelletColor = '#fcb4aa';
    }

    get textureOffset() {
        return { x: 228, y: 0 };
    }
}
//inherit statics and load map
Object.assign(Pacman1, Maze);
Pacman1.initialize();class Sprite {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.context = scene.context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.animations = [];
        this.currentAnimation = 0;
    }

    get size() {
        return {
            width: this.width,
            height: this.height
        }
    }
    get position() {
        return {x: this.x, y: this.y};
    }
    set position(position) {
        this.x = position.x;
        this.y = position.y;
    }
    get centerPixel() {
        return {x: this.position.x + (this.width/2), y: this.position.y + (this.height/2)}; 
    }
    get tile() {
        var center = this.centerPixel;
        return {x: Math.floor((center.x) / 8), y: Math.floor((center.y) / 8)};
    }

    hide() {
        this.hidden = true;
    }

    show() {
        this.hidden = false;
    }

    freeze() {
        this.frozen = true;
    }

    unfreeze() {
        this.frozen = false;
    }


    collide(entity) {
        return (this.tile.x == entity.tile.x && this.tile.y == entity.tile.y)
    }


    //animation stuff
    set animation(index) {
        this.currentAnimation = index;
        //reset animation info
        this.animation.curFrame = 0;
        this.animation.curFrameTicks = 0;
        this.frameCtr = 0;
    }
    get animation() {
        return this.animations[this.currentAnimation];
    }


    draw() {
        if (this.hidden) return;
        if (this.frozen) return;
        // update animations
        if (this.animations.length) {
            var currentAnimation = this.animations[this.currentAnimation];
            //if animating...
            if (currentAnimation.ticksPerFrame > 0 && currentAnimation.frames > 1) {
                //increment time spent on the current frame (milliseconds)
                currentAnimation.curFrameTicks++;
                //convert secPerFrame to milliseconds for comparison
                //is the time on the current frame more than secPerFrame? if so, time to move on to next frame
                if (currentAnimation.curFrameTicks == currentAnimation.ticksPerFrame) {
                    //go to the next frame in the animation
                    currentAnimation.curFrame = (currentAnimation.curFrame + 1) % currentAnimation.frames;
                    currentAnimation.curFrameTicks = 0;
                }
            }
        }
    }
}class Text extends Sprite {
    static TEXT_MAP = [
        "ABCDEFGHIJKLMNO ",
        "PQRSTUVWXYZ!cpts",
        '0123456789/-".'
    ]
    constructor(scene, text, color, x, y, align) {
        super(scene, x, y);
        this.text = text;
        this.color = color;
        this.align = align || 'left';

        this.flashCtr = 0;
    }

    get colorOffset() {
        return (['red','pink','blue','orange','peach','yellow'].indexOf(this.color) + 1) * 32;
    }

    getLetterCoordinates(letter) {
        for (var i = 0; i < Text.TEXT_MAP.length; i++) {
            var letterIndex = Text.TEXT_MAP[i].indexOf(letter);
            if (letterIndex > -1) {
                return { x: letterIndex * 8, y: i * 8 };
            }
        }
    }

    draw() {
        if (this.hidden) return;

        if (this.flashCtr < 16) {
            var context = this.context;
            for (var i = 0; i < this.text.length; i++) {
                var letterCoords = this.getLetterCoordinates(this.text[i]),
                    alignX = 0;
                if (this.align == 'right') {
                    alignX = ((this.text.length - 1) * 8);
                }
                context.drawImage(RESOURCE.text,
                    letterCoords.x, letterCoords.y + this.colorOffset, 8, 8,
                    this.x + (i * 8) - alignX, this.y, 8, 8
                );
            }
        }
        if (this.flash) {
            this.flashCtr = (this.flashCtr + 1) % 32;
        } else {
            this.flashCtr = 0;
        }
    }
}/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class MsPacmanPoints extends Sprite {
    static TYPE_FRUIT = 0;
    static TYPE_GHOST = 1;
    constructor (scene, x, y, score, type) {
        super(scene, x, y, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 504, y: 16};
        this.type = type;
        this.ticksToLive = 60; //TODO: what should this value be?
        this.score = score;        
    }

    eaten() {
        this.ticksToLive = 0;
    }

    tick() {
        this.ticksToLive--;
        if (this.ticksToLive < 0) {
            //pull self from the scene
            delete this.scene.pointSprite;
        }
    }

    get textureOffsets() {
        if (this.type == MsPacmanPoints.TYPE_FRUIT) {
            switch(this.score) {
                //fruit
                case 100:
                    return {x: 0, y: 0};
                case 200:
                    return {x: 16, y: 0};
                case 500:
                    return {x: 32, y: 0};
                case 700:
                    return {x: 48, y: 0};
                case 1000:
                    return {x: 64, y: 0};
                case 2000:
                    return {x: 80, y: 0};
                case 5000:
                    return {x: 96, y: 0};
            }
        } else {
            //ghost scores
            return {x: -16 * (3-this.score), y: 112};
        }
    }

    draw() {
        if (this.ticksToLive > 0) {
            //do x/y offset based on scene.level
            var offset = this.textureOffsets;
            this.scene.context.drawImage(RESOURCE.mspacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, 16, 16,
                this.position.x, this.position.y, 16, 16  
            );
        }
    }
}/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class PacmanPoints extends Sprite {
    constructor (scene, x, y, score) {
        super(scene, x, y, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 456, y: 144};
        this.ticksToLive = 120; 
        this.score = score;        
    }

    eaten() {
        this.ticksToLive = 0;
    }

    tick() {
        this.ticksToLive--;
        if (this.ticksToLive < 0) {
            //pull self from the scene
            delete this.hide()
        }
    }

    get textureOffsets() {
        switch(this.score) {
            //fruit
            case 100:
                return {x: 0, y: 0, w: 16};
            case 300:
                return {x: 16, y: 0, w: 16};
            case 500:
                return {x: 32, y: 0, w: 16};
            case 700:
                return {x: 48, y: 0, w: 16};
            case 1000:
                return {x: 64, y: 0, w: 18};
            case 2000:
                return {x: 60, y: 16, w: 24};
            case 3000:
                return {x: 60, y: 32, w: 24};
            case 5000:
                return {x: 60, y: 48, w: 24};
            default:
                //ghosts 1,2,3, or 4
                return {x: 16 * this.score, y: -16, w: 16};
        }

    }

    draw() {
        if (this.ticksToLive > 0) {
            var context = this.scene.context;
            //do x/y offset based on board.level
            var offset = this.textureOffsets;
            context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, offset.w, 16,
                this.position.x - ((offset.w - 16) / 2), this.position.y, offset.w, 16  
            );
        }
    }
}/*
the row of (ms) pacmans that appear below the maze indicating 
how many tries the player has remaining
*/

class LivesSprite extends Sprite {
    constructor(scene) {
        super(scene);
        this.resource = GAME_MODE == GAME_PACMAN?RESOURCE.pacman:RESOURCE.mspacman;
        this.textureOffset = {x: 472, y: GAME_MODE == GAME_PACMAN?16:0};
        this.width = 16;
        this.height = 16;
    }

    draw() {
        var context = this.scene.context;
        if (this.scene.pacman.lives > 0) {
            for (var i = 0; i < Math.min(this.scene.pacman.lives, 5); i++) {
                context.drawImage(this.resource,
                    this.textureOffset.x, this.textureOffset.y, this.width, this.height,
                    (i+1) * 16, 272, this.width, this.height  
                );
            }
        }
    }
}/*
the row of fruit that appears below the maze indicating which level
the player is on
*/

class MsPacmanLevelSprite extends Sprite {
    constructor(scene) {
        super(scene);
        this.textureOffset = {x: 504, y: 0};
        this.width = 16;
        this.height = 16;
    }

    draw() {
        var context = this.scene.context;
        for (var i = 0; i < Math.min(Math.max(this.scene.level,1), 7); i++) {
            context.drawImage(RESOURCE.mspacman,
                this.textureOffset.x + (i * 16), this.textureOffset.y, this.width, this.height,
                196 - (i * 16), 272, this.width, this.height  
            );
        }
    }
}/*
the row of fruit that appears below the maze indicating which level
the player is on
*/

class PacmanLevelSprite extends Sprite {
    constructor(scene) {
        super(scene);
        this.textureOffset = {x: 488, y: 48};
        this.width = 16;
        this.height = 16;
    }

    draw() {
        var context = this.scene.context,
            fruits = [],
            level = Math.max(this.scene.level, 1);
        for (var i = level; i >= level-6; i--) {
            if (i < 1) break;
            var fruitIdx = PacmanFruit.getFruitIndex(i);
            fruits.unshift(fruitIdx);
        }
        for (var i = 0; i < fruits.length; i++) {
            var offsetX = fruits[i] * 16,
                dstX = (24 - (2*i)) * 8;
            context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, this.width, this.height,
                dstX, 272, this.width, this.height  
            );
        }
    }
}class Actor extends Sprite {

    static TURN_PREFERENCE = [Vector.LEFT, Vector.UP, Vector.RIGHT, Vector.DOWN];

    constructor(board, x, y, width, height) {
        super(board, x, y, width, height);
        this.animations = [];
        this.currentAnimation = 0;
        this.frameCtr = 0;
    }

    //location stuff
    get isTileCenter() {
        var tile = this.tile,
            pixel = this.position;
        return tile.x*8 == pixel.x+4 && tile.y*8 == pixel.y+4;
    }

    //start and stop movement (but not animation)
    stop() {
        this.stopped = true;
    }
    start() {
        this.stopped = false;
    }

    tick() {
        if (!this.stopped) {
            //update position of actor
            this.x += (this.speed * this.direction.x);
            this.y += (this.speed * this.direction.y);

            //counter used for speed control
            this.frameCtr = (this.frameCtr+1) % 32;

            //warp tunnel wrap-around- if actor goes through tunnel, make them loop out from the other side
            if (this.tile.x == 29 && this.direction.x == 1) {
                this.x = (-2 * 8);
            } else if (this.tile.x == -2 && this.direction.x == -1) {
                this.x = (29 * 8);
            }
        }
    }

    get speed() {
        try {
            return parseInt(this.speedControl[this.frameCtr]);
        } catch(ex) {
            return 0;
        }
    }
}class Pacman extends Actor {
    static MODE_PATROL = 0;
    static MODE_ENERGIZED = 1;
    static MODE_DYING = 2;
    static MODE_DEAD = 3;

    static ANIM_NORMAL = 0;
    static ANIM_DIE = 1;
    static ANIM_GIANT = 2;
    static ANIM_SLOMO = 3;

    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        this.startDirection = Vector.LEFT;
        this.startPosition = { x: x, y: y };
        this.animations = [
            //normal
            { frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 },
            //die
            { frames: 14, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 504, textureY: 0 },
            //giant 32 x 32
            { frames: 4, ticksPerFrame: 3, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 16 },
            //slo-mo - same as normal but don't chomp so fast
            { frames: 4, ticksPerFrame: 4, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
        ];
        this.score = 0;
        this.energizeTimer = new Timer();
        this.reset();
    }

    reset() {
        this.show();
        this.stop();
        this.position = Vector.clone(this.startPosition);
        this.direction = Vector.clone(this.startDirection);
        this.animation = Pacman.ANIM_NORMAL;
        this.mode = Pacman.MODE_PATROL;
        this.frameCtr = 0;
        this.freeze();
    }


    //despite being a 16x16 sprite, pacman's hitbox (when eating pellets) appears to be adjusted somehow
    get hitBox() {
        return { x: this.centerPixel.x - 7, y: this.centerPixel.y - 7, w: 14, h: 15 }
    }

    get centerPixel() {
        return { x: this.position.x + 7, y: this.position.y + 7 };
    }

    collideItem(pellet) {
        var pelletHitbox = pellet.hitBox;
        if ((pelletHitbox.x > this.hitBox.x && pelletHitbox.x + pelletHitbox.w < this.hitBox.x + this.hitBox.w) &&
            (pelletHitbox.y > this.hitBox.y + 1 && pelletHitbox.y + pelletHitbox.h < this.hitBox.y + this.hitBox.h)) {
            return true;
        }
        return false;
    }

    /**
     * pacman is out in the maze and there is no fright timer.
     */
    patrol() {
        this.animation = Pacman.ANIM_NORMAL;
        this.mode = Pacman.MODE_PATROL;
    }
    get isPatrolling() {
        return this.mode == Pacman.MODE_PATROL;
    }


    /**
     * pacman eats an item such as a pellet, energizer, or fruit. when eating a pellet, pacman
     * freezes for one frame, and freezes for 3 when eating an energizer. The freeze delay counter
     * is because the freeze happens after one tick.
     * @param {*} item 
     */
    eatItem(item) {
        if (item.pellet) {
            this.freezeDelay = 2;
            this.freezeHalfTicks = 2;
            this.atePellet = true;
            Sound.playOnce('munch');
        } else if (item.energizer) {
            this.freezeDelay = 2;
            this.freezeHalfTicks = 6;
            this.mode = Pacman.MODE_ENERGIZED; //speed him up
            this.atePellet = true;
        } else if (item.fruit) {
            item.eaten();
            Sound.playOnce('eat_fruit');
        }
        this.addPoints(item.points);
    }

    get isEnergized() {
        return this.mode == Pacman.MODE_ENERGIZED;
    }

    addPoints(points) {
        var prevScore = this.score;
        this.score += points;
        //award extra life for every 10k increment of points
        prevScore = Math.floor(prevScore / 10000);
        var newScore = Math.floor(this.score / 10000);
        if (prevScore != newScore) {
            Sound.playOnce('extra_life');
            this.lives++;
        }
        //set high score
        if (this.score > this.scene.highScore) {
            localStorage['highscore_' + GAME_MODE] = this.score;
        }
    }


    die() {
        //cache the scene's pellets/energizer
        this.animation.curFrame = 2;
        this.direction = Vector.UP;
        this.pellets = Array.from(this.scene.pellets);
        this.energizers = Array.from(this.scene.energizers);
        this.scene.freezeTimer.start(30, () => {
            Sound.playOnce('die');
            this.unfreeze();
            this.mode = Pacman.MODE_DYING;
            this.animation = Pacman.ANIM_DIE;
            Math.max(--this.lives, -1); //min lives of zero
        });
    }
    get isDying() {
        return this.mode == Pacman.MODE_DYING;
    }
    get isDead() {
        return this.mode == Pacman.MODE_DEAD;
    }
    get isAlive() {
        return !this.isDead && !this.isDying;
    }

    //for pacman cut scene 1
    get isGiant() {
        return this.currentAnimation == Pacman.ANIM_GIANT;
    }


    tick() {
        //pacman freezes when eating pellets (1 tick) and energizers (3 ticks)
        //freeze delay timer is here because the actual freezing is delayed
        //by a frame (2 ticks)
        if (!this.freezeDelay) {
            if (this.freezeHalfTicks) {
                this.freezeHalfTicks--;
                return;
            }
        } else {
            this.freezeDelay--;
        }

        //two updates per tick for a moving Actor
        if (!this.stopped) {
            Actor.prototype.tick.call(this);
        }

        if (!this.scene.maze) return;  //we're scripting, no maze stuff here
        if (this.isDying) return; //ignore inputs if pacman is dying
        //get the direction for this frame by reading the input buffer or continue current direction if no input
        var inputDirection = Input.readBuffer() || this.direction;
        //check for wall contact
        //look at 5 pixels over from center point in direction pac-man is moving. if it is a wall tile, then stop
        var centerPoint = this.centerPixel,
            nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 },
            testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
        //this move would hit a wall, try to continue in same direction of travel
        if (!this.scene.mazeClass.isWalkableTile(testTile)) {
            inputDirection = this.direction;
        } else {
            this.unfreeze();
            this.start();
        }

        //try again with original direction - if there's a wall here too, stop
        nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 };
        testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
        //this move would hit a wall, try to continue in same direction of travel
        if (!this.scene.mazeClass.isWalkableTile(testTile)) {
            this.freeze();
            this.stop();
            //another interesting fact- pac man never seems to stop with his mouth closed
            if (this.animation.curFrame == 0) {
                this.animation.curFrame = 2;
            }
        }
        var changeDirection = !Vector.equals(inputDirection, this.direction),
            oppositeDirection = Vector.equals(inputDirection, Vector.inverse(this.direction));
        this.direction = inputDirection;

        //when going up... movement is '01111121'
        if (changeDirection && !oppositeDirection && Vector.equals(this.direction, Vector.DOWN)) {
            this.y++;
        }

        //pause for a frame when changing direction
        if (!this.stopped && !oppositeDirection) {

            //get the coordinate of center lane
            var centerX = (this.tile.x * 8) + 3,
                centerY = (this.tile.y * 8) + 3;

            //keep pac-man in his lane. fudge over to center line depending on direction of travel
            //this code re-aligns pacman to the center of the maze lane after cutting a corner
            if (this.direction.x) {
                if (this.centerPixel.y > centerY) {
                    this.y -= 0.5;
                } else if (this.centerPixel.y < centerY) {
                    this.y += 0.5;
                }
            }
            if (this.direction.y) {
                if (this.centerPixel.x > centerX) {
                    this.x -= 0.5;
                } else if (this.centerPixel.x < centerX) {
                    this.x += 0.5;
                }
            }
        }
    }

    //clip apart the sprite sheet at res/pacman/pacman.png
    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.scene.context,
            animation = this.animation;

        if (!this.isDying) {
            var curFrame = animation.curFrame,
                frameOffsetX = 0,
                directionalOffsetY = 0,
                width = 15,
                height = 15;

            if (curFrame == 0) {
                //closed mouth uses only one texture, no matter direction
                directionalOffsetY = 0;
            } else {
                //right, left, up, down
                if (this.direction.x >= 1) {
                    directionalOffsetY = 0;
                } else if (this.direction.x <= -1) {
                    directionalOffsetY = 16;
                } else if (this.direction.y <= -1) {
                    directionalOffsetY = 32;
                } else if (this.direction.y >= 1) {
                    directionalOffsetY = 48;
                }
            }

            if (curFrame == 0) {
                frameOffsetX = 0
            } else if (curFrame == 1) {
                frameOffsetX = -1;
            } else if (curFrame == 2) {
                frameOffsetX = -2;
            } else if (curFrame == 3) {
                frameOffsetX = -1;
            }

            if (this.isGiant) {
                directionalOffsetY = 16;
                width = 32;
                height = 32;
                frameOffsetX *= -32;
            } else {
                frameOffsetX *= 16;
            }
            //do directional stuff and modular back and forth for animation
            context.drawImage(RESOURCE.pacman,
                animation.textureX + frameOffsetX, directionalOffsetY, width, height,
                this.position.x, this.position.y, width, height
            );
        } else {
            //dying animation
            context.drawImage(RESOURCE.pacman,
                animation.textureX + (animation.curFrame * 16), 0, 16, 16,
                this.position.x, this.position.y, 16, 16
            );
            if (animation.curFrame == 13) {
                //dead
                this.stop();
                this.freeze();
                this.hide();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }


    /**
     * 
     * https://github.com/BleuLlama/GameDocs/blob/master/disassemble/mspac.asm#L2456
     */
    get energizedDuration() {
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

    // for info on pacman speeds, etc see: https://www.gamasutra.com/db_area/images/feature/3938/tablea1.png
    get speedControl() {
        // TODO: something odd going on when pacman moves up. doesn't follow these patterns. pixel rounding??
        //on average I think it works out, but not pixel perfect
        if (this.stopped || this.isDying) {
            return '00000000000000000000000000000000';
        } else if (this.isPatrolling) {
            if (this.scene.level == 1) {
                return '01010101010101010101010101010101';
            } else if (this.scene.level <= 4) {
                return '11010101011010101101010101101010' //18/32
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101'; //20/32
            } else {
                return '11010101011010101101010101101010';
            }
        } else if (this.isEnergized) {
            if (this.scene.level == 1) {
                return '11010101011010101101010101101010';
            } else if (this.scene.level <= 4) {
                return '11010110010110101010110110110101';
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101';
            } else {
                //there is no "energized" state for pacman at this point as the 
                //energizers don't frighten the ghosts- just use patrolling speed
                return '11010101011010101101010101101010';
            }
        }
    }
}class MsPacman extends Pacman {
    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        this.animations = [
            //normal
            { frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 },
            //die
            { frames: 11, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 472, textureY: 48 },
            //giant 32 x 32 --pacman only
            { },
            //slo-mo - same as normal but don't chomp so fast
            { frames: 4, ticksPerFrame: 4, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
            
        ];
    }

    die() {
        Pacman.prototype.die.call(this);
        this.animation.curFrame = 1;
        this.direction = Vector.DOWN;
    }

    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.scene.context,
            animation = this.animation,
            directionalOffsetY = 0;

        //right, left, up, down
        if (this.direction.x >= 1) {
            directionalOffsetY = 0;
        } else if (this.direction.x <= -1) {
            directionalOffsetY = 16;
        } else if (this.direction.y <= -1) {
            directionalOffsetY = 32;
        } else if (this.direction.y >= 1) {
            directionalOffsetY = 48;
        }

        if (!this.isDying) {
            var curFrame = animation.curFrame,
                frameOffsetX = 0;

            if (curFrame == 0) {
                frameOffsetX = 0
            } else if (curFrame == 1) {
                frameOffsetX = -1;
            } else if (curFrame == 2) {
                frameOffsetX = -2;
            } else if (curFrame == 3) {
                frameOffsetX = -1;
            }

            //do directional stuff and modular back and forth for animation
            context.drawImage(RESOURCE.mspacman,
                animation.textureX + (frameOffsetX * 16), directionalOffsetY, 15, 15,
                this.position.x, this.position.y, 15, 15
            );
        } else {
            //dying animation- should spin, down,left,up,right, down,left,up,right, down,left,up
            this.direction = Actor.TURN_PREFERENCE[3 - (animation.curFrame + 2) % 4];
            context.drawImage(RESOURCE.mspacman,
                animation.textureX, directionalOffsetY, 16, 16,
                this.position.x, this.position.y, 16, 16
            );
            if (animation.curFrame == 9) {
                //dead
                this.stop();
                this.freeze();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }
}// https://www.youtube.com/watch?v=sQK7PmR8kpQ ms pacman ghost ai
//ghost movement https://raw.githubusercontent.com/BleuLlama/GameDocs/master/disassemble/mspac.asm
class Ghost extends Actor {
    static MODE_CHASE = 0;
    static MODE_SCATTER = 1;
    static MODE_FRIGHT = 2;
    static MODE_EATEN = 3;

    static STATUS_LEAVE_HOME = 0;
    static STATUS_ENTER_HOME = 1;
    static STATUS_HOME = 2;
    static STATUS_PATROL = 3;

    static ANIM_SCATTER_CHASE = 0;
    static ANIM_FRIGHT = 1;
    static ANIM_FRIGHT_FLASH = 2;
    static ANIM_EATEN = 3;

    static NUM_EATEN = 0;
    static NUM_FRIGHTENED = 0;


    //entrance and exit to the ghost house
    static HOUSE_DOOR = { x: 13, y: 14 };
    static LEAVE_TARGET = { x: 13 * 8, y: 13.5 * 8 };

    constructor(scene, x, y, name) {
        super(scene, x, y, 16, 16);
        this.scene = scene;
        this.name = name;
        this.startPosition = { x: x, y: y };

        this.animations = [
            //normal movement
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 456, textureY: 64 },
            //frighten just blue
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 64 },
            //frighten (flash blue / white)
            { frames: 4, ticksPerFrame: 7, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 64 },
            //eaten (eyes)
            { frames: 1, ticksPerFrame: 0, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 80 },
        ];
        this.currentAnimation = 0;
        this.pelletCounter = 0;
    }


    reset() {
        this.show();
        this.frozen = true;
        this.frameCtr = 0;
        this.direction = Vector.clone(this.startDirection);
        this.position = Vector.clone(this.startPosition);
        this.nextInstruction = Vector.clone(this.direction);
        this.status = Ghost.STATUS_HOME; // EXCEPT BLINKY
        this.mode = Ghost.MODE_SCATTER;
        this.animation = Ghost.ANIM_SCATTER_CHASE;
        this.targetTile = this.calculateTargetTile();
        delete this.reverseInstruction;
    }


    get pelletLimit() {
        return 0;
    }


    get inTunnel() {
        try {
            return this.scene.mazeClass.isTunnelTile(this.tile);
        } catch (ex) {
            return false;
        }
    }

    get isSlow() {
        return this.isHome || this.isLeavingHome || this.inTunnel;
    }

    /**
     * frighten the ghosts if they're not eaten. frightened ghosts
     * get a reverse instruction.
     */
    frighten() {
        //tag the instruction as a reverse
        this.reverseInstruction = Vector.inverse(this.direction);
        this.reverseInstruction.reverse = true;
        if (!this.isEaten) {
            //eaten ghosts (eyes) can't be frightened
            this.mode = Ghost.MODE_FRIGHT;
            this.animation = Ghost.ANIM_FRIGHT;
            Ghost.NUM_FRIGHTENED++;
        }
    }
    frightenFlash() {
        this.animation = Ghost.ANIM_FRIGHT_FLASH;
    }
    get isFrightened() {
        return this.mode == Ghost.MODE_FRIGHT;
    }

    /**
     * turn the ghost around at the next tile center, if possible
     */
    reverse() {
        var reverse = Vector.inverse(this.direction);
        this.reverseInstruction = reverse;
        this.reverseInstruction.reverse = true;
    }


    /**
     * make the ghost scatter pacman. called by the scatterchase instance
     * @param {*} noReverse sometimes scatter needs to be called without the reverse instruction
     */

    scatter(noReverse) {
        if (!this.isEaten) {
            if (!noReverse) {
                this.reverse();
            }
            this.mode = Ghost.MODE_SCATTER;
            this.animation = Ghost.ANIM_SCATTER_CHASE;
            //point to this ghost's scatter target
            this.targetTile = this.calculateTargetTile();
        }
    }
    get isScattering() {
        return this.mode == Ghost.MODE_SCATTER;
    }



    /**
     * make the ghost chase pacman. called by the scatterchase instance
     * @param {*} noReverse sometimes chase needs to be called without the reverse instruction
     */
    chase(noReverse) {
        if (!this.isEaten) {
            if (!noReverse) {
                this.reverse();
            }
            this.mode = Ghost.MODE_CHASE;
            this.animation = Ghost.ANIM_SCATTER_CHASE;
            this.targetTile = this.calculateTargetTile();
        }
    }
    get isChasing() {
        return this.mode == Ghost.MODE_CHASE;
    }


    /**
     * called when pacman eats this ghost
     */
    eaten() {
        //ghost hides for a moment while a score sprite is displayed in its place
        this.hide();
        this.stop();
        this.mode = Ghost.MODE_EATEN;
        this.targetTile = Ghost.HOUSE_DOOR;
        this.animation = Ghost.ANIM_EATEN;
    }
    get isEaten() {
        return this.mode == Ghost.MODE_EATEN;
    }



    //ghost house stuff vvvv
    /**
     * direct the ghost to leave the house. if they are not already home
     * point the ghost in the direction of the exit point (x axis first)
     * and slowly migrate to the LEAVE_TARGET
     */
    leaveHouse() {
        if (this.isHome) {
            //turn and face exit point immediately
            if (this.position.x > Ghost.LEAVE_TARGET.x) {
                this.direction = Vector.LEFT;
            } else if (this.position.x < Ghost.LEAVE_TARGET.x) {
                this.direction = Vector.RIGHT;
            } else if (this.position.y > Ghost.LEAVE_TARGET.y) {
                this.direction = Vector.UP;
            }
            //ghost's status updated to leaving home
            this.status = Ghost.STATUS_LEAVE_HOME;
        }
    }
    get isReadyToLeaveHouse() {
        return this.isHome && this.pelletCounter >= this.pelletLimit;
    }
    get isHome() {
        return this.status == Ghost.STATUS_HOME;
    }
    get isEnteringHome() {
        return this.status == Ghost.STATUS_ENTER_HOME;
    }
    get isLeavingHome() {
        return this.status == Ghost.STATUS_LEAVE_HOME;
    }



    /**
     * look at a tile on the map and determine what the ghost's next move should be 
     * if/when it reaches that tile
     * @param {*} atTile 
     */
    calculateNextInstruction(atTile) {
        var choice = -1,
            closest = Infinity,
            validChoices = [];    //keep track of non-wall hitting moves for random selection (frightened mode)
        //cycle through the turn preferences list: UP, LEFT, DOWN, RIGHT
        for (var i = 0; i < Actor.TURN_PREFERENCE.length; i++) {
            var testDirection = Actor.TURN_PREFERENCE[i];
            // can't reverse go back the way we just came
            if (!Vector.equals(Vector.inverse(this.direction), testDirection)) {
                //calculate distance from testTile to targetTile and check if it's the closest
                var testTile = Vector.add(atTile, testDirection),
                    distance = Vector.distance(testTile, this.targetTile);
                if (this.scene.mazeClass.isWalkableTile(testTile)) {
                    //this is a valid turn to make
                    validChoices.push(i);
                    if (distance < closest) {
                        //this choice gets the ghost the closest so far
                        choice = i;
                        closest = distance;
                    }
                }
            }
        }
        // when ghost is frightened override turn choice with random selection from validChoices
        if (this.isFrightened || this.randomScatter) {
            choice = validChoices[Math.floor(Math.random() * validChoices.length)];
        }
        //set next direction to be the choice the ghost just made
        return Actor.TURN_PREFERENCE[choice];
    }


    /**
     * these are the global cases for setting a ghost's target tile. the specific
     * target tile calculations of each respective ghosts are made in their subclass
     */
    calculateTargetTile() {
        if (this.isScattering) {
            return this.scatterTargetTile;
        } else if (this.isFrightened) {
            return this.scatterTargetTile; //this doesn't matter since turns are random, just need a value
        } else if (this.isEaten) {
            return Ghost.HOUSE_DOOR;
        }
    }


    /**
     * one tick of the game. this is where the meat of the ghosts' game mechanics lies. this tells
     * the ghost how to move based on its location, mode, and status. for instance, if the ghost is 
     * leaving home, it's pointed to the LEAVE_TARGET and gradually moves there with each tick of the game.
     */
    tick() {
        //the ghost's "speed" determines how many pixels it moves in this game tick. see "get speedControl()" below
        Actor.prototype.tick.call(this);
        if (!this.scene.maze) return;
        if (this.isHome) {
            //ghost is home in the ghost house
            //bounce up and down off walls when stuck in the house
            if (Math.ceil(this.position.y) <= 128) {
                this.direction = Vector.DOWN;
            } else if (Math.floor(this.position.y) >= 136) {
                this.direction = Vector.UP;
            }
        } else if (this.isEnteringHome) {
            //entering house - find this.houseTarget
            //go down and then over (if necessary) in that order
            if (this.position.y < this.houseTarget.y) {
                this.direction = Vector.DOWN;
            } else if (this.position.x < this.houseTarget.x) {
                this.direction = Vector.RIGHT;
            } else if (this.position.x > this.houseTarget.x) {
                this.direction = Vector.LEFT;
            } else {
                //back to home target
                this.status = Ghost.STATUS_HOME;
                this.animation = Ghost.ANIM_SCATTER_CHASE;
                this.direction = Vector.UP;
                this.mode = this.scene.globalChaseMode;
                Ghost.NUM_EATEN--;
            }
        } else if (this.isLeavingHome) {
            if (!this.isEaten) {
                //leaving house - find leave target
                // go left/right first, then up in that order
                if (this.position.x > Ghost.LEAVE_TARGET.x) {
                    this.direction = Vector.LEFT;
                } else if (this.position.x < Ghost.LEAVE_TARGET.x) {
                    this.direction = Vector.RIGHT;
                } else if (this.position.y > Ghost.LEAVE_TARGET.y) {
                    this.direction = Vector.UP;
                } else {
                    //made it out of the house, patrol time
                    this.status = Ghost.STATUS_PATROL;
                    this.direction = Vector.LEFT;
                    this.exitingHouse = true;
                    //if there was a reverse instruction given when in the house, queue it up next
                    if (this.reverseInstruction) {
                        this.nextInstruction = Vector.RIGHT;
                        delete this.reverseInstruction;
                    } else {
                        this.nextInstruction = Vector.LEFT;
                    }
                    if (!this.isFrightened) {
                        this.mode = this.scene.globalChaseMode;
                    }
                    this.targetTile = this.calculateTargetTile();
                }
            } else {
                //got eaten on the way out of the house, go back inside
                this.status = Ghost.STATUS_ENTER_HOME;
            }
        } else if (this.isTileCenter && !this.madeInstruction) {
            //hit the center of a tile. time to execute the next turn/instruction
            //made instruction is important here because if a ghost is on center
            //tile for more than one tick, we don't want to re-calc an instruction
            this.madeInstruction = true;    //clear this after leaving tileCenter
            // execute pending instruction
            if (this.reverseInstruction) {
                //check validity of move, if not valid, go back in the previous direciton
                var nextTile = Vector.add(this.tile, this.reverseInstruction);
                if (this.scene.mazeClass.isWallTile(nextTile)) {
                    this.nextInstruction = Vector.inverse(this.lastDirection);
                } else {
                    this.nextInstruction = Vector.clone(this.reverseInstruction);
                }
                delete this.reverseInstruction;
            }
            this.lastDirection = Vector.clone(this.direction);
            this.direction = Vector.clone(this.nextInstruction);
            // look ahead to next tile and calculate next instruction from there
            this.targetTile = this.calculateTargetTile();
            var nextTile = Vector.add(this.tile, this.direction),
                futureTile = Vector.add(nextTile, this.direction);
            if (this.scene.mazeClass.isDecisionTile(nextTile)) {
                this.nextInstruction = this.calculateNextInstruction(nextTile);
            } else if (this.scene.mazeClass.isWallTile(futureTile)) {
                this.nextInstruction = this.calculateNextInstruction(nextTile);
            }
            if (!this.nextInstruction) {
                //the above did not generate a valid move. could happen due to a reverse instruction at an inopportune time
                var nextDirection = this.calculateNextInstruction(this.tile) || this.direction;
                this.nextInstruction = Vector.clone(nextDirection);
            }
            //update the target tile
            this.targetTile = this.calculateTargetTile();
        } else {
            if (!this.isTileCenter) {
                //off center tile, unset the madeInstruction flag
                this.madeInstruction = false;
            }
            //below is an eaten ghost in search of home
            if (this.isEaten && !this.isEnteringHome) {
                //eaten ghost looking for entrance to house
                if (Vector.equals(this.position, Ghost.LEAVE_TARGET)) {
                    //found entrance, time to go in
                    this.direction = Vector.DOWN;
                    this.status = Ghost.STATUS_ENTER_HOME;
                }
            } else if (this.exitingHouse) {
                //now that the ghost has popped out of the house, make sure its position is snapped to the maze lanes
                this.y = ((this.tile.y - 1) * 8) + 4;
                this.exitingHouse = false;
            }
            //always update the target tile
            this.targetTile = this.calculateTargetTile();
        }
    }


    /**
     * the interesting thing here is that the ghosts telegraph their turn a few pixels
     * before the execute the turn. the draw method takes into account a pending instruction
     * and moves the ghost's eyes in that direction while the ghost is patrolling
     */
    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        //figure out texture sheet offsets then draw
        var context = this.scene.context, //canvas 2d context for drawing
            animation = this.animation,
            directionalOffsetX = 0,
            offsetY = 0;
        //non-frighten animations move eyes in the nextDirection. ghosts' eyes move first before they make a turn
        if (!this.isFrightened) {
            offsetY = this.textureOffsetY;
            var eyes;
            if (this.isHome || this.isLeavingHome) {
                eyes = this.direction;
            } else if (this.madeInstruction || this.nextInstruction.reverse) {
                eyes = this.direction;
            } else {
                eyes = this.nextInstruction || this.direction;
            }
            //add an x offset to the textureX to point eyes frames
            if (eyes.x == -1) {
                directionalOffsetX = 32;
            } else if (eyes.y == -1) {
                directionalOffsetX = 64;
            } else if (eyes.y == 1) {
                directionalOffsetX = 96;
            }
            if (this.mode == Ghost.MODE_EATEN) {
                offsetY = 0;
                directionalOffsetX /= 2;
            }
        }
        //draw to canvas
        context.drawImage(RESOURCE.pacman,
            animation.textureX + directionalOffsetX + (animation.curFrame * this.width), animation.textureY + offsetY, this.width, this.height, //clip from source
            this.position.x, this.position.y, this.width, this.height
        );
    }

    /**
     * these strings represent the amount of pixels a ghost should move per half tick during
     * a period of 16 ticks (two updates per tick).  this.frameCtr keeps track of the position in the speed control
     * string. this.frameCtr gets incremented in tick() each executed (unfrozen) frame
     * see #330F on https://raw.githubusercontent.com/BleuLlama/GameDocs/master/disassemble/mspac.asm
     * 
     */
    get speedControl() {

        try {
            if (this.isEaten) {
                return '11111111111111111111111111111111'
            } else if (this.isSlow) {
                //tunnel, home
                if (this.scene.level == 1) {
                    return '00100010001000100010001000100010';
                } else if (this.scene.level <= 4) {
                    return '01001000001001000010001010010001';
                } else if (this.scene.level <= 20) {
                    return '10010010001001001001001000100100';
                } else {
                    return '10010010001001001001001000100100';
                }
            } else if (this.isFrightened) {
                //frightened
                if (this.scene.level == 1) {
                    return '10010010001001001001001000100100';
                } else if (this.scene.level <= 4) {
                    return '10010010001001000010010101001001;'
                } else if (this.scene.level <= 20) {
                    return '00100101001001010010010100100101';
                } else {
                    //not used, no frigthen state at these levels
                    return '01001000001001000010001010010001';
                }
            } else if (this.elroy == 1) {
                //elroy 1 - Blinky only
                if (this.scene.level == 1) {
                    return '10101010101010101010101010101010';
                } else if (this.scene.level <= 4) {
                    return '11010101011010101101010101101010';
                } else if (this.scene.level <= 20) {
                    return '01101101011011010110110101101101';
                } else {
                    return '01101101011011010110110101101101';
                }
            } else if (this.elroy == 2) {
                //elroy 2 - Blinky only
                if (this.scene.level == 1) {
                    return '101010100110101001010101110101010';
                } else if (this.scene.level <= 4) {
                    return '101101011001011010101011011011010';
                } else if (this.scene.level <= 20) {
                    return '101101100110110101101101110110110';
                } else {
                    return '101101100110110101101101110110110';
                }
            }
        } catch (ex) {
            //scene is not part of a maze, is scripted
            console.log(ex)
        }

        //normal patrol
        if (this.scene.level == 1) {
            return '10101010001010100101010101010101';
        } else if (this.scene.level <= 4) {
            return '10101010011010100101010111010101';
        } else if (this.scene.level <= 20) {
            return '11010110010110101010110110110101';
        } else {
            return '11010110010110101010110110110101';
        }
    }
}//TODO:  on reversal there is a ms pacman patch that makes blinky go after ms pacman to "avoid parking"

class Blinky extends Ghost {
    static ANIM_RIP = 4;
    static ANIM_PATCH = 5;
    static ANIM_NAKED = 6;
    constructor(scene, x, y) {
        super(scene, x, y, 'Blinky');
        this.houseTarget = { x: 13 * 8, y: 16.5 * 8 };
        this.startDirection = Vector.LEFT;
        this.scatterTargetTile = { x: 25, y: 0 };
        this.textureOffsetY = 0;
        //add some extra animations for the pacman cut scenes
        this.animations = this.animations.concat([ 
            //rip sheet animation for cut scene 2
            { frames: 2, ticksPerFrame: 70, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 112 },
            //patched sheet --use direction offset cutscene 3
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 112 },
            //naked cutscene 3
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 128 }
        ]);
        this.reset();
    }

    reset() {
        Ghost.prototype.reset.call(this);
        //blinky starts outside of the house
        this.status = Ghost.STATUS_PATROL;
    }

    get randomScatter() {
        return this.scene.scatterChase.randomScatter;
    }

    /**
     * Blinky targets pacman directly
     */
    calculateTargetTile() {
        if (this.isChasing) {
            return Vector.clone(this.scene.pacman.tile);
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }

    tick() {
        //blinky should always leave home immediately
        if (this.isHome) {
            this.leaveHouse()
        }
        Ghost.prototype.tick.call(this)
    }


    draw() {
        if (this.currentAnimation == Blinky.ANIM_NAKED) {
            Actor.prototype.draw.call(this);
            var animation = this.animation;
            context.drawImage(RESOURCE.pacman,
                animation.textureX + (animation.curFrame * 32), animation.textureY, 32, this.height, //clip from source
                this.position.x-16, this.position.y, 32, this.height
            );
        } else {
            Ghost.prototype.draw.call(this);
        }
    }


    /**
     * Blinky has a "cruise elroy state" where his speed increases slightly when 
     * there are few dots left in the maze.
     * 
     * https://github.com/BleuLlama/GameDocs/blob/master/disassemble/mspac.asm#L2439
     */
    get elroy() {
        //cruise elroy for Blinky only
        if (this.scene.pelletsLeft > 0) {
            if (this.scene.pelletsLeft <= this.elroy2PelletsLeft) {
                return 2;
            } else if (this.scene.pelletsLeft <= this.elroy1PelletsLeft) {
                return 1;
            }
        }
        return 0;
    }


    get elroy1PelletsLeft() {
        return this.elroy2PelletsLeft * 2;
    }
    get elroy2PelletsLeft() {
        if (this.scene.level == 1) {
            return 10;
        } else if (this.scene.level == 2) {
            return 15;
        } else if (this.scene.level <= 5) {
            return 20;
        } else if (this.scene.level <= 8) {
            return 25;
        } else if (this.scene.level <= 11) {
            return 30;
        } else if (this.scene.level <= 14) {
            return 40;
        } else if (this.scene.level <= 18) {
            return 50;
        } else {
            return 60;
        }
    }
}class Pinky extends Ghost {
    constructor(scene, x ,y) {
        super(scene, x, y, 'Pinky');
        this.houseTarget = this.startPosition;
        this.startDirection = Vector.DOWN;
        this.textureOffsetY = 16;
        this.scatterTargetTile = { x: 2, y: 0 };
        this.reset();
    }

    get randomScatter() {
        return this.scene.scatterChase.randomScatter;
    }

    /**
     * Pinky targets four tiles in front of the pacman in pacman's direction of travel. Also
     * takes into account a bug with the targeting scheme in the original arcade game.s
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var pacmanDirection = this.scene.pacman.direction,
                targetTile = Vector.clone(this.scene.pacman.tile);
            if (pacmanDirection.x) {
                targetTile.x += (pacmanDirection.x * 4)
            }
            if (pacmanDirection.y) {
                targetTile.y += (pacmanDirection.y * 4);
                //emulate the overflow bug in the original arcade game where if pacman is moving up, target tile also moves left 4 tiless
                if (pacmanDirection.y < 0) {
                    targetTile.x -= 4;
                }
            }
            return Vector.clone(targetTile);
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }

}class Inky extends Ghost {
    constructor(scene, x, y) {
        super(scene, x, y, 'Inky');
        this.houseTarget = this.startPosition;
        this.startDirection = Vector.UP;
        this.textureOffsetY = 32;
        this.scatterTargetTile = { x: 27, y: 35 };
        this.reset();
    }

    get pelletLimit() {
        return this.scene.level==1?30:0;
    }

    calculateTargetTile() {
        //inky targets two tiles in front of pacman, draws a vector from blinky to that target and doubles it
        if (this.isChasing) {
            var blinkyTile = this.scene.ghosts.Blinky.tile,
                pacmanTile = this.scene.pacman.tile,
                pacmanDirection = this.scene.pacman.direction,
                targetTile = { 
                    x: pacmanTile.x + (pacmanDirection.x * 2), 
                    y: pacmanTile.y + (pacmanDirection.y * 2) 
                };
            //emulate overflow bug where if pacman is moving up, target tile also moves left 2 tiless
            if (pacmanDirection.y) {
                if (pacmanDirection.y < 0) {
                    targetTile.x -= 2;
                }
            }
            //now draw a vector from blinky to that target and double the length to get new target
            targetTile.x += (targetTile.x - blinkyTile.x);
            targetTile.y += (targetTile.y - blinkyTile.y);
            return Vector.clone(targetTile);
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }

}class Clyde extends Ghost {
    constructor(scene, x, y) {
        super(scene, x, y, 'Clyde');
        this.houseTarget = this.startPosition;
        this.enterTarget = this.startPosition;
        this.startDirection = Vector.UP;
        this.textureOffsetY = 48;
        this.scatterTargetTile = { x: 0, y: 35 };
        this.reset();
    }

    get pelletLimit() {
        if (this.scene.level == 1) {
            return 60;
        } else if (this.scene.level == 2) {
            return 50;
        }
        return 0;
    }

    /**
     * Sue will target pacman directly when more than 8 tiles away from him. if he
     * gets closer, he will target his scatter tile
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var sueTile = this.tile,
                pacmanTile = this.scene.pacman.tile,
                distance = Vector.distance(sueTile, pacmanTile);
            if (distance > 8) {
                // target pacman tile
                return pacmanTile;
            } else {
                // move to scatter target
                return this.scatterTargetTile;
            }
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }
}/*
    this class dictates to the scene which scatter or chase phase the
    ghosts should be in at a given moment
*/
class ScatterChase {
    constructor(scene){
        this.scene = scene;
        this.reset();
     }


     get randomScatter() {
         //only applicable for ms pacman
        return GAME_MODE == GAME_MSPACMAN && this.phase == 0 &&  this.phaseTimesRemaining.scatter > 0;
    }

    reset() {
        this.phase = 0;
        this.setTimers();
        this.suspended = false;
        this.scene.globalChaseMode = GameScene.MODE_SCATTER;
    }

    setTimers() {
        var phaseTimes = this['phase'+this.phase];
        this.phaseTimesRemaining = {
            scatter: phaseTimes.scatter,// * 1000,
            chase: phaseTimes.chase,// * 1000
        };
    }

    nextPhase() {
        this.phase++;
        this.setTimers();
    }

    suspend() {
        this.suspended = true;
    }
    resume() {
        this.suspended = false;
    }

    get phase0() {
        //phase 0 timer appears to start slightly before maze characters move/update
        return {
            scatter: this.scene.level<=4?420:300,
            chase: 1200
        }
    }
    get phase1() {
        //same as phase0
        return this.phase0;
    }

    get phase2() {
        var chase;
        if (this.scene.level == 1) {
            chase = 1200;
        } else if (this.scene.level <= 4)
            chase = 61980; //1033 seconds
        else {
            chase = 62220; //1037 seconds
        }
        return {
            scatter: 420,
            chase: chase
        }
    }
    get phase3() {
        return {
            scatter: this.scene.level==1?420:1,
            chase: Infinity  //forever
        }
    }

    tick() {
        //suspended when ghosts are frightened
        if (this.suspended) return;

        //check scatter timeleft first
        if (this.phaseTimesRemaining.scatter > 0) {
            //continue scattering
            this.phaseTimesRemaining.scatter--;// -= progress;
            if (this.phaseTimesRemaining.scatter <= 0) {
                //scatter phase complete, start chasing
                this.phaseTimesRemaining.scatter = 0;
                this.scene.globalChaseMode = GameScene.MODE_CHASE;
                this.scene.ghosts.forEach(ghost => ghost.chase());
            }
        } else if (this.phaseTimesRemaining.chase > 0) {
            //chase mode happening
            this.phaseTimesRemaining.chase--;// -= progress;
            if (this.phaseTimesRemaining.chase <= 0) {
                //enter next phase
                this.phaseTimesRemaining.chase = 0;
                this.nextPhase();
                this.scene.globalChaseMode = GameScene.MODE_SCATTER;
                this.scene.ghosts.forEach(ghost => ghost.scatter());
            }
        }
    }
}class Pellet extends Sprite {
    constructor (scene, x, y) {
        super(scene, x, y, 8, 8);
        this.points = 10;
        this.pellet = true;
    }
    
    get pelletColor() {
        return this.color||(this.scene.maze||{}).pelletColor || "#fcb4aa";
    }

    get hitBox() {
        return {x: this.position.x + 3, y: this.position.y + 3, w: 2, h: 2}
    }

    draw () {
        if (this.hidden) return;
        //doesn't animate, just draw
        var context = this.scene.context;
        context.beginPath();
        context.fillStyle = this.pelletColor;
        context.fillRect(this.position.x + 3, (this.position.y) + 3, 2, 2);
        context.fill();

        // context.beginPath();
        // context.lineWidth = 1;
        // context.strokeStyle = "#FF0000";
        // var tile = this.hitBox;
        // context.strokeRect(tile.x, tile.y, tile.w, tile.h);

    }
}/*
    The big pellet. Energizes pacman and frightens/reverses the ghost when eaten
*/
class Energizer extends Pellet {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.animations = [
            //on texture coords. this will just be a flashing circle
            {frames: 2, ticksPerFrame: 10, curFrame: 0, curFrameTicks: 0}
        ]
        this.points = 50;
        this.pellet = false;
        this.energizer = true;
    }

    draw() {
        if (this.hidden) return;
        //animate this thing
        Sprite.prototype.draw.call(this);
        var animation = this.animation;
        //since energizers flash, only draw when animation frame is 0
        //there is no sprite sheet / texture involved here
        if (animation.curFrame == 0) {
            //draw energizer on the canvas
            var context = this.scene.context;
            context.fillStyle = this.pelletColor;
            // drawing a circle anti-aliases on canvas. doesn't fit aesthetic.. use rectangles
            context.fillRect(this.position.x + 1, (this.position.y) + 1, 6, 6);
            context.fillRect(this.position.x, (this.position.y) + 2, 8, 4);
            context.fillRect(this.position.x + 2, (this.position.y), 4, 8);

            context.fill();
        }
    }
}class MsPacmanFruit extends Actor {
    static MODE_ENTER = 0;
    static MODE_LOOP = 1;
    static MODE_EXIT = 2;

    static HOUSE_TARGET = { x: 13, y: 18 };

    static TURN_PREFERENCE = [Vector.LEFT, Vector.UP, Vector.RIGHT, Vector.DOWN];

    constructor(scene) {
        super(scene, -16, -16, 16, 16);

        this.level = this.scene.level;
        if (this.level > 7) {
            //after level 7, randomly choose fruit
            this.level = Math.floor(Math.random() * 7) + 1;
        }
        this.textureOffset = { x: 504, y: 0 };
        this.fruit = true;

        this.bounceCtr = 0;
        //fruit enters through one of 2 or 4 set paths (depending on maze)
        this.mode = MsPacmanFruit.MODE_ENTER;
        this.enterSequence = this.scene.maze.chooseRandomFruitEntry();
        //place at spawn point
        this.x = this.enterSequence[0].x * 8;
        this.y = this.enterSequence[0].y * 8;
        this.direction = this.x < 1 ? Vector.RIGHT : Vector.LEFT;
        this.x -= this.direction.x * 4; //nudge off the screen
        //skip the first tile in the sequence which is the spawn point (a warp tile)
        this.turn = 1;
        this.targetTile = this.enterSequence[this.turn];
    }



    get hitBox() {
        return { x: this.position.x + 4, y: this.position.y + 4, w: 8, h: 8 }
    }

    get points() {
        switch (this.level) {
            case 1:
                return 100;     //cherry
            case 2:
                return 200;     //strawberry
            case 3:
                return 500;     //orange
            case 4:
                return 700;     //pretzel
            case 5:
                return 1000;    //apple
            case 6:
                return 2000;    //pear
            case 7:
                return 5000;    //banana
        }
    }

    eaten() {
        delete this.scene.fruit;
    }

    get isExiting() {
        return this.mode == MsPacmanFruit.MODE_EXIT;
    }
    get isEntering() {
        return this.mode == MsPacmanFruit.MODE_ENTER;
    }
    get isLooping() {
        return this.mode == MsPacmanFruit.MODE_LOOP;
    }
    get isDone() {
        return this.mode == MsPacmanFruit.MODE_DONE;
    }

    chooseNextDirection(atTile) {

        var choice = -1,
            closest = Infinity,
            validChoices = [];    //keep track of non-wall hitting moves for random selection (frightened mode)
        //cycle through the turn preferences list: UP, LEFT, DOWN, RIGHT
        for (var i = 0; i < Actor.TURN_PREFERENCE.length; i++) {
            var testDirection = Actor.TURN_PREFERENCE[i];
            // can't reverse go back the way we just came
            if (!Vector.equals(Vector.inverse(this.direction), testDirection)) {
                //calculate distance from testTile to targetTile and check if it's the closest
                var testTile = Vector.add(atTile, testDirection),
                    distance = Vector.distance(testTile, this.targetTile);
                if (!this.scene.mazeClass.isWallTile(testTile)) {
                    //this is a valid turn to make
                    validChoices.push(i);
                    if (distance < closest) {
                        //this choice gets the ghost the closest so far
                        choice = i;
                        closest = distance;
                    }
                }
            }
        }
        return Actor.TURN_PREFERENCE[choice];
    }

    tick() {
        Actor.prototype.tick.call(this);        
        if (!this.frozen) {
            this.bounceCtr++;
            //play bounce sound when fruit hits the "floor"
            if (this.bounceCtr%8 == 0) {
                Sound.playOnce('fruit_bounce');
            }
        }
        
        if (this.isTileCenter && !this.madeInstruction) {
            if (this.isEntering && Vector.equals(this.tile, this.enterSequence[this.turn])) {
                if (this.turn < this.enterSequence.length - 1) {
                    this.targetTile = this.enterSequence[++this.turn];
                } else {
                    //mark this- once a full loop is made, choose an exit sequence
                    this.loopTarget = Vector.clone(this.targetTile);
                    //recycle this counter for the exit sequence
                    this.turn = 0;
                    //start looping
                    this.mode = MsPacmanFruit.MODE_LOOP;
                    //target ghost house
                    this.targetTile = MsPacmanFruit.HOUSE_TARGET;
                }
                this.madeInstruction = true;
            } else if (this.isLooping && Vector.equals(this.tile, this.loopTarget)) {
                //completed a lap around the ghost house now
                //randomly choose an exit sequence
                this.exitSequence = this.scene.maze.chooseRandomFruitExit();
                this.mode = MsPacmanFruit.MODE_EXIT;
                this.targetTile = this.exitSequence[this.turn];
                if (Vector.equals(this.targetTile, this.tile)) {
                    //already on the exit point. go to next in sequence
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && Vector.equals(this.tile, this.targetTile)) {
                //made it to the next target of the exit sequence
                if (this.turn < this.exitSequence.length - 1) {
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && (this.tile.x < 0 || this.tile.x > 27)) {
                //fruit has left the building, delete it from the scene
                delete this.scene.fruit;
            }
            //navigate the maze
            var centerPoint = this.centerPixel,
                nextPixel = { x: centerPoint.x + this.direction.x * 5, y: centerPoint.y + this.direction.y * 5 },
                testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };

            //this move would hit a wall, try to continue in same direction of travel
            if (this.scene.mazeClass.isWallTile(testTile) || this.scene.mazeClass.isHouseTile(testTile) || this.scene.mazeClass.isDecisionTile(this.tile)) {
                this.direction = this.chooseNextDirection(this.tile);
                this.madeInstruction = true;
            }
        } else {
            if (!this.isTileCenter) {
                //off tile center, clear the last instruction
                delete this.madeInstruction;
            }
        }
    }

    draw() {
        Actor.prototype.draw.call(this);
        var context = this.scene.context,
            offsetX = (this.level - 1) * 16,
            offsetBounce = 1.5 * Math.sin((this.bounceCtr / 16) * Math.PI) - 0.5;  //bounce the fruit up and down
        context.drawImage(RESOURCE.mspacman,
            this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
            this.position.x, this.position.y + offsetBounce, 16, 16
        );


        // context.beginPath();
        // context.lineWidth = 1;
        // context.strokeStyle = "#FF0000";
        // var tile = this.targetTile;
        // context.strokeRect(tile.x*8, tile.y*8, 8, 8);

    }

    get speedControl() {
        return '00100010001000100010001000100010';
    }
}//instead of making a subclass for each fruit, just jam all info into this single class for everything
class PacmanFruit extends Sprite {
    static POINTS = [100, 300, 500, 700, 1000, 2000, 3000, 5000];
    static getFruitIndex(level) {
        switch(level) {
            case 1:
                return 0;     //cherry
            case 2: 
                return 1;     //strawberry
            case 3:
            case 4:
                return 2;     //orange
            case 5:
            case 6:
                return 3;     //apple
            case 7:
            case 8:
                return 4;    //melon
            case 9:
            case 10:
                return 5;    //galaxian boss
            case 11:
            case 12:
                return 6;    //bell
            default:
                return 7;    //keys
        }
    }

    constructor (scene) {
        super(scene, 13*8, 19.5*8, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 488, y: 48};
        //60 fps == 60 ticks per sec
        this.halfTicksToLive = 2 * 60 * ((Math.random() * (2/3)) + (28/3));   //10ish second timer (should be random between 9.33333 and 10)
        // this.points = this.setPoints();
        this.fruit = true;
    }


    get points() {
        return PacmanFruit.POINTS[PacmanFruit.getFruitIndex(this.scene.level)];
    }

    get hitBox() {
        return {x: this.position.x + 6, y: this.position.y, w: 2, h: 8}
    }

    collide(pacman) {
        return (pacman.centerPixel.x <= this.hitBox.x+this.hitBox.w && pacman.centerPixel.x >= this.hitBox.x && 
                pacman.centerPixel.y <= this.hitBox.y+this.hitBox.h && pacman.centerPixel.y >= this.hitBox.y)
    }

    eaten() {
        this.halfTicksToLive = 0;
    }


    tick() {
        this.halfTicksToLive--;
        if (this.halfTicksToLive < 0) {
            //delete self from board
            delete this.scene.fruit;
        }
    }

    draw() {
        if (this.halfTicksToLive > 0) {
            var context = this.scene.context;
            //do x/y offset based on board.level
            var offsetX = PacmanFruit.getFruitIndex(this.scene.level) * 16;
            context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
                this.position.x, this.position.y, 16, 16  
            );
        }
    }
}//MS PACMAN
// http://cubeman.org/arcade-source/mspac.asm
// https://raw.githubusercontent.com/BleuLlama/GameDocs/master/disassemble/mspac.asm


//great guide!!
//https://gamefaqs.gamespot.com/arcade/583976-ms-pac-man/faqs/1298
//http://spyhunter007.com/the_1983_ms_pacman_bozeman_montana_think_tank.htm
//https://www.retrogamer.net/retro_games80/the-making-of-ms-pac-man/


//AI papers
// http://www.cs.nott.ac.uk/~pszgxk/papers/cig2010.pdf
// http://lisc.mae.cornell.edu/LISCpapers/TCIAGGregModelBasedPacmanJune2017.pdf
// https://www.researchgate.net/publication/221157530_A_simple_tree_search_method_for_playing_Ms_Pac-Man

//game credits for fun
var CREDITS = 0;

//game choice
var GAME_PACMAN = 0,
    GAME_MSPACMAN = 1,
    GAME_MODE = GAME_PACMAN, //default to pacman
    TitleScene, StartScene, CutScene1, CutScene2, CutScene3, LevelSprite, PacClass, Points, Fruit;    //these will be set when player picks a game mode    


var LAST_SCORES = [
    [0,null],   //pacman
    [0,null]    //mspacman
]

//load resources (sprite sheets)
var RESOURCE = {
    mspacman: document.createElement('img'),
    pacman: document.createElement('img'),
    text: document.createElement('img')
}
RESOURCE.mspacman.src = 'res/mspacman/mspacman.png';
RESOURCE.pacman.src = 'res/pacman/pacman.png';
RESOURCE.text.src = 'res/text.png';

//create the game screen canvas
var SCREEN = document.createElement('canvas'),
    context = SCREEN.getContext('2d'),
    scale = 2.0;
SCREEN.id = "screen";
SCREEN.width = 224*scale;
SCREEN.height = 288*scale;

//turn off scale antialiasing
context.webkitImageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.imageSmoothingEnabled = false;
context.scale(scale, scale)

//draw black background on canvas
SCREEN.style.background = 'black';
SCREEN.style.border = 'solid';
document.body.appendChild(SCREEN);



function loop() {

    if (!pauseGame) {
        SceneManager.update();  
    }

    //deal with sound engine
    if (pauseGame && !wasPaused) {
        Sound.suspend();
    } else if (!pauseGame && wasPaused) {
        Sound.resume();
    }

    wasPaused = pauseGame;

    window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop)

//create the game screen
var creditsScene = new CreditsScene(context);
SceneManager.pushScene(creditsScene);

var pauseGame = false,
    wasPaused = false;
