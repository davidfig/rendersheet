// yy-rendersheet
// by David Figatner
// (c) YOPEY YOPEY LLC 2017
// MIT License
// https://github.com/davidfig/rendersheet

const PIXI = require('pixi.js')

const GrowingPacker = require('./growingpacker')
const SimplePacker = require('./simplepacker')

// types
const CANVAS = 0 // default
const IMAGE = 1

// default ms to wait to reload an image to load
const WAIT = 250

class RenderSheet
{
    /**
     * @param {object} options
     * @param {number} [options.maxSize=2048]
     * @param {number} [options.buffer=5] around each texture
     * @param {number} [options.scale=1] of texture
     * @param {number} [options.resolution=1] of rendersheet
     * @param {number} [options.wait=250] number of milliseconds to wait between checks for onload of addImage images before rendering
     * @param {Function} [options.debug] the Debug module from yy-debug (@see {@link github.com/davidfig/debug})
     * @param {boolean} [options.testBoxes] draw a different colored boxes around each rendering
     * @param {number} [options.scaleMode] PIXI.settings.SCALE_MODE to set for rendersheet
     * @param {boolean} [options.useSimplePacker] use a stupidly simple (but fast) packer instead of growing packer algorithm
     * @param {boolean|object} [options.show] set to true or a CSS object (e.g., {zIndex: 10, background: 'blue'}) to attach the final canvas to document.body--useful for debugging
     */
    constructor(options)
    {
        options = options || {}
        this.wait = options.wait || WAIT
        this.testBoxes = options.testBoxes || false
        this.maxSize = options.maxSize || 2048
        this.buffer = options.buffer || 5
        this.scale = options.scale || 1
        this.scaleMode = options.scaleMode
        this.resolution = options.resolution || 1
        this.show = options.show
        this.packer = options.useSimplePacker ? SimplePacker : GrowingPacker
        this.canvases = []
        this.baseTextures = []
        this.textures = {}
    }

    /**
     * adds a canvas rendering
     * @param {string} name of rendering
     * @param {Function} draw function(context) - use the context to draw within the bounds of the measure function
     * @param {Function} measure function(context) - needs to return {width: width, height: height} for the rendering
     * @param {object} params - object to pass the draw() and measure() functions
     */
    add(name, draw, measure, param)
    {
        const object = this.textures[name] = { name: name, draw: draw, measure: measure, param: param, type: CANVAS, texture: new PIXI.Texture(PIXI.Texture.EMPTY) }
        return object
    }

    /**
     * adds an image rendering
     * @param {string} name of rendering
     * @param {Function} draw function(context) - use the context to draw within the bounds of the measure function
     * @param {Function} measure function(context) - needs to return {width: width, height: height} for the rendering
     * @param {object} params - object to pass the draw() and measure() functions
     */
    addImage(name, file)
    {
        const object = this.textures[name] = { name: name, file: file, type: IMAGE, texture: new PIXI.Texture(PIXI.Texture.EMPTY)  }
        object.image = new Image()
        object.image.onload =
            function()
            {
                object.loaded = true
            }
        object.image.src = file
        return object
    }

    /**
     * attaches RenderSheet to DOM for testing
     * @param {object} styles - CSS styles to use for rendersheet
     * @private
     */
    showCanvases()
    {
        if (!this.divCanvases)
        {
            this.divCanvases = document.createElement('div')
            document.body.appendChild(this.divCanvases)
        }
        else
        {
            while (this.divCanvases.hasChildNodes())
            {
                this.divCanvases.removeChild(this.divCanvases.lastChild)
            }
        }
        const percent = 1 / this.canvases.length
        for (let i = 0; i < this.canvases.length; i++)
        {
            const canvas = this.canvases[i]
            const style = canvas.style
            style.position = 'fixed'
            style.left = '0px'
            style.top = i * Math.round(percent * 100) + '%'
            style.width = 'auto'
            style.height = Math.round(percent * 100) + '%'
            style.zIndex = 1000
            if (this.scaleMode === PIXI.SCALE_MODES.NEAREST)
            {
                style.imageRendering = 'pixelated'
            }
            style.background = this.randomColor()
            if (typeof this.show === 'object')
            {
                for (let key in this.show)
                {
                    style[key] = this.show[key]
                }
            }
            this.divCanvases.appendChild(canvas)
        }
    }

