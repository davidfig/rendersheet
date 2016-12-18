const PIXI = require('pixi.js');
const Debug = require('yy-debug');
const RenderSheet = require('../rendersheet/rendersheet.js');

Debug.init();

// set up rendersheet
var resolution = window.devicePixelRatio;
var sheet = new RenderSheet({width: 2048, height: 2048, resolution: resolution, debug: Debug});

// surround textures with boxes (for debug purposes)
// sheet.testBoxes = true;

// show the rendersheet (for debug purposes)
sheet.show = {opacity: 0.5, pointerEvents: 'none'};


// count for triangles
var n = 0;

// maximum size of triangles
var size = 500;

// draw triangle textures on rendersheet
var count = 50;
for (var i = 0; i < count; i++)
{
    sheet.add('texture_' + i, triangleDraw, triangleMeasure, {size: Math.random() * size, color: Math.round(Math.random() * 0xffffff)});
}

sheet.render();

// test changing the rendersheet after rendering
for (var i = count; i < count + 10; i++)
{
    sheet.add('texture_' + i, triangleDraw, triangleMeasure, {size: Math.random() * size, color: Math.round(Math.random() * 0xffffff)});
}

// test addImage instead of canvas drawing
for (var i = count + 10; i < count + 17; i++)
{
    sheet.addImage('texture_' + i, 'faces/happy-' + (i - count - 9) + '.png');
}
var total = count + 16;

// set up pixi
var renderer, stage, width, height;
pixi();

sheet.render(go);

// called after images are loaded and render is successful
function go()
{
    // add a sprite
    var sprite = new PIXI.Sprite();
    sprite.anchor.set(0.5);
    stage.addChild(sprite);
    sprite.x = width / 2;
    sprite.y = height / 2;

    // change the texture of the sprite to a texture from the rendersheet
    window.setInterval(
        function()
        {
            sprite.texture = sheet.getTexture('texture_' + Math.floor(Math.random() * total));
            renderer.render(stage);
        }, 200);
}

// initialize pixi
function pixi()
{
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0];
    width = w.innerWidth || e.clientWidth || g.clientWidth;
    height = w.innerHeight|| e.clientHeight|| g.clientHeight;
    renderer = new PIXI.WebGLRenderer(width, height, {transparent: true, resolution: resolution});
    document.body.appendChild(renderer.view);
    renderer.view.style.position = 'absolute';
    renderer.view.style.top = renderer.view.style.left = '0px';
    renderer.view.style.pointerEvents = 'none';
    renderer.view.style.width = width + 'px';
    renderer.view.style.height = height + 'px';
    stage = new PIXI.Container();
}

// draw a triangle to the render sheet using canvas
function triangleDraw(c, params)
{
    var size = params.size;
    var half = params.size / 2;
    c.beginPath();
    c.fillStyle = '#' + params.color.toString(16);
    c.moveTo(half, 0);
    c.lineTo(0, size);
    c.lineTo(size, size);
    c.closePath();
    c.fill();
    c.fillStyle = 'white';
    var measure = c.measureText(n);
    c.fillText(n++, size / 2 - measure.width / 2, size / 2 + 10);
}

// returns the size of the drawn texture
function triangleMeasure(c, params)
{
    return {width: params.size, height: params.size};
}