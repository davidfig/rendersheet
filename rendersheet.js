/*
    rendersheet.js <https://github.com/davidfig/rendersheet>
    License: MIT license <https://github.com/davidfig/rendersheet/license>
    Author: David Figatner
    Copyright (c) 2016 YOPEY YOPEY LLC
*/

// Creates a spritesheet texture for pixi.js
// options:
//     maxSize {number}: 2048 (default)
//     testBoxes: false (default) - draw colored boxes around the this.textures
//     buffer {number}: 5 (default) - pixels surrounding each texture
//     scale {number}: 1 (default) - this.scale renderSheet
//     resolution {number}: 1 (default) - change this.resolution of renderSheet
// Usage:
//     var sheet = new RenderSheet();
//     sheet.add(name, funct, param)
//     ...
//     sheet.render()
//     sheet.get(name)
//     sheet.getTexture(name)
function RenderSheet(options)
{
    options = options || {};
    this.testBoxes = options.testBoxes || false;
    this.maxSize = options.maxSize || 2048;
    this.buffer = options.buffer || 5;
    this.scale = options.scale || 1;
    this.resolution = options.resolution || 1;
    this.canvases = [];
    this.baseTextures = [];
    this.textures = {};
}

// adds a texture to the rendersheeet
//  name {string}: name of texture (for getting)
//  funct {function}: drawing function
//  measure {function}: measure function
//  params {object} any params to pass the measure and drawing functions
RenderSheet.prototype.add = function(name, draw, measure, param)
{
    this.textures[name] = { name: name, draw: draw, measure: measure, param: param };
};

// attaches the rendersheet to the DOM for testing purposes
RenderSheet.prototype.show = function(styles)
{
    function r()
    {
        return Math.floor(Math.random() * 256);
    }
    var percent = 1 / this.canvases.length;
    for (var i = 0; i < this.canvases.length; i++)
    {
        var canvas = this.canvases[i];
        var style = canvas.style;
        style.position = 'fixed';
        style.left = '0px';
        style.top = i * Math.round(percent * 100) + '%';
        style.width = 'auto';
        style.height = Math.round(percent * 100) + '%';
        style.zIndex = 1000;
        style.background = 'rgba(' + r() + ',' + r() + ',' + r() + ', 0.5)';
        for (var key in styles)
        {
            style[key] = styles[key];
        }
        document.body.appendChild(canvas);
        if (typeof Debug !== 'undefined')
        {
            debug('#' + (i + 1) + ': rendersheet size: ' + canvas.width + ',' + canvas.height + ' - this.resolution: ' + this.resolution);
        }
    }
};

RenderSheet.prototype.hasLoaded = function()
{
    return texture && texture.hasLoaded;
};

RenderSheet.prototype.measure = function()
{
    var c = document.createElement('canvas');
    c.width = this.maxSize;
    c.height = this.maxSize;
    co = c.getContext('2d');
    var multiplier = this.scale * this.resolution;
    for (var key in this.textures)
    {
        var texture = this.textures[key];
        var size = texture.measure(co, texture.param);
        texture.width = Math.ceil(size.width * multiplier);
        texture.height = Math.ceil(size.height * multiplier);
        this.sorted.push(texture);
    }
};

RenderSheet.prototype.sort = function()
{
    this.sorted.sort(function(a, b)
    {
        var aSize = Math.max(a.height, a.width);
        var bSize = Math.max(b.height, b.width);
        if (aSize > bSize)
        {
            return -1;
        }
        else if (aSize < bSize)
        {
            return 1;
        }
        else
        {
            if (aSize === bSize)
            {
                return 0;
            }
            else
            {
                return (aSize > bSize) ? -1 : 1;
            }
        }
    });
};

RenderSheet.prototype.createCanvas = function(width, height)
{
    canvas = document.createElement('canvas');
    canvas.width = width || this.maxSize;
    canvas.height = height || this.maxSize;
    context = canvas.getContext('2d');
    this.canvases.push(canvas);
};

RenderSheet.prototype.draw = function()
{
    function r()
    {
        return Math.floor(Math.random() * 255);
    }

    var current, context;
    var multiplier = this.scale * this.resolution;
    for (var key in this.textures)
    {
        var texture = this.textures[key];
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
            context.fillStyle = 'rgb(' + r() + ',' + r() + ',' + r() + ')';
            context.fillRect(0, 0, texture.width / multiplier, texture.height / multiplier);
        }
        texture.draw(context, texture.param);
        context.restore();
    }
    context.restore();
};

RenderSheet.prototype.createBaseTextures = function()
{
    for (var i = 0; i < this.baseTextures.length; i++)
    {
        this.baseTextures[i].destroy();
    }
    this.baseTextures = [];
    for (var i = 0; i < this.canvases.length; i++)
    {
        var base = PIXI.BaseTexture.fromCanvas(this.canvases[i]);
        base.resolution = this.resolution;
        this.baseTextures.push(base);
    }
};

