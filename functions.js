/*jshint latedef: true */
/*global window */
/*global document */
/*global console */

var levels = ["00002200000002332000002333320000023320000000220000", "00000000000000000000333333333322222222221111111111"];


/**
 * Collision detect function
 * @param integer obj1Xpos, obj1Ypos, obj1Width, obj1Height, obj2Xpos, obj2Ypos, obj2Width, obj2Height
 * @return string t/r/l/b || boolean false
 */
function Collision (obj1X, obj1Y, obj1W, obj1H, obj2X, obj2Y, obj2W, obj2H) {
    var w = 0.5 * (obj1W + obj2W);
    var h = 0.5 * (obj1H + obj2H);
    var dx = (obj1X + obj1W/2) - (obj2X + obj2W/2);
    var dy = (obj1Y + obj1H/2) - (obj2Y + obj2H/2);

    if (Math.abs(dx) <= w && Math.abs(dy) <= h) {
        var wy = w * dy;
        var hx = h * dx;

        if (wy > hx) {
            if (wy > -hx) {return 't';} 
            else {return 'r';}
        } else {
            if (wy > -hx) {return 'l';} 
            else {return 'b';}
        }
    } else {return false;}
};

/**
 * Cube class
 * @param integer positionX, positionY, health
 * @param object canvas
 */
function Cube (posX, posY, health, canvas, scale) {
    var scope = this,
        drawing = new Image();
    this.scale = scale;
    this.width = Math.round(40*this.scale);
    this.height = Math.round(20*this.scale);
    this.posX = posX;
    this.posY = posY;
    this.health = health;
    this.fullHealth = health;
    this.canvas = canvas;

    /**
     * Render to canvas method
     * @return void
     */
    this.render = function() {
        if (scope.fullHealth > 3) {drawing.src = "images/stone.png";}
        else {drawing.src = "images/lives_" + this.fullHealth + "_live_" + this.health + ".png";}
        //scope.canvas.drawImage(drawing, scope.posX, scope.posY);
        scope.canvas.drawImage(drawing, 0, 0, drawing.width, drawing.height, scope.posX, scope.posY, scope.width, scope.height);
    };

    /**
     * Take damage method
     * @return boolean
     */
    this.takeDamage = function() {
        if(this.health <= 1) {
            return true;
        } else {
            this.health--;
            return false;
        }
    };
};

/**
 * World class
 * @param object canvas
 * @param integer level
 */
