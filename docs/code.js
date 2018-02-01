const PIXI = require('pixi.js')
const Counter = require('yy-counter')
const Random = require('yy-random')

const RenderSheet = require('..')

let renderer, counter, n = 0, size = 500, total

// set up rendersheet
const sheet = new RenderSheet({ width: 2048, height: 2048, extrude: true, scaleMode: true })

// surround textures with boxes (for debug purposes)
// sheet.testBoxes = true;

// show the rendersheet (for debug purposes)
sheet.show = { opacity: 0.6, pointerEvents: 'none' }

function setupSheet()
{
    // draw triangle textures on rendersheet
    const count = 100
    for (let i = 0; i < count; i++)
    {
        sheet.add('texture_' + i, triangleDraw, triangleMeasure, { size: Math.random() * size, color: Math.round(Math.random() * 0xffffff) })
    }

    // test changing the rendersheet after rendering
    for (let i = count; i < count + 10; i++)
    {
        sheet.add('texture_' + i, triangleDraw, triangleMeasure, { size: Math.random() * size, color: Math.round(Math.random() * 0xffffff) })
    }

    // test addImage instead of canvas drawing
    for (let i = count + 10; i < count + 17; i++)
    {
        sheet.addImage('texture_' + i, 'faces/happy-' + (i - count - 9) + '.png')
    }

    total = count + 16

    const image = document.getElementById('PNG')
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const c = canvas.getContext('2d')
    c.drawImage(image, 0, 0)
    const data = canvas.toDataURL().replace(/^data:image\/(png|jpg);base64,/, '')
    sheet.addData('data-test', data)
}

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
    let time = 0
    PIXI.ticker.shared.add((t) =>
    {
        time += t
        if (time > 5)
        {
            time = 0
            const n = Random.get(total)
            sprite.texture = sheet.getTexture('texture_' + n)
            counter.log('texture #' + n)
        }
    })

    const data = renderer.stage.addChild(sheet.get('data-test'))
    data.position.set(window.innerWidth - data.width, window.innerHeight - data.height)
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
    return { width: params.size, height: params.size }
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
    const sprite = renderer.stage.addChild(sheet.get('texture_0'))
    sprite.anchor.set(0.5)
    sprite.alpha = 0.25
    renderer.stage.addChild(sprite)
    sprite.x = window.innerWidth / 2
    sprite.y = 3 * window.innerHeight / 4

    let time = 0

    PIXI.ticker.shared.add((t) =>
    {
        time += t
        if (time > 10)
        {
            time = 0
            sheet.changeDraw('texture_0', draw)
        }
    })
}

function tests()
{
    testTextures()
    testChangingTextures()
    renderer.start()
}

window.onload = function ()
{
    renderer = new PIXI.Application({ transparent: true, width: window.innerWidth, height: window.innerHeight, autoResize: true })
    document.body.appendChild(renderer.view)

    counter = new Counter({ side: 'bottom-left' })
    setupSheet()
    sheet.once('render', tests)
    sheet.render()
    require('./highlight')('https://github.com/davidfig/rendersheet')
}