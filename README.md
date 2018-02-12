## rendersheet.js
Generate on-the-fly spritesheets for pixi.js

## Rationale
I needed a way to generate spritesheets based on canvas drawings and/or images. This allows me to resize the drawings based on different resolutions. For canvas drawings, you pass the rendersheet two functions: a drawing function and a measure function.

## Code Example

    // set up rendersheet
    var sheet = new RenderSheet();

    // draw triangle textures on rendersheet
    sheet.add('triangle', triangleDraw, triangleMeasure, {size: 50, 'red'});

    // render the sheet
    sheet.render();

    // create a PIXI.Sprite using the rendersheet
    var sprite = stage.addChild(sheet.get('triangle'));

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
        return { width: params.size, height: params.size };
    }

## Installation

    npm i yy-rendersheet

## Live Example
https://davidfig.github.io/rendersheet/

## API Documentation
https://davidfig.github.io/rendersheet/jsdoc

## license  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
