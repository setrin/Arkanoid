/*jshint latedef: true */
/*global window */
/*global document */
/*global console */

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
function Cube (posX, posY, health, canvas) {
    this.width = 40;
    this.height = 20;
    this.posX = posX;
    this.posY = posY;
    this.health = health;
    this.fullHealth = health;
    this.canvas = canvas;
    var scope = this;

    /**
     * Render to canvas method
     * @return void
     */
    this.render = function() {
        var drawing = new Image();
        drawing.src = "images/lives_" + this.fullHealth + "_live_" + this.health + ".png";
        scope.canvas.drawImage(drawing, scope.posX, scope.posY);
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
 */
function World (canvas) {
    var scope = this;
    this.canvas = canvas;
    this.worldWidth = 400,
    this.worldHeight = 400;
    this.score = 0;
    this.lifes = 3;
    this.gameOver =  false;
    this.pause = false;
    this.holdBall = true;
    this.cubesCollection = [];
    this.lowestCubePos = 0;

    /**
     * Player Object
     */
    this.player = new function() {
        this.size = 60;
        this.height = 10;
        this.posX = 170;
        this.posY = scope.worldHeight - this.height;

        /**
         * Render to canvas method
         * @return void
         */
        this.render = function() {
            var drawing = new Image();
            drawing.src = "images/player.png";
            scope.canvas.drawImage(drawing, this.posX, this.posY);
        };
    };

    /**
     * Ball Object
     */
    this.ball = new function() {
        this.size = 20;
        this.radius = this.size/2;
        this.posX = scope.player.posX + scope.player.size/2;
        this.posY = scope.player.posY - this.size;
        this.speedX = -2; //-4
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
            var drawing = new Image();
            drawing.src = "images/ball.png";
            scope.canvas.drawImage(drawing, this.posX, this.posY);
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
                    var side = Collision(scope.cubesCollection[i].posX, scope.cubesCollection[i].posY, scope.cubesCollection[i].width, scope.cubesCollection[i].height, this.posX, this.posY, this.size, this.size);
                    if (typeof side == 'string') {
                        if (side === 't' || side === 'b') {this.speedY *= -1;} 
                        else if (side === 'r' || side === 'l') {this.speedX *= -1;}
                        scope.score += 30;
                        scope.setScoreLifes();
                        if (scope.cubesCollection[i].takeDamage()) {
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
    };

    /**
     * Render Gameover to canvas method
     * @return void
     */
    this.renderGameOver = function() {
        scope.clearView();
        scope.canvas.font="40px Arial";
        scope.canvas.fillText("Game over!", scope.worldWidth/2 - 100, scope.worldHeight/2 + 10);
    };

    /**
     * Render Win screen to canvas method
     * @return void
     */
    this.renderWinner = function() {
        scope.clearView();
        scope.canvas.font="40px Arial";
        scope.canvas.fillText("You Won!", scope.worldWidth/2 - 80, scope.worldHeight/2 + 10);
    };

    /**
     * Render Pause screen to canvas method
     * @return void
     */
    this.renderPause = function() {
        scope.clearView();
        scope.canvas.font="40px Arial";
        scope.canvas.fillText("Pause", scope.worldWidth/2 - 60, scope.worldHeight/2 + 10);
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
        scope.ball.speedX = -2;
        scope.ball.speedY = -4;
    };

    /**
     * Initialize method
     * @return void
     */
    this.init = function () {
        level1(scope);
        scope.setDefaults();
        scope.renderWorld();
        scope.timer();
    };

    document.onkeydown = this.keyHandler;
    document.getElementById("myCanvas").addEventListener('mousemove', function (e) {
        if((e.pageX > scope.player.size/2) && ((e.pageX < (scope.worldWidth - scope.player.size/2)))) {
            scope.player.posX = e.pageX - scope.player.size/2;
        }
    }, false);
};

window.onload = function () {
    "use strict";
    var canvas = document.getElementById("myCanvas"),
        ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    
    var world = new World(ctx);
    world.init();
};












var level1 = function (world) {
    world.cubesCollection.push(new Cube(0, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(40, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(80, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(120, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(160, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(200, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(240, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(280, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(320, 40, 3, world.canvas));
    world.cubesCollection.push(new Cube(360, 40, 3, world.canvas)); 

    world.cubesCollection.push(new Cube(0, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(40, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(80, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(120, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(160, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(200, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(240, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(280, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(320, 60, 2, world.canvas));
    world.cubesCollection.push(new Cube(360, 60, 2, world.canvas));

    world.cubesCollection.push(new Cube(0, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(40, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(80, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(120, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(160, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(200, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(240, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(280, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(320, 80, 1, world.canvas));
    world.cubesCollection.push(new Cube(360, 80, 1, world.canvas));  
};