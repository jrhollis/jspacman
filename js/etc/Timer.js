/**
 * simple class that just keeps track of a countdown. when the
 * countdown is complete, fire the callback
 */
class Timer {
    constructor() {}

    start(ticks, callback) {
        this.originalTicks = ticks;
        this.ticks = ticks;
        this.callback = callback;
        if (ticks <= 0) {
            //started with no or negative time, just do the call back
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