RenderSheet.prototype.render = function()
{
    this.canvases = [];
    this.sorted = [];
    var canvas, context;

    this.measure();
    this.sort();
    this.pack();
    this.draw();
    this.createBaseTextures();

    for (key in this.textures)
    {
        var current = this.textures[key];
        if (!current.texture)
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
};

//  find the index of the texture based on the texture object
RenderSheet.prototype.getIndex = function(find)
{
    var i = 0;
    for (var key in this.textures)
    {
        if (i === find)
        {
            return this.textures[key].texture;
        }
        i++;
    }
    return null;
};

RenderSheet.prototype.pack = function()
{
    var packers = [new GrowingPacker(this.maxSize, this.sorted[0], this.buffer)];
    for (var i = 0; i < this.sorted.length; i++)
    {
        var block = this.sorted[i];
        var packed = false;
        for (var j = 0; j < packers.length; j++)
        {
            if (packers[j].add(block, j))
            {
                packed = true;
                break;
            }
        }
        if (!packed)
        {
            packers.push(new GrowingPacker(this.maxSize, block, this.buffer));
            if (!packers[j].add(block, j))
            {
                debug(block.name + ' is too big for the spritesheet.');
                return;
            }
        }
    }

    for (var i = 0; i < packers.length; i++)
    {
        var size = packers[i].finish(this.maxSize);
        this.createCanvas(size, size);
    }
};

// returns the texture object based on the name
RenderSheet.prototype.get = function(name)
{
    return this.textures[name];
};

// returns the PIXI.Texture based on the name
RenderSheet.prototype.getTexture = function(name)
{
    var texture = this.textures[name];
    if (texture)
    {
        return this.textures[name].texture;
    }
    else
    {
        debug('Texture ' + name + ' not found in spritesheet.', 'error');
        return null;
    }
};

// returns a PIXI.Sprite based on the the name
// also sets sprite anchor to 0.5 (because that's how it should be)
RenderSheet.prototype.getSprite = function(name)
{
    var texture = this.getTexture(name);
    var sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
};


// returns the number of this.textures in the sprite sheet
RenderSheet.prototype.entries = function()
{
    var size = 0;
    for (var key in this.textures)
    {
        size++;
    }
    return size;
};

// pack subroutines based on https://github.com/jakesgordon/bin-packing/ (MIT)
var GrowingPacker = function(max, first, buffer)
{
    this.max = max;
    this.buffer = buffer;
    this.root = { x: 0, y: 0, w: first.width + buffer, h: first.height + buffer };
};

GrowingPacker.prototype.finish = function(maxSize)
{
    var n = 1;
    var squared = [];
    var count = 0;
    do
    {
        var next = Math.pow(2, n++);
        squared.push(next);
    } while (next < maxSize);

    var max = Math.max(this.root.w, this.root.h);

    for (var i = squared.length - 1; i >= 0; i--)
    {
        if (squared[i] < max)
        {
            return squared[i + 1];
        }
    }
};

GrowingPacker.prototype.add = function(block, canvasNumber)
{
    var result;
    if (node = this.findNode(this.root, block.width + this.buffer, block.height + this.buffer))
    {
        result = this.splitNode(node, block.width + this.buffer, block.height + this.buffer);
    }
    else
    {
        result = this.growNode(block.width + this.buffer, block.height + this.buffer);
        if (!result)
        {
            return false;
        }
    }
    block.x = result.x;
    block.y = result.y;
    block.canvas = canvasNumber;
    return true;
};

GrowingPacker.prototype.findNode = function(root, w, h)
{
    if (root.used)
    {
        return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    }
    else if ((w <= root.w) && (h <= root.h))
    {
        return root;
    }
    else
    {
        return null;
    }
};

GrowingPacker.prototype.splitNode = function(node, w, h)
{
    node.used = true;
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
    return node;
};

GrowingPacker.prototype.growNode = function(w, h)
{
    var canGrowDown  = (w <= this.root.w);
    var canGrowRight = (h <= this.root.h);

    var shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w)); // attempt to keep square-ish by growing right when height is much greater than width
    var shouldGrowDown  = canGrowDown  && (this.root.w >= (this.root.h + h)); // attempt to keep square-ish by growing down  when width  is much greater than height

    if (shouldGrowRight)
    {
        return this.growRight(w, h);
    }
    else if (shouldGrowDown)
    {
        return this.growDown(w, h);
    }
    else if (canGrowRight)
    {
        return this.growRight(w, h);
    }
    else if (canGrowDown)
    {
        return this.growDown(w, h);
    }
    else
    {
        return null;
    }
};

GrowingPacker.prototype.growRight = function(w, h)
{
    if (this.root.w + w >= this.max)
    {
        return null;
    }
    this.root = {
        used: true,
        x: 0,
        y: 0,
        w: this.root.w + w,
        h: this.root.h,
        down: this.root,
        right: { x: this.root.w, y: 0, w: w, h: this.root.h }
    };
    if (node = this.findNode(this.root, w, h))
    {
        return this.splitNode(node, w, h);
    }
    else
    {
        return null;
    }
};

GrowingPacker.prototype.growDown = function(w, h)
{
    if (this.root.h + h >= this.max)
    {
        return null;
    }
    this.root = {
        used: true,
        x: 0,
        y: 0,
        w: this.root.w,
        h: this.root.h + h,
        down:  { x: 0, y: this.root.h, w: this.root.w, h: h },
        right: this.root
    };
    if (node = this.findNode(this.root, w, h))
    {
        return this.splitNode(node, w, h);
    }
    else
    {
        return null;
    }
};

// add support for AMD (Asynchronous Module Definition) libraries such as require.js.
if (typeof define === 'function' && define.amd)
{
    define(function()
    {
        return {
            RenderSheet: RenderSheet
        };
    });
}

// add support for CommonJS libraries such as browserify.
if (typeof exports !== 'undefined')
{
    module.exports = RenderSheet;
}

// define globally in case AMD is not available or available but not used
if (typeof window !== 'undefined')
{
    window.RenderSheet = RenderSheet;
}