/**
 * the Sound class uses Web Audio API. One sound track for each game mode
 * contains all the sound effects for that respective game. this class
 * picks the sound track apart and plays snippets from each game's track as a
 * sound effect.
 * 
 * !!!!! In order for sound effects to work, this game must be loaded through
 * a web server because it loads the sound effects files via XMLHttpRequest
 */
class Sound {
    static initialize() {
        if (this.initialized) return;
        this.initialized = true;
        //safari polyfill
        if (!window.AudioContext && window.webkitAudioContext) {
            var oldFunc = webkitAudioContext.prototype.decodeAudioData;
            webkitAudioContext.prototype.decodeAudioData = function (arraybuffer, cb) {
                return new Promise((resolve, reject) => {
                    // cb.call(this, arraybuffer, resolve, reject);
                    oldFunc.call(this, arraybuffer, cb, reject);
                });
            }
        }
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.unlockAudioContext(this.context);
        this.volume = 0.1;
        //load each sound track
        this.loadSound('res/pacman/sfx.mp3').then(buffer => this.sfx_0 = buffer);
        this.loadSound('res/mspacman/sfx.mp3').then(buffer => this.sfx_1 = buffer);
    }


    static unlockAudioContext(audioCtx) {
        if (audioCtx.state === 'suspended') {
            var events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
            var unlock = function unlock() {
                events.forEach(function (event) {
                    document.body.removeEventListener(event, unlock)
                });
                audioCtx.resume();
            };

            events.forEach(function (event) {
                document.body.addEventListener(event, unlock, false)
            });
        }
    }

    //list of currently running sounds. used for stopAll()
    static playing = {};

    //time offsets for each sound effect in the sfx.ogg file
    static sfx = [{    //GAME_PACMAN res/pacman/sfx.ogg
        siren0: { start: 17.125, end: 17.504 },
        siren1: { start: 18.51595, end: 18.788359 },
        siren2: { start: 19.84, end: 20.134 },
        siren3: { start: 21.14, end: 21.3985 },
        retreating: { start: 22.399, end: 22.663 },
        power_pellet: { start: 23.852, end: 23.988 },
        intermission: { start: 25.255, end: 30.418 },
        die: { start: 2.692, end: 4.184 },
        munch0: { start: 5.315, end: 5.394 },
        munch1: { start: 6.443, end: 6.525 },
        game_start: { start: 36.570, end: 40.776 },
        eat_ghost: { start: 8.794, end: 9.301 },
        extra_life: { start: 10.387, end: 12.351 },
        eat_fruit: { start: 13.463, end: 13.846 },
        credit: { start: 14.380, end: 14.595 }
    }, {   //GAME_MSPACMAN res/pacman/sfx.ogg
        credit: { start: 1.111, end: 1.357 },
        game_start: { start: 3.087, end: 7.313 },
        siren0: { start: 50.562, end: 50.695 },
        siren1: { start: 52.118, end: 52.269 },
        siren2: { start: 53.576, end: 53.743 },
        siren3: { start: 54.824, end: 55.008 },
        munch0: { start: 48.396, end: 48.526 },
        munch1: { start: 48.396, end: 48.526 },
        power_pellet: { start: 56.990, end: 95.991 },
        retreating: { start: 99.063, end: 99.664 },
        extra_life: { start: 100.148, end: 102.137 },
        eat_fruit: { start: 103.146, end: 103.533 },
        eat_ghost: { start: 106.292, end: 106.795 },
        fruit_bounce: {start: 107.293, end: 107.496 },
        die: { start: 104.427, end: 105.567 },
        act1: { start: 9.889, end: 18.470 },
        act2: { start: 19.049, end: 40.421 },
        act3: { start: 41.195, end: 46.171 }
    }];


    /**
     * siren pointer. as pellets are eaten, the siren will change
     */
    static siren = 0;
    static resetSiren() {
        this.siren = 0;
    }
    /**
     * determine which siren to play based on number of pellets remaining in maze.
     * when the siren is changed, the old siren must first be stopped.
     * @param {int} pelletsLeft pellets remaining on maze
     */
    static checkSiren(pelletsLeft) {
        //I think these are the pellet counts at which the siren
        //changes tone
        if (pelletsLeft > 108) {
            this.setSiren(0);
        } else if (pelletsLeft > 44) {
            this.setSiren(1);
        } else if (pelletsLeft > 12) {
            this.setSiren(2);
        } else {
            this.setSiren(3);
        }
    }
    static setSiren(siren) {
        if (this.siren != siren) {
            //siren change
            this.stop('siren');
        }
        this.siren = siren;
    }

    /**
     * siren pointer. as pellets are eaten, the siren will change
     * @param {*} fx sound effect name from this.sfx to play
     */
    static playLoop(fx) {
        if (fx == 'siren') {
            fx += this.siren;
        }
        //only play this clip once
        if (this.sfx[Game.GAME_MODE][fx].source) return;
        this.playing[fx] = true;
        var source = this.context.createBufferSource();
        source.buffer = this['sfx_' + Game.GAME_MODE];
        source.loop = true;
        var loop = this.sfx[Game.GAME_MODE][fx];
        source.loopStart = loop.start;
        source.loopEnd = loop.end;
        source.connect(this.context.destination);
        source.start(0, loop.start);
        this.sfx[Game.GAME_MODE][fx].source = source;
        source.addEventListener('ended', () => {
            delete this.sfx[Game.GAME_MODE][fx].source;
            delete this.playing[fx];
        });
        return source;
    }

    /**
     * this counter is only for pacman. his sound fx flips back and forth each time he eats a pellet
     */
    static munch = 0;

    /**
     * play sound effect one time
     * @param {} fx sound effect name from this.sfx to play
     */
    static playOnce(fx) {
        if (fx == 'munch') {
            this.stop('munch');
            fx += this.munch;
            this.munch = (this.munch + 1) % 2;
        }
        if (this.sfx[Game.GAME_MODE][fx].source) return;
        var source = this.context.createBufferSource();
        source.buffer = this['sfx_' + Game.GAME_MODE];
        var clip = this.sfx[Game.GAME_MODE][fx];
        source.connect(this.context.destination);
        source.start(0, clip.start, clip.end - clip.start);
        this.sfx[Game.GAME_MODE][fx].playing = true;
        this.sfx[Game.GAME_MODE][fx].source = source;
        source.addEventListener('ended', () => {
            delete this.sfx[Game.GAME_MODE][fx].source;
        });
        return source;
    }

    /**
     * stop a currently-playing sfx
     * @param {*} fx sound effect name from this.sfx to stop
     */
    static stop(fx) {
        if (fx == 'siren') {
            fx += this.siren;
        }
        if (this.sfx[Game.GAME_MODE][fx] && this.sfx[Game.GAME_MODE][fx].source) {
            this.sfx[Game.GAME_MODE][fx].source.stop();
        }
    }

    /**
     * stop all currently playing sound effects
     */
    static stopAll() {
        for (var fx in this.playing) {
            this.stop(fx);
        }
    }

    /**
     * unpauses all sounds
     */
    static resume() {
        if (this.context) this.context.resume();
    }

    /**
     * pauses all sounds
     */
    static suspend() {
        if (this.context) this.context.suspend();
    }


    /**
     * load a sound file into an audio buffer for processing
     * @param {*} url location of sound file
     */
    static loadSound(url) {
        return new Promise((resolve, reject) => {
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.onload = () => {
                this.context.decodeAudioData(request.response, function (buffer) {
                    resolve(buffer)
                });
            }
            request.send();
        });
    }
}