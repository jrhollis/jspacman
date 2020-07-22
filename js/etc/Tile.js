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
    //maze wall
    get wall() {
        return this.type == '.';
    }
    //open tile. no pellets or anythign else on it
    get open() {
        return this.type == '0';
    }
    get pellet() {
        return this.type == '1' || this.type == '2';
    }
    get energizer() {
        return this.type == '3';
    }
    //tunnel tile - slows the ghosts
    get tunnel() {
        return this.type == '5';
    }
    //ghost house tile - slows the ghosts
    get house() {
        return this.type == '6';
    }
    //decision tiles are where the ghosts make their next move depending on their AI
    //these occur at most (but not all) intersections in the maze
    get decision() {
        return this.type == '4' || this.type == '2';
    }
    //can pac-man move over this tile
    get walkable() {
        return !this.house && !this.wall;
    }
}