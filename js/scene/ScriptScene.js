/**
 * ScriptScene keeps a ctr of each tick and will execute a
 * function from keyFrames if it is assigned to that tick. extend
 * this class for cutscenes and title scenes
 */
class ScriptScene extends Scene {
    /**
     * the constructor takes an object of tick timestamps and functions to execute at that
     * tick. timestamps can also have a few special values: 
     * 'end'    will end the scene and pop it from the SceneManager. 
     * 'loop'   will start the script over at the beginning
     * 
     * @param {*} context 
     * @param {*} keyFrames object of timestamps and functions to execute at that time
     * 
     */
    constructor(context, keyFrames) {
        super(context);
        this.keyFrames = keyFrames;
        //things to draw in this scene
        this.drawables = [];
        //things that move- pacmans, ghosts
        this.actors = [];
        //how many ticks has this scene been active
        this.ctr = 0;
    }

    tick() {
        //increment the tick ctr
        this.ctr++;
        //see if there's a callback to execute at this tick
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
        for (var i = 0; i < 2; i++) {
            this.actors.forEach(a => a.tick());
        }
    }


    draw() {
        Scene.prototype.draw.call(this);
        this.drawables.forEach(d => d.draw());
    }

}