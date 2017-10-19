## rendersheet.js
renders a canvas spritesheet for use with pixi.js

## Rationale
I needed a way to generate spritesheets on the fly based on canvas drawings and/or images. This allows me to resize the drawings based on different resolutions. It works by passing the rendersheet two functions: a drawing function and a measure function. It currently uses a rudimentary packing algorithm.

## Code Example

    // set up rendersheet
    var sheet = new RenderSheet()

    // show the rendersheet (used for debugging)
    sheet.show = true

    // draw triangle textures on rendersheet
    sheet.add('triangle', triangleDraw, triangleMeasure, {size: 50, 'red'})

    // render the sheet
    sheet.render()

    // create a sprite using the rendersheet
    var sprite = new PIXI.Sprite(sheet.getTexture(triangle))

    // drawing function to generate the canvas triangle
    function triangleDraw(c, params)
    {
        var size = params.size
        var half = params.size / 2
        c.beginPath()
        c.fillStyle = params.color
        c.moveTo(half, 0)
        c.lineTo(0, size)
        c.lineTo(size, size)
        c.closePath()
        c.fill()
    }

    // measure function to provide dimensions for canvas triangle
    function triangleMeasure(c, params)
    {
        return {width: params.size, height: params.size}
    }

## Installation

    npm i yy-rendersheet

## Live Example
https://davidfig.github.io/rendersheet/

## API Reference
```
    /**
     * @param {object} options
     * @param {number} [options.maxSize=2048]
     * @param {number} [options.buffer=5] around each texture
     * @param {number} [options.scale=1] of texture
     * @param {number} [options.resolution=window.devicePixelRatio] of rendersheet
     * @param {number} [options.wait=250] number of milliseconds to wait between checks for onload of addImage images before rendering
     * @param {Function} [options.debug] the Debug module from yy-debug (@see {@link github.com/davidfig/debug})
     * @param {boolean} [options.testBoxes] draw a different colored boxes around each rendering
     * @param {number} [options.scaleMode] PIXI.settings.SCALE_MODE to set for rendersheet
     * @param {boolean|object} [options.show] set to true or a CSS object (e.g., {zIndex: 10, background: 'blue'}) to attach the final canvas to document.body--useful for debugging
     */
    constructor(options)

    /**
     * adds a canvas rendering
     * @param {string} name of rendering
     * @param {Function} draw function(context) - use the context to draw within the bounds of the measure function
     * @param {Function} measure function(context) - needs to return {width: width, height: height} for the rendering
     * @param {object} params - object to pass the draw() and measure() functions
     */
    add(name, draw, measure, param)

    /**
     * adds an image rendering
     * @param {string} name of rendering
     * @param {Function} draw function(context) - use the context to draw within the bounds of the measure function
     * @param {Function} measure function(context) - needs to return {width: width, height: height} for the rendering
     * @param {object} params - object to pass the draw() and measure() functions
     */
    addImage(name, file)

    /**
     * @param {string} name of texture
     * @return {(PIXI.Texture|null)}
     */
    getTexture(name)

    /**
     * returns a PIXI.Sprite (with anchor set to 0.5, because that's where it should be)
     * @param {string} name of texture
     * @return {PIXI.Sprite}
     */
    getSprite(name)

    /**
     * alias for getSprite()
     * @param {string} name of texture
     * @return {PIXI.Sprite)}
     */
    get(name)

    /**
     * @return {number} amount of textures in this rendersheet
     */
    entries()

    /**
     * prints statistics of canvases to console.log
     */
    debug()

    /**
     * find the index of the texture based on the texture object
     * @param {number} find this indexed texture
     * @returns {PIXI.Texture}
     */
    getIndex(find)

    /**
     * checks if all textures are loaded
     * @return {boolean}
     */
    checkLoaded()

    /**
     * create (or refresh) the rendersheet
     * @param {function} [callback] function - useful for addImage to ensure image is loaded before rendering starts
     */
    render(callback)
```
## license  
MIT License  
(c) 2017 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
