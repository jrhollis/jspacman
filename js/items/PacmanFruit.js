//instead of making a subclass for each fruit, just jam all info into this single class for everything
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
        //60 fps == 60 ticks per sec
        //half ticks because fruit is updated twice per tick
        this.halfTicksToLive = 2 * 60 * ((Math.random() * (2/3)) + (28/3));   //10ish second timer (should be random between 9.33333 and 10)
        // this.points = this.setPoints();
        this.fruit = true;
    }


    get points() {
        return PacmanFruit.POINTS[PacmanFruit.getFruitIndex(this.scene.level)];
    }

    get hitBox() {
        return {x: this.position.x + 6, y: this.position.y, w: 2, h: 8}
    }

    collide(pacman) {
        return (pacman.centerPixel.x <= this.hitBox.x+this.hitBox.w && pacman.centerPixel.x >= this.hitBox.x && 
                pacman.centerPixel.y <= this.hitBox.y+this.hitBox.h && pacman.centerPixel.y >= this.hitBox.y)
    }

    eaten() {
        this.halfTicksToLive = 0;
    }


    tick() {
        this.halfTicksToLive--;
        if (this.halfTicksToLive < 0) {
            //delete self from board
            delete this.scene.fruit;
        }
    }

    draw() {
        if (this.halfTicksToLive > 0) {
            //do x/y offset based on board.level
            var offsetX = PacmanFruit.getFruitIndex(this.scene.level) * 16;
            this.context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
                this.position.x, this.position.y, 16, 16  
            );
        }
    }
}