    /**
     * tests whether a texture exists
     * @param {string} name of texture
     * @return {boolean}
     */
    exists(name)
    {
        return this.textures[name] ? true : false
    }

    /**
     * @param {string} name of texture
     * @return {(PIXI.Texture|null)}
     */
    getTexture(name)
    {
        const texture = this.textures[name]
        if (texture)
        {
            return texture.texture
        }
        else
        {
            console.warn('yy-rendersheet: texture ' + name + ' not found in spritesheet.')
            return null
        }
    }

    /**
     * returns a PIXI.Sprite (with anchor set to 0.5, because that's where it should be)
     * @param {string} name of texture
     * @return {PIXI.Sprite}
     */
    getSprite(name)
    {
        const texture = this.getTexture(name)
        if (texture)
        {
            const sprite = new PIXI.Sprite(texture)
            sprite.anchor.set(0.5)
            return sprite
        }
        else
        {
            return null
        }
    }

    /**
     * alias for getSprite()
     * @param {string} name of texture
     * @return {PIXI.Sprite)}
     */
    get(name)
    {
        return this.getSprite(name)
    }

    /**
     * @return {number} amount of textures in this rendersheet
     */
    entries()
    {
        return Object.keys(this.textures).length
    }

    /**
     * prints statistics of canvases to console.log
     */
    debug()
    {
        for (let i = 0; i < this.canvases.length; i++)
        {
            const canvas = this.canvases[i]
            console.log('yy-rendersheet: Sheet #' + (i + 1) + ' | size: ' + canvas.width + 'x' + canvas.height + ' | resolution: ' + this.resolution)
        }
    }

    /**
     * find the index of the texture based on the texture object
     * @param {number} find this indexed texture
     * @returns {PIXI.Texture}
     */
    getIndex(find)
    {
        let i = 0
        for (let key in this.textures)
        {
            if (i === find)
            {
                return this.textures[key].texture
            }
            i++
        }
        return null
    }

    /**
     * checks if all textures are loaded
     * @return {boolean}
     */
    checkLoaded()
    {
        for (let key in this.textures)
        {
            const current = this.textures[key]
            if (current.type === IMAGE && !current.loaded)
            {
                return false
            }
        }
        return true
    }

    /**
     * create (or refresh) the rendersheet
     * @param {function} [callback] function - useful for addImage to ensure image is loaded before rendering starts
     */
    render(callback)
    {
        if (!Object.keys(this.textures).length)
        {
            if (callback) callback()
            return
        }
        if (callback)
        {
            this.callback = callback
        }
        if (!this.checkLoaded())
        {
            window.setTimeout(this.render.bind(this), WAIT)
            return
        }
        this.canvases = []
        this.sorted = []

        this.measure()
        this.sort()
        this.pack()
        this.draw()
        this.createBaseTextures()

        for (let key in this.textures)
        {
            const current = this.textures[key]
            current.texture.baseTexture = this.baseTextures[current.canvas]
            current.texture.frame = new PIXI.Rectangle(current.x, current.y, current.width, current.height)
            current.texture.update()
        }
        callback = callback || this.callback
        if (callback)
        {
            callback()
        }
        if (this.show)
        {
            this.showCanvases()
        }
    }

    /**
     * measures canvas renderings
     * @private
     */
    measure()
    {
        const c = document.createElement('canvas')
        c.width = this.maxSize
        c.height = this.maxSize
        const context = c.getContext('2d')
        const multiplier = this.scale * this.resolution
        for (let key in this.textures)
        {
            const texture = this.textures[key]
            switch (texture.type)
            {
                case CANVAS:
                    const size = texture.measure(context, texture.param)
                    texture.width = Math.ceil(size.width * multiplier)
                    texture.height = Math.ceil(size.height * multiplier)
                    break

                case IMAGE:
                    texture.width = texture.image.width * multiplier
                    texture.height = texture.image.height * multiplier
                    break
            }
            this.sorted.push(texture)
        }
    }

