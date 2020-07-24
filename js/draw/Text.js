/**
 * render text strings to the canvas in various colors. 
 * 
 * see res/text.png for sprite sheet
 */

class Text extends Sprite {
    //this string mirrors the placement of letters in res/text.png
    static TEXT_MAP = [
        "ABCDEFGHIJKLMNO ",
        "PQRSTUVWXYZ!cpts", //c is copyright symbol and pts is the "pts" (points) abbreviation
        '0123456789/-".'
    ]

    /**
     * 
     * @param {*} scene scene to render the text on
     * @param {*} text string of text to render
     * @param {*} color color of rendered text. values are: red, pink, blue, orange, peach, yellow
     * @param {*} x pixel location to render text
     * @param {*} y pixel location to render text
     * @param {*} align alignment of text: values are left (default) and right
     */
    constructor(scene, text, color, x, y, align) {
        super(scene, x, y);
        this.text = text;
        this.color = color;
        this.align = align || 'left';
        //a simple counter for flash "animation" instead of using animations array
        this.flashCtr = 0;
    }

    /**
     * the Y offset of the text.png texture that corresponds to the color
     * of the text
     */
    get colorOffset() {
        return (['red','pink','blue','orange','peach','yellow'].indexOf(this.color) + 1) * 32;
    }

    /**
     * by finding the location of the letter in the textmap string, this calculates the x,y 
     * coordinate of the given letter as it appears on res/text.png
     * 
     * @param {*} letter find the x,y coordinate on sprite sheet of this letter. 
     *                   Y coord is added with color offset later
     */
    getLetterCoordinates(letter) {
        for (var i = 0; i < Text.TEXT_MAP.length; i++) {
            var letterIndex = Text.TEXT_MAP[i].indexOf(letter);
            if (letterIndex > -1) {
                return { x: letterIndex * 8, y: i * 8 };
            }
        }
    }

    draw() {
        if (this.hidden) return;
        //flashing is used for the 1/2 player scores only. 
        if (this.flashCtr < 16) {
            //flash on for 16 frames, then off for 16
            for (var i = 0; i < this.text.length; i++) {
                //go through this.text letter by letter and find the corresponding sprite
                var letterCoords = this.getLetterCoordinates(this.text[i]),
                    alignX = 0;
                //calculate text alignment offset for this letter
                if (this.align == 'right') {
                    alignX = ((this.text.length - 1) * 8);
                }
                //draw the letter in sequence
                this.context.drawImage(RESOURCE.text,
                    letterCoords.x, letterCoords.y + this.colorOffset, 8, 8,
                    this.x + (i * 8) - alignX, this.y, 8, 8
                );
            }
        }
        //cycle the flash counter if flash flag is true
        if (this.flash) {
            this.flashCtr = (this.flashCtr + 1) % 32;
        } else {
            //other wise leave counter at zero so text always gets drawn
            this.flashCtr = 0;
        }
    }
}