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
                setTimeout(function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNhbnZhc2VzIiwiYmFzZVRleHR1cmVzIiwidGV4dHVyZXMiLCJuYW1lIiwiZHJhdyIsIm1lYXN1cmUiLCJwYXJhbSIsIm9iamVjdCIsInR5cGUiLCJ0ZXh0dXJlIiwiVGV4dHVyZSIsIkVNUFRZIiwic3JjIiwiZmlsZSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJkYXRhIiwiaGVhZGVyIiwiZGl2Q2FudmFzZXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJoYXNDaGlsZE5vZGVzIiwicmVtb3ZlQ2hpbGQiLCJsYXN0Q2hpbGQiLCJwZXJjZW50IiwibGVuZ3RoIiwiaSIsImNhbnZhcyIsInN0eWxlIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiTWF0aCIsInJvdW5kIiwid2lkdGgiLCJoZWlnaHQiLCJ6SW5kZXgiLCJpbWFnZVJlbmRlcmluZyIsImJhY2tncm91bmQiLCJyYW5kb21Db2xvciIsImtleSIsImNvbnNvbGUiLCJ3YXJuIiwiZ2V0VGV4dHVyZSIsInNwcml0ZSIsIlNwcml0ZSIsImFuY2hvciIsInNldCIsImdldFNwcml0ZSIsIk9iamVjdCIsImtleXMiLCJsb2ciLCJmaW5kIiwiY3VycmVudCIsImNhbGxiYWNrIiwib25jZSIsImVtaXQiLCJjaGVja0xvYWRlZCIsInNldFRpbWVvdXQiLCJyZW5kZXIiLCJzb3J0ZWQiLCJzb3J0IiwicGFjayIsImNyZWF0ZUJhc2VUZXh0dXJlcyIsImJhc2VUZXh0dXJlIiwiZnJhbWUiLCJSZWN0YW5nbGUiLCJ4IiwieSIsInVwZGF0ZSIsInNob3dDYW52YXNlcyIsImMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm11bHRpcGxpZXIiLCJjZWlsIiwic2l6ZSIsInB1c2giLCJhIiwiYiIsImFTaXplIiwibWF4IiwiYlNpemUiLCJtaW4iLCJyIiwiZmxvb3IiLCJyYW5kb20iLCJyZXN0b3JlIiwic2F2ZSIsInRyYW5zbGF0ZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiZHJhd0ltYWdlIiwiZXh0cnVkZUVudHJ5IiwiZ2V0IiwiZW50cnkiLCJkIiwiZ2V0SW1hZ2VEYXRhIiwicG9wIiwiZGVzdHJveSIsImZyb20iLCJCYXNlVGV4dHVyZSIsImZyb21DYW52YXMiLCJiYXNlIiwicGFja2VycyIsImJsb2NrIiwicGFja2VkIiwiaiIsImFkZCIsImZpbmlzaCIsImNyZWF0ZUNhbnZhcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsT0FBT0MsUUFBUSxTQUFSLENBQWI7QUFDQSxJQUFNQyxTQUFTRCxRQUFRLGVBQVIsQ0FBZjs7QUFFQSxJQUFNRSxnQkFBZ0JGLFFBQVEsaUJBQVIsQ0FBdEI7QUFDQSxJQUFNRyxlQUFlSCxRQUFRLGdCQUFSLENBQXJCOztBQUVBO0FBQ0EsSUFBTUksU0FBUyxDQUFmLEMsQ0FBaUI7QUFDakIsSUFBTUMsUUFBUSxDQUFkLEMsQ0FBZ0I7QUFDaEIsSUFBTUMsT0FBTyxDQUFiLEMsQ0FBZTs7QUFFZjtBQUNBLElBQU1DLE9BQU8sR0FBYjs7SUFFTUMsVzs7O0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJBQVlDLE9BQVosRUFDQTtBQUFBOztBQUFBOztBQUVJQSxrQkFBVUEsV0FBVyxFQUFyQjtBQUNBLGNBQUtD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QUFJOEUsUUFBUS9FLE1BQTVCLEVBQW9DQyxJQUFwQyxFQUNBO0FBQ0ksb0JBQU1rRCxPQUFPNEIsUUFBUTlFLEVBQVIsRUFBV21GLE1BQVgsQ0FBa0IsS0FBSzVILE9BQXZCLENBQWI7QUFDQSxxQkFBSzZILFlBQUwsQ0FBa0JsQyxJQUFsQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs7OzttQ0FNVzdFLEksRUFBTUMsSSxFQUNqQjtBQUNJLGdCQUFNSyxVQUFVLEtBQUtQLFFBQUwsQ0FBY0MsSUFBZCxDQUFoQjtBQUNBLGdCQUFJTSxRQUFRRCxJQUFSLEtBQWlCM0IsTUFBckIsRUFDQTtBQUNJZ0Usd0JBQVFDLElBQVIsQ0FBYSwwREFBYjtBQUNBO0FBQ0g7QUFDRHJDLG9CQUFRTCxJQUFSLEdBQWVBLElBQWY7QUFDQSxnQkFBTXdFLFVBQVUsS0FBSzVFLFFBQUwsQ0FBY1MsUUFBUXNCLE1BQXRCLEVBQThCOEMsVUFBOUIsQ0FBeUMsSUFBekMsQ0FBaEI7QUFDQSxnQkFBTUMsYUFBYSxLQUFLdkYsS0FBTCxHQUFhLEtBQUtJLFVBQXJDO0FBQ0FpRixvQkFBUWdCLElBQVI7QUFDQWhCLG9CQUFRckYsS0FBUixDQUFjdUYsVUFBZCxFQUEwQkEsVUFBMUI7QUFDQUYsb0JBQVFpQixTQUFSLENBQWtCcEYsUUFBUThELENBQVIsR0FBWU8sVUFBOUIsRUFBMENyRSxRQUFRK0QsQ0FBUixHQUFZTSxVQUF0RDtBQUNBckUsb0JBQVFMLElBQVIsQ0FBYXdFLE9BQWIsRUFBc0JuRSxRQUFRSCxLQUE5QjtBQUNBc0Usb0JBQVFlLE9BQVI7QUFDQWxGLG9CQUFRQSxPQUFSLENBQWdCZ0UsTUFBaEI7QUFDSDs7OztFQS9pQnFCL0YsTTs7QUFrakIxQnlJLE9BQU9DLE9BQVAsR0FBaUJuSSxXQUFqQjs7QUFFQSIsImZpbGUiOiJyZW5kZXJzaGVldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHl5LXJlbmRlcnNoZWV0XHJcbi8vIGJ5IERhdmlkIEZpZ2F0bmVyXHJcbi8vIChjKSBZT1BFWSBZT1BFWSBMTEMgMjAxN1xyXG4vLyBNSVQgTGljZW5zZVxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGF2aWRmaWcvcmVuZGVyc2hlZXRcclxuXHJcbmNvbnN0IFBJWEkgPSByZXF1aXJlKCdwaXhpLmpzJylcclxuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcblxyXG5jb25zdCBHcm93aW5nUGFja2VyID0gcmVxdWlyZSgnLi9ncm93aW5ncGFja2VyJylcclxuY29uc3QgU2ltcGxlUGFja2VyID0gcmVxdWlyZSgnLi9zaW1wbGVwYWNrZXInKVxyXG5cclxuLy8gdHlwZXNcclxuY29uc3QgQ0FOVkFTID0gMCAvLyBkZWZhdWx0XHJcbmNvbnN0IElNQUdFID0gMSAvLyBpbWFnZSB1cmxcclxuY29uc3QgREFUQSA9IDIgLy8gZGF0YSBzcmMgKGUuZy4sIHJlc3VsdCBvZiAudG9EYXRhVVJMKCkpXHJcblxyXG4vLyBkZWZhdWx0IG1zIHRvIHdhaXQgdG8gY2hlY2sgaWYgYW4gaW1hZ2UgaGFzIGZpbmlzaGVkIGxvYWRpbmdcclxuY29uc3QgV0FJVCA9IDI1MFxyXG5cclxuY2xhc3MgUmVuZGVyU2hlZXQgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFNpemU9MjA0OF1cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5idWZmZXI9NV0gYXJvdW5kIGVhY2ggdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNjYWxlPTFdIG9mIHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5yZXNvbHV0aW9uPTFdIG9mIHJlbmRlcnNoZWV0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuZXh0cnVkZV0gdGhlIGVkZ2VzLS11c2VmdWwgZm9yIHJlbW92aW5nIGdhcHMgaW4gc3ByaXRlcyB3aGVuIHRpbGluZ1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndhaXQ9MjUwXSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIG9ubG9hZCBvZiBhZGRJbWFnZSBpbWFnZXMgYmVmb3JlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50ZXN0Qm94ZXNdIGRyYXcgYSBkaWZmZXJlbnQgY29sb3JlZCBib3hlcyBiZWhpbmQgZWFjaCByZW5kZXJpbmcgKHVzZWZ1bCBmb3IgZGVidWdnaW5nKVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ8Ym9vbGVhbn0gW29wdGlvbnMuc2NhbGVNb2RlXSBQSVhJLnNldHRpbmdzLlNDQUxFX01PREUgdG8gc2V0IGZvciByZW5kZXJzaGVldCAodXNlID10cnVlIGZvciBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1QgZm9yIHBpeGVsIGFydClcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlU2ltcGxlUGFja2VyXSB1c2UgYSBzdHVwaWRseSBzaW1wbGUgcGFja2VyIGluc3RlYWQgb2YgZ3Jvd2luZyBwYWNrZXIgYWxnb3JpdGhtXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW58b2JqZWN0fSBbb3B0aW9ucy5zaG93XSBzZXQgdG8gdHJ1ZSBvciBhIENTUyBvYmplY3QgKGUuZy4sIHt6SW5kZXg6IDEwLCBiYWNrZ3JvdW5kOiAnYmx1ZSd9KSB0byBhdHRhY2ggdGhlIGZpbmFsIGNhbnZhcyB0byBkb2N1bWVudC5ib2R5LS11c2VmdWwgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICogQGZpcmUgcmVuZGVyXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgICAgICAgdGhpcy53YWl0ID0gb3B0aW9ucy53YWl0IHx8IFdBSVRcclxuICAgICAgICB0aGlzLnRlc3RCb3hlcyA9IG9wdGlvbnMudGVzdEJveGVzIHx8IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhTaXplID0gb3B0aW9ucy5tYXhTaXplIHx8IDIwNDhcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG9wdGlvbnMuYnVmZmVyIHx8IDVcclxuICAgICAgICB0aGlzLnNjYWxlID0gb3B0aW9ucy5zY2FsZSB8fCAxXHJcbiAgICAgICAgdGhpcy5zY2FsZU1vZGUgPSBvcHRpb25zLnNjYWxlTW9kZSA9PT0gdHJ1ZSA/IFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVCA6IG9wdGlvbnMuc2NhbGVNb2RlXHJcbiAgICAgICAgdGhpcy5yZXNvbHV0aW9uID0gb3B0aW9ucy5yZXNvbHV0aW9uIHx8IDFcclxuICAgICAgICB0aGlzLnNob3cgPSBvcHRpb25zLnNob3dcclxuICAgICAgICB0aGlzLmV4dHJ1ZGUgPSBvcHRpb25zLmV4dHJ1ZGVcclxuICAgICAgICBpZiAodGhpcy5leHRydWRlICYmIHRoaXMuYnVmZmVyIDwgMilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyID0gMlxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhY2tlciA9IG9wdGlvbnMudXNlU2ltcGxlUGFja2VyID8gU2ltcGxlUGFja2VyIDogR3Jvd2luZ1BhY2tlclxyXG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXVxyXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmVzID0gW11cclxuICAgICAgICB0aGlzLnRleHR1cmVzID0ge31cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBjYW52YXMgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGRyYXcgZnVuY3Rpb24oY29udGV4dCkgLSB1c2UgdGhlIGNvbnRleHQgdG8gZHJhdyB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgbWVhc3VyZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbWVhc3VyZSBmdW5jdGlvbihjb250ZXh0KSAtIG5lZWRzIHRvIHJldHVybiB7d2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0gZm9yIHRoZSByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBvYmplY3QgdG8gcGFzcyB0aGUgZHJhdygpIGFuZCBtZWFzdXJlKCkgZnVuY3Rpb25zXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlbmRlcnNoZWV0IG9iamVjdCBmb3IgdGV4dHVyZVxyXG4gICAgICovXHJcbiAgICBhZGQobmFtZSwgZHJhdywgbWVhc3VyZSwgcGFyYW0pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZTogbmFtZSwgZHJhdzogZHJhdywgbWVhc3VyZTogbWVhc3VyZSwgcGFyYW06IHBhcmFtLCB0eXBlOiBDQU5WQVMsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSB9XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhbiBpbWFnZSByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNyYyBmb3IgaW1hZ2VcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZEltYWdlKG5hbWUsIHNyYylcclxuICAgIHtcclxuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lLCBmaWxlOiBzcmMsIHR5cGU6IElNQUdFLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKFBJWEkuVGV4dHVyZS5FTVBUWSkgIH1cclxuICAgICAgICBvYmplY3QuaW1hZ2UgPSBuZXcgSW1hZ2UoKVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5vbmxvYWQgPSAoKSA9PiBvYmplY3QubG9hZGVkID0gdHJ1ZVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBzcmNcclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGEgZGF0YSBzb3VyY2UgKGUuZy4sIGEgUE5HIGZpbGUgaW4gZGF0YSBmb3JtYXQpXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBvZiByZW5kZXJpbmcgKG5vdCBmaWxlbmFtZSlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbaGVhZGVyPWRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxdIGZvciBkYXRhXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlbmRlcnNoZWV0IG9iamVjdCBmb3IgdGV4dHVyZVxyXG4gICAgICovXHJcbiAgICBhZGREYXRhKG5hbWUsIGRhdGEsIGhlYWRlcilcclxuICAgIHtcclxuICAgICAgICBoZWFkZXIgPSB0eXBlb2YgaGVhZGVyICE9PSAndW5kZWZpbmVkJyA/IGhlYWRlciA6ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJ1xyXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMudGV4dHVyZXNbbmFtZV0gPSB7IG5hbWUsIHR5cGU6IERBVEEsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSB9XHJcbiAgICAgICAgb2JqZWN0LmltYWdlID0gbmV3IEltYWdlKClcclxuICAgICAgICBvYmplY3QuaW1hZ2Uuc3JjID0gaGVhZGVyICsgZGF0YVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5vbmxvYWQgPSAoKSA9PiBvYmplY3QubG9hZGVkID0gdHJ1ZVxyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGF0dGFjaGVzIFJlbmRlclNoZWV0IHRvIERPTSBmb3IgdGVzdGluZ1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHN0eWxlcyAtIENTUyBzdHlsZXMgdG8gdXNlIGZvciByZW5kZXJzaGVldFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgc2hvd0NhbnZhc2VzKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGl2Q2FudmFzZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRpdkNhbnZhc2VzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRpdkNhbnZhc2VzKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5kaXZDYW52YXNlcy5oYXNDaGlsZE5vZGVzKCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMucmVtb3ZlQ2hpbGQodGhpcy5kaXZDYW52YXNlcy5sYXN0Q2hpbGQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcGVyY2VudCA9IDEgLyB0aGlzLmNhbnZhc2VzLmxlbmd0aFxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbaV1cclxuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBjYW52YXMuc3R5bGVcclxuICAgICAgICAgICAgc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAnMHB4J1xyXG4gICAgICAgICAgICBzdHlsZS50b3AgPSBpICogTWF0aC5yb3VuZChwZXJjZW50ICogMTAwKSArICclJ1xyXG4gICAgICAgICAgICBzdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICBzdHlsZS5oZWlnaHQgPSBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnXHJcbiAgICAgICAgICAgIHN0eWxlLnpJbmRleCA9IDEwMDBcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGVNb2RlID09PSBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHN0eWxlLmltYWdlUmVuZGVyaW5nID0gJ3BpeGVsYXRlZCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5yYW5kb21Db2xvcigpXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5zaG93ID09PSAnb2JqZWN0JylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuc2hvdylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZVtrZXldID0gdGhpcy5zaG93W2tleV1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRpdkNhbnZhc2VzLmFwcGVuZENoaWxkKGNhbnZhcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0ZXN0cyB3aGV0aGVyIGEgdGV4dHVyZSBleGlzdHNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGV4aXN0cyhuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRleHR1cmVzW25hbWVdID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHsoUElYSS5UZXh0dXJlfG51bGwpfVxyXG4gICAgICovXHJcbiAgICBnZXRUZXh0dXJlKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNbbmFtZV1cclxuICAgICAgICBpZiAodGV4dHVyZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0dXJlLnRleHR1cmVcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1yZW5kZXJzaGVldDogdGV4dHVyZSAnICsgbmFtZSArICcgbm90IGZvdW5kIGluIHNwcml0ZXNoZWV0LicpXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhIFBJWEkuU3ByaXRlICh3aXRoIGFuY2hvciBzZXQgdG8gMC41LCBiZWNhdXNlIHRoYXQncyB3aGVyZSBpdCBzaG91bGQgYmUpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHtQSVhJLlNwcml0ZX1cclxuICAgICAqL1xyXG4gICAgZ2V0U3ByaXRlKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuZ2V0VGV4dHVyZShuYW1lKVxyXG4gICAgICAgIGlmICh0ZXh0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3Qgc3ByaXRlID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmUpXHJcbiAgICAgICAgICAgIHNwcml0ZS5hbmNob3Iuc2V0KDAuNSlcclxuICAgICAgICAgICAgcmV0dXJuIHNwcml0ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFsaWFzIGZvciBnZXRTcHJpdGUoKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7UElYSS5TcHJpdGV9XHJcbiAgICAgKi9cclxuICAgIGdldChuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFNwcml0ZShuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBhbW91bnQgb2YgdGV4dHVyZXMgaW4gdGhpcyByZW5kZXJzaGVldFxyXG4gICAgICovXHJcbiAgICBlbnRyaWVzKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy50ZXh0dXJlcykubGVuZ3RoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwcmludHMgc3RhdGlzdGljcyBvZiBjYW52YXNlcyB0byBjb25zb2xlLmxvZ1xyXG4gICAgICovXHJcbiAgICBkZWJ1ZygpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tpXVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygneXktcmVuZGVyc2hlZXQ6IFNoZWV0ICMnICsgKGkgKyAxKSArICcgfCBzaXplOiAnICsgY2FudmFzLndpZHRoICsgJ3gnICsgY2FudmFzLmhlaWdodCArICcgfCByZXNvbHV0aW9uOiAnICsgdGhpcy5yZXNvbHV0aW9uKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZpbmQgdGhlIGluZGV4IG9mIHRoZSB0ZXh0dXJlIGJhc2VkIG9uIHRoZSB0ZXh0dXJlIG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGZpbmQgdGhpcyBpbmRleGVkIHRleHR1cmVcclxuICAgICAqIEByZXR1cm5zIHtQSVhJLlRleHR1cmV9XHJcbiAgICAgKi9cclxuICAgIGdldEluZGV4KGZpbmQpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gZmluZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dHVyZXNba2V5XS50ZXh0dXJlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGVja3MgaWYgYWxsIHRleHR1cmVzIGFyZSBsb2FkZWRcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGNoZWNrTG9hZGVkKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgaWYgKChjdXJyZW50LnR5cGUgPT09IElNQUdFIHx8IGN1cnJlbnQudHlwZSA9PT0gREFUQSkgJiYgIWN1cnJlbnQubG9hZGVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlIChvciByZWZyZXNoKSB0aGUgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBjYWxscyBSZW5kZXJTaGVldC5vbmNlKCdyZW5kZXInLCBjYWxsYmFjaylcclxuICAgICAqL1xyXG4gICAgcmVuZGVyKGNhbGxiYWNrKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChjYWxsYmFjaylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub25jZSgncmVuZGVyJywgY2FsbGJhY2spXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghT2JqZWN0LmtleXModGhpcy50ZXh0dXJlcykubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrTG9hZGVkKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVuZGVyKCksIFdBSVQpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW11cclxuICAgICAgICB0aGlzLnNvcnRlZCA9IFtdXHJcblxyXG4gICAgICAgIHRoaXMubWVhc3VyZSgpXHJcbiAgICAgICAgdGhpcy5zb3J0KClcclxuICAgICAgICB0aGlzLnBhY2soKVxyXG4gICAgICAgIHRoaXMuZHJhdygpXHJcbiAgICAgICAgdGhpcy5jcmVhdGVCYXNlVGV4dHVyZXMoKVxyXG5cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmJhc2VUZXh0dXJlID0gdGhpcy5iYXNlVGV4dHVyZXNbY3VycmVudC5jYW52YXNdXHJcbiAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS5mcmFtZSA9IG5ldyBQSVhJLlJlY3RhbmdsZShjdXJyZW50LngsIGN1cnJlbnQueSwgY3VycmVudC53aWR0aCwgY3VycmVudC5oZWlnaHQpXHJcbiAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS51cGRhdGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zaG93KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zaG93Q2FudmFzZXMoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3JlbmRlcicpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtZWFzdXJlcyBjYW52YXMgcmVuZGVyaW5nc1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgbWVhc3VyZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgYy53aWR0aCA9IHRoaXMubWF4U2l6ZVxyXG4gICAgICAgIGMuaGVpZ2h0ID0gdGhpcy5tYXhTaXplXHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSBNYXRoLmNlaWwodGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvbilcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgc3dpdGNoICh0ZXh0dXJlLnR5cGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgQ0FOVkFTOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSB0ZXh0dXJlLm1lYXN1cmUoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgYylcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLndpZHRoID0gTWF0aC5jZWlsKHNpemUud2lkdGggKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaGVpZ2h0ID0gTWF0aC5jZWlsKHNpemUuaGVpZ2h0ICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgSU1BR0U6IGNhc2UgREFUQTpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLndpZHRoID0gTWF0aC5jZWlsKHRleHR1cmUuaW1hZ2Uud2lkdGggKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaGVpZ2h0ID0gTWF0aC5jZWlsKHRleHR1cmUuaW1hZ2UuaGVpZ2h0ICogbXVsdGlwbGllcilcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc29ydGVkLnB1c2godGV4dHVyZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzb3J0IHRleHR1cmVzIGJ5IGxhcmdlc3QgZGltZW5zaW9uXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBzb3J0KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNvcnRlZC5zb3J0KFxyXG4gICAgICAgICAgICBmdW5jdGlvbihhLCBiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYVNpemUgPSBNYXRoLm1heChhLmhlaWdodCwgYS53aWR0aClcclxuICAgICAgICAgICAgICAgIGxldCBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgaWYgKGFTaXplID09PSBiU2l6ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBhU2l6ZSA9IE1hdGgubWluKGEuaGVpZ2h0LCBhLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgICAgIGJTaXplID0gTWF0aC5tYXgoYi5oZWlnaHQsIGIud2lkdGgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYlNpemUgLSBhU2l6ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlIHNxdWFyZSBjYW52YXNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbc2l6ZT10aGlzLm1heFNpemVdXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVDYW52YXMoc2l6ZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgPSBzaXplIHx8IHRoaXMubWF4U2l6ZVxyXG4gICAgICAgIHRoaXMuY2FudmFzZXMucHVzaChjYW52YXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGEgcmFuZG9tIHJnYiBjb2xvclxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgcmFuZG9tQ29sb3IoKVxyXG4gICAge1xyXG4gICAgICAgIGZ1bmN0aW9uIHIoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI1NSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCAwLjIpJ1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZHJhdyByZW5kZXJpbmdzIHRvIHJlbmRlcnRleHR1cmVcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGRyYXcoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBjdXJyZW50LCBjb250ZXh0XHJcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IE1hdGguY2VpbCh0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uKVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBpZiAodGV4dHVyZS5jYW52YXMgIT09IGN1cnJlbnQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudCAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSB0ZXh0dXJlLmNhbnZhc1xyXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IHRoaXMuY2FudmFzZXNbY3VycmVudF0uZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5zYXZlKClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuc2NhbGUobXVsdGlwbGllciwgbXVsdGlwbGllcilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZXh0LnNhdmUoKVxyXG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZShNYXRoLmNlaWwodGV4dHVyZS54IC8gbXVsdGlwbGllciksIE1hdGguY2VpbCh0ZXh0dXJlLnkgLyBtdWx0aXBsaWVyKSlcclxuICAgICAgICAgICAgaWYgKHRoaXMudGVzdEJveGVzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMucmFuZG9tQ29sb3IoKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCBNYXRoLmNlaWwodGV4dHVyZS53aWR0aCAvIG11bHRpcGxpZXIpLCBNYXRoLmNlaWwodGV4dHVyZS5oZWlnaHQgLyBtdWx0aXBsaWVyKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRleHR1cmUudHlwZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBDQU5WQVM6XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5kcmF3KGNvbnRleHQsIHRleHR1cmUucGFyYW0sIHRoaXMuY2FudmFzZXNbY3VycmVudF0pXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIElNQUdFOiBjYXNlIERBVEE6XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGV4dHVyZS5pbWFnZSwgMCwgMClcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0cnVkZUVudHJ5KHRleHR1cmUsIGNvbnRleHQsIGN1cnJlbnQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGV4dC5yZXN0b3JlKClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGV4dHJ1ZGUgcGl4ZWxzIGZvciBlbnRyeVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjb250ZXh0XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBleHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcclxuICAgIHtcclxuICAgICAgICBmdW5jdGlvbiBnZXQoeCwgeSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gKHggKyB5ICogdGV4dHVyZS53aWR0aCkgKiA0XHJcbiAgICAgICAgICAgIGNvbnN0IGQgPSBkYXRhLmRhdGFcclxuICAgICAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyBkW2VudHJ5XSArICcsJyArIGRbZW50cnkgKyAxXSArICcsJyArIGRbZW50cnkgKyAyXSArICcsJyArIChkW2VudHJ5ICsgM10gLyAweGZmKSArICcpJ1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tjdXJyZW50XVxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSh0ZXh0dXJlLngsIHRleHR1cmUueSwgdGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQpXHJcbiAgICAgICAgaWYgKHRleHR1cmUueCAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGV4dHVyZS5oZWlnaHQ7IHkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoMCwgeSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoLTEsIHksIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoMCwgMClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoLTEsIC0xLCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnggKyB0ZXh0dXJlLndpZHRoICE9PSBjYW52YXMud2lkdGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0ZXh0dXJlLmhlaWdodDsgeSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh0ZXh0dXJlLndpZHRoIC0gMSwgeSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QodGV4dHVyZS53aWR0aCwgeSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGV4dHVyZS55ICsgdGV4dHVyZS5oZWlnaHQgIT09IGNhbnZhcy5oZWlnaHQgLSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh0ZXh0dXJlLndpZHRoIC0gMSwgdGV4dHVyZS5oZWlnaHQgLSAxKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh0ZXh0dXJlLndpZHRoLCB0ZXh0dXJlLmhlaWdodCwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dHVyZS55ICE9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0ZXh0dXJlLndpZHRoOyB4KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHgsIDApXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIC0xLCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnkgKyB0ZXh0dXJlLmhlaWdodCAhPT0gY2FudmFzLmhlaWdodCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRleHR1cmUud2lkdGg7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoeCwgdGV4dHVyZS5oZWlnaHQgLSAxKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh4LCB0ZXh0dXJlLmhlaWdodCwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUJhc2VUZXh0dXJlcygpXHJcbiAgICB7XHJcbiAgICAgICAgd2hpbGUgKHRoaXMuYmFzZVRleHR1cmVzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZVRleHR1cmVzLnBvcCgpLmRlc3Ryb3koKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBmcm9tID0gUElYSS5CYXNlVGV4dHVyZS5mcm9tQ2FudmFzIHx8IFBJWEkuQmFzZVRleHR1cmUuZnJvbVxyXG4gICAgICAgICAgICBjb25zdCBiYXNlID0gZnJvbSh0aGlzLmNhbnZhc2VzW2ldKVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zY2FsZU1vZGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJhc2Uuc2NhbGVNb2RlID0gdGhpcy5zY2FsZU1vZGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJhc2VUZXh0dXJlcy5wdXNoKGJhc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcGFjayB0ZXh0dXJlcyBhZnRlciBtZWFzdXJlbWVudFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgcGFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgcGFja2VycyA9IFtuZXcgdGhpcy5wYWNrZXIodGhpcy5tYXhTaXplLCB0aGlzLnNvcnRlZFswXSwgdGhpcy5idWZmZXIpXVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zb3J0ZWQubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBibG9jayA9IHRoaXMuc29ydGVkW2ldXHJcbiAgICAgICAgICAgIGxldCBwYWNrZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhY2tlcnMubGVuZ3RoOyBqKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChwYWNrZXJzW2pdLmFkZChibG9jaywgaikpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0galxyXG4gICAgICAgICAgICAgICAgICAgIHBhY2tlZCA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghcGFja2VkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYWNrZXJzLnB1c2gobmV3IHRoaXMucGFja2VyKHRoaXMubWF4U2l6ZSwgYmxvY2ssIHRoaXMuYnVmZmVyKSlcclxuICAgICAgICAgICAgICAgIGlmICghcGFja2Vyc1tqXS5hZGQoYmxvY2ssIGopKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktcmVuZGVyc2hlZXQ6ICcgKyBibG9jay5uYW1lICsgJyBpcyB0b28gYmlnIGZvciB0aGUgc3ByaXRlc2hlZXQuJylcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBibG9jay5jYW52YXMgPSBqXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2Vycy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBwYWNrZXJzW2ldLmZpbmlzaCh0aGlzLm1heFNpemUpXHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ2FudmFzKHNpemUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hhbmdlcyB0aGUgZHJhd2luZyBmdW5jdGlvbiBvZiBhIHRleHR1cmVcclxuICAgICAqIE5PVEU6IHRoaXMgb25seSB3b3JrcyBpZiB0aGUgdGV4dHVyZSByZW1haW5zIHRoZSBzYW1lIHNpemU7IHVzZSBTaGVldC5yZW5kZXIoKSB0byByZXNpemUgdGhlIHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkcmF3XHJcbiAgICAgKi9cclxuICAgIGNoYW5nZURyYXcobmFtZSwgZHJhdylcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tuYW1lXVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnR5cGUgIT09IENBTlZBUylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktc2hlZXQuY2hhbmdlVGV4dHVyZURyYXcgb25seSB3b3JrcyB3aXRoIHR5cGU6IENBTlZBUy4nKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dHVyZS5kcmF3ID0gZHJhd1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNhbnZhc2VzW3RleHR1cmUuY2FudmFzXS5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IHRoaXMuc2NhbGUgKiB0aGlzLnJlc29sdXRpb25cclxuICAgICAgICBjb250ZXh0LnNhdmUoKVxyXG4gICAgICAgIGNvbnRleHQuc2NhbGUobXVsdGlwbGllciwgbXVsdGlwbGllcilcclxuICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh0ZXh0dXJlLnggLyBtdWx0aXBsaWVyLCB0ZXh0dXJlLnkgLyBtdWx0aXBsaWVyKVxyXG4gICAgICAgIHRleHR1cmUuZHJhdyhjb250ZXh0LCB0ZXh0dXJlLnBhcmFtKVxyXG4gICAgICAgIGNvbnRleHQucmVzdG9yZSgpXHJcbiAgICAgICAgdGV4dHVyZS50ZXh0dXJlLnVwZGF0ZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyU2hlZXRcclxuXHJcbi8qKlxyXG4gKiBmaXJlcyB3aGVuIHJlbmRlciBjb21wbGV0ZXNcclxuICogQGV2ZW50IFJlbmRlclNoZWV0I3JlbmRlclxyXG4gKi8iXX0=