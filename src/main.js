import { Renderer } from './rendering/GLRenderer.js';
import { Shapes } from './rendering/shapes.js';
const r = new Renderer(document.getElementById('gl'));
await r.init();
const color = [
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
];
const obj1 = r.create(Object.assign(Object.assign({}, Shapes.rectangle(0.1, 0.13)), { color, static: true }));
const obj2 = r.create(Object.assign(Object.assign({}, Shapes.triangle()), { color: [
        0, 1, 1, 1,
        1, 1, 0, 1,
        0.5, 0.1, 1, 1,
    ], static: true }));
if (obj1 && obj2) {
    r.append(obj1);
    r.append(obj2);
    const f = () => {
        r.draw();
        requestAnimationFrame(f);
    };
    f();
}
