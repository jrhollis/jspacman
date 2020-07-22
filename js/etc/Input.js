class Input {
    static lastKey = null;
    static buffer = [];
    static keyState = {};

    static reset() {
        Input.buffer = [];
    }

    static onKeyDown(e) {
        Input.keyState[''+e.keyCode] = 1;
        Input.lastKey = e.keyCode;
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            e.preventDefault();
            return false;
        }

        if (e.keyCode == 32) {
            pauseGame = !pauseGame;
            e.preventDefault();
            return false;
        }
        if (e.keyCode == 70) {
            pauseGame = true;
            //render next frame
            SceneManager.update();
            e.preventDefault();
            return false;
        }
        // console.log(e.keyCode)
        //read once
        if (!Input.keyDown) {
            Input.keyPress = e.keyCode;
        }
        Input.keyDown = true;
    }

    static onKeyUp(e) {
        delete Input.keyState[e.keyCode];
        delete Input.lastKey;
        Input.keyDown = false;
    }

    static watch() {
        //two frame delay- stop- change direction
        var nextDirection;
        if (Input.keyState['37']) {
            nextDirection = Vector.LEFT;
        } else if (Input.keyState['39']) {
            nextDirection = Vector.RIGHT;
        } else if (Input.keyState['38']) {
            nextDirection = Vector.UP;
        } else if (Input.keyState['40']) {
            nextDirection = Vector.DOWN;
        }
        Input.buffer.unshift(nextDirection);
        if (Input.buffer.length == 3) {
            Input.buffer.pop();
        }
    }


    static readKeyPress() {
        var k = this.keyPress;
        delete this.keyPress;
        return k;
    }


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