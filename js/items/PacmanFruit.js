/**
 * Pacman only fruit. This fruit doesn't do anything except spawn at the same
 * place in the maze, twice per maze, and hang around for 9.33 to 10 seconds
 */
 class PacmanFruit extends Sprite {
    static POINTS = [100, 300, 500, 700, 1000, 2000, 3000, 5000];
    static getFruitIndex(level) {
        switch(level) {
            case 1:
                return 0;     //cherry
            case 2: 
                return 1;     //strawberry
            case 3:
            case 4:
                return 2;     //orange
            case 5:
            case 6:
                return 3;     //apple
            case 7:
            case 8:
                return 4;    //melon
            case 9:
            case 10:
                return 5;    //galaxian boss
            case 11:
            case 12:
                return 6;    //bell
            default:
                return 7;    //keys
        }
    }

    constructor (scene) {
        super(scene, 13*8, 19.5*8, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 488, y: 48};
        //half ticks because fruit is updated twice per tick
        this.halfTicksToLive = 2 * 60 * ((Math.random() * (2/3)) + (28/3));   //10ish second timer (should be random between 9.33333 and 10)
        this.fruit = true;
    }

    /**
     * amount of points this fruit is worth
     */
    get points() {
        return PacmanFruit.POINTS[PacmanFruit.getFruitIndex(this.scene.level)];
    }

    get hitBox() {
        return {x: this.position.x + 6, y: this.position.y, w: 2, h: 8}
    }

    /**
     * returns true if hitbox intersects with pacman's hitbox
     * @param {*} pacman duh
     */
    collide(pacman) {
        return (pacman.centerPixel.x <= this.hitBox.x+this.hitBox.w && pacman.centerPixel.x >= this.hitBox.x && 
                pacman.centerPixel.y <= this.hitBox.y+this.hitBox.h && pacman.centerPixel.y >= this.hitBox.y);
    }

    /**
     * the fruit was eaten, leave it for dead
     */
    eaten() {
        this.halfTicksToLive = 0;
    }

    /**
     * count down half ticks until it's time to remove the fruit
     */
    tick() {
        this.halfTicksToLive--;
        if (this.halfTicksToLive < 0) {
            //delete self from board
            delete this.scene.fruit;
        }
    }

    draw() {
        if (this.halfTicksToLive > 0) {
            var offsetX = PacmanFruit.getFruitIndex(this.scene.level) * 16;
            this.context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
                this.x, this.y, 16, 16  
            );
        }
    }
}