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
        _this.clear();
        return _this;
    }

    /**
     * removes all textures from rendersheets
     */


    _createClass(RenderSheet, [{
        key: 'clear',
        value: function clear() {
            this.canvases = [];
            this.baseTextures = [];
            this.textures = {};
        }

        /**
         * adds a canvas rendering
         * @param {string} name of rendering
         * @param {Function} draw function(context) - use the context to draw within the bounds of the measure function
         * @param {Function} measure function(context) - needs to return {width: width, height: height} for the rendering
         * @param {object} params - object to pass the draw() and measure() functions
         * @return {object} rendersheet object for texture
         */

    }, {
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
                base.scaleMode = this.scaleMode;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNsZWFyIiwiY2FudmFzZXMiLCJiYXNlVGV4dHVyZXMiLCJ0ZXh0dXJlcyIsIm5hbWUiLCJkcmF3IiwibWVhc3VyZSIsInBhcmFtIiwib2JqZWN0IiwidHlwZSIsInRleHR1cmUiLCJUZXh0dXJlIiwiRU1QVFkiLCJzcmMiLCJmaWxlIiwiaW1hZ2UiLCJJbWFnZSIsIm9ubG9hZCIsImxvYWRlZCIsImRhdGEiLCJoZWFkZXIiLCJjb21wbGV0ZSIsImRpdkNhbnZhc2VzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiYm9keSIsImFwcGVuZENoaWxkIiwiaGFzQ2hpbGROb2RlcyIsInJlbW92ZUNoaWxkIiwibGFzdENoaWxkIiwicGVyY2VudCIsImxlbmd0aCIsImkiLCJjYW52YXMiLCJzdHlsZSIsInBvc2l0aW9uIiwibGVmdCIsInRvcCIsIk1hdGgiLCJyb3VuZCIsIndpZHRoIiwiaGVpZ2h0IiwiekluZGV4IiwiaW1hZ2VSZW5kZXJpbmciLCJiYWNrZ3JvdW5kIiwicmFuZG9tQ29sb3IiLCJrZXkiLCJjb25zb2xlIiwid2FybiIsImdldFRleHR1cmUiLCJzcHJpdGUiLCJTcHJpdGUiLCJhbmNob3IiLCJzZXQiLCJnZXRTcHJpdGUiLCJPYmplY3QiLCJrZXlzIiwibG9nIiwiZmluZCIsImN1cnJlbnQiLCJza2lwVGV4dHVyZXMiLCJQcm9taXNlIiwicmVuZGVyIiwicmVzb2x2ZSIsImNhbGxiYWNrIiwib25jZSIsImVtaXQiLCJjaGVja0xvYWRlZCIsInNldFRpbWVvdXQiLCJzb3J0ZWQiLCJzb3J0IiwicGFjayIsImNyZWF0ZUJhc2VUZXh0dXJlcyIsImJhc2VUZXh0dXJlIiwiZnJhbWUiLCJSZWN0YW5nbGUiLCJ4IiwieSIsInVwZGF0ZSIsInNob3dDYW52YXNlcyIsImMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm11bHRpcGxpZXIiLCJjZWlsIiwic2l6ZSIsInB1c2giLCJhIiwiYiIsImFTaXplIiwibWF4IiwiYlNpemUiLCJtaW4iLCJyIiwiZmxvb3IiLCJyYW5kb20iLCJyZXN0b3JlIiwic2F2ZSIsInRyYW5zbGF0ZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiZHJhd0ltYWdlIiwiZXh0cnVkZUVudHJ5IiwiZ2V0IiwiZW50cnkiLCJkIiwiZ2V0SW1hZ2VEYXRhIiwicG9wIiwiZGVzdHJveSIsImZyb20iLCJCYXNlVGV4dHVyZSIsImZyb21DYW52YXMiLCJiYXNlIiwicGFja2VycyIsImJsb2NrIiwicGFja2VkIiwiaiIsImFkZCIsImZpbmlzaCIsImNyZWF0ZUNhbnZhcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsT0FBT0MsUUFBUSxTQUFSLENBQWI7QUFDQSxJQUFNQyxTQUFTRCxRQUFRLGVBQVIsQ0FBZjs7QUFFQSxJQUFNRSxnQkFBZ0JGLFFBQVEsaUJBQVIsQ0FBdEI7QUFDQSxJQUFNRyxlQUFlSCxRQUFRLGdCQUFSLENBQXJCOztBQUVBO0FBQ0EsSUFBTUksU0FBUyxDQUFmLEMsQ0FBaUI7QUFDakIsSUFBTUMsUUFBUSxDQUFkLEMsQ0FBZ0I7QUFDaEIsSUFBTUMsT0FBTyxDQUFiLEMsQ0FBZTs7QUFFZjtBQUNBLElBQU1DLE9BQU8sR0FBYjs7SUFFTUMsVzs7O0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJBQVlDLE9B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R0FBWU8sVUFBOUIsRUFBMEN6RSxRQUFRbUUsQ0FBUixHQUFZTSxVQUF0RDtBQUNBekUsb0JBQVFMLElBQVIsQ0FBYTRFLE9BQWIsRUFBc0J2RSxRQUFRSCxLQUE5QjtBQUNBMEUsb0JBQVFlLE9BQVI7QUFDQXRGLG9CQUFRQSxPQUFSLENBQWdCb0UsTUFBaEI7QUFDSDs7OztFQTNrQnFCcEcsTTs7QUE4a0IxQjhJLE9BQU9DLE9BQVAsR0FBaUJ4SSxXQUFqQjs7QUFFQSIsImZpbGUiOiJyZW5kZXJzaGVldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHl5LXJlbmRlcnNoZWV0XHJcbi8vIGJ5IERhdmlkIEZpZ2F0bmVyXHJcbi8vIChjKSBZT1BFWSBZT1BFWSBMTEMgMjAxOVxyXG4vLyBNSVQgTGljZW5zZVxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGF2aWRmaWcvcmVuZGVyc2hlZXRcclxuXHJcbmNvbnN0IFBJWEkgPSByZXF1aXJlKCdwaXhpLmpzJylcclxuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcblxyXG5jb25zdCBHcm93aW5nUGFja2VyID0gcmVxdWlyZSgnLi9ncm93aW5ncGFja2VyJylcclxuY29uc3QgU2ltcGxlUGFja2VyID0gcmVxdWlyZSgnLi9zaW1wbGVwYWNrZXInKVxyXG5cclxuLy8gdHlwZXNcclxuY29uc3QgQ0FOVkFTID0gMCAvLyBkZWZhdWx0XHJcbmNvbnN0IElNQUdFID0gMSAvLyBpbWFnZSB1cmxcclxuY29uc3QgREFUQSA9IDIgLy8gZGF0YSBzcmMgKGUuZy4sIHJlc3VsdCBvZiAudG9EYXRhVVJMKCkpXHJcblxyXG4vLyBkZWZhdWx0IG1zIHRvIHdhaXQgdG8gY2hlY2sgaWYgYW4gaW1hZ2UgaGFzIGZpbmlzaGVkIGxvYWRpbmdcclxuY29uc3QgV0FJVCA9IDI1MFxyXG5cclxuY2xhc3MgUmVuZGVyU2hlZXQgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFNpemU9MjA0OF1cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5idWZmZXI9NV0gYXJvdW5kIGVhY2ggdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNjYWxlPTFdIG9mIHRleHR1cmVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5yZXNvbHV0aW9uPTFdIG9mIHJlbmRlcnNoZWV0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuZXh0cnVkZV0gdGhlIGVkZ2VzLS11c2VmdWwgZm9yIHJlbW92aW5nIGdhcHMgaW4gc3ByaXRlcyB3aGVuIHRpbGluZ1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndhaXQ9MjUwXSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIG9ubG9hZCBvZiBhZGRJbWFnZSBpbWFnZXMgYmVmb3JlIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50ZXN0Qm94ZXNdIGRyYXcgYSBkaWZmZXJlbnQgY29sb3JlZCBib3hlcyBiZWhpbmQgZWFjaCByZW5kZXJpbmcgKHVzZWZ1bCBmb3IgZGVidWdnaW5nKVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ8Ym9vbGVhbn0gW29wdGlvbnMuc2NhbGVNb2RlXSBQSVhJLnNldHRpbmdzLlNDQUxFX01PREUgdG8gc2V0IGZvciByZW5kZXJzaGVldCAodXNlID10cnVlIGZvciBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1QgZm9yIHBpeGVsIGFydClcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlU2ltcGxlUGFja2VyXSB1c2UgYSBzdHVwaWRseSBzaW1wbGUgcGFja2VyIGluc3RlYWQgb2YgZ3Jvd2luZyBwYWNrZXIgYWxnb3JpdGhtXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW58b2JqZWN0fSBbb3B0aW9ucy5zaG93XSBzZXQgdG8gdHJ1ZSBvciBhIENTUyBvYmplY3QgKGUuZy4sIHt6SW5kZXg6IDEwLCBiYWNrZ3JvdW5kOiAnYmx1ZSd9KSB0byBhdHRhY2ggdGhlIGZpbmFsIGNhbnZhcyB0byBkb2N1bWVudC5ib2R5LS11c2VmdWwgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICogQGZpcmUgcmVuZGVyXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgICAgICAgdGhpcy53YWl0ID0gb3B0aW9ucy53YWl0IHx8IFdBSVRcclxuICAgICAgICB0aGlzLnRlc3RCb3hlcyA9IG9wdGlvbnMudGVzdEJveGVzIHx8IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhTaXplID0gb3B0aW9ucy5tYXhTaXplIHx8IDIwNDhcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG9wdGlvbnMuYnVmZmVyIHx8IDVcclxuICAgICAgICB0aGlzLnNjYWxlID0gb3B0aW9ucy5zY2FsZSB8fCAxXHJcbiAgICAgICAgdGhpcy5zY2FsZU1vZGUgPSBvcHRpb25zLnNjYWxlTW9kZSA9PT0gdHJ1ZSA/IFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVCA6IG9wdGlvbnMuc2NhbGVNb2RlXHJcbiAgICAgICAgdGhpcy5yZXNvbHV0aW9uID0gb3B0aW9ucy5yZXNvbHV0aW9uIHx8IDFcclxuICAgICAgICB0aGlzLnNob3cgPSBvcHRpb25zLnNob3dcclxuICAgICAgICB0aGlzLmV4dHJ1ZGUgPSBvcHRpb25zLmV4dHJ1ZGVcclxuICAgICAgICBpZiAodGhpcy5leHRydWRlICYmIHRoaXMuYnVmZmVyIDwgMilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyID0gMlxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhY2tlciA9IG9wdGlvbnMudXNlU2ltcGxlUGFja2VyID8gU2ltcGxlUGFja2VyIDogR3Jvd2luZ1BhY2tlclxyXG4gICAgICAgIHRoaXMuY2xlYXIoKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVtb3ZlcyBhbGwgdGV4dHVyZXMgZnJvbSByZW5kZXJzaGVldHNcclxuICAgICAqL1xyXG4gICAgY2xlYXIoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXVxyXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmVzID0gW11cclxuICAgICAgICB0aGlzLnRleHR1cmVzID0ge31cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBjYW52YXMgcmVuZGVyaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGRyYXcgZnVuY3Rpb24oY29udGV4dCkgLSB1c2UgdGhlIGNvbnRleHQgdG8gZHJhdyB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgbWVhc3VyZSBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbWVhc3VyZSBmdW5jdGlvbihjb250ZXh0KSAtIG5lZWRzIHRvIHJldHVybiB7d2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0gZm9yIHRoZSByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBvYmplY3QgdG8gcGFzcyB0aGUgZHJhdygpIGFuZCBtZWFzdXJlKCkgZnVuY3Rpb25zXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlbmRlcnNoZWV0IG9iamVjdCBmb3IgdGV4dHVyZVxyXG4gICAgICovXHJcbiAgICBhZGQobmFtZSwgZHJhdywgbWVhc3VyZSwgcGFyYW0pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZTogbmFtZSwgZHJhdzogZHJhdywgbWVhc3VyZTogbWVhc3VyZSwgcGFyYW06IHBhcmFtLCB0eXBlOiBDQU5WQVMsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSB9XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhbiBpbWFnZSByZW5kZXJpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHJlbmRlcmluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNyYyBmb3IgaW1hZ2VcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXHJcbiAgICAgKi9cclxuICAgIGFkZEltYWdlKG5hbWUsIHNyYylcclxuICAgIHtcclxuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lLCBmaWxlOiBzcmMsIHR5cGU6IElNQUdFLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKFBJWEkuVGV4dHVyZS5FTVBUWSkgIH1cclxuICAgICAgICBvYmplY3QuaW1hZ2UgPSBuZXcgSW1hZ2UoKVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5vbmxvYWQgPSAoKSA9PiBvYmplY3QubG9hZGVkID0gdHJ1ZVxyXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBzcmNcclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGEgZGF0YSBzb3VyY2UgKGUuZy4sIGEgUE5HIGZpbGUgaW4gZGF0YSBmb3JtYXQpXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBvZiByZW5kZXJpbmcgKG5vdCBmaWxlbmFtZSlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbaGVhZGVyPWRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxdIGZvciBkYXRhXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlbmRlcnNoZWV0IG9iamVjdCBmb3IgdGV4dHVyZVxyXG4gICAgICovXHJcbiAgICBhZGREYXRhKG5hbWUsIGRhdGEsIGhlYWRlcilcclxuICAgIHtcclxuICAgICAgICBoZWFkZXIgPSB0eXBlb2YgaGVhZGVyICE9PSAndW5kZWZpbmVkJyA/IGhlYWRlciA6ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJ1xyXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMudGV4dHVyZXNbbmFtZV0gPSB7IG5hbWUsIHR5cGU6IERBVEEsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSB9XHJcbiAgICAgICAgb2JqZWN0LmltYWdlID0gbmV3IEltYWdlKClcclxuICAgICAgICBvYmplY3QuaW1hZ2Uuc3JjID0gaGVhZGVyICsgZGF0YVxyXG4gICAgICAgIGlmIChvYmplY3QuaW1hZ2UuY29tcGxldGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3QubG9hZGVkID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3QuaW1hZ2Uub25sb2FkID0gKCkgPT4gb2JqZWN0LmxvYWRlZCA9IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYXR0YWNoZXMgUmVuZGVyU2hlZXQgdG8gRE9NIGZvciB0ZXN0aW5nXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gc3R5bGVzIC0gQ1NTIHN0eWxlcyB0byB1c2UgZm9yIHJlbmRlcnNoZWV0XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBzaG93Q2FudmFzZXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5kaXZDYW52YXNlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZGl2Q2FudmFzZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmRpdkNhbnZhc2VzLmhhc0NoaWxkTm9kZXMoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcy5yZW1vdmVDaGlsZCh0aGlzLmRpdkNhbnZhc2VzLmxhc3RDaGlsZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwZXJjZW50ID0gMSAvIHRoaXMuY2FudmFzZXMubGVuZ3RoXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tpXVxyXG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGNhbnZhcy5zdHlsZVxyXG4gICAgICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCdcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9ICcwcHgnXHJcbiAgICAgICAgICAgIHN0eWxlLnRvcCA9IGkgKiBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnXHJcbiAgICAgICAgICAgIHN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHN0eWxlLmhlaWdodCA9IE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJSdcclxuICAgICAgICAgICAgc3R5bGUuekluZGV4ID0gMTAwMFxyXG4gICAgICAgICAgICBpZiAodGhpcy5zY2FsZU1vZGUgPT09IFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc3R5bGUuaW1hZ2VSZW5kZXJpbmcgPSAncGl4ZWxhdGVkJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnJhbmRvbUNvbG9yKClcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnNob3cgPT09ICdvYmplY3QnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5zaG93KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSB0aGlzLnNob3dba2V5XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMuYXBwZW5kQ2hpbGQoY2FudmFzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHRlc3RzIHdoZXRoZXIgYSB0ZXh0dXJlIGV4aXN0c1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgZXhpc3RzKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dHVyZXNbbmFtZV0gPyB0cnVlIDogZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4geyhQSVhJLlRleHR1cmV8bnVsbCl9XHJcbiAgICAgKi9cclxuICAgIGdldFRleHR1cmUobmFtZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tuYW1lXVxyXG4gICAgICAgIGlmICh0ZXh0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHR1cmUudGV4dHVyZVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiB0ZXh0dXJlICcgKyBuYW1lICsgJyBub3QgZm91bmQgaW4gc3ByaXRlc2hlZXQuJylcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGEgUElYSS5TcHJpdGUgKHdpdGggYW5jaG9yIHNldCB0byAwLjUsIGJlY2F1c2UgdGhhdCdzIHdoZXJlIGl0IHNob3VsZCBiZSlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcclxuICAgICAqIEByZXR1cm4ge1BJWEkuU3ByaXRlfVxyXG4gICAgICovXHJcbiAgICBnZXRTcHJpdGUobmFtZSlcclxuICAgIHtcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5nZXRUZXh0dXJlKG5hbWUpXHJcbiAgICAgICAgaWYgKHRleHR1cmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZSlcclxuICAgICAgICAgICAgc3ByaXRlLmFuY2hvci5zZXQoMC41KVxyXG4gICAgICAgICAgICByZXR1cm4gc3ByaXRlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWxpYXMgZm9yIGdldFNwcml0ZSgpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXHJcbiAgICAgKiBAcmV0dXJuIHtQSVhJLlNwcml0ZX1cclxuICAgICAqL1xyXG4gICAgZ2V0KG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3ByaXRlKG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IGFtb3VudCBvZiB0ZXh0dXJlcyBpbiB0aGlzIHJlbmRlcnNoZWV0XHJcbiAgICAgKi9cclxuICAgIGVudHJpZXMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnRleHR1cmVzKS5sZW5ndGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHByaW50cyBzdGF0aXN0aWNzIG9mIGNhbnZhc2VzIHRvIGNvbnNvbGUubG9nXHJcbiAgICAgKi9cclxuICAgIGRlYnVnKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2ldXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd5eS1yZW5kZXJzaGVldDogU2hlZXQgIycgKyAoaSArIDEpICsgJyB8IHNpemU6ICcgKyBjYW52YXMud2lkdGggKyAneCcgKyBjYW52YXMuaGVpZ2h0ICsgJyB8IHJlc29sdXRpb246ICcgKyB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZmluZCB0aGUgaW5kZXggb2YgdGhlIHRleHR1cmUgYmFzZWQgb24gdGhlIHRleHR1cmUgb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZmluZCB0aGlzIGluZGV4ZWQgdGV4dHVyZVxyXG4gICAgICogQHJldHVybnMge1BJWEkuVGV4dHVyZX1cclxuICAgICAqL1xyXG4gICAgZ2V0SW5kZXgoZmluZClcclxuICAgIHtcclxuICAgICAgICBsZXQgaSA9IDBcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChpID09PSBmaW5kKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlc1trZXldLnRleHR1cmVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpKytcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGxcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoZWNrcyBpZiBhbGwgdGV4dHVyZXMgYXJlIGxvYWRlZFxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgY2hlY2tMb2FkZWQoKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBpZiAoKGN1cnJlbnQudHlwZSA9PT0gSU1BR0UgfHwgY3VycmVudC50eXBlID09PSBEQVRBKSAmJiAhY3VycmVudC5sb2FkZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGUgKG9yIHJlZnJlc2gpIHRoZSByZW5kZXJzaGVldCAoc3VwcG9ydHMgYXN5bmMgaW5zdGVhZCBvZiBjYWxsYmFjaylcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcFRleHR1cmVzIC0gZG9uJ3QgY3JlYXRlIFBJWEkuQmFzZVRleHR1cmVzIGFuZCBQSVhJLlRleHR1cmVzICh1c2VmdWwgZm9yIGdlbmVyYXRpbmcgZXh0ZXJuYWwgc3ByaXRlc2hlZXRzKVxyXG4gICAgICovXHJcbiAgICBhc3luY1JlbmRlcihza2lwVGV4dHVyZXMpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHJlc29sdmUsIHNraXBUZXh0dXJlcylcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlIChvciByZWZyZXNoKSB0aGUgcmVuZGVyc2hlZXRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcFRleHR1cmVzIC0gZG9uJ3QgY3JlYXRlIFBJWEkuQmFzZVRleHR1cmVzIGFuZCBQSVhJLlRleHR1cmVzICh1c2VmdWwgZm9yIGdlbmVyYXRpbmcgZXh0ZXJuYWwgc3ByaXRlc2hlZXRzKVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IGNhbGxzIFJlbmRlclNoZWV0Lm9uY2UoJ3JlbmRlcicsIGNhbGxiYWNrKVxyXG4gICAgICovXHJcbiAgICByZW5kZXIoY2FsbGJhY2ssIHNraXBUZXh0dXJlcylcclxuICAgIHtcclxuICAgICAgICBpZiAoY2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9uY2UoJ3JlbmRlcicsIGNhbGxiYWNrKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHRoaXMudGV4dHVyZXMpLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncmVuZGVyJylcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5jaGVja0xvYWRlZCgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCBXQUlUKVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5zb3J0ZWQgPSBbXVxyXG5cclxuICAgICAgICB0aGlzLm1lYXN1cmUoKVxyXG4gICAgICAgIHRoaXMuc29ydCgpXHJcbiAgICAgICAgdGhpcy5wYWNrKClcclxuICAgICAgICB0aGlzLmRyYXcoKVxyXG4gICAgICAgIGlmICghc2tpcFRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVCYXNlVGV4dHVyZXMoKVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnRleHR1cmVzW2tleV1cclxuICAgICAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS5iYXNlVGV4dHVyZSA9IHRoaXMuYmFzZVRleHR1cmVzW2N1cnJlbnQuY2FudmFzXVxyXG4gICAgICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmZyYW1lID0gbmV3IFBJWEkuUmVjdGFuZ2xlKGN1cnJlbnQueCwgY3VycmVudC55LCBjdXJyZW50LndpZHRoLCBjdXJyZW50LmhlaWdodClcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQudGV4dHVyZS51cGRhdGUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnNob3cpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNob3dDYW52YXNlcygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVuZGVyJylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1lYXN1cmVzIGNhbnZhcyByZW5kZXJpbmdzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBtZWFzdXJlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICBjLndpZHRoID0gdGhpcy5tYXhTaXplXHJcbiAgICAgICAgYy5oZWlnaHQgPSB0aGlzLm1heFNpemVcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gYy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IE1hdGguY2VpbCh0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uKVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNba2V5XVxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRleHR1cmUudHlwZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBDQU5WQVM6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHRleHR1cmUubWVhc3VyZShjb250ZXh0LCB0ZXh0dXJlLnBhcmFtLCBjKVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUud2lkdGggPSBNYXRoLmNlaWwoc2l6ZS53aWR0aCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwoc2l6ZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBJTUFHRTogY2FzZSBEQVRBOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUud2lkdGggPSBNYXRoLmNlaWwodGV4dHVyZS5pbWFnZS53aWR0aCAqIG11bHRpcGxpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwodGV4dHVyZS5pbWFnZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zb3J0ZWQucHVzaCh0ZXh0dXJlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNvcnQgdGV4dHVyZXMgYnkgbGFyZ2VzdCBkaW1lbnNpb25cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHNvcnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc29ydGVkLnNvcnQoXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGEsIGIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBhU2l6ZSA9IE1hdGgubWF4KGEuaGVpZ2h0LCBhLndpZHRoKVxyXG4gICAgICAgICAgICAgICAgbGV0IGJTaXplID0gTWF0aC5tYXgoYi5oZWlnaHQsIGIud2lkdGgpXHJcbiAgICAgICAgICAgICAgICBpZiAoYVNpemUgPT09IGJTaXplKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGFTaXplID0gTWF0aC5taW4oYS5oZWlnaHQsIGEud2lkdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgYlNpemUgPSBNYXRoLm1heChiLmhlaWdodCwgYi53aWR0aClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiU2l6ZSAtIGFTaXplXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGUgc3F1YXJlIGNhbnZhc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzaXplPXRoaXMubWF4U2l6ZV1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUNhbnZhcyhzaXplKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCA9IHNpemUgfHwgdGhpcy5tYXhTaXplXHJcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGNhbnZhcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYSByYW5kb20gcmdiIGNvbG9yXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICByYW5kb21Db2xvcigpXHJcbiAgICB7XHJcbiAgICAgICAgZnVuY3Rpb24gcigpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjU1KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ3JnYmEoJyArIHIoKSArICcsJyArIHIoKSArICcsJyArIHIoKSArICcsIDAuMiknXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBkcmF3IHJlbmRlcmluZ3MgdG8gcmVuZGVydGV4dHVyZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZHJhdygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQsIGNvbnRleHRcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gTWF0aC5jZWlsKHRoaXMuc2NhbGUgKiB0aGlzLnJlc29sdXRpb24pXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1trZXldXHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLmNhbnZhcyAhPT0gY3VycmVudClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHRleHR1cmUuY2FudmFzXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gdGhpcy5jYW52YXNlc1tjdXJyZW50XS5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LnNhdmUoKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5zY2FsZShtdWx0aXBsaWVyLCBtdWx0aXBsaWVyKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpXHJcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKE1hdGguY2VpbCh0ZXh0dXJlLnggLyBtdWx0aXBsaWVyKSwgTWF0aC5jZWlsKHRleHR1cmUueSAvIG11bHRpcGxpZXIpKVxyXG4gICAgICAgICAgICBpZiAodGhpcy50ZXN0Qm94ZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5yYW5kb21Db2xvcigpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIE1hdGguY2VpbCh0ZXh0dXJlLndpZHRoIC8gbXVsdGlwbGllciksIE1hdGguY2VpbCh0ZXh0dXJlLmhlaWdodCAvIG11bHRpcGxpZXIpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaCAodGV4dHVyZS50eXBlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIENBTlZBUzpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgdGhpcy5jYW52YXNlc1tjdXJyZW50XSlcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgSU1BR0U6IGNhc2UgREFUQTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh0ZXh0dXJlLmltYWdlLCAwLCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuZXh0cnVkZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZXh0cnVkZSBwaXhlbHMgZm9yIGVudHJ5XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGV4dHVyZVxyXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGV4dHJ1ZGVFbnRyeSh0ZXh0dXJlLCBjb250ZXh0LCBjdXJyZW50KVxyXG4gICAge1xyXG4gICAgICAgIGZ1bmN0aW9uIGdldCh4LCB5KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSAoeCArIHkgKiB0ZXh0dXJlLndpZHRoKSAqIDRcclxuICAgICAgICAgICAgY29uc3QgZCA9IGRhdGEuZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gJ3JnYmEoJyArIGRbZW50cnldICsgJywnICsgZFtlbnRyeSArIDFdICsgJywnICsgZFtlbnRyeSArIDJdICsgJywnICsgKGRbZW50cnkgKyAzXSAvIDB4ZmYpICsgJyknXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzW2N1cnJlbnRdXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKHRleHR1cmUueCwgdGV4dHVyZS55LCB0ZXh0dXJlLndpZHRoLCB0ZXh0dXJlLmhlaWdodClcclxuICAgICAgICBpZiAodGV4dHVyZS54ICE9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0ZXh0dXJlLmhlaWdodDsgeSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCB5KVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgtMSwgeSwgMSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGV4dHVyZS55ICE9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgtMSwgLTEsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueCArIHRleHR1cmUud2lkdGggIT09IGNhbnZhcy53aWR0aCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHRleHR1cmUud2lkdGggLSAxLCB5KVxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh0ZXh0dXJlLndpZHRoLCB5LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLnkgKyB0ZXh0dXJlLmhlaWdodCAhPT0gY2FudmFzLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHRleHR1cmUud2lkdGggLSAxLCB0ZXh0dXJlLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHRleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ZXh0dXJlLnkgIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRleHR1cmUud2lkdGg7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoeCwgMClcclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoeCwgLTEsIDEsIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHR1cmUueSArIHRleHR1cmUuaGVpZ2h0ICE9PSBjYW52YXMuaGVpZ2h0IC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGV4dHVyZS53aWR0aDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh4LCB0ZXh0dXJlLmhlaWdodCAtIDEpXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgY3JlYXRlQmFzZVRleHR1cmVzKClcclxuICAgIHtcclxuICAgICAgICB3aGlsZSAodGhpcy5iYXNlVGV4dHVyZXMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucG9wKCkuZGVzdHJveSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZyb20gPSBQSVhJLkJhc2VUZXh0dXJlLmZyb21DYW52YXMgfHwgUElYSS5CYXNlVGV4dHVyZS5mcm9tXHJcbiAgICAgICAgICAgIGNvbnN0IGJhc2UgPSBmcm9tKHRoaXMuY2FudmFzZXNbaV0pXHJcbiAgICAgICAgICAgIGJhc2Uuc2NhbGVNb2RlID0gdGhpcy5zY2FsZU1vZGVcclxuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucHVzaChiYXNlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhY2sgdGV4dHVyZXMgYWZ0ZXIgbWVhc3VyZW1lbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHBhY2soKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHBhY2tlcnMgPSBbbmV3IHRoaXMucGFja2VyKHRoaXMubWF4U2l6ZSwgdGhpcy5zb3J0ZWRbMF0sIHRoaXMuYnVmZmVyKV1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc29ydGVkLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYmxvY2sgPSB0aGlzLnNvcnRlZFtpXVxyXG4gICAgICAgICAgICBsZXQgcGFja2VkID0gZmFsc2VcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYWNrZXJzLmxlbmd0aDsgaisrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFja2Vyc1tqXS5hZGQoYmxvY2ssIGopKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmNhbnZhcyA9IGpcclxuICAgICAgICAgICAgICAgICAgICBwYWNrZWQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXBhY2tlZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFja2Vycy5wdXNoKG5ldyB0aGlzLnBhY2tlcih0aGlzLm1heFNpemUsIGJsb2NrLCB0aGlzLmJ1ZmZlcikpXHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhY2tlcnNbal0uYWRkKGJsb2NrLCBqKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiAnICsgYmxvY2submFtZSArICcgaXMgdG9vIGJpZyBmb3IgdGhlIHNwcml0ZXNoZWV0LicpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0galxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhY2tlcnMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzaXplID0gcGFja2Vyc1tpXS5maW5pc2godGhpcy5tYXhTaXplKVxyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNhbnZhcyhzaXplKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoYW5nZXMgdGhlIGRyYXdpbmcgZnVuY3Rpb24gb2YgYSB0ZXh0dXJlXHJcbiAgICAgKiBOT1RFOiB0aGlzIG9ubHkgd29ya3MgaWYgdGhlIHRleHR1cmUgcmVtYWlucyB0aGUgc2FtZSBzaXplOyB1c2UgU2hlZXQucmVuZGVyKCkgdG8gcmVzaXplIHRoZSB0ZXh0dXJlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZHJhd1xyXG4gICAgICovXHJcbiAgICBjaGFuZ2VEcmF3KG5hbWUsIGRyYXcpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNbbmFtZV1cclxuICAgICAgICBpZiAodGV4dHVyZS50eXBlICE9PSBDQU5WQVMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXNoZWV0LmNoYW5nZVRleHR1cmVEcmF3IG9ubHkgd29ya3Mgd2l0aCB0eXBlOiBDQU5WQVMuJylcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHR1cmUuZHJhdyA9IGRyYXdcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jYW52YXNlc1t0ZXh0dXJlLmNhbnZhc10uZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSB0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uXHJcbiAgICAgICAgY29udGV4dC5zYXZlKClcclxuICAgICAgICBjb250ZXh0LnNjYWxlKG11bHRpcGxpZXIsIG11bHRpcGxpZXIpXHJcbiAgICAgICAgY29udGV4dC50cmFuc2xhdGUodGV4dHVyZS54IC8gbXVsdGlwbGllciwgdGV4dHVyZS55IC8gbXVsdGlwbGllcilcclxuICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSlcclxuICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxyXG4gICAgICAgIHRleHR1cmUudGV4dHVyZS51cGRhdGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlclNoZWV0XHJcblxyXG4vKipcclxuICogZmlyZXMgd2hlbiByZW5kZXIgY29tcGxldGVzXHJcbiAqIEBldmVudCBSZW5kZXJTaGVldCNyZW5kZXJcclxuICovIl19