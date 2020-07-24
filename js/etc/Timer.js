/**
 * simple class that just keeps track of a countdown. when the
 * countdown is complete, fire the callback. used for ghost fright/flash timers, 
 * start/end of level sequences, and other game play timings
 */
class Timer {
    /**
     * nothing is passed to the constructor. a Timer doesn't do anything until
     * .start(...) is called on it with the countdown and callbacks passed to it there.
     */
    constructor() {}

    /**
     * define and start a timer countdown and an action to take at the end
     * of the countdown
     * 
     * @param {*} ticks number of ticks to set the countdown for
     * @param {*} callback callback to execute when tick countdown reaches zero
     */
    start(ticks, callback) {
        this.originalTicks = ticks;
        this.ticks = ticks;
        this.callback = callback;
        if (ticks <= 0) {
            //started with no or negative time, just do the call back immediately
            this.ticks = 0;
            this.callback.call(this);
        }
    }

    /**
     * start the timer back up
     * @param {*} ticks the number of ticks to set on the timer
     */
    reset(ticks) {
        this.ticks = ticks||this.originalTicks; 
    }

    /**
     * kill the timer
     */
    stop() {
        this.ticks = 0;
    }

    /**
     * countdown the timer. when time's up, execute the call back
     */
    tick() {
        if (this.ticks > 0) {
            this.ticks--;
            if (this.ticks == 0) {
                //time is up
                this.callback.call(this);
            }
        }
        return this.ticks > 0;
    }
}