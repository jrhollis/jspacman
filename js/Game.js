/**
 * Game class creates a canvas and fires up a game loop.
 */
class Game {
    //pacman cannot die!
    static GOD_MODE = false;

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
        window.requestAnimationFrame(()=>this.loop());
    }


    /**
     * the game loop. where the magic happens
     */
    loop() {
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
        window.requestAnimationFrame(()=>this.loop());
    }
}
