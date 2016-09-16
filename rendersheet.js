/*
    rendersheet.js <https://github.com/davidfig/rendersheet>
    License: MIT license <https://github.com/davidfig/rendersheet/license>
    Author: David Figatner
    Copyright (c) 2016 YOPEY YOPEY LLC
*/

/* globals document, PIXI */

const GrowingPacker = require('./growingpacker.js');

/**
 * Creates a spritesheet texture with canvas renderings for pixi.js
 * Usage:
 *
 * function drawBox(context)
 * {
 *      context.fillStyle = 'white';
 *      context.fillRect(0, 0, 100, 100);
 * }
 *
 * function measureBox()
 * {
 *      return {width: 100, height: 100};
 * }
 *
 * const sheet = new RenderSheet();
 * sheet.add('box', drawBox, measureBox)
 * ...
 * sheet.render();
 *
 * // returns a PIXI.Sprite
 * const sprite = sheet.getSprite('box');
 *
 * // returns a PIXI.Texture
 * const texture = sheet.getTexture('box');
 */
class RenderSheet
{
    /**
     * @param {object} options
     * @param {number=2048} maxSize
     * @param {number=5} buffer around each texture
     * @param {number=1} scale of texture
     * @param {number=1} resolution of rendersheet
     * @param {Function=} debug - function to call with debug information (e.g., console.log)
     * @param {boolean=} testBoxes - draw a different colored boxes around each rendering
     */
    constructor(options)
    {
        options = options || {};
        this.testBoxes = options.testBoxes || false;
        this.maxSize = options.maxSize || 2048;
        this.buffer = options.buffer || 5;
        this.scale = options.scale || 1;
        this.resolution = options.resolution || 1;
        this.debug = options.debug;
        this.canvases = [];
        this.baseTextures = [];
        this.textures = {};
    }

    /**
     * adds a rendering
     * @param {string} name of rendering
     * @param {Function} draw function(context) - use the context to draw within the bounds of the measure function
     * @param {Function} measure function(context) - needs to return {width: width, height: height} for the rendering
     * @param {object} params - object to pass the draw() and measure() functions
     */
    add(name, draw, measure, param)
    {
        this.textures[name] = { name: name, draw: draw, measure: measure, param: param };
    }

    /**
     * attaches RenderSheet to DOM for testing
     * @param {object} styles - CSS styles to use for rendersheet
     */
    show(styles)
    {
        const percent = 1 / this.canvases.length;
        for (let i = 0; i < this.canvases.length; i++)
        {
            const canvas = this.canvases[i];
            const style = canvas.style;
            style.position = 'fixed';
            style.left = '0px';
            style.top = i * Math.round(percent * 100) + '%';
            style.width = 'auto';
            style.height = Math.round(percent * 100) + '%';
            style.zIndex = 1000;
            style.background = this.randomColor();
            for (let key in styles)
            {
                style[key] = styles[key];
            }
            document.body.appendChild(canvas);
            if (this.debug)
            {
                this.debug('Sheet #' + (i + 1) + '<br>size: ' + canvas.width + 'x' + canvas.height + '<br>resolution: ' + this.resolution);
            }
        }
    }

    /**
     * @param {string} name of texture
     * @return {PIXI.Texture|null}
     */
    getTexture(name)
    {
        const texture = this.textures[name];
        if (texture)
        {
            return this.textures[name].texture;
        }
        else
        {
            if (this.debug)
            {
                this.debug('Texture ' + name + ' not found in spritesheet.', 'error');
            }
            return null;
        }
    }

    /**
     * @param {string} name of texture
     * note: this sets the sprite's anchor to 0.5 (because that's how it should be)
     * @return {PIXI.Sprite|null}
     */
    getSprite(name)
    {
        const texture = this.getTexture(name);
        if (texture)
        {
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            return sprite;
        }
        else
        {
            return null;
        }
    }


    /**
     * @param {string} name of texture
     * @return {object} texture object
     */
    get(name)
    {
        return this.textures[name];
    }

    /**
     * @return {number} amount of textures in this rendersheet
     */
    entries()
    {
        let size = 0;
        for (let key in this.textures)
        {
            size++;
        }
        return size;
    }

    /**
     * find the index of the texture based on the texture object
     * @param {number} find this indexed texture
     * @returns {PIXI.Texture}
     */
    getIndex(find)
    {
        let i = 0;
        for (let key in this.textures)
        {
            if (i === find)
            {
                return this.textures[key].texture;
            }
            i++;
        }
        return null;
    }

