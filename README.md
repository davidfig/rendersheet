## rendersheet
renders a canvas spritesheet for use with pixi.js

## rationale
this generates on the fly spritesheets for use as basetextures in pixi.js.
you pass functions that draw and measure each texture, and rendersheet combines those into a sheet.
it currently uses a rudimentary packing algorithm.

## Code Example

    set up rendersheet
    var sheet = new RenderSheet();

    draw triangle textures on rendersheet
    sheet.add('triangle', triangleDraw, triangleMeasure, {size: 50, 'red'});

    render the sheet
    sheet.render();

    show the rendersheet (used for debug purposes)
    var canvas = sheet.show();

    create a sprite using the rendersheet
    var sprite = new PIXI.Sprite(sheet.getTexture(triangle));

    drawing function to generate the canvas triangle
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

    measure function to provide dimensions for canvas triangle
    function triangleMeasure(c, params)
    {
        return {width: params.size, height: params.size};
    }

## Installation
include rendersheet.js in your project or add to your workflow

    <script src="rendersheet.js"></script>

## Example
https://davidfig.github.io/rendersheet/

see also

* https://davidfig.github.io/debug/
* https://davidfig.github.io/update/
* https://davidfig.github.io/animate/
* https://davidfig.github.io/renderer/
* https://davidfig.github.io/viewport/

## API Reference

#### RenderSheet(options)
Creates a spritesheet texture for pixi.js
* Options:
  - maxWidth {number}: 1024 (default)
* Usage:
  - var sheet = new RenderSheet();
  - sheet.add(name, funct, param)
  - ...
  - sheet.render()
  - sheet.get(name)
  - sheet.getTexture(name)

#### RenderSheet.add(name, draw, measure, param)
adds a texture to the rendersheeet
* name {string}: name of texture (for getting)
* funct {function}: drawing function
* measure {function}: measure function
* params {object} any params to pass the measure and drawing functions

#### RenderSheet.show()
attaches the rendersheet to the DOM for testing purposes

#### RenderSheet.hasLoaded()
checks whether rendersheet has loaded

#### RenderSheet.render()
renders the rendersheet

#### RenderSheet.getIndex(find)
find the index of the texture based on the texture object

#### RenderSheet.get(name)
returns the texture object based on the name

#### RenderSheet.getTexture(name)
returns the PIXI.Texture based on the name

#### RenderSheet.getSprite(name)
returns a PIXI.Sprite based on the the name
also sets sprite anchor to 0.5 (because that's how it should be)

#### RenderSheet.entries()
returns the number of textures in the sprite sheet

## License
MIT License (MIT)