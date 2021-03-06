class PacmanStartScene extends Scene {
    constructor(context) {
        super(context);
        this.p1HighScoreP2 = new Text(this, "1UP   HIGH SCORE   2UP", 'white', 3*8, 0);
        this.highScoreText = new Text(this, ""+Game.getHighScore(Game.GAME_PACMAN), 'white', 16*8, 8, 'right');
        this.scoreOneText = new Text(this, ""+(Game.LAST_SCORES[0][0]||"00"), 'white', 6 * 8, 1 * 8, 'right');
        this.scoreTwoText = new Text(this, ""+Game.LAST_SCORES[0][1]||"00", 'white', 25 * 8, 1 * 8, 'right');
        //no last score for this guy, so show nothing
        if (!Game.LAST_SCORES[0][1]) {
            this.scoreTwoText.hide();
        }

        this.pushStartButton = new Text(this, "PUSH START BUTTON", 'orange', 5*8, 16*8);
        this.onePlayerOnly = new Text(this, "1 PLAYER ONLY", 'blue', 7*8, 20*8);
        this.twoPlayers = new Text(this, "1 OR 2 PLAYERS", 'blue', 7*8, 20*8);
        this.bonusPacman = new Text(this, "BONUS PAC-MAN FOR 10000 pts", 'peach', 1*8, 24*8);
        this.copyright = new Text(this, "c 1980 MIDWAY MFG.CO.", 'pink', 4*8, 28*8);

        //credit
        this.creditLabel = new Text(this, "CREDIT", 'white', 1*8, 35*8);
        this.credits = new Text(this, ""+Game.CREDITS, 'white', 9*8, 35*8, 'right');
    }

    tick() {
        var keyPress = Input.readKeyPress();
        if (Game.CREDITS > 0 && keyPress == 13) { //enter
            SceneManager.replaceScene(new GameScene(this.context, 1));
            return;
        } else if (Game.CREDITS > 1 && keyPress == 50) { //#2
            SceneManager.replaceScene(new GameScene(this.context, 2));
            return;
        } else if (keyPress == 27) {
            //go back
            SceneManager.popScene();
            return;
        } else if (keyPress == 16) {
            Game.CREDITS++;
            Sound.playOnce('credit');
        }

        this.credits.text = ""+Game.CREDITS;
        if (Game.CREDITS > 1) {
            this.twoPlayers.show();
            this.onePlayerOnly.hide();
        } else {
            this.twoPlayers.hide();
            this.onePlayerOnly.show();
        }
    }


    draw() {
        Scene.prototype.draw.call(this);

        this.p1HighScoreP2.draw();
        this.highScoreText.draw();
        this.scoreOneText.draw()
        this.scoreTwoText.draw();

        this.pushStartButton.draw();
        this.onePlayerOnly.draw();
        this.twoPlayers.draw();
        this.bonusPacman.draw();
        this.copyright.draw();

        //credits
        this.creditLabel.draw();
        this.credits.draw();
    }
}