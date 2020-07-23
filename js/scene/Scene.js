class Scene {
    constructor(context) {
        this.context = context;
    }
    
    tick() {}

    draw() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}