//MS PACMAN
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
