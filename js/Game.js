class Game {
    static GAME_PACMAN = 0;
    static GAME_MSPACMAN = 1;
    static GAME_MODE = 0; //pacman

    static CREDITS = 0;

    static LAST_SCORES = [
        [0,null],   //pacman
        [0,null]    //mspacman
    ];

    constructor(el) {
        this.el = (el?document.getElementById(el):document.body)||document.body;

        this.pauseGame = false;
        this.wasPaused = false;

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d'),
        this.scale = 2.0;
        this.canvas.width = 224*this.scale;
        this.canvas.height = 288*this.scale;
        
        //turn off scale antialiasing
        this.context.webkitImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.imageSmoothingEnabled = false;
        this.context.scale(this.scale, this.scale)
        
        //draw black background on canvas
        this.canvas.style.background = 'black';
        this.canvas.style.border = 'solid';
        this.el.appendChild(this.canvas);

        //set up scene manager with credits scene
        SceneManager.pushScene(new CreditsScene(this.context));

        //start game loop
        window.requestAnimationFrame(()=>this.loop());
    }


    /**
     * the game loop. where the magic happens
     */
    loop() {

        if (!this.pauseGame) {
            SceneManager.update();  
        }
    
        //deal with sound engine
        if (this.pauseGame && !this.wasPaused) {
            Sound.suspend();
        } else if (!this.pauseGame && this.wasPaused) {
            Sound.resume();
        }
    
        this.wasPaused = this.pauseGame;
    
        window.requestAnimationFrame(()=>this.loop());
    }
}
