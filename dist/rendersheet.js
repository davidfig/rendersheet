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
            object.image.onload = function () {
                return object.loaded = true;
            };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNhbnZhc2VzIiwiYmFzZVRleHR1cmVzIiwidGV4dHVyZXMiLCJuYW1lIiwiZHJhdyIsIm1lYXN1cmUiLCJwYXJhbSIsIm9iamVjdCIsInR5cGUiLCJ0ZXh0dXJlIiwiVGV4dHVyZSIsIkVNUFRZIiwic3JjIiwiZmlsZSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJkYXRhIiwiaGVhZGVyIiwiZGl2Q2FudmFzZXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJoYXNDaGlsZE5vZGVzIiwicmVtb3ZlQ2hpbGQiLCJsYXN0Q2hpbGQiLCJwZXJjZW50IiwibGVuZ3RoIiwiaSIsImNhbnZhcyIsInN0eWxlIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiTWF0aCIsInJvdW5kIiwid2lkdGgiLCJoZWlnaHQiLCJ6SW5kZXgiLCJpbWFnZVJlbmRlcmluZyIsImJhY2tncm91bmQiLCJyYW5kb21Db2xvciIsImtleSIsImNvbnNvbGUiLCJ3YXJuIiwiZ2V0VGV4dHVyZSIsInNwcml0ZSIsIlNwcml0ZSIsImFuY2hvciIsInNldCIsImdldFNwcml0ZSIsIk9iamVjdCIsImtleXMiLCJsb2ciLCJmaW5kIiwiY3VycmVudCIsInNraXBUZXh0dXJlcyIsIlByb21pc2UiLCJyZW5kZXIiLCJyZXNvbHZlIiwiY2FsbGJhY2siLCJvbmNlIiwiZW1pdCIsImNoZWNrTG9hZGVkIiwic2V0VGltZW91dCIsInNvcnRlZCIsInNvcnQiLCJwYWNrIiwiY3JlYXRlQmFzZVRleHR1cmVzIiwiYmFzZVRleHR1cmUiLCJmcmFtZSIsIlJlY3RhbmdsZSIsIngiLCJ5IiwidXBkYXRlIiwic2hvd0NhbnZhc2VzIiwiYyIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwibXVsdGlwbGllciIsImNlaWwiLCJzaXplIiwicHVzaCIsImEiLCJiIiwiYVNpemUiLCJtYXgiLCJiU2l6ZSIsIm1pbiIsInIiLCJmbG9vciIsInJhbmRvbSIsInJlc3RvcmUiLCJzYXZlIiwidHJhbnNsYXRlIiwiZmlsbFN0eWxlIiwiZmlsbFJlY3QiLCJkcmF3SW1hZ2UiLCJleHRydWRlRW50cnkiLCJnZXQiLCJlbnRyeSIsImQiLCJnZXRJbWFnZURhdGEiLCJwb3AiLCJkZXN0cm95IiwiZnJvbSIsIkJhc2VUZXh0dXJlIiwiZnJvbUNhbnZhcyIsImJhc2UiLCJwYWNrZXJzIiwiYmxvY2siLCJwYWNrZWQiLCJqIiwiYWRkIiwiZmluaXNoIiwiY3JlYXRlQ2FudmFzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPQyxRQUFRLFNBQVIsQ0FBYjtBQUNBLElBQU1DLFNBQVNELFFBQVEsZUFBUixDQUFmOztBQUVBLElBQU1FLGdCQUFnQkYsUUFBUSxpQkFBUixDQUF0QjtBQUNBLElBQU1HLGVBQWVILFFBQVEsZ0JBQVIsQ0FBckI7O0FBRUE7QUFDQSxJQUFNSSxTQUFTLENBQWYsQyxDQUFpQjtBQUNqQixJQUFNQyxRQUFRLENBQWQsQyxDQUFnQjtBQUNoQixJQUFNQyxPQUFPLENBQWIsQyxDQUFlOztBQUVmO0FBQ0EsSUFBTUMsT0FBTyxHQUFiOztJQUVNQyxXOzs7QUFFRjs7Ozs7Ozs7Ozs7Ozs7QUFjQSx5QkFBWUMsT0FBWixFQUNBO0FBQUE7O0FBQUE7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ckYsb0JBQVFBLE9BQVIsQ0FBZ0JtRSxNQUFoQjtBQUNIOzs7O0VBL2pCcUJsRyxNOztBQWtrQjFCNEksT0FBT0MsT0FBUCxHQUFpQnRJLFdBQWpCOztBQUVBIiwiZmlsZSI6InJlbmRlcnNoZWV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8geXktcmVuZGVyc2hlZXRcclxuLy8gYnkgRGF2aWQgRmlnYXRuZXJcclxuLy8gKGMpIFlPUEVZIFlPUEVZIExMQyAyMDE5XHJcbi8vIE1JVCBMaWNlbnNlXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXZpZGZpZy9yZW5kZXJzaGVldFxyXG5cclxuY29uc3QgUElYSSA9IHJlcXVpcmUoJ3BpeGkuanMnKVxyXG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcclxuXHJcbmNvbnN0IEdyb3dpbmdQYWNrZXIgPSByZXF1aXJlKCcuL2dyb3dpbmdwYWNrZXInKVxyXG5jb25zdCBTaW1wbGVQYWNrZXIgPSByZXF1aXJlKCcuL3NpbXBsZXBhY2tlcicpXHJcblxyXG4vLyB0eXBlc1xyXG5jb25zdCBDQU5WQVMgPSAwIC8vIGRlZmF1bHRcclxuY29uc3QgSU1BR0UgPSAxIC8vIGltYWdlIHVybFxyXG5jb25zdCBEQVRBID0gMiAvLyBkYXRhIHNyYyAoZS5nLiwgcmVzdWx0IG9mIC50b0RhdGFVUkwoKSlcclxuXHJcbi8vIGRlZmF1bHQgbXMgdG8gd2FpdCB0byBjaGVjayBpZiBhbiBpbWFnZSBoYXMgZmluaXNoZWQgbG9hZGluZ1xyXG5jb25zdCBXQUlUID0gMjUwXHJcblxyXG5jbGFzcyBSZW5kZXJTaGVldCBleHRlbmRzIEV2ZW50c1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4U2l6ZT0yMDQ4XVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmJ1ZmZlcj01XSBhcm91bmQgZWFjaCB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2NhbGU9MV0gb2YgdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnJlc29sdXRpb249MV0gb2YgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5leHRydWRlXSB0aGUgZWRnZXMtLXVzZWZ1bCBmb3IgcmVtb3ZpbmcgZ2FwcyBpbiBzcHJpdGVzIHdoZW4gdGlsaW5nXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMud2FpdD0yNTBdIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3Igb25sb2FkIG9mIGFkZEltYWdlIGltYWdlcyBiZWZvcmUgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRlc3RCb3hlc10gZHJhdyBhIGRpZmZlcmVudCBjb2xvcmVkIGJveGVzIGJlaGluZCBlYWNoIHJlbmRlcmluZyAodXNlZnVsIGZvciBkZWJ1Z2dpbmcpXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufSBbb3B0aW9ucy5zY2FsZU1vZGVdIFBJWEkuc2V0dGluZ3MuU0NBTEVfTU9ERSB0byBzZXQgZm9yIHJlbmRlcnNoZWV0ICh1c2UgPXRydWUgZm9yIFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVCBmb3IgcGl4ZWwgYXJ0KVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VTaW1wbGVQYWNrZXJdIHVzZSBhIHN0dXBpZGx5IHNpbXBsZSBwYWNrZXIgaW5zdGVhZCBvZiBncm93aW5nIHBhY2tlciBhbGdvcml0aG1cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbnxvYmplY3R9IFtvcHRpb25zLnNob3ddIHNldCB0byB0cnVlIG9yIGEgQ1NTIG9iamVjdCAoZS5nLiwge3pJbmRleDogMTAsIGJhY2tncm91bmQ6ICdibHVlJ30pIHRvIGF0dGFjaCB0aGUgZmluYWwgY2FudmFzIHRvIGRvY3VtZW50LmJvZHktLXVzZWZ1bCBmb3IgZGVidWdnaW5nXHJcbiAgICAgKiBAZmlyZSByZW5kZXJcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLndhaXQgPSBvcHRpb25zLndhaXQgfHwgV0FJVFxyXG4gICAgICAgIHRoaXMudGVzdEJveGVzID0gb3B0aW9ucy50ZXN0Qm94ZXMgfHwgZmFsc2VcclxuICAgICAgICB0aGlzLm1heFNpemUgPSBvcHRpb25zLm1heFNpemUgfHwgMjA0OFxyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gb3B0aW9ucy5idWZmZXIgfHwgNVxyXG4gICAgICAgIHRoaXMuc2NhbGUgPSBvcHRpb25zLnNjYWxlIHx8IDFcclxuICAgICAgICB0aGlzLnNjYWxlTW9kZSA9IG9wdGlvbnMuc2NhbGVNb2RlID09PSB0cnVlID8gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUIDogb3B0aW9ucy5zY2FsZU1vZGVcclxuICAgICAgICB0aGlzLnJlc29sdXRpb24gPSBvcHRpb25zLnJlc29sdXRpb24gfHwgMVxyXG4gICAgICAgIHRoaXMuc2hvdyA9IG9wdGlvbnMuc2hvd1xyXG4gICAgICAgIHRoaXMuZXh0cnVkZSA9IG9wdGlvbnMuZXh0cnVkZVxyXG4gICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUgJiYgdGhpcy5idWZmZXIgPCAyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIgPSAyXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGFja2VyID0gb3B0aW9ucy51c2VTaW1wbGVQYWNrZXIgPyBTaW1wbGVQYWNrZXIgOiBHcm93aW5nUGFja2VyXHJcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMgPSBbXVxyXG4gICAgICAgIHRoaXMudGV4dHVyZXMgPSB7fVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhIGNhbnZhcyByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZHJhdyBmdW5jdGlvbihjb250ZXh0KSAtIHVzZSB0aGUgY29udGV4dCB0byBkcmF3IHdpdGhpbiB0aGUgYm91bmRzIG9mIHRoZSBtZWFzdXJlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZWFzdXJlIGZ1bmN0aW9uKGNvbnRleHQpIC0gbmVlZHMgdG8gcmV0dXJuIHt3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSBmb3IgdGhlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIG9iamVjdCB0byBwYXNzIHRoZSBkcmF3KCkgYW5kIG1lYXN1cmUoKSBmdW5jdGlvbnNcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZChuYW1lLCBkcmF3LCBtZWFzdXJlLCBwYXJhbSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lOiBuYW1lLCBkcmF3OiBkcmF3LCBtZWFzdXJlOiBtZWFzdXJlLCBwYXJhbTogcGFyYW0sIHR5cGU6IENBTlZBUywgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZShQSVhJLlRleHR1cmUuRU1QVFkpIH1cclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGFuIGltYWdlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3JjIGZvciBpbWFnZVxyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSByZW5kZXJzaGVldCBvYmplY3QgZm9yIHRleHR1cmVcclxuICAgICAqL1xyXG4gICAgYWRkSW1hZ2UobmFtZSwgc3JjKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMudGV4dHVyZXNbbmFtZV0gPSB7IG5hbWUsIGZpbGU6IHNyYywgdHlwZTogSU1BR0UsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSAgfVxyXG4gICAgICAgIG9iamVjdC5pbWFnZSA9IG5ldyBJbWFnZSgpXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLnNyYyA9IHNyY1xyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBkYXRhIHNvdXJjZSAoZS5nLiwgYSBQTkcgZmlsZSBpbiBkYXRhIGZvcm1hdClcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIG9mIHJlbmRlcmluZyAobm90IGZpbGVuYW1lKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtoZWFkZXI9ZGF0YTppbWFnZS9wbmc7YmFzZTY0LF0gZm9yIGRhdGFcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZERhdGEobmFtZSwgZGF0YSwgaGVhZGVyKVxyXG4gICAge1xyXG4gICAgICAgIGhlYWRlciA9IHR5cGVvZiBoZWFkZXIgIT09ICd1bmRlZmluZWQnID8gaGVhZGVyIDogJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCwnXHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZSwgdHlwZTogREFUQSwgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZShQSVhJLlRleHR1cmUuRU1QVFkpIH1cclxuICAgICAgICBvYmplY3QuaW1hZ2UgPSBuZXcgSW1hZ2UoKVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBoZWFkZXIgKyBkYXRhXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYXR0YWNoZXMgUmVuZGVyU2hlZXQgdG8gRE9NIGZvciB0ZXN0aW5nXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gc3R5bGVzIC0gQ1NTIHN0eWxlcyB0byB1c2UgZm9yIHJlbmRlcnNoZWV0XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBzaG93Q2FudmFzZXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5kaXZDYW52YXNlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZGl2Q2FudmFzZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmRpdkNhbnZhc2VzLmhhc0NoaWxkTm9kZXMoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcy5yZW1vdmVDaGlsZCh0aGlzLmRpdkNhbnZhc2VzLmxhc3RDaGlsZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwZXJjZW50ID0gMSAvIHRoaXMuY2FudmFzZXMubGVuZ3RoXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tpXVxyXG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGNhbnZhcy5zdHlsZVxyXG4gICAgICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCdcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9ICcwcHgnXHJcbiAgICAgICAgICAgIHN0eWxlLnRvcCA9IGkgKiBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnXHJcbiAgICAgICAgICAgIHN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHN0eWxlLmhlaWdodCA9IE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJSdcclxuICAgICAgICAgICAgc3R5bGUuekluZGV4ID0gMTAwMFxyXG4gICAgICAgICAgICBpZiAodGhpcy5zY2FsZU1vZGUgPT09IFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc3R5bGUuaW1hZ2VSZW5kZXJpbmcgPSAncGl4ZWxhdGVkJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnJhbmRvbUNvbG9yKClcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnNob3cgPT09ICdvYmplY3QnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5zaG93KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSB0aGlzLnNob3dba2V5XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMuYXBwZW5kQ2hpbGQoY2FudmFzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHRlc3RzIHdoZXRoZXIgYSB0ZXh0dXJlIGV4aXN0c1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgZXhpc3RzKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dHVyZXNbbmFtZV0gPyB0cnVlIDogZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4geyhQSVhJLlRleHR1cmV8bnVsbCl9XHJcbiAgICAgKi9cclxuICAgIGdldFRleHR1cmUobmFtZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tuYW1lXVxyXG4gICAgICAgIGlmICh0ZXh0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHR1cmUudGV4dHVyZVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiB0ZXh0dXJlICcgKyBuYW1lICsgJyBub3QgZm91bmQgaW4gc3ByaXRlc2hlZXQuJylcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGEgUElYSS5TcHJpdGUgKHdpdGggYW5jaG9yIHNldCB0byAwLjUsIGJlY2F1c2UgdGhhdCdzIHdoZXJlIGl0IHNob3VsZCBiZSlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4ge1BJWEkuU3ByaXRlfVxyXG4gICAgICovXHJcbiAgICBnZXRTcHJpdGUobmFtZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5nZXRUZXh0dXJlKG5hbWUpXHJcbiAgICAgICAgaWYgKHRleHR1cmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZSlcclxuICAgICAgICAgICAgc3ByaXRlLmFuY2hvci5zZXQoMC41KVxyXG4gICAgICAgICAgICByZXR1cm4gc3ByaXRlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWxpYXMgZm9yIGdldFNwcml0ZSgpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHtQSVhJLlNwcml0ZX1cclxuICAgICAqL1xyXG4gICAgZ2V0KG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3ByaXRlKG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IGFtb3VudCBvZiB0ZXh0dXJlcyBpbiB0aGlzIHJlbmRlcnNoZWV0XHJcbiAgICAgKi9cclxuICAgIGVudHJpZXMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnRleHR1cmVzKS5sZW5ndGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHByaW50cyBzdGF0aXN0aWNzIG9mIGNhbnZhc2VzIHRvIGNvbnNvbGUubG9nXHJcbiAgICAgKi9cclxuICAgIGRlYnVnKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2ldXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd5eS1yZW5kZXJzaGVldDogU2hlZXQgIycgKyAoaSArIDEpICsgJyB8IHNpemU6ICcgKyBjYW52YXMud2lkdGggKyAneCcgKyBjYW52YXMuaGVpZ2h0ICsgJyB8IHJlc29sdXRpb246ICcgKyB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZmluZCB0aGUgaW5kZXggb2YgdGhlIHRleHR1cmUgYmFzZWQgb24gdGhlIHRleHR1cmUgb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZmluZCB0aGlzIGluZGV4ZWQgdGV4dHVyZVxyXG4gICAgICogQHJldHVybnMge1BJWEkuVGV4dHVyZX1cclxuICAgICAqL1xyXG4gICAgZ2V0SW5kZXgoZmluZClcclxuICAgIHtcclxuICAgICAgICBsZXQgaSA9IDBcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChpID09PSBmaW5kKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlc1trZXldLnRleHR1cmVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpKytcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGxcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoZWNrcyBpZiBhbGwgdGV4dHVyZXMgYXJlIGxvYWRlZFxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgY2hlY2tMb2FkZWQoKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBpZiAoKGN1cnJlbnQudHlwZSA9PT0gSU1BR0UgfHwgY3VycmVudC50eXBlID09PSBEQVRBKSAmJiAhY3VycmVudC5sb2FkZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGUgKG9yIHJlZnJlc2gpIHRoZSByZW5kZXJzaGVldCAoc3VwcG9ydHMgYXN5bmMgaW5zdGVhZCBvZiBjYWxsYmFjaylcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcFRleHR1cmVzIC0gZG9uJ3QgY3JlYXRlIFBJWEkuQmFzZVRleHR1cmVzIGFuZCBQSVhJLlRleHR1cmVzICh1c2VmdWwgZm9yIGdlbmVyYXRpbmcgZXh0ZXJuYWwgc3ByaXRlc2hlZXRzKVxyXG4gICAgICovXHJcbiAgICBhc3luY1JlbmRlcihza2lwVGV4dHVyZXMpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHJlc29sdmUsIHNraXBUZXh0dXJlcylcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlIChvciByZWZyZXNoKSB0aGUgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcFRleHR1cmVzIC0gZG9uJ3QgY3JlYXRlIFBJWEkuQmFzZVRleHR1cmVzIGFuZCBQSVhJLlRleHR1cmVzICh1c2VmdWwgZm9yIGdlbmVyYXRpbmcgZXh0ZXJuYWwgc3ByaXRlc2hlZXRzKVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IGNhbGxzIFJlbmRlclNoZWV0Lm9uY2UoJ3JlbmRlcicsIGNhbGxiYWNrKVxyXG4gICAgICovXHJcbiAgICByZW5kZXIoY2FsbGJhY2ssIHNraXBUZXh0dXJlcylcclxuICAgIHtcclxuICAgICAgICBpZiAoY2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9uY2UoJ3JlbmRlcicsIGNhbGxiYWNrKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHRoaXMudGV4dHVyZXMpLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncmVuZGVyJylcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5jaGVja0xvYWRlZCgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCBXQUlUKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5zb3J0ZWQgPSBbXVxyXG5cclxuICAgICAgICB0aGlzLm1lYXN1cmUoKVxyXG4gICAgICAgIHRoaXMuc29ydCgpXHJcbiAgICAgICAgdGhpcy5wYWNrKClcclxuICAgICAgICB0aGlzLmRyYXcoKVxyXG4gICAgICAgIGlmICghc2tpcFRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVCYXNlVGV4dHVyZXMoKVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS5iYXNlVGV4dHVyZSA9IHRoaXMuYmFzZVRleHR1cmVzW2N1cnJlbnQuY2FudmFzXVxyXG4gICAgICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmZyYW1lID0gbmV3IFBJWEkuUmVjdGFuZ2xlKGN1cnJlbnQueCwgY3VycmVudC55LCBjdXJyZW50LndpZHRoLCBjdXJyZW50LmhlaWdodClcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS51cGRhdGUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnNob3cpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNob3dDYW52YXNlcygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVuZGVyJylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1lYXN1cmVzIGNhbnZhcyByZW5kZXJpbmdzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBtZWFzdXJlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICBjLndpZHRoID0gdGhpcy5tYXhTaXplXHJcbiAgICAgICAgYy5oZWlnaHQgPSB0aGlzLm1heFNpemVcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gYy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IE1hdGguY2VpbCh0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uKVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRleHR1cmUudHlwZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBDQU5WQVM6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHRleHR1cmUubWVhc3VyZShjb250ZXh0LCB0ZXh0dXJlLnBhcmFtLCBjKVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUud2lkdGggPSBNYXRoLmNlaWwoc2l6ZS53aWR0aCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwoc2l6ZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBJTUFHRTogY2FzZSBEQVRBOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUud2lkdGggPSBNYXRoLmNlaWwodGV4dHVyZS5pbWFnZS53aWR0aCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwodGV4dHVyZS5pbWFnZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zb3J0ZWQucHVzaCh0ZXh0dXJlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNvcnQgdGV4dHVyZXMgYnkgbGFyZ2VzdCBkaW1lbnNpb25cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHNvcnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc29ydGVkLnNvcnQoXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGEsIGIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBhU2l6ZSA9IE1hdGgubWF4KGEuaGVpZ2h0LCBhLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgbGV0IGJTaXplID0gTWF0aC5tYXgoYi5oZWlnaHQsIGIud2lkdGgpXHJcbiAgICAgICAgICAgICAgICBpZiAoYVNpemUgPT09IGJTaXplKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGFTaXplID0gTWF0aC5taW4oYS5oZWlnaHQsIGEud2lkdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgYlNpemUgPSBNYXRoLm1heChiLmhlaWdodCwgYi53aWR0aClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiU2l6ZSAtIGFTaXplXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGUgc3F1YXJlIGNhbnZhc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzaXplPXRoaXMubWF4U2l6ZV1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUNhbnZhcyhzaXplKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCA9IHNpemUgfHwgdGhpcy5tYXhTaXplXHJcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGNhbnZhcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYSByYW5kb20gcmdiIGNvbG9yXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICByYW5kb21Db2xvcigpXHJcbiAgICB7XHJcbiAgICAgICAgZnVuY3Rpb24gcigpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjU1KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ3JnYmEoJyArIHIoKSArICcsJyArIHIoKSArICcsJyArIHIoKSArICcsIDAuMiknXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBkcmF3IHJlbmRlcmluZ3MgdG8gcmVuZGVydGV4dHVyZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZHJhdygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQsIGNvbnRleHRcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gTWF0aC5jZWlsKHRoaXMuc2NhbGUgKiB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLmNhbnZhcyAhPT0gY3VycmVudClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHRleHR1cmUuY2FudmFzXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gdGhpcy5jYW52YXNlc1tjdXJyZW50XS5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LnNhdmUoKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5zY2FsZShtdWx0aXBsaWVyLCBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpXHJcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKE1hdGguY2VpbCh0ZXh0dXJlLnggLyBtdWx0aXBsaWVyKSwgTWF0aC5jZWlsKHRleHR1cmUueSAvIG11bHRpcGxpZXIpKVxyXG4gICAgICAgICAgICBpZiAodGhpcy50ZXN0Qm94ZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5yYW5kb21Db2xvcigpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIE1hdGguY2VpbCh0ZXh0dXJlLndpZHRoIC8gbXVsdGlwbGllciksIE1hdGguY2VpbCh0ZXh0dXJlLmhlaWdodCAvIG11bHRpcGxpZXIpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaCAodGV4dHVyZS50eXBlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIENBTlZBUzpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgdGhpcy5jYW52YXNlc1tjdXJyZW50XSlcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgSU1BR0U6IGNhc2UgREFUQTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh0ZXh0dXJlLmltYWdlLCAwLCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuZXh0cnVkZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZXh0cnVkZSBwaXhlbHMgZm9yIGVudHJ5XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGV4dHJ1ZGVFbnRyeSh0ZXh0dXJlLCBjb250ZXh0LCBjdXJyZW50KVxyXG4gICAge1xyXG4gICAgICAgIGZ1bmN0aW9uIGdldCh4LCB5KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSAoeCArIHkgKiB0ZXh0dXJlLndpZHRoKSAqIDRcclxuICAgICAgICAgICAgY29uc3QgZCA9IGRhdGEuZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gJ3JnYmEoJyArIGRbZW50cnldICsgJywnICsgZFtlbnRyeSArIDFdICsgJywnICsgZFtlbnRyeSArIDJdICsgJywnICsgKGRbZW50cnkgKyAzXSAvIDB4ZmYpICsgJyknXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2N1cnJlbnRdXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKHRleHR1cmUueCwgdGV4dHVyZS55LCB0ZXh0dXJlLndpZHRoLCB0ZXh0dXJlLmhlaWdodClcclxuICAgICAgICBpZiAodGV4dHVyZS54ICE9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0ZXh0dXJlLmhlaWdodDsgeSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCB5KVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgtMSwgeSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGV4dHVyZS55ICE9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgtMSwgLTEsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueCArIHRleHR1cmUud2lkdGggIT09IGNhbnZhcy53aWR0aCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHRleHR1cmUud2lkdGggLSAxLCB5KVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh0ZXh0dXJlLndpZHRoLCB5LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLnkgKyB0ZXh0dXJlLmhlaWdodCAhPT0gY2FudmFzLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHRleHR1cmUud2lkdGggLSAxLCB0ZXh0dXJlLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHRleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnkgIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRleHR1cmUud2lkdGg7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoeCwgMClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoeCwgLTEsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueSArIHRleHR1cmUuaGVpZ2h0ICE9PSBjYW52YXMuaGVpZ2h0IC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGV4dHVyZS53aWR0aDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh4LCB0ZXh0dXJlLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgY3JlYXRlQmFzZVRleHR1cmVzKClcclxuICAgIHtcclxuICAgICAgICB3aGlsZSAodGhpcy5iYXNlVGV4dHVyZXMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucG9wKCkuZGVzdHJveSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZyb20gPSBQSVhJLkJhc2VUZXh0dXJlLmZyb21DYW52YXMgfHwgUElYSS5CYXNlVGV4dHVyZS5mcm9tXHJcbiAgICAgICAgICAgIGNvbnN0IGJhc2UgPSBmcm9tKHRoaXMuY2FudmFzZXNbaV0pXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlTW9kZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYmFzZS5zY2FsZU1vZGUgPSB0aGlzLnNjYWxlTW9kZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZVRleHR1cmVzLnB1c2goYmFzZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwYWNrIHRleHR1cmVzIGFmdGVyIG1lYXN1cmVtZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBwYWNrKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBwYWNrZXJzID0gW25ldyB0aGlzLnBhY2tlcih0aGlzLm1heFNpemUsIHRoaXMuc29ydGVkWzBdLCB0aGlzLmJ1ZmZlcildXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNvcnRlZC5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJsb2NrID0gdGhpcy5zb3J0ZWRbaV1cclxuICAgICAgICAgICAgbGV0IHBhY2tlZCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFja2Vycy5sZW5ndGg7IGorKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhY2tlcnNbal0uYWRkKGJsb2NrLCBqKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBibG9jay5jYW52YXMgPSBqXHJcbiAgICAgICAgICAgICAgICAgICAgcGFja2VkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFwYWNrZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBhY2tlcnMucHVzaChuZXcgdGhpcy5wYWNrZXIodGhpcy5tYXhTaXplLCBibG9jaywgdGhpcy5idWZmZXIpKVxyXG4gICAgICAgICAgICAgICAgaWYgKCFwYWNrZXJzW2pdLmFkZChibG9jaywgaikpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1yZW5kZXJzaGVldDogJyArIGJsb2NrLm5hbWUgKyAnIGlzIHRvbyBiaWcgZm9yIHRoZSBzcHJpdGVzaGVldC4nKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmNhbnZhcyA9IGpcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWNrZXJzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHBhY2tlcnNbaV0uZmluaXNoKHRoaXMubWF4U2l6ZSlcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDYW52YXMoc2l6ZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2VzIHRoZSBkcmF3aW5nIGZ1bmN0aW9uIG9mIGEgdGV4dHVyZVxyXG4gICAgICogTk9URTogdGhpcyBvbmx5IHdvcmtzIGlmIHRoZSB0ZXh0dXJlIHJlbWFpbnMgdGhlIHNhbWUgc2l6ZTsgdXNlIFNoZWV0LnJlbmRlcigpIHRvIHJlc2l6ZSB0aGUgdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRyYXdcclxuICAgICAqL1xyXG4gICAgY2hhbmdlRHJhdyhuYW1lLCBkcmF3KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW25hbWVdXHJcbiAgICAgICAgaWYgKHRleHR1cmUudHlwZSAhPT0gQ0FOVkFTKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1zaGVldC5jaGFuZ2VUZXh0dXJlRHJhdyBvbmx5IHdvcmtzIHdpdGggdHlwZTogQ0FOVkFTLicpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0dXJlLmRyYXcgPSBkcmF3XHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHRoaXMuY2FudmFzZXNbdGV4dHVyZS5jYW52YXNdLmdldENvbnRleHQoJzJkJylcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gdGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvblxyXG4gICAgICAgIGNvbnRleHQuc2F2ZSgpXHJcbiAgICAgICAgY29udGV4dC5zY2FsZShtdWx0aXBsaWVyLCBtdWx0aXBsaWVyKVxyXG4gICAgICAgIGNvbnRleHQudHJhbnNsYXRlKHRleHR1cmUueCAvIG11bHRpcGxpZXIsIHRleHR1cmUueSAvIG11bHRpcGxpZXIpXHJcbiAgICAgICAgdGV4dHVyZS5kcmF3KGNvbnRleHQsIHRleHR1cmUucGFyYW0pXHJcbiAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgICAgICB0ZXh0dXJlLnRleHR1cmUudXBkYXRlKClcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJTaGVldFxyXG5cclxuLyoqXHJcbiAqIGZpcmVzIHdoZW4gcmVuZGVyIGNvbXBsZXRlc1xyXG4gKiBAZXZlbnQgUmVuZGVyU2hlZXQjcmVuZGVyXHJcbiAqLyJdfQ==