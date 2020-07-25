/**
 * holds a list of scenes. will only update the scene
 * on the top of the stack (current scene)
 */
class SceneManager {
    //list of scenes
    static stack = [];

    /**
     * put a scene on top of the stack. becomes the current scene
     * @param {*} scene 
     */
    static pushScene(scene) {
        this.stack.push(scene);
    }

    /**
     * remove the current scene. the scene "below" it becomes 
     * current
     */
    static popScene() {
        this.stack.pop();
    }

    /**
     * remove the current scene from the stack and add a new one to it
     * @param {*} scene 
     */
    static replaceScene(scene) {
        this.popScene();
        this.pushScene(scene);
    }

    /**
     * return the last scene in the stack
     */
    static currentScene() {
        if (this.stack.length) {
            return this.stack[this.stack.length-1]
        } else {
            return null;
        }
    }

    /**
     * ticks and draws the current scene
     */
    static update() {
        var scene = this.currentScene();
        if (scene) {
            scene.tick();
            scene.draw();    
        }
    }
}