class SceneManager {
    static stack = [];

    static pushScene(scene) {
        this.stack.push(scene);
    }

    static popScene() {
        this.stack.pop();
    }

    static replaceScene(scene) {
        this.popScene();
        this.pushScene(scene);
    }

    static currentScene() {
        if (this.stack.length) {
            return this.stack[this.stack.length-1]
        } else {
            return null;
        }
    }

    static update() {
        Input.watch();
        var scene = this.currentScene();
        if (scene) {
            scene.tick();
            scene.draw();    
        }
    }
}