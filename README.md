## rendersheet.js
renders a canvas spritesheet for use with pixi.js

## Rationale
I needed a way to generate spritesheets on the fly based on canvas drawings and/or images. This allows me to resize the drawings based on different resolutions. It works by passing the rendersheet two functions: a drawing function and a measure function. It currently uses a rudimentary packing algorithm.

## Code Example

    // set up rendersheet
    var sheet = new RenderSheet();

    // show the rendersheet (used for debugging)
    sheet.show = true;

    // draw triangle textures on rendersheet
    sheet.add('triangle', triangleDraw, triangleMeasure, {size: 50, 'red'});

    // render the sheet
    sheet.render();


    // create a sprite using the rendersheet
    var sprite = new PIXI.Sprite(sheet.getTexture(triangle));

    // drawing function to generate the canvas triangle
    function triangleDraw(c, params)
    {
        var size = params.size;
        var half = params.size / 2;
        c.beginPath();
        c.fillStyle = params.color;
        c.moveTo(half, 0);
        c.lineTo(0, size);
        c.lineTo(size, size);
        c.closePath();
        c.fill();
    }

    // measure function to provide dimensions for canvas triangle
    function triangleMeasure(c, params)
    {
        return {width: params.size, height: params.size};
    }

## Installation

    npm install yy-rendersheet

## Live Example
https://davidfig.github.io/rendersheet/

see also

* https://davidfig.github.io/debug/
* https://davidfig.github.io/update/
* https://davidfig.github.io/animate/
* https://davidfig.github.io/renderer/
* https://davidfig.github.io/viewport/

# API Reference
<a name="RenderSheet"></a>

## RenderSheet
Creates a spritesheet texture with canvas renderings for pixi.js
Usage:

function drawBox(context)
{
     context.fillStyle = 'white';
     context.fillRect(0, 0, 100, 100);
}

function measureBox()
{
     return {width: 100, height: 100};
}

const sheet = new RenderSheet();
sheet.add('box', drawBox, measureBox)
...

// set this to true or a CSS style object to attach the canvases--useful for debugging
sheet.show = true
sheet.render();

// returns a PIXI.Sprite
const sprite = sheet.getSprite('box');

// returns a PIXI.Texture
const texture = sheet.getTexture('box');

**Kind**: global class  

* [RenderSheet](#RenderSheet)
    * [new RenderSheet(options)](#new_RenderSheet_new)
    * [.add(name, draw, measure, params)](#RenderSheet+add)
    * [.addImage(name, draw, measure, params)](#RenderSheet+addImage)
    * [.getTexture(name)](#RenderSheet+getTexture) ⇒ <code>PIXI.Texture</code> &#124; <code>null</code>
    * [.getSprite(name)](#RenderSheet+getSprite) ⇒ <code>PIXI.Sprite</code> &#124; <code>null</code>
    * [.get(name)](#RenderSheet+get) ⇒ <code>object</code>
    * [.entries()](#RenderSheet+entries) ⇒ <code>number</code>
    * [.getIndex(find)](#RenderSheet+getIndex) ⇒ <code>PIXI.Texture</code>
    * [.render([callback])](#RenderSheet+render)

<a name="new_RenderSheet_new"></a>

### new RenderSheet(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| [options.maxSize] | <code>number</code> | <code>2048</code> |  |
| [options.buffer] | <code>number</code> | <code>5</code> | around each texture |
| [options.scale] | <code>number</code> | <code>1</code> | of texture |
| [options.resolution] | <code>number</code> | <code>1</code> | of rendersheet |
| [options.wait] | <code>number</code> | <code>250</code> | number of milliseconds to wait between checks for onload of addImage images before rendering |
| [options.debug] | <code>function</code> |  | the Debug module from yy-debug (@see [github.com/davidfig/debug](github.com/davidfig/debug)) |
| [options.testBoxes] | <code>boolean</code> |  | draw a different colored boxes around each rendering |
| [options.show] | <code>boolean</code> &#124; <code>object</code> |  | set to true or a CSS object (e.g., {zIndex: 10, background: 'blue'}) to attach the final canvas to document.body--useful for debugging |

<a name="RenderSheet+add"></a>

### renderSheet.add(name, draw, measure, params)
adds a canvas rendering

**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of rendering |
| draw | <code>function</code> | function(context) - use the context to draw within the bounds of the measure function |
| measure | <code>function</code> | function(context) - needs to return {width: width, height: height} for the rendering |
| params | <code>object</code> | object to pass the draw() and measure() functions |

<a name="RenderSheet+addImage"></a>

### renderSheet.addImage(name, draw, measure, params)
adds an image rendering

**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of rendering |
| draw | <code>function</code> | function(context) - use the context to draw within the bounds of the measure function |
| measure | <code>function</code> | function(context) - needs to return {width: width, height: height} for the rendering |
| params | <code>object</code> | object to pass the draw() and measure() functions |

<a name="RenderSheet+getTexture"></a>

### renderSheet.getTexture(name) ⇒ <code>PIXI.Texture</code> &#124; <code>null</code>
**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of texture |

<a name="RenderSheet+getSprite"></a>

### renderSheet.getSprite(name) ⇒ <code>PIXI.Sprite</code> &#124; <code>null</code>
returns a PIXI.Sprite (with anchor set to 0.5, because that's where it should be)

**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of texture |

<a name="RenderSheet+get"></a>

### renderSheet.get(name) ⇒ <code>object</code>
**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  
**Returns**: <code>object</code> - texture object  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of texture |

<a name="RenderSheet+entries"></a>

### renderSheet.entries() ⇒ <code>number</code>
**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  
**Returns**: <code>number</code> - amount of textures in this rendersheet  
<a name="RenderSheet+getIndex"></a>

### renderSheet.getIndex(find) ⇒ <code>PIXI.Texture</code>
find the index of the texture based on the texture object

**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| find | <code>number</code> | this indexed texture |

<a name="RenderSheet+render"></a>

### renderSheet.render([callback])
create (or refresh) the rendersheet

**Kind**: instance method of <code>[RenderSheet](#RenderSheet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | function - useful for addImage to ensure image is loaded before rendering starts |


* * *

Copyright (c) 2016 YOPEY YOPEY LLC - MIT License - Documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown)