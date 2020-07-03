class Scene {
    constructor(context) {
        this.context = context;
        this.mazeClass = Maze;
    }
    
    tick() {

    }

    draw() {
        this.context.clearRect(0, 0, SCREEN.width, SCREEN.height);
    }
}