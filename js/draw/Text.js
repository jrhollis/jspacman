class Text extends Sprite {
    static TEXT_MAP = [
        "ABCDEFGHIJKLMNO ",
        "PQRSTUVWXYZ!cpts",
        '0123456789/-".'
    ]
    constructor(scene, text, color, x, y, align) {
        super(scene, x, y);
        this.text = text;
        this.color = color;
        this.align = align || 'left';

        this.flashCtr = 0;
    }

    get colorOffset() {
        return (['red','pink','blue','orange','peach','yellow'].indexOf(this.color) + 1) * 32;
    }

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

        if (this.flashCtr < 16) {
            for (var i = 0; i < this.text.length; i++) {
                var letterCoords = this.getLetterCoordinates(this.text[i]),
                    alignX = 0;
                if (this.align == 'right') {
                    alignX = ((this.text.length - 1) * 8);
                }
                this.context.drawImage(RESOURCE.text,
                    letterCoords.x, letterCoords.y + this.colorOffset, 8, 8,
                    this.x + (i * 8) - alignX, this.y, 8, 8
                );
            }
        }
        if (this.flash) {
            this.flashCtr = (this.flashCtr + 1) % 32;
        } else {
            this.flashCtr = 0;
        }
    }
}