/**
 * this class dictates to the scene which scatter or chase phase the
 * ghosts should be in at a given moment. basically a glorified timer.
 * the durations of each scatter/chase phase are dependent on the 
 * current level
 */
class ScatterChase {
    constructor(scene){
        this.scene = scene;
        this.reset();
     }

     /**
      * phase 0 scatter in ms pacman is random movements for pinky and blinky
      */
     get randomScatter() {
        return Game.GAME_MODE == Game.GAME_MSPACMAN && this.phase == 0 &&  this.phaseTimesRemaining.scatter > 0;
    }

    /**
     * reset the phase and timers
     */
    reset() {
        this.phase = 0;
        this.setTimers();
        this.suspended = false;
        this.scene.globalChaseMode = GameScene.MODE_SCATTER;
    }

    /**
     * set the countdowns for the current phase
     */
    setTimers() {
        var phaseTimes = this['phase'+this.phase];
        this.phaseTimesRemaining = {
            scatter: phaseTimes.scatter,
            chase: phaseTimes.chase,
        };
    }

    /**
     * progress to the next phase in the sequence. replenish countdowns
     * 
     */
    nextPhase() {
        this.phase++;
        this.setTimers();
    }

    /**
     * scatter/chase suspends when ghosts are frightened
     */
    suspend() {
        this.suspended = true;
    }
    resume() {
        this.suspended = false;
    }

    get phase0() {
        //phase 0 timer appears to start slightly before maze characters move/update
        return {
            scatter: this.scene.level<=4?420:300, //7 else 5 seconds
            chase: 1200 //20 seconds
        }
    }
    get phase1() {
        //same as phase0
        return this.phase0;
    }

    get phase2() {
        var chase;
        if (this.scene.level == 1) {
            chase = 1200; //20 sec
        } else if (this.scene.level <= 4)
            chase = 61980; //1033 seconds
        else {
            chase = 62220; //1037 seconds
        }
        return {
            scatter: 420, //7 seconds
            chase: chase
        }
    }
    get phase3() {
        return {
            scatter: this.scene.level==1?420:1, //7 else 1/60 sec
            chase: Infinity  //forever
        }
    }

    tick() {
        //don't count down if scatter/chase is suspended
        if (this.suspended) return;

        //check scatter timeleft first
        if (this.phaseTimesRemaining.scatter > 0) {
            //continue scattering
            this.phaseTimesRemaining.scatter--;;
            if (this.phaseTimesRemaining.scatter == 0) {
                //scatter phase complete, start chasing
                this.scene.globalChaseMode = GameScene.MODE_CHASE;
                this.scene.ghosts.forEach(ghost => ghost.chase());
            }
        } else if (this.phaseTimesRemaining.chase > 0) {
            //chase mode happening
            this.phaseTimesRemaining.chase--;
            if (this.phaseTimesRemaining.chase == 0) {
                //enter next phase
                this.nextPhase();
                this.scene.globalChaseMode = GameScene.MODE_SCATTER;
                this.scene.ghosts.forEach(ghost => ghost.scatter());
            }
        }
    }
}