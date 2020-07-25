class MsPacman1 extends Maze {
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

    //warp tiles (could find these programmatically)
    static WARP_TILES = [
        {x: -1, y: 10.5},
        {x: -1, y: 19.5},
        {x: 28, y: 10.5},
        {x: 28, y: 19.5}
    ];

    //fruit entrance sequences
    static ENTER_TARGETS = [
        [{x: 9, y: 11},{x: 9, y: 14}], //upper left
        [{x: 4, y: 26}, {x: 18, y: 26}, {x: 15, y: 20}], //lower left
        [{x: 24, y: 20}, {x: 18, y: 17}], //upper right
        [{x: 22, y: 23}, {x: 15, y: 20}] //lower right
    ];

    //fruit exit sequences
    static EXIT_TARGETS = [
        [{x: 9, y: 14}], //upper left
        [{x: 12, y: 20}, {x: 10, y: 23}], //lower left
        [{x: 15, y: 20}, {x: 18, y: 23}], //upper right
        [{x: 15, y: 20}, {x: 18, y: 23}] //lower right
    ];

    constructor(board) {
        super(board, RESOURCE.mspacman);
        this.pelletColor = '#dedffe';
        //release a fruit at these many pellets eaten (including energizers)
        this.fruitRelease = [64, 172];
    }

    get textureOffset() {
        //depends on level
        var scene = this.scene, 
            pacman = scene.pacman;
        if (scene.numPlayers == 1 && scene.level == 1 && (pacman.lives >= 2 || (!pacman.isAlive && pacman.lives == 1))) {
            //bug where maze is blue and red on first play for one player
            return {x: 0, y: 992};
        } else {
            return {x: 228, y: 0};
        }
    }
}
//inherit statics and load map
Object.assign(MsPacman1, Maze);
MsPacman1.initialize();