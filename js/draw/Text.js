class Text extends Sprite {
    constructor(scene, text, color, x, y, align) {
        super(scene, x, y);
        this.textMap = [
            "ABCDEFGHIJKLMNO ",
            "PQRSTUVWXYZ!cpts",
            '0123456789/-".'
        ]
        this.text = text;
        this.color = color;
        this.align = align||'left';
        
        this.flashCtr = 0;
    }

    get colorOffset() {
        switch(this.color) {
            case 'red':
                return 4 * 8;
            case 'pink':
                return 8*8;
            case 'blue':
                return 12*8;
            case 'orange':
                return 16*8;
            case 'peach':
                return 20*8;
            case 'yellow':
                return 24 * 8;
            default: 
                return 0;
        }
    }

    getLetterCoordinates(letter) {
        for (var i = 0; i < this.textMap.length; i++) {
            var letterIndex = this.textMap[i].indexOf(letter);
            if (letterIndex > -1) {
                return {x: letterIndex * 8, y: i * 8};
            }
        }
    }

    draw() {
        if (this.hidden) return;

        if (this.flashCtr < 16) {
            var context = this.context;
            for (var i = 0; i < this.text.length; i++) {
                var letterCoords = this.getLetterCoordinates(this.text[i]),
                    alignX = 0;
                if (this.align == 'right') {
                    alignX = ((this.text.length-1) * 8);
                }
                context.drawImage(RESOURCE.text,
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