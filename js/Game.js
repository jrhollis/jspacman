/**
 * Game class creates a canvas and fires up a game loop.
 */
class Game {
    //pacman cannot die!
    static GOD_MODE = false;
    // static GOD_MODE = true;

    //skip cutscenes
    static SKIP_CUTSCENES = false;
    // static SKIP_CUTSCENES = false;

    //pacman can't run out of lives
    // static PRACTICE_MODE = true;
    static PRACTICE_MODE = false;

    //which game mode is being played
    static GAME_PACMAN = 0;
    static GAME_MSPACMAN = 1;
    static GAME_MODE = 0; //pacman

    //credits to play.. for fun I guess
    static CREDITS = 0;

    //last game's scores for each player and each game mode
    static LAST_SCORES = [
        [0,null],   //pacman
        [0,null]    //mspacman
    ];

    //used of local storage doesn't work
    static TEMP_HIGH_SCORE = 0;

    /**
     * retrieve the current high score
     * @param {*} mode game mode
     */
    static getHighScore(mode) {
        try {
            return parseInt(localStorage['highscore_' + mode]||'0');
        } catch(ex) {
            //if localStorage not available, just take the last high score
            var oldHigh =  Math.max(...this.LAST_SCORES[mode]),
                high = Math.max(oldHigh, this.TEMP_HIGH_SCORE);
            return high;
        }
    }

    /**
     * check to set a new high score
     * @param {*} mode  game mode
     * @param {*} score score of the game
     */
    static setHighScore(mode, score) {
        try {
            localStorage['highscore_' + mode] = score;
        } catch(ex) {
            //localStorage not available
        } finally {
            this.TEMP_HIGH_SCORE = Math.max(this.TEMP_HIGH_SCORE, score);
        }
    }

    /**
     * 
     * @param {*} el element to attach the canvas to. defaults to document.body
     * @param {int} scale how many times larger to make the screen. default is 2
     */
    constructor(el, scale) {
        this.el = (el?document.getElementById(el):document.body)||document.body;

        //pause controls. space bar will pause/unpause the game. see Input.js
        this.pauseGame = false;
        this.wasPaused = false;

        //create the canvas and scale it so it's not so tiny
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d'),
        this.scale = scale || 2.0;
        this.canvas.width = 224*this.scale;
        this.canvas.height = 288*this.scale;
        
        //turn off antialiasing on the scaling
        this.context.webkitImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.imageSmoothingEnabled = false;
        this.context.scale(this.scale, this.scale)
        
        //draw black background on canvas
        this.canvas.style.background = 'black';
        this.canvas.style.border = 'solid';
        this.el.appendChild(this.canvas);

        //set up scene manager with credits scene as initial scene
        SceneManager.pushScene(new CreditsScene(this.context));

        //start game loop
        this.fpsLimit = 60;
        this.previousDelta = 0;
        window.requestAnimationFrame((d)=>this.loop(d));
    }



    /**
     * the game loop. where the magic happens
     */
    loop(currentDelta) {
        //lock to ~60fps
        var delta = currentDelta - this.previousDelta;

        // if (this.fpsLimit && delta < 1000 / this.fpsLimit) {
            // window.requestAnimationFrame((d)=>this.loop(d));
            // return;
        // }

        //if not paused, play the action
        if (!this.pauseGame) {
            Input.watch();
            SceneManager.update();  
        }

        //deal with sound engine when pausing
        if (this.pauseGame && !this.wasPaused) {
            Sound.suspend();
        } else if (!this.pauseGame && this.wasPaused) {
            Sound.resume();
        }
        this.wasPaused = this.pauseGame;

        //request another frame to continue the game loop
        window.requestAnimationFrame((d)=>this.loop(d));
        this.previousDelta = currentDelta;
    }
}
