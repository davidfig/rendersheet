const PIXI = require('pixi.js')
const Renderer = require('yy-renderer')
const Counter = require('yy-counter')
const Random = require('yy-random')

const RenderSheet = require('..')

let renderer, counter, n = 0, size = 500

// set up rendersheet
const sheet = new RenderSheet({width: 2048, height: 2048, useSimplePacker: true})

// surround textures with boxes (for debug purposes)
// sheet.testBoxes = true;

// show the rendersheet (for debug purposes)
sheet.show = {opacity: 0.6, pointerEvents: 'none'}

// draw triangle textures on rendersheet
const count = 100
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
function testTextures()
{
    // print statistics abouts textures to console.log
    sheet.debug()

    // add a sprite
    var sprite = new PIXI.Sprite()
    sprite.anchor.set(0.5)
    sprite.alpha = 0.25
    renderer.stage.addChild(sprite)
    sprite.x = window.innerWidth / 2
    sprite.y = window.innerHeight / 4

    // cycle the texture of the sprite from all textures in the rendersheet
    renderer.interval(
        function()
        {
            const n = Random.get(total)
            sprite.texture = sheet.getTexture('texture_' + n)
            counter.log('texture #' + n)
            renderer.dirty = true
        }, 200)
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
    c.font = '40px Arial'
    const measure = c.measureText(n)
    c.fillText(n++, size / 2 - measure.width / 2, size / 2 + 10)
}

// returns the size of the drawn texture
function triangleMeasure(c, params)
{
    return {width: params.size, height: params.size}
}

function draw(c, params)
{
    const size = params.size
    c.beginPath()
    c.rect(0, 0, size, size)
    c.fillStyle = '#' + Random.color().toString(16)
    c.fill()
}

function testChangingTextures()
{
    const sprite = renderer.add(sheet.get('texture_0'))
    sprite.anchor.set(0.5)
    sprite.alpha = 0.25
    renderer.stage.addChild(sprite)
    sprite.x = window.innerWidth / 2
    sprite.y = 3 * window.innerHeight / 4

    renderer.interval(
        function ()
        {
            sheet.changeDraw('texture_0', draw)
            renderer.dirty = true
        }, 1000
    )
}

function tests()
{
    testTextures()
    testChangingTextures()
    renderer.start()
}

window.onload = function ()
{
    renderer = new Renderer({ debug: true })
    counter = new Counter({ side: 'bottom-left' })
    sheet.render(tests)
    require('./highlight')('https://github.com/davidfig/rendersheet')
}