    /**
     * create (or refresh) the rendersheet
     */
    render()
    {
        this.canvases = [];
        this.sorted = [];

        this.measure();
        this.sort();
        this.pack();
        this.draw();
        this.createBaseTextures();

        for (let key in this.textures)
        {
            const current = this.textures[key];
            if (current.texture)
            {
                current.texture = new PIXI.Texture(this.baseTextures[current.canvas], new PIXI.Rectangle(current.x, current.y, current.width, current.height));
            }
            else
            {
                current.texture.baseTexture = this.baseTextures[current.canvas];
                current.texture.frame = new PIXI.Rectangle(current.x, current.y, current.width, current.height);
                current.texture.update();
            }
        }
    }

    /**
     * measures canvas renderings
     * @private
     */
    measure()
    {
        const c = document.createElement('canvas');
        c.width = this.maxSize;
        c.height = this.maxSize;
        const context = c.getContext('2d');
        const multiplier = this.scale * this.resolution;
        for (let key in this.textures)
        {
            const texture = this.textures[key];
            const size = texture.measure(context, texture.param);
            texture.width = Math.ceil(size.width * multiplier);
            texture.height = Math.ceil(size.height * multiplier);
            this.sorted.push(texture);
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
                let aSize = Math.max(a.height, a.width);
                let bSize = Math.max(b.height, b.width);
                if (aSize === bSize)
                {
                    aSize = Math.min(a.height, a.width);
                    bSize = Math.max(b.height, b.width);
                }
                return bSize - aSize;
            }
        );
    }

    /**
     * create square canvas
     * @param {number=this.maxSize} size
     * @private
     */
    createCanvas(size)
    {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size || this.maxSize;
        this.canvases.push(canvas);
    }

    /**
     * returns a random rgb color
     * @private
     */
    randomColor()
    {
        const value = Math.floor(Math.random() * 255);
        return 'rgb(' + this.value + ',' + value + ',' + value + ')';
    }

    /**
     * draw renderings to rendertexture
     * @private
     */
    draw()
    {
        let current, context;
        const multiplier = this.scale * this.resolution;
        for (let key in this.textures)
        {
            const texture = this.textures[key];
            if (texture.canvas !== current)
            {
                if (typeof current !== 'undefined')
                {
                    context.restore();
                }
                current = texture.canvas;
                context = this.canvases[current].getContext('2d');
                context.save();
                context.scale(multiplier, multiplier);
            }
            context.save();
            context.translate(texture.x / multiplier, texture.y / multiplier);
            if (this.testBoxes)
            {
                context.fillStyle = this.randomColor();
                context.fillRect(0, 0, texture.width / multiplier, texture.height / multiplier);
            }
            texture.draw(context, texture.param);
            context.restore();
        }
        context.restore();
    }

    /**
     * @private
     */
    createBaseTextures()
    {
        for (let i = 0; i < this.baseTextures.length; i++)
        {
            this.baseTextures[i].destroy();
        }
        this.baseTextures = [];
        for (let i = 0; i < this.canvases.length; i++)
        {
            const base = PIXI.BaseTexture.fromCanvas(this.canvases[i]);
            base.resolution = this.resolution;
            this.baseTextures.push(base);
        }
    }

    /**
     * pack textures after measurement
     * @private
     */
    pack()
    {
        const packers = [new GrowingPacker(this.maxSize, this.sorted[0], this.buffer)];
        for (var i = 0; i < this.sorted.length; i++)
        {
            const block = this.sorted[i];
            let packed = false;
            for (var j = 0; j < packers.length; j++)
            {
                if (packers[j].add(block, j))
                {
                    block.canvas = j;
                    packed = true;
                    break;
                }
            }
            if (!packed)
            {
                packers.push(new GrowingPacker(this.maxSize, block, this.buffer));
                if (!packers[j].add(block, j))
                {
                    if (this.debug)
                    {
                        this.debug(block.name + ' is too big for the spritesheet.');
                    }
                    return;
                }
                else
                {
                    block.canvas = j;
                }
            }
        }

        for (let i = 0; i < packers.length; i++)
        {
            const size = packers[i].finish(this.maxSize);
            this.createCanvas(size);
        }
    }
}

module.exports = RenderSheet;