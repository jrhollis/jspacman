class ScriptScene extends Scene {
    constructor(context, keyFrames) {
        super(context);
        this.keyFrames = keyFrames;
        this.ctr = 0;
    }

    tick() {
        this.ctr++;
        //if ctr > scene length
        var keyFrame = this.keyFrames[this.ctr];
        if (keyFrame == 'loop') {
            //start over
            this.ctr = 0;
            keyFrame = this.keyFrames[this.ctr];
        }
        if (keyFrame == 'end') {
            SceneManager.popScene();
        } else if (keyFrame) {
            keyFrame.call(this);
        }
    }

}