    /**
     * sort textures by largest dimension
     * @private
     */
    sort()
    {
        this.sorted.sort(
            function(a, b)
            {
                let aSize = Math.max(a.height, a.width)
                let bSize = Math.max(b.height, b.width)
                if (aSize === bSize)
                {
                    aSize = Math.min(a.height, a.width)
                    bSize = Math.max(b.height, b.width)
                }
                return bSize - aSize
            }
        )
    }

    /**
     * create square canvas
     * @param {number} [size=this.maxSize]
     * @private
     */
    createCanvas(size)
    {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size || this.maxSize
        this.canvases.push(canvas)
    }

    /**
     * returns a random rgb color
     * @private
     */
    randomColor()
    {
        function r()
        {
            return Math.floor(Math.random() * 255)
        }
        return 'rgba(' + r() + ',' + r() + ',' + r() + ', 0.2)'
    }

    /**
     * draw renderings to rendertexture
     * @private
     */
    draw()
    {
        let current, context
        const multiplier = this.scale * this.resolution
        for (let key in this.textures)
        {
            const texture = this.textures[key]
            if (texture.canvas !== current)
            {
                if (typeof current !== 'undefined')
                {
                    context.restore()
                }
                current = texture.canvas
                context = this.canvases[current].getContext('2d')
                context.save()
                context.scale(multiplier, multiplier)
            }
            context.save()
            context.translate(texture.x / multiplier, texture.y / multiplier)
            if (this.testBoxes)
            {
                context.fillStyle = this.randomColor()
                context.fillRect(0, 0, texture.width / multiplier, texture.height / multiplier)
            }
            switch (texture.type)
            {
                case CANVAS:
                    texture.draw(context, texture.param)
                    break

                case IMAGE:
                    context.drawImage(texture.image, 0, 0)
                    break
            }
            context.restore()
        }
        context.restore()
    }

    /**
     * @private
     */
    createBaseTextures()
    {
        while (this.baseTextures.length)
        {
            this.baseTextures.pop().destroy()
        }
        for (let i = 0; i < this.canvases.length; i++)
        {
            const base = PIXI.BaseTexture.fromCanvas(this.canvases[i])
            if (this.scaleMode)
            {
                base.scaleMode = this.scaleMode
            }
            this.baseTextures.push(base)
        }
    }

    /**
     * pack textures after measurement
     * @private
     */
    pack()
    {
        const packers = [new this.packer(this.maxSize, this.sorted[0], this.buffer)]
        for (let i = 0; i < this.sorted.length; i++)
        {
            const block = this.sorted[i]
            let packed = false
            for (var j = 0; j < packers.length; j++)
            {
                if (packers[j].add(block, j))
                {
                    block.canvas = j
                    packed = true
                    break
                }
            }
            if (!packed)
            {
                packers.push(new this.packer(this.maxSize, block, this.buffer))
                if (!packers[j].add(block, j))
                {
                    console.warn('yy-rendersheet: ' + block.name + ' is too big for the spritesheet.')
                    return
                }
                else
                {
                    block.canvas = j
                }
            }
        }

        for (let i = 0; i < packers.length; i++)
        {
            const size = packers[i].finish(this.maxSize)
            this.createCanvas(size)
        }
    }

    /**
     * Changes the drawing function of a texture
     * NOTE: this only works if the texture remains the same size; use Sheet.render() to resize the texture
     * @param {string} name
     * @param {function} draw
     */
    changeDraw(name, draw)
    {
        const texture = this.textures[name]
        if (texture.type !== CANVAS)
        {
            console.warn('yy-sheet.changeTextureDraw only works with type: CANVAS.')
            return
        }
        texture.draw = draw
        const context = this.canvases[texture.canvas].getContext('2d')
        const multiplier = this.scale * this.resolution
        context.save()
        context.scale(multiplier, multiplier)
        context.translate(texture.x / multiplier, texture.y / multiplier)
        texture.draw(context, texture.param)
        context.restore()
        texture.texture.update()
    }
}

module.exports = RenderSheet