/**
 * this class reads key presses and keeps a two frame buffer 
 * since inputs appear to be delayed in the game
 */
class Input {
    //remember the last key pressed
    static lastKey = null;
    //frame delay buffer
    static buffer = [];
    //hash of currently pressed keys (hashkey = keycode)
    //and their state
    static keyState = {};

    /**
     * clear the key (frame delay) buffer
     */
    static reset() {
        Input.buffer = [];
    }

    /**
     * read key presses
     * @param {*} e key down event
     */
    static onKeyDown(e) {
        //tag this key state as pressed
        Input.keyState[''+e.keyCode] = 1;
        //remember the last key pressed
        Input.lastKey = e.keyCode;
        //if pressing arrow keys, prevent default so the web page doesn't scroll
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            e.preventDefault();
            return false;
        }
        //if space bar is pressed pause the game
        if (e.keyCode == 32) {
            GAME.pauseGame = !GAME.pauseGame;
            e.preventDefault();
            return false;
        }
        //if "F" key is pressed, pause and advance the game one frame
        if (e.keyCode == 70) {
            GAME.pauseGame = true;
            //render next frame
            Input.watch();
            SceneManager.update();
            e.preventDefault();
            return false;
        }
        // console.log(e.keyCode)
        //read the pressed key once if no keys are currently being pressed
        if (!Input.keyDown) {
            Input.keyPress = e.keyCode;
        }
        //a key is being pressed
        Input.keyDown = true;
    }

    /**
     * 
     * @param {*} e key up event
     */
    static onKeyUp(e) {
        delete Input.keyState[e.keyCode];
        delete Input.lastKey;
        //a key is no longer being pressed
        Input.keyDown = false;
    }

    /**
     * called every tick. keeps track of which keys
     * are pressed at this time and queues up the next direction
     * into the two frame delay buffer
     */
    static watch() {
        var nextDirection;
        if (Input.keyState['37'] || Input.keyState['65']) {
            nextDirection = Vector.LEFT;
        } else if (Input.keyState['39'] || Input.keyState['68']) {
            nextDirection = Vector.RIGHT;
        } else if (Input.keyState['38'] || Input.keyState['87']) {
            nextDirection = Vector.UP;
        } else if (Input.keyState['40'] || Input.keyState['83']) {
            nextDirection = Vector.DOWN;
        }
        Input.buffer.unshift(nextDirection);
        if (Input.buffer.length == 3) {
            Input.buffer.pop();
        }
    }

    /**
     * returns the last key pressed
     */
    static readKeyPress() {
        var k = this.keyPress;
        delete this.keyPress;
        return k;
    }

    /**
     * reads the key press from two frames ago
     */
    static readBuffer() {
        if (Input.buffer.length == 2) {
            return Input.buffer[1];
        } else {
            return null;
        }
    }
}

//swallow the key strokes
document.onkeydown = Input.onKeyDown;
document.onkeyup = Input.onKeyUp;