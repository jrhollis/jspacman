class Inky extends Ghost {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.name = 'Inky';
        this.startDirection = Vector.UP;
        this.textureOffsetY = 32;
        this.scatterTargetTile = { x: 27, y: 35 };
        this.reset();
    }

    /**
     * inky leave the ghost house after 30 pellets eaten on level 1 only
     */
    get pelletLimit() {
        return this.scene.level==1?30:0;
    }


    /**
     * inky looks two tiles in front of pacman, draws a vector from blinky to that spot and doubles it
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var blinkyTile = this.scene.ghosts.Blinky.tile,
                pacmanTile = this.scene.pacman.tile,
                pacmanDirection = this.scene.pacman.direction,
                targetTile = { 
                    x: pacmanTile.x + (pacmanDirection.x * 2), 
                    y: pacmanTile.y + (pacmanDirection.y * 2) 
                };
            //emulate overflow bug where if pacman is moving up, target tile also moves left 2 tiless
            if (pacmanDirection.y < 0) {
                targetTile.x -= 2;
            }
            this.ptile = Vector.clone(targetTile);
            //now draw a vector from blinky to that target and double the length to get new target
            targetTile.x += (targetTile.x - blinkyTile.x);
            targetTile.y += (targetTile.y - blinkyTile.y);
            return targetTile;
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }

}