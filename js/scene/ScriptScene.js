/**
 * ScriptScene keeps a ctr of each tick and will execute a
 * function from keyFrames if it is assigned to that tick.
 */
class ScriptScene extends Scene {
    constructor(context, keyFrames) {
        super(context);
        this.keyFrames = keyFrames;
        this.ctr = 0;
    }

    tick() {
        this.ctr++;
        var keyFrame = this.keyFrames[this.ctr];
        if (keyFrame == 'loop') {
            //this scene is looped, start over now
            this.ctr = 0;
            keyFrame = this.keyFrames[this.ctr];
        }
        if (keyFrame == 'end') {
            //this scripted scene is done
            SceneManager.popScene();
        } else if (keyFrame) {
            //execute the keyframe function
            keyFrame.call(this);
        }
    }

}