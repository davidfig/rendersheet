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
                        var size = texture.measure(context, texture.param);
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
                        texture.draw(context, texture.param);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNhbnZhc2VzIiwiYmFzZVRleHR1cmVzIiwidGV4dHVyZXMiLCJuYW1lIiwiZHJhdyIsIm1lYXN1cmUiLCJwYXJhbSIsIm9iamVjdCIsInR5cGUiLCJ0ZXh0dXJlIiwiVGV4dHVyZSIsIkVNUFRZIiwic3JjIiwiZmlsZSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJkYXRhIiwiaGVhZGVyIiwiZGl2Q2FudmFzZXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJoYXNDaGlsZE5vZGVzIiwicmVtb3ZlQ2hpbGQiLCJsYXN0Q2hpbGQiLCJwZXJjZW50IiwibGVuZ3RoIiwiaSIsImNhbnZhcyIsInN0eWxlIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiTWF0aCIsInJvdW5kIiwid2lkdGgiLCJoZWlnaHQiLCJ6SW5kZXgiLCJpbWFnZVJlbmRlcmluZyIsImJhY2tncm91bmQiLCJyYW5kb21Db2xvciIsImtleSIsImNvbnNvbGUiLCJ3YXJuIiwiZ2V0VGV4dHVyZSIsInNwcml0ZSIsIlNwcml0ZSIsImFuY2hvciIsInNldCIsImdldFNwcml0ZSIsIk9iamVjdCIsImtleXMiLCJsb2ciLCJmaW5kIiwiY3VycmVudCIsImNhbGxiYWNrIiwib25jZSIsImVtaXQiLCJjaGVja0xvYWRlZCIsIndpbmRvdyIsInNldFRpbWVvdXQiLCJyZW5kZXIiLCJzb3J0ZWQiLCJzb3J0IiwicGFjayIsImNyZWF0ZUJhc2VUZXh0dXJlcyIsImJhc2VUZXh0dXJlIiwiZnJhbWUiLCJSZWN0YW5nbGUiLCJ4IiwieSIsInVwZGF0ZSIsInNob3dDYW52YXNlcyIsImMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm11bHRpcGxpZXIiLCJjZWlsIiwic2l6ZSIsInB1c2giLCJhIiwiYiIsImFTaXplIiwibWF4IiwiYlNpemUiLCJtaW4iLCJyIiwiZmxvb3IiLCJyYW5kb20iLCJyZXN0b3JlIiwic2F2ZSIsInRyYW5zbGF0ZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiZHJhd0ltYWdlIiwiZXh0cnVkZUVudHJ5IiwiZ2V0IiwiZW50cnkiLCJkIiwiZ2V0SW1hZ2VEYXRhIiwicG9wIiwiZGVzdHJveSIsImJhc2UiLCJCYXNlVGV4dHVyZSIsImZyb21DYW52YXMiLCJwYWNrZXJzIiwiYmxvY2siLCJwYWNrZWQiLCJqIiwiYWRkIiwiZmluaXNoIiwiY3JlYXRlQ2FudmFzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPQyxRQUFRLFNBQVIsQ0FBYjtBQUNBLElBQU1DLFNBQVNELFFBQVEsZUFBUixDQUFmOztBQUVBLElBQU1FLGdCQUFnQkYsUUFBUSxpQkFBUixDQUF0QjtBQUNBLElBQU1HLGVBQWVILFFBQVEsZ0JBQVIsQ0FBckI7O0FBRUE7QUFDQSxJQUFNSSxTQUFTLENBQWYsQyxDQUFpQjtBQUNqQixJQUFNQyxRQUFRLENBQWQsQyxDQUFnQjtBQUNoQixJQUFNQyxPQUFPLENBQWIsQyxDQUFlOztBQUVmO0FBQ0EsSUFBTUMsT0FBTyxHQUFiOztJQUVNQyxXOzs7QUFFRjs7Ozs7Ozs7Ozs7Ozs7QUFjQSx5QkFBWUMsT0FBWixFQUNBO0FBQUE7O0FBQUE7O0FBRUlBLGtCQUFVQSxXQUFXLEVBQXJCO0FBQ0EsY0FB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Q0FBa0IsS0FBSzVILE9BQXZCLENBQWI7QUFDQSxxQkFBSzZILFlBQUwsQ0FBa0JqQyxJQUFsQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs7OzttQ0FNVzlFLEksRUFBTUMsSSxFQUNqQjtBQUNJLGdCQUFNSyxVQUFVLEtBQUtQLFFBQUwsQ0FBY0MsSUFBZCxDQUFoQjtBQUNBLGdCQUFJTSxRQUFRRCxJQUFSLEtBQWlCM0IsTUFBckIsRUFDQTtBQUNJZ0Usd0JBQVFDLElBQVIsQ0FBYSwwREFBYjtBQUNBO0FBQ0g7QUFDRHJDLG9CQUFRTCxJQUFSLEdBQWVBLElBQWY7QUFDQSxnQkFBTXlFLFVBQVUsS0FBSzdFLFFBQUwsQ0FBY1MsUUFBUXNCLE1BQXRCLEVBQThCK0MsVUFBOUIsQ0FBeUMsSUFBekMsQ0FBaEI7QUFDQSxnQkFBTUMsYUFBYSxLQUFLeEYsS0FBTCxHQUFhLEtBQUtJLFVBQXJDO0FBQ0FrRixvQkFBUWdCLElBQVI7QUFDQWhCLG9CQUFRdEYsS0FBUixDQUFjd0YsVUFBZCxFQUEwQkEsVUFBMUI7QUFDQUYsb0JBQVFpQixTQUFSLENBQWtCckYsUUFBUStELENBQVIsR0FBWU8sVUFBOUIsRUFBMEN0RSxRQUFRZ0UsQ0FBUixHQUFZTSxVQUF0RDtBQUNBdEUsb0JBQVFMLElBQVIsQ0FBYXlFLE9BQWIsRUFBc0JwRSxRQUFRSCxLQUE5QjtBQUNBdUUsb0JBQVFlLE9BQVI7QUFDQW5GLG9CQUFRQSxPQUFSLENBQWdCaUUsTUFBaEI7QUFDSDs7OztFQTlpQnFCaEcsTTs7QUFpakIxQnlJLE9BQU9DLE9BQVAsR0FBaUJuSSxXQUFqQjs7QUFFQSIsImZpbGUiOiJyZW5kZXJzaGVldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHl5LXJlbmRlcnNoZWV0XHJcbi8vIGJ5IERhdmlkIEZpZ2F0bmVyXHJcbi8vIChjKSBZT1BFWSBZT1BFWSBMTEMgMjAxN1xyXG4vLyBNSVQgTGljZW5zZVxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGF2aWRmaWcvcmVuZGVyc2hlZXRcclxuXHJcbmNvbnN0IFBJWEkgPSByZXF1aXJlKCdwaXhpLmpzJylcclxuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcblxyXG5jb25zdCBHcm93aW5nUGFja2VyID0gcmVxdWlyZSgnLi9ncm93aW5ncGFja2VyJylcclxuY29uc3QgU2ltcGxlUGFja2VyID0gcmVxdWlyZSgnLi9zaW1wbGVwYWNrZXInKVxyXG5cclxuLy8gdHlwZXNcclxuY29uc3QgQ0FOVkFTID0gMCAvLyBkZWZhdWx0XHJcbmNvbnN0IElNQUdFID0gMSAvLyBpbWFnZSB1cmxcclxuY29uc3QgREFUQSA9IDIgLy8gZGF0YSBzcmMgKGUuZy4sIHJlc3VsdCBvZiAudG9EYXRhVVJMKCkpXHJcblxyXG4vLyBkZWZhdWx0IG1zIHRvIHdhaXQgdG8gY2hlY2sgaWYgYW4gaW1hZ2UgaGFzIGZpbmlzaGVkIGxvYWRpbmdcclxuY29uc3QgV0FJVCA9IDI1MFxyXG5cclxuY2xhc3MgUmVuZGVyU2hlZXQgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFNpemU9MjA0OF1cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5idWZmZXI9NV0gYXJvdW5kIGVhY2ggdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNjYWxlPTFdIG9mIHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5yZXNvbHV0aW9uPTFdIG9mIHJlbmRlcnNoZWV0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuZXh0cnVkZV0gdGhlIGVkZ2VzLS11c2VmdWwgZm9yIHJlbW92aW5nIGdhcHMgaW4gc3ByaXRlcyB3aGVuIHRpbGluZ1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndhaXQ9MjUwXSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIG9ubG9hZCBvZiBhZGRJbWFnZSBpbWFnZXMgYmVmb3JlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50ZXN0Qm94ZXNdIGRyYXcgYSBkaWZmZXJlbnQgY29sb3JlZCBib3hlcyBiZWhpbmQgZWFjaCByZW5kZXJpbmcgKHVzZWZ1bCBmb3IgZGVidWdnaW5nKVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ8Ym9vbGVhbn0gW29wdGlvbnMuc2NhbGVNb2RlXSBQSVhJLnNldHRpbmdzLlNDQUxFX01PREUgdG8gc2V0IGZvciByZW5kZXJzaGVldCAodXNlID10cnVlIGZvciBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1QgZm9yIHBpeGVsIGFydClcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlU2ltcGxlUGFja2VyXSB1c2UgYSBzdHVwaWRseSBzaW1wbGUgcGFja2VyIGluc3RlYWQgb2YgZ3Jvd2luZyBwYWNrZXIgYWxnb3JpdGhtXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW58b2JqZWN0fSBbb3B0aW9ucy5zaG93XSBzZXQgdG8gdHJ1ZSBvciBhIENTUyBvYmplY3QgKGUuZy4sIHt6SW5kZXg6IDEwLCBiYWNrZ3JvdW5kOiAnYmx1ZSd9KSB0byBhdHRhY2ggdGhlIGZpbmFsIGNhbnZhcyB0byBkb2N1bWVudC5ib2R5LS11c2VmdWwgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICogQGZpcmUgcmVuZGVyXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgICAgICAgdGhpcy53YWl0ID0gb3B0aW9ucy53YWl0IHx8IFdBSVRcclxuICAgICAgICB0aGlzLnRlc3RCb3hlcyA9IG9wdGlvbnMudGVzdEJveGVzIHx8IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhTaXplID0gb3B0aW9ucy5tYXhTaXplIHx8IDIwNDhcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG9wdGlvbnMuYnVmZmVyIHx8IDVcclxuICAgICAgICB0aGlzLnNjYWxlID0gb3B0aW9ucy5zY2FsZSB8fCAxXHJcbiAgICAgICAgdGhpcy5zY2FsZU1vZGUgPSBvcHRpb25zLnNjYWxlTW9kZSA9PT0gdHJ1ZSA/IFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVCA6IG9wdGlvbnMuc2NhbGVNb2RlXHJcbiAgICAgICAgdGhpcy5yZXNvbHV0aW9uID0gb3B0aW9ucy5yZXNvbHV0aW9uIHx8IDFcclxuICAgICAgICB0aGlzLnNob3cgPSBvcHRpb25zLnNob3dcclxuICAgICAgICB0aGlzLmV4dHJ1ZGUgPSBvcHRpb25zLmV4dHJ1ZGVcclxuICAgICAgICBpZiAodGhpcy5leHRydWRlICYmIHRoaXMuYnVmZmVyIDwgMilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyID0gMlxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhY2tlciA9IG9wdGlvbnMudXNlU2ltcGxlUGFja2VyID8gU2ltcGxlUGFja2VyIDogR3Jvd2luZ1BhY2tlclxyXG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXVxyXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmVzID0gW11cclxuICAgICAgICB0aGlzLnRleHR1cmVzID0ge31cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBjYW52YXMgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGRyYXcgZnVuY3Rpb24oY29udGV4dCkgLSB1c2UgdGhlIGNvbnRleHQgdG8gZHJhdyB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgbWVhc3VyZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbWVhc3VyZSBmdW5jdGlvbihjb250ZXh0KSAtIG5lZWRzIHRvIHJldHVybiB7d2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0gZm9yIHRoZSByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBvYmplY3QgdG8gcGFzcyB0aGUgZHJhdygpIGFuZCBtZWFzdXJlKCkgZnVuY3Rpb25zXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlbmRlcnNoZWV0IG9iamVjdCBmb3IgdGV4dHVyZVxyXG4gICAgICovXHJcbiAgICBhZGQobmFtZSwgZHJhdywgbWVhc3VyZSwgcGFyYW0pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZTogbmFtZSwgZHJhdzogZHJhdywgbWVhc3VyZTogbWVhc3VyZSwgcGFyYW06IHBhcmFtLCB0eXBlOiBDQU5WQVMsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSB9XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhbiBpbWFnZSByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNyYyBmb3IgaW1hZ2VcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZEltYWdlKG5hbWUsIHNyYylcclxuICAgIHtcclxuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lLCBmaWxlOiBzcmMsIHR5cGU6IElNQUdFLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKFBJWEkuVGV4dHVyZS5FTVBUWSkgIH1cclxuICAgICAgICBvYmplY3QuaW1hZ2UgPSBuZXcgSW1hZ2UoKVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5vbmxvYWQgPSAoKSA9PiBvYmplY3QubG9hZGVkID0gdHJ1ZVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBzcmNcclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGEgZGF0YSBzb3VyY2UgKGUuZy4sIGEgUE5HIGZpbGUgaW4gZGF0YSBmb3JtYXQpXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBvZiByZW5kZXJpbmcgKG5vdCBmaWxlbmFtZSlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbaGVhZGVyPWRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxdIGZvciBkYXRhXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlbmRlcnNoZWV0IG9iamVjdCBmb3IgdGV4dHVyZVxyXG4gICAgICovXHJcbiAgICBhZGREYXRhKG5hbWUsIGRhdGEsIGhlYWRlcilcclxuICAgIHtcclxuICAgICAgICBoZWFkZXIgPSB0eXBlb2YgaGVhZGVyICE9PSAndW5kZWZpbmVkJyA/IGhlYWRlciA6ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJ1xyXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMudGV4dHVyZXNbbmFtZV0gPSB7IG5hbWUsIHR5cGU6IERBVEEsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSB9XHJcbiAgICAgICAgb2JqZWN0LmltYWdlID0gbmV3IEltYWdlKClcclxuICAgICAgICBvYmplY3QuaW1hZ2Uuc3JjID0gaGVhZGVyICsgZGF0YVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5vbmxvYWQgPSAoKSA9PiBvYmplY3QubG9hZGVkID0gdHJ1ZVxyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGF0dGFjaGVzIFJlbmRlclNoZWV0IHRvIERPTSBmb3IgdGVzdGluZ1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHN0eWxlcyAtIENTUyBzdHlsZXMgdG8gdXNlIGZvciByZW5kZXJzaGVldFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgc2hvd0NhbnZhc2VzKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGl2Q2FudmFzZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRpdkNhbnZhc2VzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRpdkNhbnZhc2VzKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5kaXZDYW52YXNlcy5oYXNDaGlsZE5vZGVzKCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMucmVtb3ZlQ2hpbGQodGhpcy5kaXZDYW52YXNlcy5sYXN0Q2hpbGQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcGVyY2VudCA9IDEgLyB0aGlzLmNhbnZhc2VzLmxlbmd0aFxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbaV1cclxuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBjYW52YXMuc3R5bGVcclxuICAgICAgICAgICAgc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAnMHB4J1xyXG4gICAgICAgICAgICBzdHlsZS50b3AgPSBpICogTWF0aC5yb3VuZChwZXJjZW50ICogMTAwKSArICclJ1xyXG4gICAgICAgICAgICBzdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICBzdHlsZS5oZWlnaHQgPSBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnXHJcbiAgICAgICAgICAgIHN0eWxlLnpJbmRleCA9IDEwMDBcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGVNb2RlID09PSBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHN0eWxlLmltYWdlUmVuZGVyaW5nID0gJ3BpeGVsYXRlZCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5yYW5kb21Db2xvcigpXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5zaG93ID09PSAnb2JqZWN0JylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuc2hvdylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZVtrZXldID0gdGhpcy5zaG93W2tleV1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRpdkNhbnZhc2VzLmFwcGVuZENoaWxkKGNhbnZhcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0ZXN0cyB3aGV0aGVyIGEgdGV4dHVyZSBleGlzdHNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGV4aXN0cyhuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRleHR1cmVzW25hbWVdID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHsoUElYSS5UZXh0dXJlfG51bGwpfVxyXG4gICAgICovXHJcbiAgICBnZXRUZXh0dXJlKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNbbmFtZV1cclxuICAgICAgICBpZiAodGV4dHVyZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0dXJlLnRleHR1cmVcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1yZW5kZXJzaGVldDogdGV4dHVyZSAnICsgbmFtZSArICcgbm90IGZvdW5kIGluIHNwcml0ZXNoZWV0LicpXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhIFBJWEkuU3ByaXRlICh3aXRoIGFuY2hvciBzZXQgdG8gMC41LCBiZWNhdXNlIHRoYXQncyB3aGVyZSBpdCBzaG91bGQgYmUpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHtQSVhJLlNwcml0ZX1cclxuICAgICAqL1xyXG4gICAgZ2V0U3ByaXRlKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuZ2V0VGV4dHVyZShuYW1lKVxyXG4gICAgICAgIGlmICh0ZXh0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3Qgc3ByaXRlID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmUpXHJcbiAgICAgICAgICAgIHNwcml0ZS5hbmNob3Iuc2V0KDAuNSlcclxuICAgICAgICAgICAgcmV0dXJuIHNwcml0ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFsaWFzIGZvciBnZXRTcHJpdGUoKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7UElYSS5TcHJpdGV9XHJcbiAgICAgKi9cclxuICAgIGdldChuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFNwcml0ZShuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBhbW91bnQgb2YgdGV4dHVyZXMgaW4gdGhpcyByZW5kZXJzaGVldFxyXG4gICAgICovXHJcbiAgICBlbnRyaWVzKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy50ZXh0dXJlcykubGVuZ3RoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwcmludHMgc3RhdGlzdGljcyBvZiBjYW52YXNlcyB0byBjb25zb2xlLmxvZ1xyXG4gICAgICovXHJcbiAgICBkZWJ1ZygpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tpXVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygneXktcmVuZGVyc2hlZXQ6IFNoZWV0ICMnICsgKGkgKyAxKSArICcgfCBzaXplOiAnICsgY2FudmFzLndpZHRoICsgJ3gnICsgY2FudmFzLmhlaWdodCArICcgfCByZXNvbHV0aW9uOiAnICsgdGhpcy5yZXNvbHV0aW9uKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZpbmQgdGhlIGluZGV4IG9mIHRoZSB0ZXh0dXJlIGJhc2VkIG9uIHRoZSB0ZXh0dXJlIG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGZpbmQgdGhpcyBpbmRleGVkIHRleHR1cmVcclxuICAgICAqIEByZXR1cm5zIHtQSVhJLlRleHR1cmV9XHJcbiAgICAgKi9cclxuICAgIGdldEluZGV4KGZpbmQpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gZmluZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dHVyZXNba2V5XS50ZXh0dXJlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGVja3MgaWYgYWxsIHRleHR1cmVzIGFyZSBsb2FkZWRcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGNoZWNrTG9hZGVkKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgaWYgKChjdXJyZW50LnR5cGUgPT09IElNQUdFIHx8IGN1cnJlbnQudHlwZSA9PT0gREFUQSkgJiYgIWN1cnJlbnQubG9hZGVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlIChvciByZWZyZXNoKSB0aGUgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBjYWxscyBSZW5kZXJTaGVldC5vbmNlKCdyZW5kZXInLCBjYWxsYmFjaylcclxuICAgICAqL1xyXG4gICAgcmVuZGVyKGNhbGxiYWNrKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChjYWxsYmFjaylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub25jZSgncmVuZGVyJywgY2FsbGJhY2spXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghT2JqZWN0LmtleXModGhpcy50ZXh0dXJlcykubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrTG9hZGVkKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCBXQUlUKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5zb3J0ZWQgPSBbXVxyXG5cclxuICAgICAgICB0aGlzLm1lYXN1cmUoKVxyXG4gICAgICAgIHRoaXMuc29ydCgpXHJcbiAgICAgICAgdGhpcy5wYWNrKClcclxuICAgICAgICB0aGlzLmRyYXcoKVxyXG4gICAgICAgIHRoaXMuY3JlYXRlQmFzZVRleHR1cmVzKClcclxuXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS5iYXNlVGV4dHVyZSA9IHRoaXMuYmFzZVRleHR1cmVzW2N1cnJlbnQuY2FudmFzXVxyXG4gICAgICAgICAgICBjdXJyZW50LnRleHR1cmUuZnJhbWUgPSBuZXcgUElYSS5SZWN0YW5nbGUoY3VycmVudC54LCBjdXJyZW50LnksIGN1cnJlbnQud2lkdGgsIGN1cnJlbnQuaGVpZ2h0KVxyXG4gICAgICAgICAgICBjdXJyZW50LnRleHR1cmUudXBkYXRlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuc2hvdylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0NhbnZhc2VzKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWVhc3VyZXMgY2FudmFzIHJlbmRlcmluZ3NcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIG1lYXN1cmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgIGMud2lkdGggPSB0aGlzLm1heFNpemVcclxuICAgICAgICBjLmhlaWdodCA9IHRoaXMubWF4U2l6ZVxyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjLmdldENvbnRleHQoJzJkJylcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gTWF0aC5jZWlsKHRoaXMuc2NhbGUgKiB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIHN3aXRjaCAodGV4dHVyZS50eXBlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIENBTlZBUzpcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzaXplID0gdGV4dHVyZS5tZWFzdXJlKGNvbnRleHQsIHRleHR1cmUucGFyYW0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS53aWR0aCA9IE1hdGguY2VpbChzaXplLndpZHRoICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmhlaWdodCA9IE1hdGguY2VpbChzaXplLmhlaWdodCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIElNQUdFOiBjYXNlIERBVEE6XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS53aWR0aCA9IE1hdGguY2VpbCh0ZXh0dXJlLmltYWdlLndpZHRoICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmhlaWdodCA9IE1hdGguY2VpbCh0ZXh0dXJlLmltYWdlLmhlaWdodCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNvcnRlZC5wdXNoKHRleHR1cmUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc29ydCB0ZXh0dXJlcyBieSBsYXJnZXN0IGRpbWVuc2lvblxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgc29ydCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zb3J0ZWQuc29ydChcclxuICAgICAgICAgICAgZnVuY3Rpb24oYSwgYilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFTaXplID0gTWF0aC5tYXgoYS5oZWlnaHQsIGEud2lkdGgpXHJcbiAgICAgICAgICAgICAgICBsZXQgYlNpemUgPSBNYXRoLm1heChiLmhlaWdodCwgYi53aWR0aClcclxuICAgICAgICAgICAgICAgIGlmIChhU2l6ZSA9PT0gYlNpemUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYVNpemUgPSBNYXRoLm1pbihhLmhlaWdodCwgYS53aWR0aClcclxuICAgICAgICAgICAgICAgICAgICBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJTaXplIC0gYVNpemVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNyZWF0ZSBzcXVhcmUgY2FudmFzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3NpemU9dGhpcy5tYXhTaXplXVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgY3JlYXRlQ2FudmFzKHNpemUpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ID0gc2l6ZSB8fCB0aGlzLm1heFNpemVcclxuICAgICAgICB0aGlzLmNhbnZhc2VzLnB1c2goY2FudmFzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhIHJhbmRvbSByZ2IgY29sb3JcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHJhbmRvbUNvbG9yKClcclxuICAgIHtcclxuICAgICAgICBmdW5jdGlvbiByKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNTUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAncmdiYSgnICsgcigpICsgJywnICsgcigpICsgJywnICsgcigpICsgJywgMC4yKSdcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGRyYXcgcmVuZGVyaW5ncyB0byByZW5kZXJ0ZXh0dXJlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBkcmF3KClcclxuICAgIHtcclxuICAgICAgICBsZXQgY3VycmVudCwgY29udGV4dFxyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSBNYXRoLmNlaWwodGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvbilcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgaWYgKHRleHR1cmUuY2FudmFzICE9PSBjdXJyZW50KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnQgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gdGV4dHVyZS5jYW52YXNcclxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzLmNhbnZhc2VzW2N1cnJlbnRdLmdldENvbnRleHQoJzJkJylcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LnNjYWxlKG11bHRpcGxpZXIsIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29udGV4dC5zYXZlKClcclxuICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoTWF0aC5jZWlsKHRleHR1cmUueCAvIG11bHRpcGxpZXIpLCBNYXRoLmNlaWwodGV4dHVyZS55IC8gbXVsdGlwbGllcikpXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRlc3RCb3hlcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLnJhbmRvbUNvbG9yKClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgTWF0aC5jZWlsKHRleHR1cmUud2lkdGggLyBtdWx0aXBsaWVyKSwgTWF0aC5jZWlsKHRleHR1cmUuaGVpZ2h0IC8gbXVsdGlwbGllcikpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3dpdGNoICh0ZXh0dXJlLnR5cGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgQ0FOVkFTOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuZHJhdyhjb250ZXh0LCB0ZXh0dXJlLnBhcmFtKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBJTUFHRTogY2FzZSBEQVRBOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHRleHR1cmUuaW1hZ2UsIDAsIDApXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5leHRydWRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4dHJ1ZGVFbnRyeSh0ZXh0dXJlLCBjb250ZXh0LCBjdXJyZW50KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBleHRydWRlIHBpeGVscyBmb3IgZW50cnlcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZXh0cnVkZUVudHJ5KHRleHR1cmUsIGNvbnRleHQsIGN1cnJlbnQpXHJcbiAgICB7XHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0KHgsIHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9ICh4ICsgeSAqIHRleHR1cmUud2lkdGgpICogNFxyXG4gICAgICAgICAgICBjb25zdCBkID0gZGF0YS5kYXRhXHJcbiAgICAgICAgICAgIHJldHVybiAncmdiYSgnICsgZFtlbnRyeV0gKyAnLCcgKyBkW2VudHJ5ICsgMV0gKyAnLCcgKyBkW2VudHJ5ICsgMl0gKyAnLCcgKyAoZFtlbnRyeSArIDNdIC8gMHhmZikgKyAnKSdcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbY3VycmVudF1cclxuICAgICAgICBjb25zdCBkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEodGV4dHVyZS54LCB0ZXh0dXJlLnksIHRleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0KVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnggIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KDAsIHkpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KC0xLCB5LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLnkgIT09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KDAsIDApXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KC0xLCAtMSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dHVyZS54ICsgdGV4dHVyZS53aWR0aCAhPT0gY2FudmFzLndpZHRoIC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGV4dHVyZS5oZWlnaHQ7IHkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQodGV4dHVyZS53aWR0aCAtIDEsIHkpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHRleHR1cmUud2lkdGgsIHksIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSArIHRleHR1cmUuaGVpZ2h0ICE9PSBjYW52YXMuaGVpZ2h0IC0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQodGV4dHVyZS53aWR0aCAtIDEsIHRleHR1cmUuaGVpZ2h0IC0gMSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QodGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGV4dHVyZS53aWR0aDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh4LCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh4LCAtMSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dHVyZS55ICsgdGV4dHVyZS5oZWlnaHQgIT09IGNhbnZhcy5oZWlnaHQgLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0ZXh0dXJlLndpZHRoOyB4KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHgsIHRleHR1cmUuaGVpZ2h0IC0gMSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoeCwgdGV4dHVyZS5oZWlnaHQsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVCYXNlVGV4dHVyZXMoKVxyXG4gICAge1xyXG4gICAgICAgIHdoaWxlICh0aGlzLmJhc2VUZXh0dXJlcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VUZXh0dXJlcy5wb3AoKS5kZXN0cm95KClcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYmFzZSA9IFBJWEkuQmFzZVRleHR1cmUuZnJvbUNhbnZhcyh0aGlzLmNhbnZhc2VzW2ldKVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zY2FsZU1vZGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJhc2Uuc2NhbGVNb2RlID0gdGhpcy5zY2FsZU1vZGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJhc2VUZXh0dXJlcy5wdXNoKGJhc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcGFjayB0ZXh0dXJlcyBhZnRlciBtZWFzdXJlbWVudFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgcGFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgcGFja2VycyA9IFtuZXcgdGhpcy5wYWNrZXIodGhpcy5tYXhTaXplLCB0aGlzLnNvcnRlZFswXSwgdGhpcy5idWZmZXIpXVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zb3J0ZWQubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBibG9jayA9IHRoaXMuc29ydGVkW2ldXHJcbiAgICAgICAgICAgIGxldCBwYWNrZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhY2tlcnMubGVuZ3RoOyBqKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChwYWNrZXJzW2pdLmFkZChibG9jaywgaikpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0galxyXG4gICAgICAgICAgICAgICAgICAgIHBhY2tlZCA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghcGFja2VkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYWNrZXJzLnB1c2gobmV3IHRoaXMucGFja2VyKHRoaXMubWF4U2l6ZSwgYmxvY2ssIHRoaXMuYnVmZmVyKSlcclxuICAgICAgICAgICAgICAgIGlmICghcGFja2Vyc1tqXS5hZGQoYmxvY2ssIGopKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktcmVuZGVyc2hlZXQ6ICcgKyBibG9jay5uYW1lICsgJyBpcyB0b28gYmlnIGZvciB0aGUgc3ByaXRlc2hlZXQuJylcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBibG9jay5jYW52YXMgPSBqXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2Vycy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBwYWNrZXJzW2ldLmZpbmlzaCh0aGlzLm1heFNpemUpXHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ2FudmFzKHNpemUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hhbmdlcyB0aGUgZHJhd2luZyBmdW5jdGlvbiBvZiBhIHRleHR1cmVcclxuICAgICAqIE5PVEU6IHRoaXMgb25seSB3b3JrcyBpZiB0aGUgdGV4dHVyZSByZW1haW5zIHRoZSBzYW1lIHNpemU7IHVzZSBTaGVldC5yZW5kZXIoKSB0byByZXNpemUgdGhlIHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkcmF3XHJcbiAgICAgKi9cclxuICAgIGNoYW5nZURyYXcobmFtZSwgZHJhdylcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tuYW1lXVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnR5cGUgIT09IENBTlZBUylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktc2hlZXQuY2hhbmdlVGV4dHVyZURyYXcgb25seSB3b3JrcyB3aXRoIHR5cGU6IENBTlZBUy4nKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dHVyZS5kcmF3ID0gZHJhd1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNhbnZhc2VzW3RleHR1cmUuY2FudmFzXS5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IHRoaXMuc2NhbGUgKiB0aGlzLnJlc29sdXRpb25cclxuICAgICAgICBjb250ZXh0LnNhdmUoKVxyXG4gICAgICAgIGNvbnRleHQuc2NhbGUobXVsdGlwbGllciwgbXVsdGlwbGllcilcclxuICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh0ZXh0dXJlLnggLyBtdWx0aXBsaWVyLCB0ZXh0dXJlLnkgLyBtdWx0aXBsaWVyKVxyXG4gICAgICAgIHRleHR1cmUuZHJhdyhjb250ZXh0LCB0ZXh0dXJlLnBhcmFtKVxyXG4gICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICAgICAgdGV4dHVyZS50ZXh0dXJlLnVwZGF0ZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyU2hlZXRcclxuXHJcbi8qKlxyXG4gKiBmaXJlcyB3aGVuIHJlbmRlciBjb21wbGV0ZXNcclxuICogQGV2ZW50IFJlbmRlclNoZWV0I3JlbmRlclxyXG4gKi8iXX0=