class Pinky extends Ghost {
    constructor(scene, x ,y) {
        super(scene, x, y, 'Pinky');
        this.houseTarget = this.startPosition;
        this.startDirection = Vector.DOWN;
        this.textureOffsetY = 16;
        this.scatterTargetTile = { x: 2, y: 0 };
        this.reset();
    }

    get randomScatter() {
        return this.scene.scatterChase.randomScatter;
    }

    /**
     * Pinky targets four tiles in front of the pacman in pacman's direction of travel. Also
     * takes into account a bug with the targeting scheme in the original arcade game.s
     */
    calculateTargetTile() {
        if (this.isChasing) {
            var pacmanDirection = this.scene.pacman.direction,
                targetTile = Vector.clone(this.scene.pacman.tile);
            if (pacmanDirection.x) {
                targetTile.x += (pacmanDirection.x * 4)
            }
            if (pacmanDirection.y) {
                targetTile.y += (pacmanDirection.y * 4);
                //emulate the overflow bug in the original arcade game where if pacman is moving up, target tile also moves left 4 tiless
                if (pacmanDirection.y < 0) {
                    targetTile.x -= 4;
                }
            }
            return Vector.clone(targetTile);
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }

}