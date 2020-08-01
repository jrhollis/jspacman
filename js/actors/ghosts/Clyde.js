class Clyde extends Ghost {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.name = 'Clyde';
        this.startDirection = Vector.UP;
        this.textureOffsetY = 48;
        this.scatterTargetTile = { x: 0, y: 35 };
        this.reset();
    }

    /**
     * Clyde leaves the house after 60 pellets are eaten on level 1
     * and after 50 on level 2
     */
    get pelletLimit() {
        if (this.scene.level == 1) {
            return 60;
        } else if (this.scene.level == 2) {
            return 50;
        }
        return 0;
    }

    /**
     * Clyde will target pacman directly when more than 8 tiles away from him. if he
     * gets closer than that, he will target his scatter tile
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var pacmanTile = this.scene.pacman.tile,
                distance = Vector.distance(this.tile, pacmanTile);
            if (distance > 8) {
                // target pacman tile
                return Vector.clone(pacmanTile);
            } else {
                // move to scatter target
                return this.scatterTargetTile;
            }
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }
}