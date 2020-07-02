class Tile {
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
}