import { FlyScene, game, FlySprite2D, Load, bug, Shapes } from './Fly/fly.js';
const color = [
    1.0, 0.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.1, 0.0, 1.0,
    1.0, 0.0, 0.5, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.1, 0.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.5, 1.0,
    1.0, 1.0, 1, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 0.4, 1.0, 1.0,
    0.0, 0.3, 1.0, 1.0,
];
const vertices = [
    0, 1, 0,
    0, -1, 0,
    2, 1, 0,
    2, -1, 0,
    4, 1, 0,
    4, -1, 0,
    6, 1, 0,
    6, -1, 0,
    8, 1, 0,
    8, -1, 0, // 9
];
const boneIndex = [
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 1, 0, 0,
    0, 1, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 2, 0, 0,
    1, 2, 0, 0,
    2, 0, 0, 0,
    2, 0, 0, 0, // 9
];
const weights = [
    1, 0, 0, 0,
    1, 0, 0, 0,
    .5, .5, 0, 0,
    .5, .5, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    .5, .5, 0, 0,
    .5, .5, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0, // 9
];
const indices = [
    0, 1,
    0, 2,
    1, 3,
    2, 3,
    2, 4,
    3, 5,
    4, 5,
    4, 6,
    5, 7,
    6, 7,
    6, 8,
    7, 9,
    8, 9,
];
game.assets.images.img = await Load.image('./otherStuff/prova.png');
class mySprite extends FlySprite2D {
    constructor() {
        super({
            image: game.assets.images.img,
            frames: 4,
            costumes: 4,
        });
        this.time = 60;
        this.nextFrameTime = 60;
    }
    onDraw() {
        this.animate(this.game.loopController.timeFromStart);
    }
    onDismiss() {
        throw new Error('Method not implemented.');
    }
    onEnter() {
        bug(this);
        this.game.refs.costumes = 0;
        this.costume = 3;
    }
    animate(delta) {
        if (delta < this.nextFrameTime)
            return;
        this.nextFrameTime = delta + this.time;
        this.frame = this.game.refs.costumes;
        this.game.refs.costumes++;
        if (this.game.refs.costumes >= this.costumes)
            this.game.refs.costumes = 0;
    }
}
class FirstScene extends FlyScene {
    update() {
        this.$renderer.draw();
    }
    onCreate(game) {
        this.$game.refs.i = 0;
        //setup debug camera
        this.$debug.globalCamera();
        const sprite = new mySprite();
        const sprite2 = new mySprite();
        sprite2.x = 0;
        sprite2.z = -2.5;
        sprite.z = -3;
        sprite.costume = 0;
        sprite2.costume = 3;
        const bg = this.$renderer.create(Object.assign(Object.assign({}, Shapes.rectangle(100, 100, { x: 0, y: 0, z: -10 })), { staticColor: { r: 0, g: 1, b: 0, a: 1 }, perspective: true }));
        this.attach('bg', bg);
        this.attach(sprite);
        this.attach(sprite2);
        this.$events.onArrowLeftPressed(() => {
            sprite.x -= 0.05;
            sprite.costume = 1;
        });
        this.$events.onArrowRightPressed(() => {
            sprite.x += 0.05;
            sprite.costume = 2;
        });
        this.$events.onArrowUpPressed(() => {
            sprite.y += 0.05;
            sprite.z += 0.05;
            sprite.costume = 3;
        });
        this.$events.onArrowDownPressed(() => {
            sprite.y -= 0.05;
            sprite.costume = 0;
        });
        //this.execute( this.update );
    }
    onDestroyed(game) { }
}
// finally, use the scene
game.useScene(FirstScene);
/**
  <defs>
  <linearGradient id="linear" x1="0%" y1="100%" x2="0%" y2="0%">
  <stop offset="0%" stop-color="#ff00ff"/>
  <stop offset="100%" stop-color="#6600ff"/>
  </linearGradient>
  </defs>
  <line x1="100" y1="15" x2="100" y2="30" stroke="black" stroke-width="7"></line>
  <ellipse cx="100" cy="50" rx="25" ry="25" fill="white" stroke="url(#linear)" stroke-width="5"></ellipse>
  <circle cx="80" cy="40" r="20" fill="red" stroke="black" stroke-width="5"></circle>
  <circle cx="120" cy="40" r="20" fill="red" stroke="black" stroke-width="5"></circle>
  <ellipse cx="100" cy="120" rx="30" ry="45" fill="#eeffee" stroke="url(#linear)" stroke-width="5"></ellipse>
  <ellipse cx="80" cy="110" rx="25" ry="40" fill="#00ffff55" stroke="black" stroke-width="5"></ellipse>
  <ellipse cx="120" cy="110" rx="25" ry="40" fill="#00ffff55" stroke="black" stroke-width="5"></ellipse>
</svg>
 */ 
