class Timer {
    constructor() {}

    start(ticks, callback, wait) {
        this.wait = wait;
        this.originalTicks = ticks;
        this.ticks = ticks; //one frame delay on starts
        this.callback = callback;
        if (ticks <= 0) {
            //started with no or negative time, just do the call back
            this.ticks = 0;
            this.callback.call(this);
        }
    }

    reset(ticks) {
        this.ticks = ticks||this.originalTicks; 
    }

    stop() {
        this.ticks = 0;
    }

    tick() {
        if (this.ticks > 0) {
            this.ticks--;
            if (this.ticks == 0) {
                //time is up
                this.callback.call(this);
            }
        }
        return this.wait || this.ticks > 0;
    }
}