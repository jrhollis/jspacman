/**
 * a scene instance holds a reference to the canvas context for drawing.
 * each different "screen" in the game will be represented by a scene or
 * subclass of scene.
 */
class Scene {
    constructor(context) {
        //save a reference to the canvas context
        this.context = context;
    }
    
    tick() {} //stub

    draw() {
        //clear the canvas on each draw
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}