//. = wall
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
Pacman1.initialize();