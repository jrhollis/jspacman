class Clyde extends Ghost {
    constructor(scene, x, y) {
        super(scene, x, y, 'Clyde');
        this.startPosition = { x: x, y: y };
        this.houseTarget = this.startPosition;
        this.enterTarget = this.startPosition;
        this.startDirection = Vector.UP;
        this.textureOffsetY = 48;
        this.scatterTargetTile = { x: 0, y: 35 };
        this.reset();
    }

    get pelletLimit() {
        if (this.scene.level == 1) {
            return 60;
        } else if (this.scene.level == 2) {
            return 50;
        }
        return 0;
    }

    /**
     * Sue will target pacman directly when more than 8 tiles away from him. if he
     * gets closer, he will target his scatter tile
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var sueTile = this.tile,
                pacmanTile = this.scene.pacman.tile,
                distance = Vector.distance(sueTile, pacmanTile);
            if (distance > 8) {
                // target pacman tile
                return pacmanTile;
            } else {
                // move to scatter target
                return this.scatterTargetTile;
            }
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }
}