'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// yy-rendersheet
// by David Figatner
// (c) YOPEY YOPEY LLC 2019
// MIT License
// https://github.com/davidfig/rendersheet

var PIXI = require('pixi.js');
var Events = require('eventemitter3');

var GrowingPacker = require('./growingpacker');
var SimplePacker = require('./simplepacker');

// types
var CANVAS = 0; // default
var IMAGE = 1; // image url
var DATA = 2; // data src (e.g., result of .toDataURL())

// default ms to wait to check if an image has finished loading
var WAIT = 250;

var RenderSheet = function (_Events) {
    _inherits(RenderSheet, _Events);

    /**
     * @param {object} options
     * @param {number} [options.maxSize=2048]
     * @param {number} [options.buffer=5] around each texture
     * @param {number} [options.scale=1] of texture
     * @param {number} [options.resolution=1] of rendersheet
     * @param {number} [options.extrude] the edges--useful for removing gaps in sprites when tiling
     * @param {number} [options.wait=250] number of milliseconds to wait between checks for onload of addImage images before rendering
     * @param {boolean} [options.testBoxes] draw a different colored boxes behind each rendering (useful for debugging)
     * @param {number|boolean} [options.scaleMode] PIXI.settings.SCALE_MODE to set for rendersheet (use =true for PIXI.SCALE_MODES.NEAREST for pixel art)
     * @param {boolean} [options.useSimplePacker] use a stupidly simple packer instead of growing packer algorithm
     * @param {boolean|object} [options.show] set to true or a CSS object (e.g., {zIndex: 10, background: 'blue'}) to attach the final canvas to document.body--useful for debugging
     * @fire render
     */
    function RenderSheet(options) {
        _classCallCheck(this, RenderSheet);

        var _this = _possibleConstructorReturn(this, (RenderSheet.__proto__ || Object.getPrototypeOf(RenderSheet)).call(this));

        options = options || {};
        _this.wait = options.wait || WAIT;
        _this.testBoxes = options.testBoxes || false;
        _this.maxSize = options.maxSize || 2048;
        _this.buffer = options.buffer || 5;
        _this.scale = options.scale || 1;
        _this.scaleMode = options.scaleMode === true ? PIXI.SCALE_MODES.NEAREST : options.scaleMode;
        _this.resolution = options.resolution || 1;
        _this.show = options.show;
        _this.extrude = options.extrude;
        if (_this.extrude && _this.buffer < 2) {
            _this.buffer = 2;
        }
        _this.packer = options.useSimplePacker ? SimplePacker : GrowingPacker;
        _this.canvases = [];
        _this.baseTextures = [];
        _this.textures = {};
        return _this;
    }

    /**
     * adds a canvas rendering
     * @param {string} name of rendering
     * @param {Function} draw function(context) - use the context to draw within the bounds of the measure function
     * @param {Function} measure function(context) - needs to return {width: width, height: height} for the rendering
     * @param {object} params - object to pass the draw() and measure() functions
     * @return {object} rendersheet object for texture
     */


    _createClass(RenderSheet, [{
        key: 'add',
        value: function add(name, draw, measure, param) {
            var object = this.textures[name] = { name: name, draw: draw, measure: measure, param: param, type: CANVAS, texture: new PIXI.Texture(PIXI.Texture.EMPTY) };
            return object;
        }

        /**
         * adds an image rendering
         * @param {string} name of rendering
         * @param {string} src for image
         * @return {object} rendersheet object for texture
         */

    }, {
        key: 'addImage',
        value: function addImage(name, src) {
            var object = this.textures[name] = { name: name, file: src, type: IMAGE, texture: new PIXI.Texture(PIXI.Texture.EMPTY) };
            object.image = new Image();
            object.image.onload = function () {
                return object.loaded = true;
            };
            object.image.src = src;
            return object;
        }

        /**
         * adds a data source (e.g., a PNG file in data format)
         * @param {object} data of rendering (not filename)
         * @param {string} [header=data:image/png;base64,] for data
         * @return {object} rendersheet object for texture
         */

    }, {
        key: 'addData',
        value: function addData(name, data, header) {
            header = typeof header !== 'undefined' ? header : 'data:image/png;base64,';
            var object = this.textures[name] = { name: name, type: DATA, texture: new PIXI.Texture(PIXI.Texture.EMPTY) };
            object.image = new Image();
            object.image.src = header + data;
            if (object.image.complete) {
                object.loaded = true;
            } else {
                object.image.onload = function () {
                    return object.loaded = true;
                };
            }
            return object;
        }

        /**
         * attaches RenderSheet to DOM for testing
         * @param {object} styles - CSS styles to use for rendersheet
         * @private
         */

    }, {
        key: 'showCanvases',
        value: function showCanvases() {
            if (!this.divCanvases) {
                this.divCanvases = document.createElement('div');
                document.body.appendChild(this.divCanvases);
            } else {
                while (this.divCanvases.hasChildNodes()) {
                    this.divCanvases.removeChild(this.divCanvases.lastChild);
                }
            }
            var percent = 1 / this.canvases.length;
            for (var i = 0; i < this.canvases.length; i++) {
                var canvas = this.canvases[i];
                var style = canvas.style;
                style.position = 'fixed';
                style.left = '0px';
                style.top = i * Math.round(percent * 100) + '%';
                style.width = 'auto';
                style.height = Math.round(percent * 100) + '%';
                style.zIndex = 1000;
                if (this.scaleMode === PIXI.SCALE_MODES.NEAREST) {
                    style.imageRendering = 'pixelated';
                }
                style.background = this.randomColor();
                if (_typeof(this.show) === 'object') {
                    for (var key in this.show) {
                        style[key] = this.show[key];
                    }
                }
                this.divCanvases.appendChild(canvas);
            }
        }

        /**
         * tests whether a texture exists
         * @param {string} name of texture
         * @return {boolean}
         */

    }, {
        key: 'exists',
        value: function exists(name) {
            return this.textures[name] ? true : false;
        }

        /**
         * @param {string} name of texture
         * @return {(PIXI.Texture|null)}
         */

    }, {
        key: 'getTexture',
        value: function getTexture(name) {
            var texture = this.textures[name];
            if (texture) {
                return texture.texture;
            } else {
                console.warn('yy-rendersheet: texture ' + name + ' not found in spritesheet.');
                return null;
            }
        }

        /**
         * returns a PIXI.Sprite (with anchor set to 0.5, because that's where it should be)
         * @param {string} name of texture
         * @return {PIXI.Sprite}
         */

    }, {
        key: 'getSprite',
        value: function getSprite(name) {
            var texture = this.getTexture(name);
            if (texture) {
                var sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                return sprite;
            } else {
                return null;
            }
        }

        /**
         * alias for getSprite()
         * @param {string} name of texture
         * @return {PIXI.Sprite}
         */

    }, {
        key: 'get',
        value: function get(name) {
            return this.getSprite(name);
        }

        /**
         * @return {number} amount of textures in this rendersheet
         */

    }, {
        key: 'entries',
        value: function entries() {
            return Object.keys(this.textures).length;
        }

        /**
         * prints statistics of canvases to console.log
         */

    }, {
        key: 'debug',
        value: function debug() {
            for (var i = 0; i < this.canvases.length; i++) {
                var canvas = this.canvases[i];
                console.log('yy-rendersheet: Sheet #' + (i + 1) + ' | size: ' + canvas.width + 'x' + canvas.height + ' | resolution: ' + this.resolution);
            }
        }

        /**
         * find the index of the texture based on the texture object
         * @param {number} find this indexed texture
         * @returns {PIXI.Texture}
         */

    }, {
        key: 'getIndex',
        value: function getIndex(find) {
            var i = 0;
            for (var key in this.textures) {
                if (i === find) {
                    return this.textures[key].texture;
                }
                i++;
            }
            return null;
        }

        /**
         * checks if all textures are loaded
         * @return {boolean}
         */

    }, {
        key: 'checkLoaded',
        value: function checkLoaded() {
            for (var key in this.textures) {
                var current = this.textures[key];
                if ((current.type === IMAGE || current.type === DATA) && !current.loaded) {
                    return false;
                }
            }
            return true;
        }

        /**
         * create (or refresh) the rendersheet (supports async instead of callback)
         * @param {boolean} skipTextures - don't create PIXI.BaseTextures and PIXI.Textures (useful for generating external spritesheets)
         */

    }, {
        key: 'asyncRender',
        value: function asyncRender(skipTextures) {
            var _this2 = this;

            return new Promise(function (resolve) {
                _this2.render(resolve, skipTextures);
            });
        }

        /**
         * create (or refresh) the rendersheet
         * @param {boolean} skipTextures - don't create PIXI.BaseTextures and PIXI.Textures (useful for generating external spritesheets)
         * @param {function} callback - convenience function that calls RenderSheet.once('render', callback)
         */

    }, {
        key: 'render',
        value: function render(callback, skipTextures) {
            var _this3 = this;

            if (callback) {
                this.once('render', callback);
            }
            if (!Object.keys(this.textures).length) {
                this.emit('render');
                return;
            }
            if (!this.checkLoaded()) {
                setTimeout(function () {
                    return _this3.render();
                }, WAIT);
                return;
            }
            this.canvases = [];
            this.sorted = [];

            this.measure();
            this.sort();
            this.pack();
            this.draw();
            if (!skipTextures) {
                this.createBaseTextures();

                for (var key in this.textures) {
                    var current = this.textures[key];
                    current.texture.baseTexture = this.baseTextures[current.canvas];
                    current.texture.frame = new PIXI.Rectangle(current.x, current.y, current.width, current.height);
                    current.texture.update();
                }
            }
            if (this.show) {
                this.showCanvases();
            }
            this.emit('render');
        }

        /**
         * measures canvas renderings
         * @private
         */

    }, {
        key: 'measure',
        value: function measure() {
            var c = document.createElement('canvas');
            c.width = this.maxSize;
            c.height = this.maxSize;
            var context = c.getContext('2d');
            var multiplier = Math.ceil(this.scale * this.resolution);
            for (var key in this.textures) {
                var texture = this.textures[key];
                switch (texture.type) {
                    case CANVAS:
                        var size = texture.measure(context, texture.param, c);
                        texture.width = Math.ceil(size.width * multiplier);
                        texture.height = Math.ceil(size.height * multiplier);
                        break;

                    case IMAGE:case DATA:
                        texture.width = Math.ceil(texture.image.width * multiplier);
                        texture.height = Math.ceil(texture.image.height * multiplier);
                        break;
                }
                this.sorted.push(texture);
            }
        }

        /**
         * sort textures by largest dimension
         * @private
         */

    }, {
        key: 'sort',
        value: function sort() {
            this.sorted.sort(function (a, b) {
                var aSize = Math.max(a.height, a.width);
                var bSize = Math.max(b.height, b.width);
                if (aSize === bSize) {
                    aSize = Math.min(a.height, a.width);
                    bSize = Math.max(b.height, b.width);
                }
                return bSize - aSize;
            });
        }

        /**
         * create square canvas
         * @param {number} [size=this.maxSize]
         * @private
         */

    }, {
        key: 'createCanvas',
        value: function createCanvas(size) {
            var canvas = document.createElement('canvas');
            canvas.width = canvas.height = size || this.maxSize;
            this.canvases.push(canvas);
        }

        /**
         * returns a random rgb color
         * @private
         */

    }, {
        key: 'randomColor',
        value: function randomColor() {
            function r() {
                return Math.floor(Math.random() * 255);
            }
            return 'rgba(' + r() + ',' + r() + ',' + r() + ', 0.2)';
        }

        /**
         * draw renderings to rendertexture
         * @private
         */

    }, {
        key: 'draw',
        value: function draw() {
            var current = void 0,
                context = void 0;
            var multiplier = Math.ceil(this.scale * this.resolution);
            for (var key in this.textures) {
                var texture = this.textures[key];
                if (texture.canvas !== current) {
                    if (typeof current !== 'undefined') {
                        context.restore();
                    }
                    current = texture.canvas;
                    context = this.canvases[current].getContext('2d');
                    context.save();
                    context.scale(multiplier, multiplier);
                }
                context.save();
                context.translate(Math.ceil(texture.x / multiplier), Math.ceil(texture.y / multiplier));
                if (this.testBoxes) {
                    context.fillStyle = this.randomColor();
                    context.fillRect(0, 0, Math.ceil(texture.width / multiplier), Math.ceil(texture.height / multiplier));
                }
                switch (texture.type) {
                    case CANVAS:
                        texture.draw(context, texture.param, this.canvases[current]);
                        break;

                    case IMAGE:case DATA:
                        context.drawImage(texture.image, 0, 0);
                        break;
                }
                if (this.extrude) {
                    this.extrudeEntry(texture, context, current);
                }
                context.restore();
            }
            context.restore();
        }

        /**
         * extrude pixels for entry
         * @param {object} texture
         * @param {CanvasRenderingContext2D} context
         * @private
         */

    }, {
        key: 'extrudeEntry',
        value: function extrudeEntry(texture, context, current) {
            function get(x, y) {
                var entry = (x + y * texture.width) * 4;
                var d = data.data;
                return 'rgba(' + d[entry] + ',' + d[entry + 1] + ',' + d[entry + 2] + ',' + d[entry + 3] / 0xff + ')';
            }

            var canvas = this.canvases[current];
            var data = context.getImageData(texture.x, texture.y, texture.width, texture.height);
            if (texture.x !== 0) {
                for (var y = 0; y < texture.height; y++) {
                    context.fillStyle = get(0, y);
                    context.fillRect(-1, y, 1, 1);
                }
                if (texture.y !== 0) {
                    context.fillStyle = get(0, 0);
                    context.fillRect(-1, -1, 1, 1);
                }
            }
            if (texture.x + texture.width !== canvas.width - 1) {
                for (var _y = 0; _y < texture.height; _y++) {
                    context.fillStyle = get(texture.width - 1, _y);
                    context.fillRect(texture.width, _y, 1, 1);
                }
                if (texture.y + texture.height !== canvas.height - 1) {
                    context.fillStyle = get(texture.width - 1, texture.height - 1);
                    context.fillRect(texture.width, texture.height, 1, 1);
                }
            }
            if (texture.y !== 0) {
                for (var x = 0; x < texture.width; x++) {
                    context.fillStyle = get(x, 0);
                    context.fillRect(x, -1, 1, 1);
                }
            }
            if (texture.y + texture.height !== canvas.height - 1) {
                for (var _x = 0; _x < texture.width; _x++) {
                    context.fillStyle = get(_x, texture.height - 1);
                    context.fillRect(_x, texture.height, 1, 1);
                }
            }
        }

        /**
         * @private
         */

    }, {
        key: 'createBaseTextures',
        value: function createBaseTextures() {
            while (this.baseTextures.length) {
                this.baseTextures.pop().destroy();
            }
            for (var i = 0; i < this.canvases.length; i++) {
                var from = PIXI.BaseTexture.fromCanvas || PIXI.BaseTexture.from;
                var base = from(this.canvases[i]);
                if (this.scaleMode) {
                    base.scaleMode = this.scaleMode;
                }
                this.baseTextures.push(base);
            }
        }

        /**
         * pack textures after measurement
         * @private
         */

    }, {
        key: 'pack',
        value: function pack() {
            var packers = [new this.packer(this.maxSize, this.sorted[0], this.buffer)];
            for (var i = 0; i < this.sorted.length; i++) {
                var block = this.sorted[i];
                var packed = false;
                for (var j = 0; j < packers.length; j++) {
                    if (packers[j].add(block, j)) {
                        block.canvas = j;
                        packed = true;
                        break;
                    }
                }
                if (!packed) {
                    packers.push(new this.packer(this.maxSize, block, this.buffer));
                    if (!packers[j].add(block, j)) {
                        console.warn('yy-rendersheet: ' + block.name + ' is too big for the spritesheet.');
                        return;
                    } else {
                        block.canvas = j;
                    }
                }
            }

            for (var _i = 0; _i < packers.length; _i++) {
                var size = packers[_i].finish(this.maxSize);
                this.createCanvas(size);
            }
        }

        /**
         * Changes the drawing function of a texture
         * NOTE: this only works if the texture remains the same size; use Sheet.render() to resize the texture
         * @param {string} name
         * @param {function} draw
         */

    }, {
        key: 'changeDraw',
        value: function changeDraw(name, draw) {
            var texture = this.textures[name];
            if (texture.type !== CANVAS) {
                console.warn('yy-sheet.changeTextureDraw only works with type: CANVAS.');
                return;
            }
            texture.draw = draw;
            var context = this.canvases[texture.canvas].getContext('2d');
            var multiplier = this.scale * this.resolution;
            context.save();
            context.scale(multiplier, multiplier);
            context.translate(texture.x / multiplier, texture.y / multiplier);
            texture.draw(context, texture.param);
            context.restore();
            texture.texture.update();
        }
    }]);

    return RenderSheet;
}(Events);

