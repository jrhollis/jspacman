//MS PACMAN


//great guide!!
//https://gamefaqs.gamespot.com/arcade/583976-ms-pac-man/faqs/1298
//http://spyhunter007.com/the_1983_ms_pacman_bozeman_montana_think_tank.htm
//https://www.retrogamer.net/retro_games80/the-making-of-ms-pac-man/


//AI papers
// http://www.cs.nott.ac.uk/~pszgxk/papers/cig2010.pdf
// http://lisc.mae.cornell.edu/LISCpapers/TCIAGGregModelBasedPacmanJune2017.pdf
// https://www.researchgate.net/publication/221157530_A_simple_tree_search_method_for_playing_Ms_Pac-Man


//these will be set when player picks a game mode    
var TitleScene, StartScene, CutScene1, CutScene2, CutScene3, LevelSprite, PacClass, Points, Fruit;    //these will be set when player picks a game mode    

//load resources (sprite sheets)
var RESOURCE = {
    mspacman: new Image(),
    pacman: new Image(),
    text: new Image()
}
RESOURCE.mspacman.src = 'res/mspacman/mspacman.png';
RESOURCE.pacman.src = 'res/pacman/pacman.png';
RESOURCE.text.src = 'res/text.png';

var GAME = new Game(null, 2);