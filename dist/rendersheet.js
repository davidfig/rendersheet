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
                return 'rgba(' + d[entry] + ',' + d[entry + 1] + ',' + d[entry + 2] + ',' + d[entry + 3] + ')';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNhbnZhc2VzIiwiYmFzZVRleHR1cmVzIiwidGV4dHVyZXMiLCJuYW1lIiwiZHJhdyIsIm1lYXN1cmUiLCJwYXJhbSIsIm9iamVjdCIsInR5cGUiLCJ0ZXh0dXJlIiwiVGV4dHVyZSIsIkVNUFRZIiwic3JjIiwiZmlsZSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJkYXRhIiwiaGVhZGVyIiwiZGl2Q2FudmFzZXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJoYXNDaGlsZE5vZGVzIiwicmVtb3ZlQ2hpbGQiLCJsYXN0Q2hpbGQiLCJwZXJjZW50IiwibGVuZ3RoIiwiaSIsImNhbnZhcyIsInN0eWxlIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiTWF0aCIsInJvdW5kIiwid2lkdGgiLCJoZWlnaHQiLCJ6SW5kZXgiLCJpbWFnZVJlbmRlcmluZyIsImJhY2tncm91bmQiLCJyYW5kb21Db2xvciIsImtleSIsImNvbnNvbGUiLCJ3YXJuIiwiZ2V0VGV4dHVyZSIsInNwcml0ZSIsIlNwcml0ZSIsImFuY2hvciIsInNldCIsImdldFNwcml0ZSIsIk9iamVjdCIsImtleXMiLCJsb2ciLCJmaW5kIiwiY3VycmVudCIsImNhbGxiYWNrIiwib25jZSIsImVtaXQiLCJjaGVja0xvYWRlZCIsIndpbmRvdyIsInNldFRpbWVvdXQiLCJyZW5kZXIiLCJzb3J0ZWQiLCJzb3J0IiwicGFjayIsImNyZWF0ZUJhc2VUZXh0dXJlcyIsImJhc2VUZXh0dXJlIiwiZnJhbWUiLCJSZWN0YW5nbGUiLCJ4IiwieSIsInVwZGF0ZSIsInNob3dDYW52YXNlcyIsImMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm11bHRpcGxpZXIiLCJjZWlsIiwic2l6ZSIsInB1c2giLCJhIiwiYiIsImFTaXplIiwibWF4IiwiYlNpemUiLCJtaW4iLCJyIiwiZmxvb3IiLCJyYW5kb20iLCJyZXN0b3JlIiwic2F2ZSIsInRyYW5zbGF0ZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiZHJhd0ltYWdlIiwiZXh0cnVkZUVudHJ5IiwiZ2V0IiwiZW50cnkiLCJkIiwiZ2V0SW1hZ2VEYXRhIiwicG9wIiwiZGVzdHJveSIsImJhc2UiLCJCYXNlVGV4dHVyZSIsImZyb21DYW52YXMiLCJwYWNrZXJzIiwiYmxvY2siLCJwYWNrZWQiLCJqIiwiYWRkIiwiZmluaXNoIiwiY3JlYXRlQ2FudmFzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxPQUFPQyxRQUFRLFNBQVIsQ0FBYjtBQUNBLElBQU1DLFNBQVNELFFBQVEsZUFBUixDQUFmOztBQUVBLElBQU1FLGdCQUFnQkYsUUFBUSxpQkFBUixDQUF0QjtBQUNBLElBQU1HLGVBQWVILFFBQVEsZ0JBQVIsQ0FBckI7O0FBRUE7QUFDQSxJQUFNSSxTQUFTLENBQWYsQyxDQUFpQjtBQUNqQixJQUFNQyxRQUFRLENBQWQsQyxDQUFnQjtBQUNoQixJQUFNQyxPQUFPLENBQWIsQyxDQUFlOztBQUVmO0FBQ0EsSUFBTUMsT0FBTyxHQUFiOztJQUVNQyxXOzs7QUFFRjs7Ozs7Ozs7Ozs7Ozs7QUFjQSx5QkFBWUMsT0FBWixFQUNBO0FBQUE7O0FBQUE7O0FBRUlBLGtCQUFVQSxXQUFXLEVBQXJCO0FBQ0EsY0FB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LEtBQUs1SCxPQUF2QixDQUFiO0FBQ0EscUJBQUs2SCxZQUFMLENBQWtCakMsSUFBbEI7QUFDSDtBQUNKOztBQUVEOzs7Ozs7Ozs7bUNBTVc5RSxJLEVBQU1DLEksRUFDakI7QUFDSSxnQkFBTUssVUFBVSxLQUFLUCxRQUFMLENBQWNDLElBQWQsQ0FBaEI7QUFDQSxnQkFBSU0sUUFBUUQsSUFBUixLQUFpQjNCLE1BQXJCLEVBQ0E7QUFDSWdFLHdCQUFRQyxJQUFSLENBQWEsMERBQWI7QUFDQTtBQUNIO0FBQ0RyQyxvQkFBUUwsSUFBUixHQUFlQSxJQUFmO0FBQ0EsZ0JBQU15RSxVQUFVLEtBQUs3RSxRQUFMLENBQWNTLFFBQVFzQixNQUF0QixFQUE4QitDLFVBQTlCLENBQXlDLElBQXpDLENBQWhCO0FBQ0EsZ0JBQU1DLGFBQWEsS0FBS3hGLEtBQUwsR0FBYSxLQUFLSSxVQUFyQztBQUNBa0Ysb0JBQVFnQixJQUFSO0FBQ0FoQixvQkFBUXRGLEtBQVIsQ0FBY3dGLFVBQWQsRUFBMEJBLFVBQTFCO0FBQ0FGLG9CQUFRaUIsU0FBUixDQUFrQnJGLFFBQVErRCxDQUFSLEdBQVlPLFVBQTlCLEVBQTBDdEUsUUFBUWdFLENBQVIsR0FBWU0sVUFBdEQ7QUFDQXRFLG9CQUFRTCxJQUFSLENBQWF5RSxPQUFiLEVBQXNCcEUsUUFBUUgsS0FBOUI7QUFDQXVFLG9CQUFRZSxPQUFSO0FBQ0FuRixvQkFBUUEsT0FBUixDQUFnQmlFLE1BQWhCO0FBQ0g7Ozs7RUE5aUJxQmhHLE07O0FBaWpCMUJ5SSxPQUFPQyxPQUFQLEdBQWlCbkksV0FBakI7O0FBRUEiLCJmaWxlIjoicmVuZGVyc2hlZXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB5eS1yZW5kZXJzaGVldFxyXG4vLyBieSBEYXZpZCBGaWdhdG5lclxyXG4vLyAoYykgWU9QRVkgWU9QRVkgTExDIDIwMTdcclxuLy8gTUlUIExpY2Vuc2VcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2RhdmlkZmlnL3JlbmRlcnNoZWV0XHJcblxyXG5jb25zdCBQSVhJID0gcmVxdWlyZSgncGl4aS5qcycpXHJcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKVxyXG5cclxuY29uc3QgR3Jvd2luZ1BhY2tlciA9IHJlcXVpcmUoJy4vZ3Jvd2luZ3BhY2tlcicpXHJcbmNvbnN0IFNpbXBsZVBhY2tlciA9IHJlcXVpcmUoJy4vc2ltcGxlcGFja2VyJylcclxuXHJcbi8vIHR5cGVzXHJcbmNvbnN0IENBTlZBUyA9IDAgLy8gZGVmYXVsdFxyXG5jb25zdCBJTUFHRSA9IDEgLy8gaW1hZ2UgdXJsXHJcbmNvbnN0IERBVEEgPSAyIC8vIGRhdGEgc3JjIChlLmcuLCByZXN1bHQgb2YgLnRvRGF0YVVSTCgpKVxyXG5cclxuLy8gZGVmYXVsdCBtcyB0byB3YWl0IHRvIGNoZWNrIGlmIGFuIGltYWdlIGhhcyBmaW5pc2hlZCBsb2FkaW5nXHJcbmNvbnN0IFdBSVQgPSAyNTBcclxuXHJcbmNsYXNzIFJlbmRlclNoZWV0IGV4dGVuZHMgRXZlbnRzXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhTaXplPTIwNDhdXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuYnVmZmVyPTVdIGFyb3VuZCBlYWNoIHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zY2FsZT0xXSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMucmVzb2x1dGlvbj0xXSBvZiByZW5kZXJzaGVldFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmV4dHJ1ZGVdIHRoZSBlZGdlcy0tdXNlZnVsIGZvciByZW1vdmluZyBnYXBzIGluIHNwcml0ZXMgd2hlbiB0aWxpbmdcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy53YWl0PTI1MF0gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBvbmxvYWQgb2YgYWRkSW1hZ2UgaW1hZ2VzIGJlZm9yZSByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudGVzdEJveGVzXSBkcmF3IGEgZGlmZmVyZW50IGNvbG9yZWQgYm94ZXMgYmVoaW5kIGVhY2ggcmVuZGVyaW5nICh1c2VmdWwgZm9yIGRlYnVnZ2luZylcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW59IFtvcHRpb25zLnNjYWxlTW9kZV0gUElYSS5zZXR0aW5ncy5TQ0FMRV9NT0RFIHRvIHNldCBmb3IgcmVuZGVyc2hlZXQgKHVzZSA9dHJ1ZSBmb3IgUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUIGZvciBwaXhlbCBhcnQpXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnVzZVNpbXBsZVBhY2tlcl0gdXNlIGEgc3R1cGlkbHkgc2ltcGxlIHBhY2tlciBpbnN0ZWFkIG9mIGdyb3dpbmcgcGFja2VyIGFsZ29yaXRobVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufG9iamVjdH0gW29wdGlvbnMuc2hvd10gc2V0IHRvIHRydWUgb3IgYSBDU1Mgb2JqZWN0IChlLmcuLCB7ekluZGV4OiAxMCwgYmFja2dyb3VuZDogJ2JsdWUnfSkgdG8gYXR0YWNoIHRoZSBmaW5hbCBjYW52YXMgdG8gZG9jdW1lbnQuYm9keS0tdXNlZnVsIGZvciBkZWJ1Z2dpbmdcclxuICAgICAqIEBmaXJlIHJlbmRlclxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKClcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gICAgICAgIHRoaXMud2FpdCA9IG9wdGlvbnMud2FpdCB8fCBXQUlUXHJcbiAgICAgICAgdGhpcy50ZXN0Qm94ZXMgPSBvcHRpb25zLnRlc3RCb3hlcyB8fCBmYWxzZVxyXG4gICAgICAgIHRoaXMubWF4U2l6ZSA9IG9wdGlvbnMubWF4U2l6ZSB8fCAyMDQ4XHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSBvcHRpb25zLmJ1ZmZlciB8fCA1XHJcbiAgICAgICAgdGhpcy5zY2FsZSA9IG9wdGlvbnMuc2NhbGUgfHwgMVxyXG4gICAgICAgIHRoaXMuc2NhbGVNb2RlID0gb3B0aW9ucy5zY2FsZU1vZGUgPT09IHRydWUgPyBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1QgOiBvcHRpb25zLnNjYWxlTW9kZVxyXG4gICAgICAgIHRoaXMucmVzb2x1dGlvbiA9IG9wdGlvbnMucmVzb2x1dGlvbiB8fCAxXHJcbiAgICAgICAgdGhpcy5zaG93ID0gb3B0aW9ucy5zaG93XHJcbiAgICAgICAgdGhpcy5leHRydWRlID0gb3B0aW9ucy5leHRydWRlXHJcbiAgICAgICAgaWYgKHRoaXMuZXh0cnVkZSAmJiB0aGlzLmJ1ZmZlciA8IDIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlciA9IDJcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wYWNrZXIgPSBvcHRpb25zLnVzZVNpbXBsZVBhY2tlciA/IFNpbXBsZVBhY2tlciA6IEdyb3dpbmdQYWNrZXJcclxuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW11cclxuICAgICAgICB0aGlzLmJhc2VUZXh0dXJlcyA9IFtdXHJcbiAgICAgICAgdGhpcy50ZXh0dXJlcyA9IHt9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGEgY2FudmFzIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBkcmF3IGZ1bmN0aW9uKGNvbnRleHQpIC0gdXNlIHRoZSBjb250ZXh0IHRvIGRyYXcgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIG1lYXN1cmUgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG1lYXN1cmUgZnVuY3Rpb24oY29udGV4dCkgLSBuZWVkcyB0byByZXR1cm4ge3dpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9IGZvciB0aGUgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gb2JqZWN0IHRvIHBhc3MgdGhlIGRyYXcoKSBhbmQgbWVhc3VyZSgpIGZ1bmN0aW9uc1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSByZW5kZXJzaGVldCBvYmplY3QgZm9yIHRleHR1cmVcclxuICAgICAqL1xyXG4gICAgYWRkKG5hbWUsIGRyYXcsIG1lYXN1cmUsIHBhcmFtKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMudGV4dHVyZXNbbmFtZV0gPSB7IG5hbWU6IG5hbWUsIGRyYXc6IGRyYXcsIG1lYXN1cmU6IG1lYXN1cmUsIHBhcmFtOiBwYXJhbSwgdHlwZTogQ0FOVkFTLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKFBJWEkuVGV4dHVyZS5FTVBUWSkgfVxyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYW4gaW1hZ2UgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzcmMgZm9yIGltYWdlXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlbmRlcnNoZWV0IG9iamVjdCBmb3IgdGV4dHVyZVxyXG4gICAgICovXHJcbiAgICBhZGRJbWFnZShuYW1lLCBzcmMpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZSwgZmlsZTogc3JjLCB0eXBlOiBJTUFHRSwgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZShQSVhJLlRleHR1cmUuRU1QVFkpICB9XHJcbiAgICAgICAgb2JqZWN0LmltYWdlID0gbmV3IEltYWdlKClcclxuICAgICAgICBvYmplY3QuaW1hZ2Uub25sb2FkID0gKCkgPT4gb2JqZWN0LmxvYWRlZCA9IHRydWVcclxuICAgICAgICBvYmplY3QuaW1hZ2Uuc3JjID0gc3JjXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhIGRhdGEgc291cmNlIChlLmcuLCBhIFBORyBmaWxlIGluIGRhdGEgZm9ybWF0KVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgb2YgcmVuZGVyaW5nIChub3QgZmlsZW5hbWUpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2hlYWRlcj1kYXRhOmltYWdlL3BuZztiYXNlNjQsXSBmb3IgZGF0YVxyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSByZW5kZXJzaGVldCBvYmplY3QgZm9yIHRleHR1cmVcclxuICAgICAqL1xyXG4gICAgYWRkRGF0YShuYW1lLCBkYXRhLCBoZWFkZXIpXHJcbiAgICB7XHJcbiAgICAgICAgaGVhZGVyID0gdHlwZW9mIGhlYWRlciAhPT0gJ3VuZGVmaW5lZCcgPyBoZWFkZXIgOiAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LCdcclxuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lLCB0eXBlOiBEQVRBLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKFBJWEkuVGV4dHVyZS5FTVBUWSkgfVxyXG4gICAgICAgIG9iamVjdC5pbWFnZSA9IG5ldyBJbWFnZSgpXHJcbiAgICAgICAgb2JqZWN0LmltYWdlLnNyYyA9IGhlYWRlciArIGRhdGFcclxuICAgICAgICBvYmplY3QuaW1hZ2Uub25sb2FkID0gKCkgPT4gb2JqZWN0LmxvYWRlZCA9IHRydWVcclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhdHRhY2hlcyBSZW5kZXJTaGVldCB0byBET00gZm9yIHRlc3RpbmdcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdHlsZXMgLSBDU1Mgc3R5bGVzIHRvIHVzZSBmb3IgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHNob3dDYW52YXNlcygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRpdkNhbnZhc2VzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kaXZDYW52YXNlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2hpbGUgKHRoaXMuZGl2Q2FudmFzZXMuaGFzQ2hpbGROb2RlcygpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpdkNhbnZhc2VzLnJlbW92ZUNoaWxkKHRoaXMuZGl2Q2FudmFzZXMubGFzdENoaWxkKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBlcmNlbnQgPSAxIC8gdGhpcy5jYW52YXNlcy5sZW5ndGhcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2ldXHJcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gY2FudmFzLnN0eWxlXHJcbiAgICAgICAgICAgIHN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJ1xyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gJzBweCdcclxuICAgICAgICAgICAgc3R5bGUudG9wID0gaSAqIE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJSdcclxuICAgICAgICAgICAgc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICAgICAgc3R5bGUuaGVpZ2h0ID0gTWF0aC5yb3VuZChwZXJjZW50ICogMTAwKSArICclJ1xyXG4gICAgICAgICAgICBzdHlsZS56SW5kZXggPSAxMDAwXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlTW9kZSA9PT0gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZS5pbWFnZVJlbmRlcmluZyA9ICdwaXhlbGF0ZWQnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3R5bGUuYmFja2dyb3VuZCA9IHRoaXMucmFuZG9tQ29sb3IoKVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc2hvdyA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnNob3cpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVba2V5XSA9IHRoaXMuc2hvd1trZXldXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcy5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdGVzdHMgd2hldGhlciBhIHRleHR1cmUgZXhpc3RzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBleGlzdHMobmFtZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlc1tuYW1lXSA/IHRydWUgOiBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7KFBJWEkuVGV4dHVyZXxudWxsKX1cclxuICAgICAqL1xyXG4gICAgZ2V0VGV4dHVyZShuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW25hbWVdXHJcbiAgICAgICAgaWYgKHRleHR1cmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGV4dHVyZS50ZXh0dXJlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktcmVuZGVyc2hlZXQ6IHRleHR1cmUgJyArIG5hbWUgKyAnIG5vdCBmb3VuZCBpbiBzcHJpdGVzaGVldC4nKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYSBQSVhJLlNwcml0ZSAod2l0aCBhbmNob3Igc2V0IHRvIDAuNSwgYmVjYXVzZSB0aGF0J3Mgd2hlcmUgaXQgc2hvdWxkIGJlKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7UElYSS5TcHJpdGV9XHJcbiAgICAgKi9cclxuICAgIGdldFNwcml0ZShuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFRleHR1cmUobmFtZSlcclxuICAgICAgICBpZiAodGV4dHVyZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNwcml0ZSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlKVxyXG4gICAgICAgICAgICBzcHJpdGUuYW5jaG9yLnNldCgwLjUpXHJcbiAgICAgICAgICAgIHJldHVybiBzcHJpdGVcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhbGlhcyBmb3IgZ2V0U3ByaXRlKClcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4ge1BJWEkuU3ByaXRlfVxyXG4gICAgICovXHJcbiAgICBnZXQobmFtZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRTcHJpdGUobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gYW1vdW50IG9mIHRleHR1cmVzIGluIHRoaXMgcmVuZGVyc2hlZXRcclxuICAgICAqL1xyXG4gICAgZW50cmllcygpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudGV4dHVyZXMpLmxlbmd0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcHJpbnRzIHN0YXRpc3RpY3Mgb2YgY2FudmFzZXMgdG8gY29uc29sZS5sb2dcclxuICAgICAqL1xyXG4gICAgZGVidWcoKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbaV1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3l5LXJlbmRlcnNoZWV0OiBTaGVldCAjJyArIChpICsgMSkgKyAnIHwgc2l6ZTogJyArIGNhbnZhcy53aWR0aCArICd4JyArIGNhbnZhcy5oZWlnaHQgKyAnIHwgcmVzb2x1dGlvbjogJyArIHRoaXMucmVzb2x1dGlvbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmaW5kIHRoZSBpbmRleCBvZiB0aGUgdGV4dHVyZSBiYXNlZCBvbiB0aGUgdGV4dHVyZSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmaW5kIHRoaXMgaW5kZXhlZCB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJucyB7UElYSS5UZXh0dXJlfVxyXG4gICAgICovXHJcbiAgICBnZXRJbmRleChmaW5kKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGkgPT09IGZpbmQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRleHR1cmVzW2tleV0udGV4dHVyZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkrK1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2hlY2tzIGlmIGFsbCB0ZXh0dXJlcyBhcmUgbG9hZGVkXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBjaGVja0xvYWRlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIGlmICgoY3VycmVudC50eXBlID09PSBJTUFHRSB8fCBjdXJyZW50LnR5cGUgPT09IERBVEEpICYmICFjdXJyZW50LmxvYWRlZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNyZWF0ZSAob3IgcmVmcmVzaCkgdGhlIHJlbmRlcnNoZWV0XHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgY2FsbHMgUmVuZGVyU2hlZXQub25jZSgncmVuZGVyJywgY2FsbGJhY2spXHJcbiAgICAgKi9cclxuICAgIHJlbmRlcihjYWxsYmFjaylcclxuICAgIHtcclxuICAgICAgICBpZiAoY2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9uY2UoJ3JlbmRlcicsIGNhbGxiYWNrKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHRoaXMudGV4dHVyZXMpLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncmVuZGVyJylcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5jaGVja0xvYWRlZCgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5yZW5kZXIoKSwgV0FJVClcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXVxyXG4gICAgICAgIHRoaXMuc29ydGVkID0gW11cclxuXHJcbiAgICAgICAgdGhpcy5tZWFzdXJlKClcclxuICAgICAgICB0aGlzLnNvcnQoKVxyXG4gICAgICAgIHRoaXMucGFjaygpXHJcbiAgICAgICAgdGhpcy5kcmF3KClcclxuICAgICAgICB0aGlzLmNyZWF0ZUJhc2VUZXh0dXJlcygpXHJcblxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBjdXJyZW50LnRleHR1cmUuYmFzZVRleHR1cmUgPSB0aGlzLmJhc2VUZXh0dXJlc1tjdXJyZW50LmNhbnZhc11cclxuICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmZyYW1lID0gbmV3IFBJWEkuUmVjdGFuZ2xlKGN1cnJlbnQueCwgY3VycmVudC55LCBjdXJyZW50LndpZHRoLCBjdXJyZW50LmhlaWdodClcclxuICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLnVwZGF0ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnNob3cpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNob3dDYW52YXNlcygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVuZGVyJylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1lYXN1cmVzIGNhbnZhcyByZW5kZXJpbmdzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBtZWFzdXJlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICBjLndpZHRoID0gdGhpcy5tYXhTaXplXHJcbiAgICAgICAgYy5oZWlnaHQgPSB0aGlzLm1heFNpemVcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gYy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IE1hdGguY2VpbCh0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uKVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRleHR1cmUudHlwZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBDQU5WQVM6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHRleHR1cmUubWVhc3VyZShjb250ZXh0LCB0ZXh0dXJlLnBhcmFtKVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUud2lkdGggPSBNYXRoLmNlaWwoc2l6ZS53aWR0aCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwoc2l6ZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBJTUFHRTogY2FzZSBEQVRBOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUud2lkdGggPSBNYXRoLmNlaWwodGV4dHVyZS5pbWFnZS53aWR0aCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwodGV4dHVyZS5pbWFnZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zb3J0ZWQucHVzaCh0ZXh0dXJlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNvcnQgdGV4dHVyZXMgYnkgbGFyZ2VzdCBkaW1lbnNpb25cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHNvcnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc29ydGVkLnNvcnQoXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGEsIGIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBhU2l6ZSA9IE1hdGgubWF4KGEuaGVpZ2h0LCBhLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgbGV0IGJTaXplID0gTWF0aC5tYXgoYi5oZWlnaHQsIGIud2lkdGgpXHJcbiAgICAgICAgICAgICAgICBpZiAoYVNpemUgPT09IGJTaXplKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGFTaXplID0gTWF0aC5taW4oYS5oZWlnaHQsIGEud2lkdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgYlNpemUgPSBNYXRoLm1heChiLmhlaWdodCwgYi53aWR0aClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiU2l6ZSAtIGFTaXplXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGUgc3F1YXJlIGNhbnZhc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzaXplPXRoaXMubWF4U2l6ZV1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUNhbnZhcyhzaXplKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCA9IHNpemUgfHwgdGhpcy5tYXhTaXplXHJcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGNhbnZhcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYSByYW5kb20gcmdiIGNvbG9yXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICByYW5kb21Db2xvcigpXHJcbiAgICB7XHJcbiAgICAgICAgZnVuY3Rpb24gcigpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjU1KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ3JnYmEoJyArIHIoKSArICcsJyArIHIoKSArICcsJyArIHIoKSArICcsIDAuMiknXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBkcmF3IHJlbmRlcmluZ3MgdG8gcmVuZGVydGV4dHVyZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZHJhdygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQsIGNvbnRleHRcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gTWF0aC5jZWlsKHRoaXMuc2NhbGUgKiB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLmNhbnZhcyAhPT0gY3VycmVudClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHRleHR1cmUuY2FudmFzXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gdGhpcy5jYW52YXNlc1tjdXJyZW50XS5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LnNhdmUoKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5zY2FsZShtdWx0aXBsaWVyLCBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpXHJcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKE1hdGguY2VpbCh0ZXh0dXJlLnggLyBtdWx0aXBsaWVyKSwgTWF0aC5jZWlsKHRleHR1cmUueSAvIG11bHRpcGxpZXIpKVxyXG4gICAgICAgICAgICBpZiAodGhpcy50ZXN0Qm94ZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5yYW5kb21Db2xvcigpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIE1hdGguY2VpbCh0ZXh0dXJlLndpZHRoIC8gbXVsdGlwbGllciksIE1hdGguY2VpbCh0ZXh0dXJlLmhlaWdodCAvIG11bHRpcGxpZXIpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaCAodGV4dHVyZS50eXBlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIENBTlZBUzpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSlcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgSU1BR0U6IGNhc2UgREFUQTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh0ZXh0dXJlLmltYWdlLCAwLCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuZXh0cnVkZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZXh0cnVkZSBwaXhlbHMgZm9yIGVudHJ5XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGV4dHJ1ZGVFbnRyeSh0ZXh0dXJlLCBjb250ZXh0LCBjdXJyZW50KVxyXG4gICAge1xyXG4gICAgICAgIGZ1bmN0aW9uIGdldCh4LCB5KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSAoeCArIHkgKiB0ZXh0dXJlLndpZHRoKSAqIDRcclxuICAgICAgICAgICAgY29uc3QgZCA9IGRhdGEuZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gJ3JnYmEoJyArIGRbZW50cnldICsgJywnICsgZFtlbnRyeSArIDFdICsgJywnICsgZFtlbnRyeSArIDJdICsgJywnICsgZFtlbnRyeSArIDNdICsgJyknXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2N1cnJlbnRdXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKHRleHR1cmUueCwgdGV4dHVyZS55LCB0ZXh0dXJlLndpZHRoLCB0ZXh0dXJlLmhlaWdodClcclxuICAgICAgICBpZiAodGV4dHVyZS54ICE9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0ZXh0dXJlLmhlaWdodDsgeSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCB5KVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgtMSwgeSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGV4dHVyZS55ICE9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgtMSwgLTEsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueCArIHRleHR1cmUud2lkdGggIT09IGNhbnZhcy53aWR0aCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHRleHR1cmUud2lkdGggLSAxLCB5KVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh0ZXh0dXJlLndpZHRoLCB5LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLnkgKyB0ZXh0dXJlLmhlaWdodCAhPT0gY2FudmFzLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHRleHR1cmUud2lkdGggLSAxLCB0ZXh0dXJlLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHRleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnkgIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRleHR1cmUud2lkdGg7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoeCwgMClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoeCwgLTEsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueSArIHRleHR1cmUuaGVpZ2h0ICE9PSBjYW52YXMuaGVpZ2h0IC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGV4dHVyZS53aWR0aDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh4LCB0ZXh0dXJlLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgY3JlYXRlQmFzZVRleHR1cmVzKClcclxuICAgIHtcclxuICAgICAgICB3aGlsZSAodGhpcy5iYXNlVGV4dHVyZXMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucG9wKCkuZGVzdHJveSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJhc2UgPSBQSVhJLkJhc2VUZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXNlc1tpXSlcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGVNb2RlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBiYXNlLnNjYWxlTW9kZSA9IHRoaXMuc2NhbGVNb2RlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucHVzaChiYXNlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhY2sgdGV4dHVyZXMgYWZ0ZXIgbWVhc3VyZW1lbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHBhY2soKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHBhY2tlcnMgPSBbbmV3IHRoaXMucGFja2VyKHRoaXMubWF4U2l6ZSwgdGhpcy5zb3J0ZWRbMF0sIHRoaXMuYnVmZmVyKV1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc29ydGVkLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYmxvY2sgPSB0aGlzLnNvcnRlZFtpXVxyXG4gICAgICAgICAgICBsZXQgcGFja2VkID0gZmFsc2VcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYWNrZXJzLmxlbmd0aDsgaisrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFja2Vyc1tqXS5hZGQoYmxvY2ssIGopKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmNhbnZhcyA9IGpcclxuICAgICAgICAgICAgICAgICAgICBwYWNrZWQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXBhY2tlZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFja2Vycy5wdXNoKG5ldyB0aGlzLnBhY2tlcih0aGlzLm1heFNpemUsIGJsb2NrLCB0aGlzLmJ1ZmZlcikpXHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhY2tlcnNbal0uYWRkKGJsb2NrLCBqKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiAnICsgYmxvY2submFtZSArICcgaXMgdG9vIGJpZyBmb3IgdGhlIHNwcml0ZXNoZWV0LicpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0galxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhY2tlcnMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzaXplID0gcGFja2Vyc1tpXS5maW5pc2godGhpcy5tYXhTaXplKVxyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNhbnZhcyhzaXplKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoYW5nZXMgdGhlIGRyYXdpbmcgZnVuY3Rpb24gb2YgYSB0ZXh0dXJlXHJcbiAgICAgKiBOT1RFOiB0aGlzIG9ubHkgd29ya3MgaWYgdGhlIHRleHR1cmUgcmVtYWlucyB0aGUgc2FtZSBzaXplOyB1c2UgU2hlZXQucmVuZGVyKCkgdG8gcmVzaXplIHRoZSB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZHJhd1xyXG4gICAgICovXHJcbiAgICBjaGFuZ2VEcmF3KG5hbWUsIGRyYXcpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNbbmFtZV1cclxuICAgICAgICBpZiAodGV4dHVyZS50eXBlICE9PSBDQU5WQVMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXNoZWV0LmNoYW5nZVRleHR1cmVEcmF3IG9ubHkgd29ya3Mgd2l0aCB0eXBlOiBDQU5WQVMuJylcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHR1cmUuZHJhdyA9IGRyYXdcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jYW52YXNlc1t0ZXh0dXJlLmNhbnZhc10uZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSB0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uXHJcbiAgICAgICAgY29udGV4dC5zYXZlKClcclxuICAgICAgICBjb250ZXh0LnNjYWxlKG11bHRpcGxpZXIsIG11bHRpcGxpZXIpXHJcbiAgICAgICAgY29udGV4dC50cmFuc2xhdGUodGV4dHVyZS54IC8gbXVsdGlwbGllciwgdGV4dHVyZS55IC8gbXVsdGlwbGllcilcclxuICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSlcclxuICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgIHRleHR1cmUudGV4dHVyZS51cGRhdGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlclNoZWV0XHJcblxyXG4vKipcclxuICogZmlyZXMgd2hlbiByZW5kZXIgY29tcGxldGVzXHJcbiAqIEBldmVudCBSZW5kZXJTaGVldCNyZW5kZXJcclxuICovIl19