function World (canvas, level) {
    var scope = this;
    this.canvas = canvas;
    this.worldWidth = document.getElementById("myCanvas").width,
    this.worldHeight = document.getElementById("myCanvas").height;
    this.score = 0;
    this.lifes = 3;
    this.level = level;
    this.gameOver =  false;
    this.pause = false;
    this.holdBall = true;
    this.cubesCollection = [];
    this.lowestCubePos = 0;
    this.scale = this.worldWidth / 400;

    /**
     * Player Object
     */
    this.player = new function() {
        var drawing = new Image();
        this.size = Math.round(60*scope.scale);
        this.height = Math.round(10*scope.scale);
        this.posX = Math.round(170*scope.scale);
        this.posY = scope.worldHeight - this.height;

        /**
         * Render to canvas method
         * @return void
         */
        this.render = function() {
            drawing.src = "images/player.png";
            //scope.canvas.drawImage(drawing, this.posX, this.posY);
            scope.canvas.drawImage(drawing, 0, 0, drawing.width, drawing.height, this.posX, this.posY, this.size, this.height);
        };
    };

    /**
     * Ball Object
     */
    this.ball = new function() {
        var drawing = new Image();
        this.size = Math.round(20*scope.scale);
        this.radius = this.size/2;
        this.posX = scope.player.posX + scope.player.size/2;
        this.posY = scope.player.posY - this.size;
        this.speedX = -2; //-2
        this.speedY = -4; //-2

        /**
         * Move ball in canvas method
         * @return void
         */
        this.moveBall = function() {
            if( (this.posX + this.speedX + this.size) > scope.worldWidth || (this.posX + this.speedX) < 0) {
                this.speedX *= -1;
            }
            if( (this.posY + this.speedY + this.size) > scope.worldHeight || (this.posY + this.speedY) < 0) {
                if ((this.posY + this.speedY + this.size) > scope.worldHeight) {scope.gameOver = true;}
                this.speedY *= -1;
            }
            this.posX += this.speedX;
            this.posY += this.speedY;
        };

        /**
         * Render to canvas method
         * @return void
         */
        this.render = function() {
            drawing.src = "images/ball.png";
            //scope.canvas.drawImage(drawing, this.posX, this.posY);
            scope.canvas.drawImage(drawing, 0, 0, drawing.width, drawing.height, this.posX, this.posY, this.size, this.size);
        };

        /**
         * Ball and Player collision detection method
         * @return void
         */
        this.playerCollision = function() {
            var side = Collision(scope.player.posX, scope.player.posY, scope.player.size, scope.player.height, this.posX, (this.posY), this.size, this.size);
            if (typeof side == 'string') {
                if (side === 't') {
                    this.speedY *= -1;
                    var centerOffset = (scope.player.posX + scope.player.size/2) - (this.posX + this.radius);
                    this.speedX = ((centerOffset / 0.4) * 0.06) *-1;
                }
                else if (side === 'b') {this.speedY *= -1;} 
                else if (side === 'r' || side === 'l') {this.speedX *= -1;}
            }
        };

        /**
         * Ball and Cube collision method
         * @return void
         */
        this.cubeCollision = function() {
            if(scope.ball.posY <= scope.lowestCubePos) {
                var i, len = scope.cubesCollection.length;
                for ( i = 0; i < len; i++) {
                    var side = Collision(scope.cubesCollection[i].posX, scope.cubesCollection[i].posY, scope.cubesCollection[i].width, scope.cubesCollection[i].height, this.posX, (this.posY + this.speedY), this.size, this.size);
                    if (typeof side == 'string') {
                        if (side === 't' || side === 'b') {this.speedY *= -1;} 
                        else if (side === 'r' || side === 'l') {this.speedX *= -1;}
                        scope.score += 30;
                        scope.setScoreLifes();
                        console.log("collision");
                        if (scope.cubesCollection[i].takeDamage()) {
                            console.log("destroy");
                            scope.destroyCube(i);
                            len = scope.cubesCollection.length;
                        }
                    }
                }
            }
        };
    };

    /**
     * Clear canvas method
     * @return void
     */
    this.clearView = function() {
        scope.canvas.fillStyle = "#fff";
        scope.canvas.fillRect(0, 0, scope.worldWidth, scope.worldHeight);
        scope.canvas.fillStyle = "#000";
        /*scope.canvas.rect(0, 0, scope.worldWidth, scope.worldHeight);
        scope.canvas.stroke();*/
    };

    /**
     * Render Gameover to canvas method
     * @return void
     */
    this.renderGameOver = function() {
        scope.clearView();
        scope.canvas.font="40px Arial";
        scope.canvas.fillText("Game over!", scope.worldWidth/2 - Math.round(100*scope.scale), scope.worldHeight/2 + Math.round(10*scope.scale));
    };

    /**
     * Render Win screen to canvas method
     * @return void
     */
    this.renderWinner = function() {
        scope.clearView();
        scope.canvas.font="40px Arial";
        scope.canvas.fillText("You Won!", scope.worldWidth/2 - Math.round(80*scope.scale), scope.worldHeight/2 + Math.round(10*scope.scale));
    };

    /**
     * Render Pause screen to canvas method
     * @return void
     */
    this.renderPause = function() {
        scope.clearView();
        scope.canvas.font="40px Arial";
        scope.canvas.fillText("Pause", scope.worldWidth/2 - Math.round(60*scope.scale), scope.worldHeight/2 + Math.round(10*scope.scale));
    };

    /**
     * Render Level Number to canvas method
     * @return void
     */
    this.renderLevelNum = function() {
        scope.clearView();
        scope.canvas.font="40px Arial";
        scope.canvas.fillText("Level " + scope.level, scope.worldWidth/2 - Math.round(60*scope.scale), scope.worldHeight/2 + Math.round(10*scope.scale));
    };

    /**
     * Render whole Worldto canvas method
     * @return void
     */
    this.renderWorld = function() {
        scope.clearView();
        scope.player.render();
        scope.ball.render();
        var i, len = scope.cubesCollection.length;
        for ( i = 0; i < len; i++) {
            scope.cubesCollection[i].render();
            scope.cubesCollection[i].timerTakenDmg = false;
        }
    };

    /**
     * Destroy Cube from collection method
     * @param integer index
     * @return void
     */
    this.destroyCube = function(i) {
        scope.cubesCollection.splice(i, 1);
    };

    /**
     * Timer method
     * @return void
     */
    this.timer = function () {
        var timer = setTimeout(function () {
                
                if (!scope.holdBall) {
                    scope.ball.moveBall();
                    scope.ball.playerCollision();
                    scope.ball.cubeCollision();
                } else {
                    scope.ball.posX = scope.player.posX + scope.player.size/2 - scope.ball.radius;
                    scope.ball.posY = scope.player.posY - scope.ball.size;
                }
                scope.renderWorld();
                
                if (scope.gameOver) {
                    if(scope.lifes > 1) {
                        scope.lifes--;
                        scope.setScoreLifes();
                        scope.setDefaults();
                        scope.timer();
                    } else {
                        clearTimeout(timer);
                        scope.lifes--;
                        scope.setScoreLifes();
                        console.log("Game Over!!!");
                        scope.renderGameOver();
                    }
                } else if (scope.pause) {
                    clearTimeout(timer);
                    console.log("Pause");
                    scope.renderPause();
                } else if (scope.cubesCollection.length === 0){
                    clearTimeout(timer);
                    console.log("You Won!!!");
                    scope.renderWinner();
                    scope.nextLevel();
                } else {
                    scope.timer();
                }
            }, 1000/60);
    };

    /**
     * Update score and lifes method
     * @return void
     */
    this.setScoreLifes = function() {
        document.getElementById('score').innerHTML = scope.score;
        document.getElementById('lifes').innerHTML = scope.lifes;
    };

    /**
     * Keyhendler method
     * @return void
     */
    this.keyHandler = function(e) {
        e = e || window.event;
        if (e.keyCode === 80) {
            if (scope.pause) {
                scope.pause = false;
                scope.timer();
            } else {
                scope.pause = true;
            }
        } else if (e.keyCode === 32) {
            scope.holdBall = false;
        } 
    };

    /**
     * Set default valuse method
     * @return void
     */
    this.setDefaults = function() {
        var i, len = scope.cubesCollection.length, pos;
        for ( i = 0; i < len; i++) {
            pos = scope.cubesCollection[i].posY + scope.cubesCollection[i].height + 20;
            if(pos > scope.lowestCubePos) {scope.lowestCubePos = pos;}
        }
        scope.player.posX = scope.worldWidth/2 - 30;
        scope.ball.posX = scope.player.posX + scope.player.size/2;
        scope.ball.posY = scope.player.posY - scope.ball.size;
        scope.gameOver = false;
        scope.pause = false;
        scope.holdBall = true;
        scope.ball.speedX = -2; //-2
        scope.ball.speedY = -4;
    };

    this.nextLevel = function() {
        var len = levels.length;
        if (scope.level < len) {
            setTimeout(function () {
                scope.cubesCollection = [];
                console.log(scope.cubesCollection);
                scope.level++;
                scope.init();
            }, 3000);
        }
    };

    this.loadLevel = function() {
        var i, 
            level = scope.level - 1, 
            len = levels[level].length, 
            cubeWidth = Math.round(40*scope.scale),
            cubeHeight = Math.round(20*scope.scale),
            x = 0, 
            y = cubeWidth

        for (i = 0; i < len; i++) {
            if(levels[level][i] > 0) {
                scope.cubesCollection.push(new Cube(x, y, levels[level][i], scope.canvas, scope.scale));
            }
            if (x + cubeWidth >= scope.worldWidth) {
                x = 0;
                y += cubeHeight;
            } else {
                x += cubeWidth;
            }
        }
    };

    /**
     * Initialize method
     * @return void
     */
    this.init = function () {
        scope.loadLevel();
        scope.setDefaults();
        scope.renderLevelNum();
        setTimeout(function () {
            scope.renderWorld();
            scope.timer();
        }, 3000);
    };

    document.onkeydown = this.keyHandler;
    document.getElementById("myCanvas").addEventListener('mousemove', function (e) {
        if((e.pageX > scope.player.size/2) && ((e.pageX < (scope.worldWidth - scope.player.size/2)))) {
            scope.player.posX = e.pageX - scope.player.size/2;
        }
    }, false);
    document.getElementById("myCanvas").addEventListener('touchmove', function (e) {
        if((e.pageX > scope.player.size/2) && ((e.pageX < (scope.worldWidth - scope.player.size/2)))) {
            scope.player.posX = e.pageX - scope.player.size/2;
        }
    }, false);
    document.getElementById("myCanvas").addEventListener('click', function () {
        scope.holdBall = false;
    }, false);
};

window.onload = function () {
    "use strict";

    var canvasSize = 0;
    if (getDimension() < 400) {
        canvasSize = getDimension();
    } else {
        canvasSize = 400;
    }
    
    var canvas = document.getElementById("myCanvas"),    
        ctx = canvas.getContext("2d");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.fillStyle = "#000";

    var world = new World(ctx, 1);
    world.init();
};

function getDimension() {
    var width = 0;
    if( typeof( window.innerWidth ) == 'number' ) {
        width = window.innerWidth;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
        width = document.documentElement.clientWidth;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
        width = document.body.clientWidth;
    }
    return width;
}