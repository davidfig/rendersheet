const PIXI = require('pixi.js')
const Renderer = require('yy-renderer')
const Loop = require('yy-loop')
const FPS = require('yy-fps')

const RenderSheet = require('..')

let renderer, n = 0, size = 500, loop, fps

// set up rendersheet
const sheet = new RenderSheet({width: 2048, height: 2048})

// surround textures with boxes (for debug purposes)
// sheet.testBoxes = true;

// show the rendersheet (for debug purposes)
sheet.show = {opacity: 0.6, pointerEvents: 'none'}

// draw triangle textures on rendersheet
const count = 50
for (let i = 0; i < count; i++)
{
    sheet.add('texture_' + i, triangleDraw, triangleMeasure, {size: Math.random() * size, color: Math.round(Math.random() * 0xffffff)})
}

// test changing the rendersheet after rendering
for (let i = count; i < count + 10; i++)
{
    sheet.add('texture_' + i, triangleDraw, triangleMeasure, {size: Math.random() * size, color: Math.round(Math.random() * 0xffffff)})
}

// test addImage instead of canvas drawing
for (let i = count + 10; i < count + 17; i++)
{
    sheet.addImage('texture_' + i, 'faces/happy-' + (i - count - 9) + '.png')
}
const total = count + 16

// called after images are loaded and render is successful
function go()
{
    // print statistics abouts textures to console.log
    sheet.debug()

    // add a sprite
    var sprite = new PIXI.Sprite()
    sprite.anchor.set(0.5)
    sprite.alpha = 0.25
    renderer.stage.addChild(sprite)
    sprite.x = window.innerWidth / 2
    sprite.y = window.innerHeight / 2

    // cycle the texture of the sprite from all textures in the rendersheet
    fps = new FPS()
    loop = new Loop()
    loop.interval(() => fps.frame())
    loop.interval(
        function()
        {
            sprite.texture = sheet.getTexture('texture_' + Math.floor(Math.random() * total))
            renderer.render()
        }, 200)
    loop.start()
}

// draw a triangle to the render sheet using canvas
function triangleDraw(c, params)
{
    const size = params.size
    const half = params.size / 2
    c.beginPath()
    c.fillStyle = '#' + params.color.toString(16)
    c.moveTo(half, 0)
    c.lineTo(0, size)
    c.lineTo(size, size)
    c.closePath()
    c.fill()
    c.fillStyle = 'white'
    const measure = c.measureText(n)
    c.fillText(n++, size / 2 - measure.width / 2, size / 2 + 10)
}

// returns the size of the drawn texture
function triangleMeasure(c, params)
{
    return {width: params.size, height: params.size}
}

window.onload = function ()
{
    renderer = new Renderer()
    sheet.render(go)

    require('./highlight')('https://github.com/davidfig/rendersheet')
}