/*
    this class dictates to the scene which scatter or chase phase the
    ghosts should be in at a given moment
*/
class ScatterChase {
    constructor(scene){
        this.scene = scene;
        this.reset();
     }


     get randomScatter() {
         //only applicable for ms pacman
        return GAME_MODE == GAME_MSPACMAN && this.phase == 0 &&  this.phaseTimesRemaining.scatter > 0;
    }

    reset() {
        this.phase = 0;
        this.setTimers();
        this.suspended = false;
        this.scene.globalChaseMode = GameScene.MODE_SCATTER;
    }

    setTimers() {
        var phaseTimes = this['phase'+this.phase];
        this.phaseTimesRemaining = {
            scatter: phaseTimes.scatter,// * 1000,
            chase: phaseTimes.chase,// * 1000
        };
    }

    nextPhase() {
        this.phase++;
        this.setTimers();
    }

    suspend() {
        this.suspended = true;
    }
    resume() {
        this.suspended = false;
    }

    get phase0() {
        //phase 0 timer appears to start slightly before maze characters move/update
        return {
            scatter: this.scene.level<=4?420:300,
            chase: 1200
        }
    }
    get phase1() {
        //same as phase0
        return this.phase0;
    }

    get phase2() {
        var chase;
        if (this.scene.level == 1) {
            chase = 1200
        } else if (this.scene.level <= 4)
            chase = 61980;
        else {
            chase = 5220;
        }
        return {
            scatter: 420,
            chase: chase
        }
    }
    get phase3() {
        return {
            scatter: this.scene.level==1?420:1,
            chase: Infinity  //forever
        }
    }

    tick() {
        //suspended when ghosts are frightened
        if (this.suspended) return;

        //check scatter timeleft first
        if (this.phaseTimesRemaining.scatter > 0) {
            //continue scattering
            this.phaseTimesRemaining.scatter--;// -= progress;
            if (this.phaseTimesRemaining.scatter <= 0) {
                //scatter phase complete, start chasing
                this.phaseTimesRemaining.scatter = 0;
                this.scene.globalChaseMode = GameScene.MODE_CHASE;
                this.scene.ghosts.forEach(ghost => ghost.chase());
            }
        } else if (this.phaseTimesRemaining.chase > 0) {
            //chase mode happening
            this.phaseTimesRemaining.chase--;// -= progress;
            if (this.phaseTimesRemaining.chase <= 0) {
                //enter next phase
                this.phaseTimesRemaining.chase = 0;
                this.nextPhase();
                this.scene.globalChaseMode = GameScene.MODE_SCATTER;
                this.scene.ghosts.forEach(ghost => ghost.scatter());
            }
        }
    }
}