module.exports = RenderSheet;

/**
 * fires when render completes
 * @event RenderSheet#render
 */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNhbnZhc2VzIiwiYmFzZVRleHR1cmVzIiwidGV4dHVyZXMiLCJuYW1lIiwiZHJhdyIsIm1lYXN1cmUiLCJwYXJhbSIsIm9iamVjdCIsInR5cGUiLCJ0ZXh0dXJlIiwiVGV4dHVyZSIsIkVNUFRZIiwic3JjIiwiZmlsZSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJkYXRhIiwiaGVhZGVyIiwiY29tcGxldGUiLCJkaXZDYW52YXNlcyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImhhc0NoaWxkTm9kZXMiLCJyZW1vdmVDaGlsZCIsImxhc3RDaGlsZCIsInBlcmNlbnQiLCJsZW5ndGgiLCJpIiwiY2FudmFzIiwic3R5bGUiLCJwb3NpdGlvbiIsImxlZnQiLCJ0b3AiLCJNYXRoIiwicm91bmQiLCJ3aWR0aCIsImhlaWdodCIsInpJbmRleCIsImltYWdlUmVuZGVyaW5nIiwiYmFja2dyb3VuZCIsInJhbmRvbUNvbG9yIiwia2V5IiwiY29uc29sZSIsIndhcm4iLCJnZXRUZXh0dXJlIiwic3ByaXRlIiwiU3ByaXRlIiwiYW5jaG9yIiwic2V0IiwiZ2V0U3ByaXRlIiwiT2JqZWN0Iiwia2V5cyIsImxvZyIsImZpbmQiLCJjdXJyZW50Iiwic2tpcFRleHR1cmVzIiwiUHJvbWlzZSIsInJlbmRlciIsInJlc29sdmUiLCJjYWxsYmFjayIsIm9uY2UiLCJlbWl0IiwiY2hlY2tMb2FkZWQiLCJzZXRUaW1lb3V0Iiwic29ydGVkIiwic29ydCIsInBhY2siLCJjcmVhdGVCYXNlVGV4dHVyZXMiLCJiYXNlVGV4dHVyZSIsImZyYW1lIiwiUmVjdGFuZ2xlIiwieCIsInkiLCJ1cGRhdGUiLCJzaG93Q2FudmFzZXMiLCJjIiwiY29udGV4dCIsImdldENvbnRleHQiLCJtdWx0aXBsaWVyIiwiY2VpbCIsInNpemUiLCJwdXNoIiwiYSIsImIiLCJhU2l6ZSIsIm1heCIsImJTaXplIiwibWluIiwiciIsImZsb29yIiwicmFuZG9tIiwicmVzdG9yZSIsInNhdmUiLCJ0cmFuc2xhdGUiLCJmaWxsU3R5bGUiLCJmaWxsUmVjdCIsImRyYXdJbWFnZSIsImV4dHJ1ZGVFbnRyeSIsImdldCIsImVudHJ5IiwiZCIsImdldEltYWdlRGF0YSIsInBvcCIsImRlc3Ryb3kiLCJmcm9tIiwiQmFzZVRleHR1cmUiLCJmcm9tQ2FudmFzIiwiYmFzZSIsInBhY2tlcnMiLCJibG9jayIsInBhY2tlZCIsImoiLCJhZGQiLCJmaW5pc2giLCJjcmVhdGVDYW52YXMiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLE9BQU9DLFFBQVEsU0FBUixDQUFiO0FBQ0EsSUFBTUMsU0FBU0QsUUFBUSxlQUFSLENBQWY7O0FBRUEsSUFBTUUsZ0JBQWdCRixRQUFRLGlCQUFSLENBQXRCO0FBQ0EsSUFBTUcsZUFBZUgsUUFBUSxnQkFBUixDQUFyQjs7QUFFQTtBQUNBLElBQU1JLFNBQVMsQ0FBZixDLENBQWlCO0FBQ2pCLElBQU1DLFFBQVEsQ0FBZCxDLENBQWdCO0FBQ2hCLElBQU1DLE9BQU8sQ0FBYixDLENBQWU7O0FBRWY7QUFDQSxJQUFNQyxPQUFPLEdBQWI7O0lBRU1DLFc7OztBQUVGOzs7Ozs7Ozs7Ozs7OztBQWNBLHlCQUFZQyxPQUFaLEVBQ0E7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Q3pFLFFBQVFtRSxDQUFSLEdBQVlNLFVBQXREO0FBQ0F6RSxvQkFBUUwsSUFBUixDQUFhNEUsT0FBYixFQUFzQnZFLFFBQVFILEtBQTlCO0FBQ0EwRSxvQkFBUWUsT0FBUjtBQUNBdEYsb0JBQVFBLE9BQVIsQ0FBZ0JvRSxNQUFoQjtBQUNIOzs7O0VBdGtCcUJuRyxNOztBQXlrQjFCNkksT0FBT0MsT0FBUCxHQUFpQnZJLFdBQWpCOztBQUVBIiwiZmlsZSI6InJlbmRlcnNoZWV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8geXktcmVuZGVyc2hlZXRcclxuLy8gYnkgRGF2aWQgRmlnYXRuZXJcclxuLy8gKGMpIFlPUEVZIFlPUEVZIExMQyAyMDE5XHJcbi8vIE1JVCBMaWNlbnNlXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXZpZGZpZy9yZW5kZXJzaGVldFxyXG5cclxuY29uc3QgUElYSSA9IHJlcXVpcmUoJ3BpeGkuanMnKVxyXG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcclxuXHJcbmNvbnN0IEdyb3dpbmdQYWNrZXIgPSByZXF1aXJlKCcuL2dyb3dpbmdwYWNrZXInKVxyXG5jb25zdCBTaW1wbGVQYWNrZXIgPSByZXF1aXJlKCcuL3NpbXBsZXBhY2tlcicpXHJcblxyXG4vLyB0eXBlc1xyXG5jb25zdCBDQU5WQVMgPSAwIC8vIGRlZmF1bHRcclxuY29uc3QgSU1BR0UgPSAxIC8vIGltYWdlIHVybFxyXG5jb25zdCBEQVRBID0gMiAvLyBkYXRhIHNyYyAoZS5nLiwgcmVzdWx0IG9mIC50b0RhdGFVUkwoKSlcclxuXHJcbi8vIGRlZmF1bHQgbXMgdG8gd2FpdCB0byBjaGVjayBpZiBhbiBpbWFnZSBoYXMgZmluaXNoZWQgbG9hZGluZ1xyXG5jb25zdCBXQUlUID0gMjUwXHJcblxyXG5jbGFzcyBSZW5kZXJTaGVldCBleHRlbmRzIEV2ZW50c1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4U2l6ZT0yMDQ4XVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmJ1ZmZlcj01XSBhcm91bmQgZWFjaCB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2NhbGU9MV0gb2YgdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnJlc29sdXRpb249MV0gb2YgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5leHRydWRlXSB0aGUgZWRnZXMtLXVzZWZ1bCBmb3IgcmVtb3ZpbmcgZ2FwcyBpbiBzcHJpdGVzIHdoZW4gdGlsaW5nXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMud2FpdD0yNTBdIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3Igb25sb2FkIG9mIGFkZEltYWdlIGltYWdlcyBiZWZvcmUgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRlc3RCb3hlc10gZHJhdyBhIGRpZmZlcmVudCBjb2xvcmVkIGJveGVzIGJlaGluZCBlYWNoIHJlbmRlcmluZyAodXNlZnVsIGZvciBkZWJ1Z2dpbmcpXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufSBbb3B0aW9ucy5zY2FsZU1vZGVdIFBJWEkuc2V0dGluZ3MuU0NBTEVfTU9ERSB0byBzZXQgZm9yIHJlbmRlcnNoZWV0ICh1c2UgPXRydWUgZm9yIFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVCBmb3IgcGl4ZWwgYXJ0KVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VTaW1wbGVQYWNrZXJdIHVzZSBhIHN0dXBpZGx5IHNpbXBsZSBwYWNrZXIgaW5zdGVhZCBvZiBncm93aW5nIHBhY2tlciBhbGdvcml0aG1cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbnxvYmplY3R9IFtvcHRpb25zLnNob3ddIHNldCB0byB0cnVlIG9yIGEgQ1NTIG9iamVjdCAoZS5nLiwge3pJbmRleDogMTAsIGJhY2tncm91bmQ6ICdibHVlJ30pIHRvIGF0dGFjaCB0aGUgZmluYWwgY2FudmFzIHRvIGRvY3VtZW50LmJvZHktLXVzZWZ1bCBmb3IgZGVidWdnaW5nXHJcbiAgICAgKiBAZmlyZSByZW5kZXJcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLndhaXQgPSBvcHRpb25zLndhaXQgfHwgV0FJVFxyXG4gICAgICAgIHRoaXMudGVzdEJveGVzID0gb3B0aW9ucy50ZXN0Qm94ZXMgfHwgZmFsc2VcclxuICAgICAgICB0aGlzLm1heFNpemUgPSBvcHRpb25zLm1heFNpemUgfHwgMjA0OFxyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gb3B0aW9ucy5idWZmZXIgfHwgNVxyXG4gICAgICAgIHRoaXMuc2NhbGUgPSBvcHRpb25zLnNjYWxlIHx8IDFcclxuICAgICAgICB0aGlzLnNjYWxlTW9kZSA9IG9wdGlvbnMuc2NhbGVNb2RlID09PSB0cnVlID8gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUIDogb3B0aW9ucy5zY2FsZU1vZGVcclxuICAgICAgICB0aGlzLnJlc29sdXRpb24gPSBvcHRpb25zLnJlc29sdXRpb24gfHwgMVxyXG4gICAgICAgIHRoaXMuc2hvdyA9IG9wdGlvbnMuc2hvd1xyXG4gICAgICAgIHRoaXMuZXh0cnVkZSA9IG9wdGlvbnMuZXh0cnVkZVxyXG4gICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUgJiYgdGhpcy5idWZmZXIgPCAyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIgPSAyXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGFja2VyID0gb3B0aW9ucy51c2VTaW1wbGVQYWNrZXIgPyBTaW1wbGVQYWNrZXIgOiBHcm93aW5nUGFja2VyXHJcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMgPSBbXVxyXG4gICAgICAgIHRoaXMudGV4dHVyZXMgPSB7fVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhIGNhbnZhcyByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZHJhdyBmdW5jdGlvbihjb250ZXh0KSAtIHVzZSB0aGUgY29udGV4dCB0byBkcmF3IHdpdGhpbiB0aGUgYm91bmRzIG9mIHRoZSBtZWFzdXJlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZWFzdXJlIGZ1bmN0aW9uKGNvbnRleHQpIC0gbmVlZHMgdG8gcmV0dXJuIHt3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSBmb3IgdGhlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIG9iamVjdCB0byBwYXNzIHRoZSBkcmF3KCkgYW5kIG1lYXN1cmUoKSBmdW5jdGlvbnNcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZChuYW1lLCBkcmF3LCBtZWFzdXJlLCBwYXJhbSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lOiBuYW1lLCBkcmF3OiBkcmF3LCBtZWFzdXJlOiBtZWFzdXJlLCBwYXJhbTogcGFyYW0sIHR5cGU6IENBTlZBUywgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZShQSVhJLlRleHR1cmUuRU1QVFkpIH1cclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGFuIGltYWdlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3JjIGZvciBpbWFnZVxyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSByZW5kZXJzaGVldCBvYmplY3QgZm9yIHRleHR1cmVcclxuICAgICAqL1xyXG4gICAgYWRkSW1hZ2UobmFtZSwgc3JjKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMudGV4dHVyZXNbbmFtZV0gPSB7IG5hbWUsIGZpbGU6IHNyYywgdHlwZTogSU1BR0UsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSAgfVxyXG4gICAgICAgIG9iamVjdC5pbWFnZSA9IG5ldyBJbWFnZSgpXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLnNyYyA9IHNyY1xyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBkYXRhIHNvdXJjZSAoZS5nLiwgYSBQTkcgZmlsZSBpbiBkYXRhIGZvcm1hdClcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIG9mIHJlbmRlcmluZyAobm90IGZpbGVuYW1lKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtoZWFkZXI9ZGF0YTppbWFnZS9wbmc7YmFzZTY0LF0gZm9yIGRhdGFcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZERhdGEobmFtZSwgZGF0YSwgaGVhZGVyKVxyXG4gICAge1xyXG4gICAgICAgIGhlYWRlciA9IHR5cGVvZiBoZWFkZXIgIT09ICd1bmRlZmluZWQnID8gaGVhZGVyIDogJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCwnXHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZSwgdHlwZTogREFUQSwgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZShQSVhJLlRleHR1cmUuRU1QVFkpIH1cclxuICAgICAgICBvYmplY3QuaW1hZ2UgPSBuZXcgSW1hZ2UoKVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBoZWFkZXIgKyBkYXRhXHJcbiAgICAgICAgaWYgKG9iamVjdC5pbWFnZS5jb21wbGV0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdC5sb2FkZWQgPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdC5pbWFnZS5vbmxvYWQgPSAoKSA9PiBvYmplY3QubG9hZGVkID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhdHRhY2hlcyBSZW5kZXJTaGVldCB0byBET00gZm9yIHRlc3RpbmdcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdHlsZXMgLSBDU1Mgc3R5bGVzIHRvIHVzZSBmb3IgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHNob3dDYW52YXNlcygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRpdkNhbnZhc2VzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kaXZDYW52YXNlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2hpbGUgKHRoaXMuZGl2Q2FudmFzZXMuaGFzQ2hpbGROb2RlcygpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpdkNhbnZhc2VzLnJlbW92ZUNoaWxkKHRoaXMuZGl2Q2FudmFzZXMubGFzdENoaWxkKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBlcmNlbnQgPSAxIC8gdGhpcy5jYW52YXNlcy5sZW5ndGhcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2ldXHJcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gY2FudmFzLnN0eWxlXHJcbiAgICAgICAgICAgIHN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJ1xyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gJzBweCdcclxuICAgICAgICAgICAgc3R5bGUudG9wID0gaSAqIE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJSdcclxuICAgICAgICAgICAgc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICAgICAgc3R5bGUuaGVpZ2h0ID0gTWF0aC5yb3VuZChwZXJjZW50ICogMTAwKSArICclJ1xyXG4gICAgICAgICAgICBzdHlsZS56SW5kZXggPSAxMDAwXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlTW9kZSA9PT0gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZS5pbWFnZVJlbmRlcmluZyA9ICdwaXhlbGF0ZWQnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3R5bGUuYmFja2dyb3VuZCA9IHRoaXMucmFuZG9tQ29sb3IoKVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc2hvdyA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnNob3cpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVba2V5XSA9IHRoaXMuc2hvd1trZXldXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcy5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdGVzdHMgd2hldGhlciBhIHRleHR1cmUgZXhpc3RzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBleGlzdHMobmFtZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlc1tuYW1lXSA/IHRydWUgOiBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7KFBJWEkuVGV4dHVyZXxudWxsKX1cclxuICAgICAqL1xyXG4gICAgZ2V0VGV4dHVyZShuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW25hbWVdXHJcbiAgICAgICAgaWYgKHRleHR1cmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGV4dHVyZS50ZXh0dXJlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktcmVuZGVyc2hlZXQ6IHRleHR1cmUgJyArIG5hbWUgKyAnIG5vdCBmb3VuZCBpbiBzcHJpdGVzaGVldC4nKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYSBQSVhJLlNwcml0ZSAod2l0aCBhbmNob3Igc2V0IHRvIDAuNSwgYmVjYXVzZSB0aGF0J3Mgd2hlcmUgaXQgc2hvdWxkIGJlKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7UElYSS5TcHJpdGV9XHJcbiAgICAgKi9cclxuICAgIGdldFNwcml0ZShuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFRleHR1cmUobmFtZSlcclxuICAgICAgICBpZiAodGV4dHVyZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNwcml0ZSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlKVxyXG4gICAgICAgICAgICBzcHJpdGUuYW5jaG9yLnNldCgwLjUpXHJcbiAgICAgICAgICAgIHJldHVybiBzcHJpdGVcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhbGlhcyBmb3IgZ2V0U3ByaXRlKClcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4ge1BJWEkuU3ByaXRlfVxyXG4gICAgICovXHJcbiAgICBnZXQobmFtZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRTcHJpdGUobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gYW1vdW50IG9mIHRleHR1cmVzIGluIHRoaXMgcmVuZGVyc2hlZXRcclxuICAgICAqL1xyXG4gICAgZW50cmllcygpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudGV4dHVyZXMpLmxlbmd0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcHJpbnRzIHN0YXRpc3RpY3Mgb2YgY2FudmFzZXMgdG8gY29uc29sZS5sb2dcclxuICAgICAqL1xyXG4gICAgZGVidWcoKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbaV1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3l5LXJlbmRlcnNoZWV0OiBTaGVldCAjJyArIChpICsgMSkgKyAnIHwgc2l6ZTogJyArIGNhbnZhcy53aWR0aCArICd4JyArIGNhbnZhcy5oZWlnaHQgKyAnIHwgcmVzb2x1dGlvbjogJyArIHRoaXMucmVzb2x1dGlvbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmaW5kIHRoZSBpbmRleCBvZiB0aGUgdGV4dHVyZSBiYXNlZCBvbiB0aGUgdGV4dHVyZSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmaW5kIHRoaXMgaW5kZXhlZCB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJucyB7UElYSS5UZXh0dXJlfVxyXG4gICAgICovXHJcbiAgICBnZXRJbmRleChmaW5kKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGkgPT09IGZpbmQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRleHR1cmVzW2tleV0udGV4dHVyZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkrK1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2hlY2tzIGlmIGFsbCB0ZXh0dXJlcyBhcmUgbG9hZGVkXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBjaGVja0xvYWRlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIGlmICgoY3VycmVudC50eXBlID09PSBJTUFHRSB8fCBjdXJyZW50LnR5cGUgPT09IERBVEEpICYmICFjdXJyZW50LmxvYWRlZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNyZWF0ZSAob3IgcmVmcmVzaCkgdGhlIHJlbmRlcnNoZWV0IChzdXBwb3J0cyBhc3luYyBpbnN0ZWFkIG9mIGNhbGxiYWNrKVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBza2lwVGV4dHVyZXMgLSBkb24ndCBjcmVhdGUgUElYSS5CYXNlVGV4dHVyZXMgYW5kIFBJWEkuVGV4dHVyZXMgKHVzZWZ1bCBmb3IgZ2VuZXJhdGluZyBleHRlcm5hbCBzcHJpdGVzaGVldHMpXHJcbiAgICAgKi9cclxuICAgIGFzeW5jUmVuZGVyKHNraXBUZXh0dXJlcylcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIocmVzb2x2ZSwgc2tpcFRleHR1cmVzKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGUgKG9yIHJlZnJlc2gpIHRoZSByZW5kZXJzaGVldFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBza2lwVGV4dHVyZXMgLSBkb24ndCBjcmVhdGUgUElYSS5CYXNlVGV4dHVyZXMgYW5kIFBJWEkuVGV4dHVyZXMgKHVzZWZ1bCBmb3IgZ2VuZXJhdGluZyBleHRlcm5hbCBzcHJpdGVzaGVldHMpXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgY2FsbHMgUmVuZGVyU2hlZXQub25jZSgncmVuZGVyJywgY2FsbGJhY2spXHJcbiAgICAgKi9cclxuICAgIHJlbmRlcihjYWxsYmFjaywgc2tpcFRleHR1cmVzKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChjYWxsYmFjaylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub25jZSgncmVuZGVyJywgY2FsbGJhY2spXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghT2JqZWN0LmtleXModGhpcy50ZXh0dXJlcykubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrTG9hZGVkKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVuZGVyKCksIFdBSVQpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW11cclxuICAgICAgICB0aGlzLnNvcnRlZCA9IFtdXHJcblxyXG4gICAgICAgIHRoaXMubWVhc3VyZSgpXHJcbiAgICAgICAgdGhpcy5zb3J0KClcclxuICAgICAgICB0aGlzLnBhY2soKVxyXG4gICAgICAgIHRoaXMuZHJhdygpXHJcbiAgICAgICAgaWYgKCFza2lwVGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJhc2VUZXh0dXJlcygpXHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmJhc2VUZXh0dXJlID0gdGhpcy5iYXNlVGV4dHVyZXNbY3VycmVudC5jYW52YXNdXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50LnRleHR1cmUuZnJhbWUgPSBuZXcgUElYSS5SZWN0YW5nbGUoY3VycmVudC54LCBjdXJyZW50LnksIGN1cnJlbnQud2lkdGgsIGN1cnJlbnQuaGVpZ2h0KVxyXG4gICAgICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLnVwZGF0ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuc2hvdylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0NhbnZhc2VzKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWVhc3VyZXMgY2FudmFzIHJlbmRlcmluZ3NcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIG1lYXN1cmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgIGMud2lkdGggPSB0aGlzLm1heFNpemVcclxuICAgICAgICBjLmhlaWdodCA9IHRoaXMubWF4U2l6ZVxyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjLmdldENvbnRleHQoJzJkJylcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gTWF0aC5jZWlsKHRoaXMuc2NhbGUgKiB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIHN3aXRjaCAodGV4dHVyZS50eXBlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIENBTlZBUzpcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzaXplID0gdGV4dHVyZS5tZWFzdXJlKGNvbnRleHQsIHRleHR1cmUucGFyYW0sIGMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS53aWR0aCA9IE1hdGguY2VpbChzaXplLndpZHRoICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmhlaWdodCA9IE1hdGguY2VpbChzaXplLmhlaWdodCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIElNQUdFOiBjYXNlIERBVEE6XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS53aWR0aCA9IE1hdGguY2VpbCh0ZXh0dXJlLmltYWdlLndpZHRoICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmhlaWdodCA9IE1hdGguY2VpbCh0ZXh0dXJlLmltYWdlLmhlaWdodCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNvcnRlZC5wdXNoKHRleHR1cmUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc29ydCB0ZXh0dXJlcyBieSBsYXJnZXN0IGRpbWVuc2lvblxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgc29ydCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zb3J0ZWQuc29ydChcclxuICAgICAgICAgICAgZnVuY3Rpb24oYSwgYilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFTaXplID0gTWF0aC5tYXgoYS5oZWlnaHQsIGEud2lkdGgpXHJcbiAgICAgICAgICAgICAgICBsZXQgYlNpemUgPSBNYXRoLm1heChiLmhlaWdodCwgYi53aWR0aClcclxuICAgICAgICAgICAgICAgIGlmIChhU2l6ZSA9PT0gYlNpemUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYVNpemUgPSBNYXRoLm1pbihhLmhlaWdodCwgYS53aWR0aClcclxuICAgICAgICAgICAgICAgICAgICBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJTaXplIC0gYVNpemVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNyZWF0ZSBzcXVhcmUgY2FudmFzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3NpemU9dGhpcy5tYXhTaXplXVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgY3JlYXRlQ2FudmFzKHNpemUpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ID0gc2l6ZSB8fCB0aGlzLm1heFNpemVcclxuICAgICAgICB0aGlzLmNhbnZhc2VzLnB1c2goY2FudmFzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhIHJhbmRvbSByZ2IgY29sb3JcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHJhbmRvbUNvbG9yKClcclxuICAgIHtcclxuICAgICAgICBmdW5jdGlvbiByKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNTUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAncmdiYSgnICsgcigpICsgJywnICsgcigpICsgJywnICsgcigpICsgJywgMC4yKSdcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGRyYXcgcmVuZGVyaW5ncyB0byByZW5kZXJ0ZXh0dXJlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBkcmF3KClcclxuICAgIHtcclxuICAgICAgICBsZXQgY3VycmVudCwgY29udGV4dFxyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSBNYXRoLmNlaWwodGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvbilcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgaWYgKHRleHR1cmUuY2FudmFzICE9PSBjdXJyZW50KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnQgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gdGV4dHVyZS5jYW52YXNcclxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzLmNhbnZhc2VzW2N1cnJlbnRdLmdldENvbnRleHQoJzJkJylcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LnNjYWxlKG11bHRpcGxpZXIsIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29udGV4dC5zYXZlKClcclxuICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoTWF0aC5jZWlsKHRleHR1cmUueCAvIG11bHRpcGxpZXIpLCBNYXRoLmNlaWwodGV4dHVyZS55IC8gbXVsdGlwbGllcikpXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRlc3RCb3hlcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLnJhbmRvbUNvbG9yKClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgTWF0aC5jZWlsKHRleHR1cmUud2lkdGggLyBtdWx0aXBsaWVyKSwgTWF0aC5jZWlsKHRleHR1cmUuaGVpZ2h0IC8gbXVsdGlwbGllcikpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3dpdGNoICh0ZXh0dXJlLnR5cGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgQ0FOVkFTOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuZHJhdyhjb250ZXh0LCB0ZXh0dXJlLnBhcmFtLCB0aGlzLmNhbnZhc2VzW2N1cnJlbnRdKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBJTUFHRTogY2FzZSBEQVRBOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHRleHR1cmUuaW1hZ2UsIDAsIDApXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5leHRydWRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4dHJ1ZGVFbnRyeSh0ZXh0dXJlLCBjb250ZXh0LCBjdXJyZW50KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBleHRydWRlIHBpeGVscyBmb3IgZW50cnlcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZXh0cnVkZUVudHJ5KHRleHR1cmUsIGNvbnRleHQsIGN1cnJlbnQpXHJcbiAgICB7XHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0KHgsIHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9ICh4ICsgeSAqIHRleHR1cmUud2lkdGgpICogNFxyXG4gICAgICAgICAgICBjb25zdCBkID0gZGF0YS5kYXRhXHJcbiAgICAgICAgICAgIHJldHVybiAncmdiYSgnICsgZFtlbnRyeV0gKyAnLCcgKyBkW2VudHJ5ICsgMV0gKyAnLCcgKyBkW2VudHJ5ICsgMl0gKyAnLCcgKyAoZFtlbnRyeSArIDNdIC8gMHhmZikgKyAnKSdcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbY3VycmVudF1cclxuICAgICAgICBjb25zdCBkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEodGV4dHVyZS54LCB0ZXh0dXJlLnksIHRleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0KVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnggIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KDAsIHkpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KC0xLCB5LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLnkgIT09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KDAsIDApXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KC0xLCAtMSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dHVyZS54ICsgdGV4dHVyZS53aWR0aCAhPT0gY2FudmFzLndpZHRoIC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGV4dHVyZS5oZWlnaHQ7IHkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQodGV4dHVyZS53aWR0aCAtIDEsIHkpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHRleHR1cmUud2lkdGgsIHksIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSArIHRleHR1cmUuaGVpZ2h0ICE9PSBjYW52YXMuaGVpZ2h0IC0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQodGV4dHVyZS53aWR0aCAtIDEsIHRleHR1cmUuaGVpZ2h0IC0gMSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QodGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGV4dHVyZS53aWR0aDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh4LCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh4LCAtMSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dHVyZS55ICsgdGV4dHVyZS5oZWlnaHQgIT09IGNhbnZhcy5oZWlnaHQgLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0ZXh0dXJlLndpZHRoOyB4KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHgsIHRleHR1cmUuaGVpZ2h0IC0gMSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoeCwgdGV4dHVyZS5oZWlnaHQsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVCYXNlVGV4dHVyZXMoKVxyXG4gICAge1xyXG4gICAgICAgIHdoaWxlICh0aGlzLmJhc2VUZXh0dXJlcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VUZXh0dXJlcy5wb3AoKS5kZXN0cm95KClcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZnJvbSA9IFBJWEkuQmFzZVRleHR1cmUuZnJvbUNhbnZhcyB8fCBQSVhJLkJhc2VUZXh0dXJlLmZyb21cclxuICAgICAgICAgICAgY29uc3QgYmFzZSA9IGZyb20odGhpcy5jYW52YXNlc1tpXSlcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGVNb2RlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBiYXNlLnNjYWxlTW9kZSA9IHRoaXMuc2NhbGVNb2RlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucHVzaChiYXNlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhY2sgdGV4dHVyZXMgYWZ0ZXIgbWVhc3VyZW1lbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHBhY2soKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHBhY2tlcnMgPSBbbmV3IHRoaXMucGFja2VyKHRoaXMubWF4U2l6ZSwgdGhpcy5zb3J0ZWRbMF0sIHRoaXMuYnVmZmVyKV1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc29ydGVkLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYmxvY2sgPSB0aGlzLnNvcnRlZFtpXVxyXG4gICAgICAgICAgICBsZXQgcGFja2VkID0gZmFsc2VcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYWNrZXJzLmxlbmd0aDsgaisrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFja2Vyc1tqXS5hZGQoYmxvY2ssIGopKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmNhbnZhcyA9IGpcclxuICAgICAgICAgICAgICAgICAgICBwYWNrZWQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXBhY2tlZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFja2Vycy5wdXNoKG5ldyB0aGlzLnBhY2tlcih0aGlzLm1heFNpemUsIGJsb2NrLCB0aGlzLmJ1ZmZlcikpXHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhY2tlcnNbal0uYWRkKGJsb2NrLCBqKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiAnICsgYmxvY2submFtZSArICcgaXMgdG9vIGJpZyBmb3IgdGhlIHNwcml0ZXNoZWV0LicpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0galxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhY2tlcnMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzaXplID0gcGFja2Vyc1tpXS5maW5pc2godGhpcy5tYXhTaXplKVxyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNhbnZhcyhzaXplKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoYW5nZXMgdGhlIGRyYXdpbmcgZnVuY3Rpb24gb2YgYSB0ZXh0dXJlXHJcbiAgICAgKiBOT1RFOiB0aGlzIG9ubHkgd29ya3MgaWYgdGhlIHRleHR1cmUgcmVtYWlucyB0aGUgc2FtZSBzaXplOyB1c2UgU2hlZXQucmVuZGVyKCkgdG8gcmVzaXplIHRoZSB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZHJhd1xyXG4gICAgICovXHJcbiAgICBjaGFuZ2VEcmF3KG5hbWUsIGRyYXcpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNbbmFtZV1cclxuICAgICAgICBpZiAodGV4dHVyZS50eXBlICE9PSBDQU5WQVMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXNoZWV0LmNoYW5nZVRleHR1cmVEcmF3IG9ubHkgd29ya3Mgd2l0aCB0eXBlOiBDQU5WQVMuJylcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHR1cmUuZHJhdyA9IGRyYXdcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jYW52YXNlc1t0ZXh0dXJlLmNhbnZhc10uZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSB0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uXHJcbiAgICAgICAgY29udGV4dC5zYXZlKClcclxuICAgICAgICBjb250ZXh0LnNjYWxlKG11bHRpcGxpZXIsIG11bHRpcGxpZXIpXHJcbiAgICAgICAgY29udGV4dC50cmFuc2xhdGUodGV4dHVyZS54IC8gbXVsdGlwbGllciwgdGV4dHVyZS55IC8gbXVsdGlwbGllcilcclxuICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSlcclxuICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgIHRleHR1cmUudGV4dHVyZS51cGRhdGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlclNoZWV0XHJcblxyXG4vKipcclxuICogZmlyZXMgd2hlbiByZW5kZXIgY29tcGxldGVzXHJcbiAqIEBldmVudCBSZW5kZXJTaGVldCNyZW5kZXJcclxuICovIl19