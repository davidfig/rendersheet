/*
    rendersheet.js <https://github.com/davidfig/rendersheet>
    License: MIT license <https://github.com/davidfig/rendersheet/license>
    Author: David Figatner
    Copyright (c) 2016 YOPEY YOPEY LLC
*/

var testBoxes = false; // show test boxes

var canvases = [];
var baseTextures = [];
var textures = {};

var sprite = null;

var maxWidth = 2048;
var maxHeight = 2048;

var buffer = 5;

var scale = 1;
var resolution = 1;

var options;

// Creates a spritesheet texture for pixi.js
// Options:
//     width {number}: 2048 (default)
//     height {number}: 2048 (default)
// Usage:
//     var sheet = new RenderSheet();
//     sheet.add(name, funct, param)
//     ...
//     sheet.render()
//     sheet.get(name)
//     sheet.getTexture(name)
function RenderSheet(opts)
{
    options = opts || {};
    maxWidth = options.width || maxWidth;
    maxHeight = options.height || maxHeight;
    resolution = options.resolution || resolution;
}

// adds a texture to the rendersheeet
//  name {string}: name of texture (for getting)
//  funct {function}: drawing function
//  measure {function}: measure function
//  params {object} any params to pass the measure and drawing functions
RenderSheet.prototype.add = function(name, draw, measure, param)
{
    textures[name] = { draw: draw, measure: measure, param: param };
};

// attaches the rendersheet to the DOM for testing purposes
RenderSheet.prototype.show = function(styles)
{
    var percent = 1 / canvases.length;
    for (var i = 0; i < canvases.length; i++)
    {
        var canvas = canvases[i];
        var style = canvas.style;
        style.position = 'fixed';
        style.left = '0px';
        style.top = i * Math.round(percent * 100) + '%';
        style.width = 'auto';
        style.height = Math.round(percent * 100) + '%';
        style.zIndex = 1000;
        for (var key in styles)
        {
            style[key] = styles[key];
        }
        document.body.appendChild(canvas);
        if (typeof Debug !== 'undefined')
        {
            debug('rendersheet size: ' + canvas.width + ',' + canvas.height + ' - resolution: ' + resolution);
        }
    }
};

RenderSheet.prototype.hasLoaded = function()
{
    return texture && texture.hasLoaded;
};

RenderSheet.prototype.render = function()
{
    function measure()
    {
        var multiplier = scale * resolution;
        for (var key in textures)
        {
            var texture = textures[key];
            var size = texture.measure(context, texture.param);
            texture.width = Math.ceil(size.width * multiplier);
            texture.height = Math.ceil(size.height * multiplier);
            sorted.push(texture);
        }
    }

    function sort()
    {
        sorted.sort(function(a, b)
        {
            if (a.height < b.height)
            {
                return -1;
            }
            else if (a.height > b.height)
            {
                return 1;
            }
            else
            {
                if (a.width === b.width)
                {
                    return 0;
                }
                else
                {
                    return (a.width < b.width) ? -1 : 1;
                }
            }
        });
    }

    function place()
    {
        function createCanvas(width, height)
        {
            canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = maxHeight;
            context = canvas.getContext('2d');
            canvases.push(canvas);
        }

        var x = 0, y = 0, width = 0, height = 0, rowMaxHeight = 0, current = 0;
        var lastRow = [];
        for (var i = 0; i < sorted.length; i++)
        {
            var texture = sorted[i];
            if (x + texture.width + buffer > maxWidth)
            {
                x = 0;
                if (y + rowMaxHeight + buffer > maxHeight)
                {
                    createCanvas(width, height);
                    height = rowMaxHeight;
                    current++;
                    y = 0;
                    for (var j = 0; j < lastRow.length; j++)
                    {
                        lastRow[j].canvas = current;
                        lastRow[j].y = y;
                    }
                }
                y += rowMaxHeight + buffer;
                rowMaxHeight = 0;
                lastRow = [];
            }
            texture.x = x;
            texture.y = y;
            texture.canvas = current;
            lastRow.push(texture);
            if (texture.height > rowMaxHeight)
            {
                rowMaxHeight = Math.ceil(texture.height);
            }
            x += Math.ceil(texture.width) + buffer;
            if (x > width)
            {
                width = x;
            }
            if (texture.height + y > height)
            {
                height = Math.ceil(texture.height + y);
            }
        }
        if (y + rowMaxHeight + buffer > maxHeight)
        {
            createCanvas(width, height);
            height = rowMaxHeight;
            current++;
            y = 0;
            for (var j = 0; j < lastRow.length; j++)
            {
                lastRow[j].canvas = current;
                lastRow[j].y = y;
            }
        }
        createCanvas(width, height);
    }

    function draw()
    {
        function r()
        {
            return Math.floor(Math.random() * 255);
        }

        var current, context;
        var multiplier = scale * resolution;
        for (var key in textures)
        {
            var texture = textures[key];
            if (texture.canvas !== current)
            {
                if (typeof current !== 'undefined')
                {
                    context.restore();
                }
                current = texture.canvas;
                context = canvases[current].getContext('2d');
                context.save();
                context.scale(multiplier, multiplier);
            }
            context.save();
            context.translate(texture.x / multiplier, texture.y / multiplier);
            if (testBoxes)
            {
                context.fillStyle = 'rgb(' + r() + ',' + r() + ',' + r() + ')';
                context.rect(0, 0, texture.width * multiplier, texture.height * multiplier);
                context.fill();
            }
            texture.draw(context, texture.param);
            context.restore();
        }
        context.restore();
    }

    function createBaseTextures()
    {
        for (var i = 0; i < baseTextures.length; i++)
        {
            baseTextures[i].destroy();
        }
        baseTextures = [];
        for (var i = 0; i < canvases.length; i++)
        {
            var base = PIXI.BaseTexture.fromCanvas(canvases[i]);
            base.resolution = resolution;
            baseTextures.push(base);
        }
    }

    canvases = [];
    var sorted = [];
    var canvas, context;

    measure();
    sort();
    place();
    draw();
    createBaseTextures();

    for (key in textures)
    {
        var current = textures[key];
        if (!current.texture)
        {
            current.texture = new PIXI.Texture(baseTextures[current.canvas], new PIXI.Rectangle(current.x, current.y, current.width, current.height));
        }
        else
        {
            current.texture.texture = baseTextures[current.canvas];
            current.texture.frame = new PIXI.Rectangle(current.x, current.y, current.width, current.height);
            current.texture.update();
        }
    }
};

//  find the index of the texture based on the texture object
RenderSheet.prototype.getIndex = function(find)
{
    var i = 0;
    for (var key in textures)
    {
        if (i === find)
        {
            return textures[key].texture;
        }
        i++;
    }
    return null;
};


// returns the texture object based on the name
RenderSheet.prototype.get = function(name)
{
    return textures[name];
};

// returns the PIXI.Texture based on the name
RenderSheet.prototype.getTexture = function(name)
{
    var texture = textures[name];
    if (texture)
    {
        return textures[name].texture;
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


// returns the number of textures in the sprite sheet
RenderSheet.prototype.entries = function()
{
    var size = 0;
    for (var key in textures)
    {
        size++;
    }
    return size;
};

RenderSheet.prototype.scale = function(newScale)
{
    scale = newScale;
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