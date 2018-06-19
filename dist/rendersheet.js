'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// yy-rendersheet
// by David Figatner
// (c) YOPEY YOPEY LLC 2017
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
         * create (or refresh) the rendersheet
         * @param {function} callback - convenience function that calls RenderSheet.once('render', callback)
         */

    }, {
        key: 'render',
        value: function render(callback) {
            var _this2 = this;

            if (callback) {
                this.once('render', callback);
            }
            if (!Object.keys(this.textures).length) {
                this.emit('render');
                return;
            }
            if (!this.checkLoaded()) {
                window.setTimeout(function () {
                    return _this2.render();
                }, WAIT);
                return;
            }
            this.canvases = [];
            this.sorted = [];

            this.measure();
            this.sort();
            this.pack();
            this.draw();
            this.createBaseTextures();

            for (var key in this.textures) {
                var current = this.textures[key];
                current.texture.baseTexture = this.baseTextures[current.canvas];
                current.texture.frame = new PIXI.Rectangle(current.x, current.y, current.width, current.height);
                current.texture.update();
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
                        texture.draw(context, texture.param, current);
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
                var base = PIXI.BaseTexture.fromCanvas(this.canvases[i]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNhbnZhc2VzIiwiYmFzZVRleHR1cmVzIiwidGV4dHVyZXMiLCJuYW1lIiwiZHJhdyIsIm1lYXN1cmUiLCJwYXJhbSIsIm9iamVjdCIsInR5cGUiLCJ0ZXh0dXJlIiwiVGV4dHVyZSIsIkVNUFRZIiwic3JjIiwiZmlsZSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJkYXRhIiwiaGVhZGVyIiwiZGl2Q2FudmFzZXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJoYXNDaGlsZE5vZGVzIiwicmVtb3ZlQ2hpbGQiLCJsYXN0Q2hpbGQiLCJwZXJjZW50IiwibGVuZ3RoIiwiaSIsImNhbnZhcyIsInN0eWxlIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiTWF0aCIsInJvdW5kIiwid2lkdGgiLCJoZWlnaHQiLCJ6SW5kZXgiLCJpbWFnZVJlbmRlcmluZyIsImJhY2tncm91bmQiLCJyYW5kb21Db2xvciIsImtleSIsImNvbnNvbGUiLCJ3YXJuIiwiZ2V0VGV4dHVyZSIsInNwcml0ZSIsIlNwcml0ZSIsImFuY2hvciIsInNldCIsImdldFNwcml0ZSIsIk9iamVjdCIsImtleXMiLCJsb2ciLCJmaW5kIiwiY3VycmVudCIsImNhbGxiYWNrIiwib25jZSIsImVtaXQiLCJjaGVja0xvYWRlZCIsIndpbmRvdyIsInNldFRpbWVvdXQiLCJyZW5kZXIiLCJzb3J0ZWQiLCJzb3J0IiwicGFjayIsImNyZWF0ZUJhc2VUZXh0dXJlcyIsImJhc2VUZXh0dXJlIiwiZnJhbWUiLCJSZWN0YW5nbGUiLCJ4IiwieSIsInVwZGF0ZSIsInNob3dDYW52YXNlcyIsImMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm11bHRpcGxpZXIiLCJjZWlsIiwic2l6ZSIsInB1c2giLCJhIiwiYiIsImFTaXplIiwibWF4IiwiYlNpemUiLCJtaW4iLCJyIiwiZmxvb3IiLCJyYW5kb20iLCJyZXN0b3JlIiwic2F2ZSIsInRyYW5zbGF0ZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiZHJhd0ltYWdlIiwiZXh0cnVkZUVudHJ5IiwiZ2V0IiwiZW50cnkiLCJkIiwiZ2V0SW1hZ2VEYXRhIiwicG9wIiwiZGVzdHJveSIsImJhc2UiLCJCYXNlVGV4dHVyZSIsImZyb21DYW52YXMiLCJwYWNrZXJzIiwiYmxvY2siLCJwYWNrZWQiLCJqIiwiYWRkIiwiZmluaXNoIiwiY3JlYXRlQ2FudmFzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPQyxRQUFRLFNBQVIsQ0FBYjtBQUNBLElBQU1DLFNBQVNELFFBQVEsZUFBUixDQUFmOztBQUVBLElBQU1FLGdCQUFnQkYsUUFBUSxpQkFBUixDQUF0QjtBQUNBLElBQU1HLGVBQWVILFFBQVEsZ0JBQVIsQ0FBckI7O0FBRUE7QUFDQSxJQUFNSSxTQUFTLENBQWYsQyxDQUFpQjtBQUNqQixJQUFNQyxRQUFRLENBQWQsQyxDQUFnQjtBQUNoQixJQUFNQyxPQUFPLENBQWIsQyxDQUFlOztBQUVmO0FBQ0EsSUFBTUMsT0FBTyxHQUFiOztJQUVNQyxXOzs7QUFFRjs7Ozs7Ozs7Ozs7Ozs7QUFjQSx5QkFBWUMsT0FBWixFQUNBO0FBQUE7O0FBQUE7O0FBRUlBLGtCQUFVQSxXQUFXLEVBQXJCO0FBQ0EsY0FB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QU8yQixRQUFROUUsRUFBUixFQUFXbUYsTUFBWCxDQUFrQixLQUFLNUgsT0FBdkIsQ0FBYjtBQUNBLHFCQUFLNkgsWUFBTCxDQUFrQmpDLElBQWxCO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7Ozs7O21DQU1XOUUsSSxFQUFNQyxJLEVBQ2pCO0FBQ0ksZ0JBQU1LLFVBQVUsS0FBS1AsUUFBTCxDQUFjQyxJQUFkLENBQWhCO0FBQ0EsZ0JBQUlNLFFBQVFELElBQVIsS0FBaUIzQixNQUFyQixFQUNBO0FBQ0lnRSx3QkFBUUMsSUFBUixDQUFhLDBEQUFiO0FBQ0E7QUFDSDtBQUNEckMsb0JBQVFMLElBQVIsR0FBZUEsSUFBZjtBQUNBLGdCQUFNeUUsVUFBVSxLQUFLN0UsUUFBTCxDQUFjUyxRQUFRc0IsTUFBdEIsRUFBOEIrQyxVQUE5QixDQUF5QyxJQUF6QyxDQUFoQjtBQUNBLGdCQUFNQyxhQUFhLEtBQUt4RixLQUFMLEdBQWEsS0FBS0ksVUFBckM7QUFDQWtGLG9CQUFRZ0IsSUFBUjtBQUNBaEIsb0JBQVF0RixLQUFSLENBQWN3RixVQUFkLEVBQTBCQSxVQUExQjtBQUNBRixvQkFBUWlCLFNBQVIsQ0FBa0JyRixRQUFRK0QsQ0FBUixHQUFZTyxVQUE5QixFQUEwQ3RFLFFBQVFnRSxDQUFSLEdBQVlNLFVBQXREO0FBQ0F0RSxvQkFBUUwsSUFBUixDQUFheUUsT0FBYixFQUFzQnBFLFFBQVFILEtBQTlCO0FBQ0F1RSxvQkFBUWUsT0FBUjtBQUNBbkYsb0JBQVFBLE9BQVIsQ0FBZ0JpRSxNQUFoQjtBQUNIOzs7O0VBOWlCcUJoRyxNOztBQWlqQjFCeUksT0FBT0MsT0FBUCxHQUFpQm5JLFdBQWpCOztBQUVBIiwiZmlsZSI6InJlbmRlcnNoZWV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8geXktcmVuZGVyc2hlZXRcclxuLy8gYnkgRGF2aWQgRmlnYXRuZXJcclxuLy8gKGMpIFlPUEVZIFlPUEVZIExMQyAyMDE3XHJcbi8vIE1JVCBMaWNlbnNlXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXZpZGZpZy9yZW5kZXJzaGVldFxyXG5cclxuY29uc3QgUElYSSA9IHJlcXVpcmUoJ3BpeGkuanMnKVxyXG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcclxuXHJcbmNvbnN0IEdyb3dpbmdQYWNrZXIgPSByZXF1aXJlKCcuL2dyb3dpbmdwYWNrZXInKVxyXG5jb25zdCBTaW1wbGVQYWNrZXIgPSByZXF1aXJlKCcuL3NpbXBsZXBhY2tlcicpXHJcblxyXG4vLyB0eXBlc1xyXG5jb25zdCBDQU5WQVMgPSAwIC8vIGRlZmF1bHRcclxuY29uc3QgSU1BR0UgPSAxIC8vIGltYWdlIHVybFxyXG5jb25zdCBEQVRBID0gMiAvLyBkYXRhIHNyYyAoZS5nLiwgcmVzdWx0IG9mIC50b0RhdGFVUkwoKSlcclxuXHJcbi8vIGRlZmF1bHQgbXMgdG8gd2FpdCB0byBjaGVjayBpZiBhbiBpbWFnZSBoYXMgZmluaXNoZWQgbG9hZGluZ1xyXG5jb25zdCBXQUlUID0gMjUwXHJcblxyXG5jbGFzcyBSZW5kZXJTaGVldCBleHRlbmRzIEV2ZW50c1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4U2l6ZT0yMDQ4XVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmJ1ZmZlcj01XSBhcm91bmQgZWFjaCB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2NhbGU9MV0gb2YgdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnJlc29sdXRpb249MV0gb2YgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5leHRydWRlXSB0aGUgZWRnZXMtLXVzZWZ1bCBmb3IgcmVtb3ZpbmcgZ2FwcyBpbiBzcHJpdGVzIHdoZW4gdGlsaW5nXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMud2FpdD0yNTBdIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3Igb25sb2FkIG9mIGFkZEltYWdlIGltYWdlcyBiZWZvcmUgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRlc3RCb3hlc10gZHJhdyBhIGRpZmZlcmVudCBjb2xvcmVkIGJveGVzIGJlaGluZCBlYWNoIHJlbmRlcmluZyAodXNlZnVsIGZvciBkZWJ1Z2dpbmcpXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufSBbb3B0aW9ucy5zY2FsZU1vZGVdIFBJWEkuc2V0dGluZ3MuU0NBTEVfTU9ERSB0byBzZXQgZm9yIHJlbmRlcnNoZWV0ICh1c2UgPXRydWUgZm9yIFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVCBmb3IgcGl4ZWwgYXJ0KVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VTaW1wbGVQYWNrZXJdIHVzZSBhIHN0dXBpZGx5IHNpbXBsZSBwYWNrZXIgaW5zdGVhZCBvZiBncm93aW5nIHBhY2tlciBhbGdvcml0aG1cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbnxvYmplY3R9IFtvcHRpb25zLnNob3ddIHNldCB0byB0cnVlIG9yIGEgQ1NTIG9iamVjdCAoZS5nLiwge3pJbmRleDogMTAsIGJhY2tncm91bmQ6ICdibHVlJ30pIHRvIGF0dGFjaCB0aGUgZmluYWwgY2FudmFzIHRvIGRvY3VtZW50LmJvZHktLXVzZWZ1bCBmb3IgZGVidWdnaW5nXHJcbiAgICAgKiBAZmlyZSByZW5kZXJcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLndhaXQgPSBvcHRpb25zLndhaXQgfHwgV0FJVFxyXG4gICAgICAgIHRoaXMudGVzdEJveGVzID0gb3B0aW9ucy50ZXN0Qm94ZXMgfHwgZmFsc2VcclxuICAgICAgICB0aGlzLm1heFNpemUgPSBvcHRpb25zLm1heFNpemUgfHwgMjA0OFxyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gb3B0aW9ucy5idWZmZXIgfHwgNVxyXG4gICAgICAgIHRoaXMuc2NhbGUgPSBvcHRpb25zLnNjYWxlIHx8IDFcclxuICAgICAgICB0aGlzLnNjYWxlTW9kZSA9IG9wdGlvbnMuc2NhbGVNb2RlID09PSB0cnVlID8gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUIDogb3B0aW9ucy5zY2FsZU1vZGVcclxuICAgICAgICB0aGlzLnJlc29sdXRpb24gPSBvcHRpb25zLnJlc29sdXRpb24gfHwgMVxyXG4gICAgICAgIHRoaXMuc2hvdyA9IG9wdGlvbnMuc2hvd1xyXG4gICAgICAgIHRoaXMuZXh0cnVkZSA9IG9wdGlvbnMuZXh0cnVkZVxyXG4gICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUgJiYgdGhpcy5idWZmZXIgPCAyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIgPSAyXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGFja2VyID0gb3B0aW9ucy51c2VTaW1wbGVQYWNrZXIgPyBTaW1wbGVQYWNrZXIgOiBHcm93aW5nUGFja2VyXHJcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMgPSBbXVxyXG4gICAgICAgIHRoaXMudGV4dHVyZXMgPSB7fVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhIGNhbnZhcyByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZHJhdyBmdW5jdGlvbihjb250ZXh0KSAtIHVzZSB0aGUgY29udGV4dCB0byBkcmF3IHdpdGhpbiB0aGUgYm91bmRzIG9mIHRoZSBtZWFzdXJlIGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZWFzdXJlIGZ1bmN0aW9uKGNvbnRleHQpIC0gbmVlZHMgdG8gcmV0dXJuIHt3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSBmb3IgdGhlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIG9iamVjdCB0byBwYXNzIHRoZSBkcmF3KCkgYW5kIG1lYXN1cmUoKSBmdW5jdGlvbnNcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZChuYW1lLCBkcmF3LCBtZWFzdXJlLCBwYXJhbSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lOiBuYW1lLCBkcmF3OiBkcmF3LCBtZWFzdXJlOiBtZWFzdXJlLCBwYXJhbTogcGFyYW0sIHR5cGU6IENBTlZBUywgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZShQSVhJLlRleHR1cmUuRU1QVFkpIH1cclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGFuIGltYWdlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3JjIGZvciBpbWFnZVxyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSByZW5kZXJzaGVldCBvYmplY3QgZm9yIHRleHR1cmVcclxuICAgICAqL1xyXG4gICAgYWRkSW1hZ2UobmFtZSwgc3JjKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMudGV4dHVyZXNbbmFtZV0gPSB7IG5hbWUsIGZpbGU6IHNyYywgdHlwZTogSU1BR0UsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSAgfVxyXG4gICAgICAgIG9iamVjdC5pbWFnZSA9IG5ldyBJbWFnZSgpXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLnNyYyA9IHNyY1xyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBkYXRhIHNvdXJjZSAoZS5nLiwgYSBQTkcgZmlsZSBpbiBkYXRhIGZvcm1hdClcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIG9mIHJlbmRlcmluZyAobm90IGZpbGVuYW1lKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtoZWFkZXI9ZGF0YTppbWFnZS9wbmc7YmFzZTY0LF0gZm9yIGRhdGFcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZERhdGEobmFtZSwgZGF0YSwgaGVhZGVyKVxyXG4gICAge1xyXG4gICAgICAgIGhlYWRlciA9IHR5cGVvZiBoZWFkZXIgIT09ICd1bmRlZmluZWQnID8gaGVhZGVyIDogJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCwnXHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZSwgdHlwZTogREFUQSwgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZShQSVhJLlRleHR1cmUuRU1QVFkpIH1cclxuICAgICAgICBvYmplY3QuaW1hZ2UgPSBuZXcgSW1hZ2UoKVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBoZWFkZXIgKyBkYXRhXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYXR0YWNoZXMgUmVuZGVyU2hlZXQgdG8gRE9NIGZvciB0ZXN0aW5nXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gc3R5bGVzIC0gQ1NTIHN0eWxlcyB0byB1c2UgZm9yIHJlbmRlcnNoZWV0XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBzaG93Q2FudmFzZXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5kaXZDYW52YXNlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZGl2Q2FudmFzZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmRpdkNhbnZhc2VzLmhhc0NoaWxkTm9kZXMoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcy5yZW1vdmVDaGlsZCh0aGlzLmRpdkNhbnZhc2VzLmxhc3RDaGlsZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwZXJjZW50ID0gMSAvIHRoaXMuY2FudmFzZXMubGVuZ3RoXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tpXVxyXG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGNhbnZhcy5zdHlsZVxyXG4gICAgICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCdcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9ICcwcHgnXHJcbiAgICAgICAgICAgIHN0eWxlLnRvcCA9IGkgKiBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnXHJcbiAgICAgICAgICAgIHN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHN0eWxlLmhlaWdodCA9IE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJSdcclxuICAgICAgICAgICAgc3R5bGUuekluZGV4ID0gMTAwMFxyXG4gICAgICAgICAgICBpZiAodGhpcy5zY2FsZU1vZGUgPT09IFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc3R5bGUuaW1hZ2VSZW5kZXJpbmcgPSAncGl4ZWxhdGVkJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnJhbmRvbUNvbG9yKClcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnNob3cgPT09ICdvYmplY3QnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5zaG93KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSB0aGlzLnNob3dba2V5XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMuYXBwZW5kQ2hpbGQoY2FudmFzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHRlc3RzIHdoZXRoZXIgYSB0ZXh0dXJlIGV4aXN0c1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgZXhpc3RzKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dHVyZXNbbmFtZV0gPyB0cnVlIDogZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4geyhQSVhJLlRleHR1cmV8bnVsbCl9XHJcbiAgICAgKi9cclxuICAgIGdldFRleHR1cmUobmFtZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tuYW1lXVxyXG4gICAgICAgIGlmICh0ZXh0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHR1cmUudGV4dHVyZVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiB0ZXh0dXJlICcgKyBuYW1lICsgJyBub3QgZm91bmQgaW4gc3ByaXRlc2hlZXQuJylcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGEgUElYSS5TcHJpdGUgKHdpdGggYW5jaG9yIHNldCB0byAwLjUsIGJlY2F1c2UgdGhhdCdzIHdoZXJlIGl0IHNob3VsZCBiZSlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4ge1BJWEkuU3ByaXRlfVxyXG4gICAgICovXHJcbiAgICBnZXRTcHJpdGUobmFtZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5nZXRUZXh0dXJlKG5hbWUpXHJcbiAgICAgICAgaWYgKHRleHR1cmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZSlcclxuICAgICAgICAgICAgc3ByaXRlLmFuY2hvci5zZXQoMC41KVxyXG4gICAgICAgICAgICByZXR1cm4gc3ByaXRlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWxpYXMgZm9yIGdldFNwcml0ZSgpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHtQSVhJLlNwcml0ZX1cclxuICAgICAqL1xyXG4gICAgZ2V0KG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3ByaXRlKG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IGFtb3VudCBvZiB0ZXh0dXJlcyBpbiB0aGlzIHJlbmRlcnNoZWV0XHJcbiAgICAgKi9cclxuICAgIGVudHJpZXMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnRleHR1cmVzKS5sZW5ndGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHByaW50cyBzdGF0aXN0aWNzIG9mIGNhbnZhc2VzIHRvIGNvbnNvbGUubG9nXHJcbiAgICAgKi9cclxuICAgIGRlYnVnKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2ldXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd5eS1yZW5kZXJzaGVldDogU2hlZXQgIycgKyAoaSArIDEpICsgJyB8IHNpemU6ICcgKyBjYW52YXMud2lkdGggKyAneCcgKyBjYW52YXMuaGVpZ2h0ICsgJyB8IHJlc29sdXRpb246ICcgKyB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZmluZCB0aGUgaW5kZXggb2YgdGhlIHRleHR1cmUgYmFzZWQgb24gdGhlIHRleHR1cmUgb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZmluZCB0aGlzIGluZGV4ZWQgdGV4dHVyZVxyXG4gICAgICogQHJldHVybnMge1BJWEkuVGV4dHVyZX1cclxuICAgICAqL1xyXG4gICAgZ2V0SW5kZXgoZmluZClcclxuICAgIHtcclxuICAgICAgICBsZXQgaSA9IDBcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChpID09PSBmaW5kKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlc1trZXldLnRleHR1cmVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpKytcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGxcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoZWNrcyBpZiBhbGwgdGV4dHVyZXMgYXJlIGxvYWRlZFxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgY2hlY2tMb2FkZWQoKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBpZiAoKGN1cnJlbnQudHlwZSA9PT0gSU1BR0UgfHwgY3VycmVudC50eXBlID09PSBEQVRBKSAmJiAhY3VycmVudC5sb2FkZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGUgKG9yIHJlZnJlc2gpIHRoZSByZW5kZXJzaGVldFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IGNhbGxzIFJlbmRlclNoZWV0Lm9uY2UoJ3JlbmRlcicsIGNhbGxiYWNrKVxyXG4gICAgICovXHJcbiAgICByZW5kZXIoY2FsbGJhY2spXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vbmNlKCdyZW5kZXInLCBjYWxsYmFjaylcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cyh0aGlzLnRleHR1cmVzKS5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbmRlcicpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tMb2FkZWQoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMucmVuZGVyKCksIFdBSVQpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW11cclxuICAgICAgICB0aGlzLnNvcnRlZCA9IFtdXHJcblxyXG4gICAgICAgIHRoaXMubWVhc3VyZSgpXHJcbiAgICAgICAgdGhpcy5zb3J0KClcclxuICAgICAgICB0aGlzLnBhY2soKVxyXG4gICAgICAgIHRoaXMuZHJhdygpXHJcbiAgICAgICAgdGhpcy5jcmVhdGVCYXNlVGV4dHVyZXMoKVxyXG5cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmJhc2VUZXh0dXJlID0gdGhpcy5iYXNlVGV4dHVyZXNbY3VycmVudC5jYW52YXNdXHJcbiAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS5mcmFtZSA9IG5ldyBQSVhJLlJlY3RhbmdsZShjdXJyZW50LngsIGN1cnJlbnQueSwgY3VycmVudC53aWR0aCwgY3VycmVudC5oZWlnaHQpXHJcbiAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS51cGRhdGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zaG93KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zaG93Q2FudmFzZXMoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3JlbmRlcicpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtZWFzdXJlcyBjYW52YXMgcmVuZGVyaW5nc1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgbWVhc3VyZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgYy53aWR0aCA9IHRoaXMubWF4U2l6ZVxyXG4gICAgICAgIGMuaGVpZ2h0ID0gdGhpcy5tYXhTaXplXHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSBNYXRoLmNlaWwodGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvbilcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgc3dpdGNoICh0ZXh0dXJlLnR5cGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgQ0FOVkFTOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSB0ZXh0dXJlLm1lYXN1cmUoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgYylcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLndpZHRoID0gTWF0aC5jZWlsKHNpemUud2lkdGggKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaGVpZ2h0ID0gTWF0aC5jZWlsKHNpemUuaGVpZ2h0ICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgSU1BR0U6IGNhc2UgREFUQTpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLndpZHRoID0gTWF0aC5jZWlsKHRleHR1cmUuaW1hZ2Uud2lkdGggKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaGVpZ2h0ID0gTWF0aC5jZWlsKHRleHR1cmUuaW1hZ2UuaGVpZ2h0ICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc29ydGVkLnB1c2godGV4dHVyZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzb3J0IHRleHR1cmVzIGJ5IGxhcmdlc3QgZGltZW5zaW9uXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBzb3J0KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNvcnRlZC5zb3J0KFxyXG4gICAgICAgICAgICBmdW5jdGlvbihhLCBiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYVNpemUgPSBNYXRoLm1heChhLmhlaWdodCwgYS53aWR0aClcclxuICAgICAgICAgICAgICAgIGxldCBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgaWYgKGFTaXplID09PSBiU2l6ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBhU2l6ZSA9IE1hdGgubWluKGEuaGVpZ2h0LCBhLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgICAgIGJTaXplID0gTWF0aC5tYXgoYi5oZWlnaHQsIGIud2lkdGgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYlNpemUgLSBhU2l6ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlIHNxdWFyZSBjYW52YXNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbc2l6ZT10aGlzLm1heFNpemVdXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVDYW52YXMoc2l6ZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgPSBzaXplIHx8IHRoaXMubWF4U2l6ZVxyXG4gICAgICAgIHRoaXMuY2FudmFzZXMucHVzaChjYW52YXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGEgcmFuZG9tIHJnYiBjb2xvclxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgcmFuZG9tQ29sb3IoKVxyXG4gICAge1xyXG4gICAgICAgIGZ1bmN0aW9uIHIoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI1NSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCAwLjIpJ1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZHJhdyByZW5kZXJpbmdzIHRvIHJlbmRlcnRleHR1cmVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGRyYXcoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBjdXJyZW50LCBjb250ZXh0XHJcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IE1hdGguY2VpbCh0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uKVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBpZiAodGV4dHVyZS5jYW52YXMgIT09IGN1cnJlbnQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudCAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSB0ZXh0dXJlLmNhbnZhc1xyXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IHRoaXMuY2FudmFzZXNbY3VycmVudF0uZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5zYXZlKClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuc2NhbGUobXVsdGlwbGllciwgbXVsdGlwbGllcilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZXh0LnNhdmUoKVxyXG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZShNYXRoLmNlaWwodGV4dHVyZS54IC8gbXVsdGlwbGllciksIE1hdGguY2VpbCh0ZXh0dXJlLnkgLyBtdWx0aXBsaWVyKSlcclxuICAgICAgICAgICAgaWYgKHRoaXMudGVzdEJveGVzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMucmFuZG9tQ29sb3IoKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCBNYXRoLmNlaWwodGV4dHVyZS53aWR0aCAvIG11bHRpcGxpZXIpLCBNYXRoLmNlaWwodGV4dHVyZS5oZWlnaHQgLyBtdWx0aXBsaWVyKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRleHR1cmUudHlwZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBDQU5WQVM6XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5kcmF3KGNvbnRleHQsIHRleHR1cmUucGFyYW0sIGN1cnJlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIElNQUdFOiBjYXNlIERBVEE6XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGV4dHVyZS5pbWFnZSwgMCwgMClcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0cnVkZUVudHJ5KHRleHR1cmUsIGNvbnRleHQsIGN1cnJlbnQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGV4dHJ1ZGUgcGl4ZWxzIGZvciBlbnRyeVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjb250ZXh0XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBleHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcclxuICAgIHtcclxuICAgICAgICBmdW5jdGlvbiBnZXQoeCwgeSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gKHggKyB5ICogdGV4dHVyZS53aWR0aCkgKiA0XHJcbiAgICAgICAgICAgIGNvbnN0IGQgPSBkYXRhLmRhdGFcclxuICAgICAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyBkW2VudHJ5XSArICcsJyArIGRbZW50cnkgKyAxXSArICcsJyArIGRbZW50cnkgKyAyXSArICcsJyArIChkW2VudHJ5ICsgM10gLyAweGZmKSArICcpJ1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tjdXJyZW50XVxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSh0ZXh0dXJlLngsIHRleHR1cmUueSwgdGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQpXHJcbiAgICAgICAgaWYgKHRleHR1cmUueCAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGV4dHVyZS5oZWlnaHQ7IHkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoMCwgeSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoLTEsIHksIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoMCwgMClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoLTEsIC0xLCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnggKyB0ZXh0dXJlLndpZHRoICE9PSBjYW52YXMud2lkdGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0ZXh0dXJlLmhlaWdodDsgeSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh0ZXh0dXJlLndpZHRoIC0gMSwgeSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QodGV4dHVyZS53aWR0aCwgeSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGV4dHVyZS55ICsgdGV4dHVyZS5oZWlnaHQgIT09IGNhbnZhcy5oZWlnaHQgLSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh0ZXh0dXJlLndpZHRoIC0gMSwgdGV4dHVyZS5oZWlnaHQgLSAxKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh0ZXh0dXJlLndpZHRoLCB0ZXh0dXJlLmhlaWdodCwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dHVyZS55ICE9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0ZXh0dXJlLndpZHRoOyB4KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHgsIDApXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIC0xLCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnkgKyB0ZXh0dXJlLmhlaWdodCAhPT0gY2FudmFzLmhlaWdodCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRleHR1cmUud2lkdGg7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoeCwgdGV4dHVyZS5oZWlnaHQgLSAxKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh4LCB0ZXh0dXJlLmhlaWdodCwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUJhc2VUZXh0dXJlcygpXHJcbiAgICB7XHJcbiAgICAgICAgd2hpbGUgKHRoaXMuYmFzZVRleHR1cmVzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZVRleHR1cmVzLnBvcCgpLmRlc3Ryb3koKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBiYXNlID0gUElYSS5CYXNlVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzZXNbaV0pXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlTW9kZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYmFzZS5zY2FsZU1vZGUgPSB0aGlzLnNjYWxlTW9kZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZVRleHR1cmVzLnB1c2goYmFzZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwYWNrIHRleHR1cmVzIGFmdGVyIG1lYXN1cmVtZW50XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBwYWNrKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBwYWNrZXJzID0gW25ldyB0aGlzLnBhY2tlcih0aGlzLm1heFNpemUsIHRoaXMuc29ydGVkWzBdLCB0aGlzLmJ1ZmZlcildXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNvcnRlZC5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJsb2NrID0gdGhpcy5zb3J0ZWRbaV1cclxuICAgICAgICAgICAgbGV0IHBhY2tlZCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFja2Vycy5sZW5ndGg7IGorKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhY2tlcnNbal0uYWRkKGJsb2NrLCBqKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBibG9jay5jYW52YXMgPSBqXHJcbiAgICAgICAgICAgICAgICAgICAgcGFja2VkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFwYWNrZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBhY2tlcnMucHVzaChuZXcgdGhpcy5wYWNrZXIodGhpcy5tYXhTaXplLCBibG9jaywgdGhpcy5idWZmZXIpKVxyXG4gICAgICAgICAgICAgICAgaWYgKCFwYWNrZXJzW2pdLmFkZChibG9jaywgaikpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1yZW5kZXJzaGVldDogJyArIGJsb2NrLm5hbWUgKyAnIGlzIHRvbyBiaWcgZm9yIHRoZSBzcHJpdGVzaGVldC4nKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmNhbnZhcyA9IGpcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWNrZXJzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHBhY2tlcnNbaV0uZmluaXNoKHRoaXMubWF4U2l6ZSlcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDYW52YXMoc2l6ZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2VzIHRoZSBkcmF3aW5nIGZ1bmN0aW9uIG9mIGEgdGV4dHVyZVxyXG4gICAgICogTk9URTogdGhpcyBvbmx5IHdvcmtzIGlmIHRoZSB0ZXh0dXJlIHJlbWFpbnMgdGhlIHNhbWUgc2l6ZTsgdXNlIFNoZWV0LnJlbmRlcigpIHRvIHJlc2l6ZSB0aGUgdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRyYXdcclxuICAgICAqL1xyXG4gICAgY2hhbmdlRHJhdyhuYW1lLCBkcmF3KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW25hbWVdXHJcbiAgICAgICAgaWYgKHRleHR1cmUudHlwZSAhPT0gQ0FOVkFTKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1zaGVldC5jaGFuZ2VUZXh0dXJlRHJhdyBvbmx5IHdvcmtzIHdpdGggdHlwZTogQ0FOVkFTLicpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0dXJlLmRyYXcgPSBkcmF3XHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHRoaXMuY2FudmFzZXNbdGV4dHVyZS5jYW52YXNdLmdldENvbnRleHQoJzJkJylcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gdGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvblxyXG4gICAgICAgIGNvbnRleHQuc2F2ZSgpXHJcbiAgICAgICAgY29udGV4dC5zY2FsZShtdWx0aXBsaWVyLCBtdWx0aXBsaWVyKVxyXG4gICAgICAgIGNvbnRleHQudHJhbnNsYXRlKHRleHR1cmUueCAvIG11bHRpcGxpZXIsIHRleHR1cmUueSAvIG11bHRpcGxpZXIpXHJcbiAgICAgICAgdGV4dHVyZS5kcmF3KGNvbnRleHQsIHRleHR1cmUucGFyYW0pXHJcbiAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgICAgICB0ZXh0dXJlLnRleHR1cmUudXBkYXRlKClcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJTaGVldFxyXG5cclxuLyoqXHJcbiAqIGZpcmVzIHdoZW4gcmVuZGVyIGNvbXBsZXRlc1xyXG4gKiBAZXZlbnQgUmVuZGVyU2hlZXQjcmVuZGVyXHJcbiAqLyJdfQ==