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
                }, this.wait);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJzaGVldC5qcyJdLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJvcHRpb25zIiwid2FpdCIsInRlc3RCb3hlcyIsIm1heFNpemUiLCJidWZmZXIiLCJzY2FsZSIsInNjYWxlTW9kZSIsIlNDQUxFX01PREVTIiwiTkVBUkVTVCIsInJlc29sdXRpb24iLCJzaG93IiwiZXh0cnVkZSIsInBhY2tlciIsInVzZVNpbXBsZVBhY2tlciIsImNsZWFyIiwiY2FudmFzZXMiLCJiYXNlVGV4dHVyZXMiLCJ0ZXh0dXJlcyIsIm5hbWUiLCJkcmF3IiwibWVhc3VyZSIsInBhcmFtIiwib2JqZWN0IiwidHlwZSIsInRleHR1cmUiLCJUZXh0dXJlIiwiRU1QVFkiLCJzcmMiLCJmaWxlIiwiaW1hZ2UiLCJJbWFnZSIsIm9ubG9hZCIsImxvYWRlZCIsImRhdGEiLCJoZWFkZXIiLCJjb21wbGV0ZSIsImRpdkNhbnZhc2VzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiYm9keSIsImFwcGVuZENoaWxkIiwiaGFzQ2hpbGROb2RlcyIsInJlbW92ZUNoaWxkIiwibGFzdENoaWxkIiwicGVyY2VudCIsImxlbmd0aCIsImkiLCJjYW52YXMiLCJzdHlsZSIsInBvc2l0aW9uIiwibGVmdCIsInRvcCIsIk1hdGgiLCJyb3VuZCIsIndpZHRoIiwiaGVpZ2h0IiwiekluZGV4IiwiaW1hZ2VSZW5kZXJpbmciLCJiYWNrZ3JvdW5kIiwicmFuZG9tQ29sb3IiLCJrZXkiLCJjb25zb2xlIiwid2FybiIsImdldFRleHR1cmUiLCJzcHJpdGUiLCJTcHJpdGUiLCJhbmNob3IiLCJzZXQiLCJnZXRTcHJpdGUiLCJPYmplY3QiLCJrZXlzIiwibG9nIiwiZmluZCIsImN1cnJlbnQiLCJza2lwVGV4dHVyZXMiLCJQcm9taXNlIiwicmVuZGVyIiwicmVzb2x2ZSIsImNhbGxiYWNrIiwib25jZSIsImVtaXQiLCJjaGVja0xvYWRlZCIsInNldFRpbWVvdXQiLCJzb3J0ZWQiLCJzb3J0IiwicGFjayIsImNyZWF0ZUJhc2VUZXh0dXJlcyIsImJhc2VUZXh0dXJlIiwiZnJhbWUiLCJSZWN0YW5nbGUiLCJ4IiwieSIsInVwZGF0ZSIsInNob3dDYW52YXNlcyIsImMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm11bHRpcGxpZXIiLCJjZWlsIiwic2l6ZSIsInB1c2giLCJhIiwiYiIsImFTaXplIiwibWF4IiwiYlNpemUiLCJtaW4iLCJyIiwiZmxvb3IiLCJyYW5kb20iLCJyZXN0b3JlIiwic2F2ZSIsInRyYW5zbGF0ZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiZHJhd0ltYWdlIiwiZXh0cnVkZUVudHJ5IiwiZ2V0IiwiZW50cnkiLCJkIiwiZ2V0SW1hZ2VEYXRhIiwicG9wIiwiZGVzdHJveSIsImZyb20iLCJCYXNlVGV4dHVyZSIsImZyb21DYW52YXMiLCJiYXNlIiwicGFja2VycyIsImJsb2NrIiwicGFja2VkIiwiaiIsImFkZCIsImZpbmlzaCIsImNyZWF0ZUNhbnZhcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsT0FBT0MsUUFBUSxTQUFSLENBQWI7QUFDQSxJQUFNQyxTQUFTRCxRQUFRLGVBQVIsQ0FBZjs7QUFFQSxJQUFNRSxnQkFBZ0JGLFFBQVEsaUJBQVIsQ0FBdEI7QUFDQSxJQUFNRyxlQUFlSCxRQUFRLGdCQUFSLENBQXJCOztBQUVBO0FBQ0EsSUFBTUksU0FBUyxDQUFmLEMsQ0FBaUI7QUFDakIsSUFBTUMsUUFBUSxDQUFkLEMsQ0FBZ0I7QUFDaEIsSUFBTUMsT0FBTyxDQUFiLEMsQ0FBZTs7QUFFZjtBQUNBLElBQU1DLE9BQU8sR0FBYjs7SUFFTUMsVzs7O0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJBQVlDLE9B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QUFSLEdBQVlPLFVBQTlCLEVBQTBDekUsUUFBUW1FLENBQVIsR0FBWU0sVUFBdEQ7QUFDQXpFLG9CQUFRTCxJQUFSLENBQWE0RSxPQUFiLEVBQXNCdkUsUUFBUUgsS0FBOUI7QUFDQTBFLG9CQUFRZSxPQUFSO0FBQ0F0RixvQkFBUUEsT0FBUixDQUFnQm9FLE1BQWhCO0FBQ0g7Ozs7RUEza0JxQnBHLE07O0FBOGtCMUI4SSxPQUFPQyxPQUFQLEdBQWlCeEksV0FBakI7O0FBRUEiLCJmaWxlIjoicmVuZGVyc2hlZXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB5eS1yZW5kZXJzaGVldFxuLy8gYnkgRGF2aWQgRmlnYXRuZXJcbi8vIChjKSBZT1BFWSBZT1BFWSBMTEMgMjAxOVxuLy8gTUlUIExpY2Vuc2Vcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXZpZGZpZy9yZW5kZXJzaGVldFxuXG5jb25zdCBQSVhJID0gcmVxdWlyZSgncGl4aS5qcycpXG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcblxuY29uc3QgR3Jvd2luZ1BhY2tlciA9IHJlcXVpcmUoJy4vZ3Jvd2luZ3BhY2tlcicpXG5jb25zdCBTaW1wbGVQYWNrZXIgPSByZXF1aXJlKCcuL3NpbXBsZXBhY2tlcicpXG5cbi8vIHR5cGVzXG5jb25zdCBDQU5WQVMgPSAwIC8vIGRlZmF1bHRcbmNvbnN0IElNQUdFID0gMSAvLyBpbWFnZSB1cmxcbmNvbnN0IERBVEEgPSAyIC8vIGRhdGEgc3JjIChlLmcuLCByZXN1bHQgb2YgLnRvRGF0YVVSTCgpKVxuXG4vLyBkZWZhdWx0IG1zIHRvIHdhaXQgdG8gY2hlY2sgaWYgYW4gaW1hZ2UgaGFzIGZpbmlzaGVkIGxvYWRpbmdcbmNvbnN0IFdBSVQgPSAyNTBcblxuY2xhc3MgUmVuZGVyU2hlZXQgZXh0ZW5kcyBFdmVudHNcbntcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhTaXplPTIwNDhdXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmJ1ZmZlcj01XSBhcm91bmQgZWFjaCB0ZXh0dXJlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNjYWxlPTFdIG9mIHRleHR1cmVcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMucmVzb2x1dGlvbj0xXSBvZiByZW5kZXJzaGVldFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5leHRydWRlXSB0aGUgZWRnZXMtLXVzZWZ1bCBmb3IgcmVtb3ZpbmcgZ2FwcyBpbiBzcHJpdGVzIHdoZW4gdGlsaW5nXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndhaXQ9MjUwXSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIG9ubG9hZCBvZiBhZGRJbWFnZSBpbWFnZXMgYmVmb3JlIHJlbmRlcmluZ1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudGVzdEJveGVzXSBkcmF3IGEgZGlmZmVyZW50IGNvbG9yZWQgYm94ZXMgYmVoaW5kIGVhY2ggcmVuZGVyaW5nICh1c2VmdWwgZm9yIGRlYnVnZ2luZylcbiAgICAgKiBAcGFyYW0ge251bWJlcnxib29sZWFufSBbb3B0aW9ucy5zY2FsZU1vZGVdIFBJWEkuc2V0dGluZ3MuU0NBTEVfTU9ERSB0byBzZXQgZm9yIHJlbmRlcnNoZWV0ICh1c2UgPXRydWUgZm9yIFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVCBmb3IgcGl4ZWwgYXJ0KVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlU2ltcGxlUGFja2VyXSB1c2UgYSBzdHVwaWRseSBzaW1wbGUgcGFja2VyIGluc3RlYWQgb2YgZ3Jvd2luZyBwYWNrZXIgYWxnb3JpdGhtXG4gICAgICogQHBhcmFtIHtib29sZWFufG9iamVjdH0gW29wdGlvbnMuc2hvd10gc2V0IHRvIHRydWUgb3IgYSBDU1Mgb2JqZWN0IChlLmcuLCB7ekluZGV4OiAxMCwgYmFja2dyb3VuZDogJ2JsdWUnfSkgdG8gYXR0YWNoIHRoZSBmaW5hbCBjYW52YXMgdG8gZG9jdW1lbnQuYm9keS0tdXNlZnVsIGZvciBkZWJ1Z2dpbmdcbiAgICAgKiBAZmlyZSByZW5kZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKVxuICAgIHtcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgICAgICB0aGlzLndhaXQgPSBvcHRpb25zLndhaXQgfHwgV0FJVFxuICAgICAgICB0aGlzLnRlc3RCb3hlcyA9IG9wdGlvbnMudGVzdEJveGVzIHx8IGZhbHNlXG4gICAgICAgIHRoaXMubWF4U2l6ZSA9IG9wdGlvbnMubWF4U2l6ZSB8fCAyMDQ4XG4gICAgICAgIHRoaXMuYnVmZmVyID0gb3B0aW9ucy5idWZmZXIgfHwgNVxuICAgICAgICB0aGlzLnNjYWxlID0gb3B0aW9ucy5zY2FsZSB8fCAxXG4gICAgICAgIHRoaXMuc2NhbGVNb2RlID0gb3B0aW9ucy5zY2FsZU1vZGUgPT09IHRydWUgPyBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1QgOiBvcHRpb25zLnNjYWxlTW9kZVxuICAgICAgICB0aGlzLnJlc29sdXRpb24gPSBvcHRpb25zLnJlc29sdXRpb24gfHwgMVxuICAgICAgICB0aGlzLnNob3cgPSBvcHRpb25zLnNob3dcbiAgICAgICAgdGhpcy5leHRydWRlID0gb3B0aW9ucy5leHRydWRlXG4gICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUgJiYgdGhpcy5idWZmZXIgPCAyKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmJ1ZmZlciA9IDJcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhY2tlciA9IG9wdGlvbnMudXNlU2ltcGxlUGFja2VyID8gU2ltcGxlUGFja2VyIDogR3Jvd2luZ1BhY2tlclxuICAgICAgICB0aGlzLmNsZWFyKClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZW1vdmVzIGFsbCB0ZXh0dXJlcyBmcm9tIHJlbmRlcnNoZWV0c1xuICAgICAqL1xuICAgIGNsZWFyKClcbiAgICB7XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXVxuICAgICAgICB0aGlzLmJhc2VUZXh0dXJlcyA9IFtdXG4gICAgICAgIHRoaXMudGV4dHVyZXMgPSB7fVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFkZHMgYSBjYW52YXMgcmVuZGVyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgcmVuZGVyaW5nXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZHJhdyBmdW5jdGlvbihjb250ZXh0KSAtIHVzZSB0aGUgY29udGV4dCB0byBkcmF3IHdpdGhpbiB0aGUgYm91bmRzIG9mIHRoZSBtZWFzdXJlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbWVhc3VyZSBmdW5jdGlvbihjb250ZXh0KSAtIG5lZWRzIHRvIHJldHVybiB7d2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0gZm9yIHRoZSByZW5kZXJpbmdcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gb2JqZWN0IHRvIHBhc3MgdGhlIGRyYXcoKSBhbmQgbWVhc3VyZSgpIGZ1bmN0aW9uc1xuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXG4gICAgICovXG4gICAgYWRkKG5hbWUsIGRyYXcsIG1lYXN1cmUsIHBhcmFtKVxuICAgIHtcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZTogbmFtZSwgZHJhdzogZHJhdywgbWVhc3VyZTogbWVhc3VyZSwgcGFyYW06IHBhcmFtLCB0eXBlOiBDQU5WQVMsIHRleHR1cmU6IG5ldyBQSVhJLlRleHR1cmUoUElYSS5UZXh0dXJlLkVNUFRZKSB9XG4gICAgICAgIHJldHVybiBvYmplY3RcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBhZGRzIGFuIGltYWdlIHJlbmRlcmluZ1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHJlbmRlcmluZ1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzcmMgZm9yIGltYWdlXG4gICAgICogQHJldHVybiB7b2JqZWN0fSByZW5kZXJzaGVldCBvYmplY3QgZm9yIHRleHR1cmVcbiAgICAgKi9cbiAgICBhZGRJbWFnZShuYW1lLCBzcmMpXG4gICAge1xuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lLCBmaWxlOiBzcmMsIHR5cGU6IElNQUdFLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKFBJWEkuVGV4dHVyZS5FTVBUWSkgIH1cbiAgICAgICAgb2JqZWN0LmltYWdlID0gbmV3IEltYWdlKClcbiAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBzcmNcbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFkZHMgYSBkYXRhIHNvdXJjZSAoZS5nLiwgYSBQTkcgZmlsZSBpbiBkYXRhIGZvcm1hdClcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBvZiByZW5kZXJpbmcgKG5vdCBmaWxlbmFtZSlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2hlYWRlcj1kYXRhOmltYWdlL3BuZztiYXNlNjQsXSBmb3IgZGF0YVxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXG4gICAgICovXG4gICAgYWRkRGF0YShuYW1lLCBkYXRhLCBoZWFkZXIpXG4gICAge1xuICAgICAgICBoZWFkZXIgPSB0eXBlb2YgaGVhZGVyICE9PSAndW5kZWZpbmVkJyA/IGhlYWRlciA6ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJ1xuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lLCB0eXBlOiBEQVRBLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKFBJWEkuVGV4dHVyZS5FTVBUWSkgfVxuICAgICAgICBvYmplY3QuaW1hZ2UgPSBuZXcgSW1hZ2UoKVxuICAgICAgICBvYmplY3QuaW1hZ2Uuc3JjID0gaGVhZGVyICsgZGF0YVxuICAgICAgICBpZiAob2JqZWN0LmltYWdlLmNvbXBsZXRlKVxuICAgICAgICB7XG4gICAgICAgICAgICBvYmplY3QubG9hZGVkID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGF0dGFjaGVzIFJlbmRlclNoZWV0IHRvIERPTSBmb3IgdGVzdGluZ1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdHlsZXMgLSBDU1Mgc3R5bGVzIHRvIHVzZSBmb3IgcmVuZGVyc2hlZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHNob3dDYW52YXNlcygpXG4gICAge1xuICAgICAgICBpZiAoIXRoaXMuZGl2Q2FudmFzZXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRpdkNhbnZhc2VzKVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgd2hpbGUgKHRoaXMuZGl2Q2FudmFzZXMuaGFzQ2hpbGROb2RlcygpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMucmVtb3ZlQ2hpbGQodGhpcy5kaXZDYW52YXNlcy5sYXN0Q2hpbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGVyY2VudCA9IDEgLyB0aGlzLmNhbnZhc2VzLmxlbmd0aFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbaV1cbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gY2FudmFzLnN0eWxlXG4gICAgICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCdcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAnMHB4J1xuICAgICAgICAgICAgc3R5bGUudG9wID0gaSAqIE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJSdcbiAgICAgICAgICAgIHN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICBzdHlsZS5oZWlnaHQgPSBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnXG4gICAgICAgICAgICBzdHlsZS56SW5kZXggPSAxMDAwXG4gICAgICAgICAgICBpZiAodGhpcy5zY2FsZU1vZGUgPT09IFBJWEkuU0NBTEVfTU9ERVMuTkVBUkVTVClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdHlsZS5pbWFnZVJlbmRlcmluZyA9ICdwaXhlbGF0ZWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5yYW5kb21Db2xvcigpXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc2hvdyA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuc2hvdylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSB0aGlzLnNob3dba2V5XVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGl2Q2FudmFzZXMuYXBwZW5kQ2hpbGQoY2FudmFzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdGVzdHMgd2hldGhlciBhIHRleHR1cmUgZXhpc3RzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICovXG4gICAgZXhpc3RzKG5hbWUpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlc1tuYW1lXSA/IHRydWUgOiBmYWxzZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcbiAgICAgKiBAcmV0dXJuIHsoUElYSS5UZXh0dXJlfG51bGwpfVxuICAgICAqL1xuICAgIGdldFRleHR1cmUobmFtZSlcbiAgICB7XG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW25hbWVdXG4gICAgICAgIGlmICh0ZXh0dXJlKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dHVyZS50ZXh0dXJlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiB0ZXh0dXJlICcgKyBuYW1lICsgJyBub3QgZm91bmQgaW4gc3ByaXRlc2hlZXQuJylcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIGEgUElYSS5TcHJpdGUgKHdpdGggYW5jaG9yIHNldCB0byAwLjUsIGJlY2F1c2UgdGhhdCdzIHdoZXJlIGl0IHNob3VsZCBiZSlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXG4gICAgICogQHJldHVybiB7UElYSS5TcHJpdGV9XG4gICAgICovXG4gICAgZ2V0U3ByaXRlKG5hbWUpXG4gICAge1xuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5nZXRUZXh0dXJlKG5hbWUpXG4gICAgICAgIGlmICh0ZXh0dXJlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBzcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZSlcbiAgICAgICAgICAgIHNwcml0ZS5hbmNob3Iuc2V0KDAuNSlcbiAgICAgICAgICAgIHJldHVybiBzcHJpdGVcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBhbGlhcyBmb3IgZ2V0U3ByaXRlKClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXG4gICAgICogQHJldHVybiB7UElYSS5TcHJpdGV9XG4gICAgICovXG4gICAgZ2V0KG5hbWUpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTcHJpdGUobmFtZSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IGFtb3VudCBvZiB0ZXh0dXJlcyBpbiB0aGlzIHJlbmRlcnNoZWV0XG4gICAgICovXG4gICAgZW50cmllcygpXG4gICAge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy50ZXh0dXJlcykubGVuZ3RoXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcHJpbnRzIHN0YXRpc3RpY3Mgb2YgY2FudmFzZXMgdG8gY29uc29sZS5sb2dcbiAgICAgKi9cbiAgICBkZWJ1ZygpXG4gICAge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXNbaV1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd5eS1yZW5kZXJzaGVldDogU2hlZXQgIycgKyAoaSArIDEpICsgJyB8IHNpemU6ICcgKyBjYW52YXMud2lkdGggKyAneCcgKyBjYW52YXMuaGVpZ2h0ICsgJyB8IHJlc29sdXRpb246ICcgKyB0aGlzLnJlc29sdXRpb24pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBmaW5kIHRoZSBpbmRleCBvZiB0aGUgdGV4dHVyZSBiYXNlZCBvbiB0aGUgdGV4dHVyZSBvYmplY3RcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZmluZCB0aGlzIGluZGV4ZWQgdGV4dHVyZVxuICAgICAqIEByZXR1cm5zIHtQSVhJLlRleHR1cmV9XG4gICAgICovXG4gICAgZ2V0SW5kZXgoZmluZClcbiAgICB7XG4gICAgICAgIGxldCBpID0gMFxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKGkgPT09IGZpbmQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dHVyZXNba2V5XS50ZXh0dXJlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKytcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNoZWNrcyBpZiBhbGwgdGV4dHVyZXMgYXJlIGxvYWRlZFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICovXG4gICAgY2hlY2tMb2FkZWQoKVxuICAgIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnRleHR1cmVzW2tleV1cbiAgICAgICAgICAgIGlmICgoY3VycmVudC50eXBlID09PSBJTUFHRSB8fCBjdXJyZW50LnR5cGUgPT09IERBVEEpICYmICFjdXJyZW50LmxvYWRlZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNyZWF0ZSAob3IgcmVmcmVzaCkgdGhlIHJlbmRlcnNoZWV0IChzdXBwb3J0cyBhc3luYyBpbnN0ZWFkIG9mIGNhbGxiYWNrKVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcFRleHR1cmVzIC0gZG9uJ3QgY3JlYXRlIFBJWEkuQmFzZVRleHR1cmVzIGFuZCBQSVhJLlRleHR1cmVzICh1c2VmdWwgZm9yIGdlbmVyYXRpbmcgZXh0ZXJuYWwgc3ByaXRlc2hlZXRzKVxuICAgICAqL1xuICAgIGFzeW5jUmVuZGVyKHNraXBUZXh0dXJlcylcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHJlc29sdmUsIHNraXBUZXh0dXJlcylcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjcmVhdGUgKG9yIHJlZnJlc2gpIHRoZSByZW5kZXJzaGVldFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcFRleHR1cmVzIC0gZG9uJ3QgY3JlYXRlIFBJWEkuQmFzZVRleHR1cmVzIGFuZCBQSVhJLlRleHR1cmVzICh1c2VmdWwgZm9yIGdlbmVyYXRpbmcgZXh0ZXJuYWwgc3ByaXRlc2hlZXRzKVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBjYWxscyBSZW5kZXJTaGVldC5vbmNlKCdyZW5kZXInLCBjYWxsYmFjaylcbiAgICAgKi9cbiAgICByZW5kZXIoY2FsbGJhY2ssIHNraXBUZXh0dXJlcylcbiAgICB7XG4gICAgICAgIGlmIChjYWxsYmFjaylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5vbmNlKCdyZW5kZXInLCBjYWxsYmFjaylcbiAgICAgICAgfVxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHRoaXMudGV4dHVyZXMpLmxlbmd0aClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrTG9hZGVkKCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5yZW5kZXIoKSwgdGhpcy53YWl0KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXG4gICAgICAgIHRoaXMuc29ydGVkID0gW11cblxuICAgICAgICB0aGlzLm1lYXN1cmUoKVxuICAgICAgICB0aGlzLnNvcnQoKVxuICAgICAgICB0aGlzLnBhY2soKVxuICAgICAgICB0aGlzLmRyYXcoKVxuICAgICAgICBpZiAoIXNraXBUZXh0dXJlcylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVCYXNlVGV4dHVyZXMoKVxuXG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy50ZXh0dXJlc1trZXldXG4gICAgICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmJhc2VUZXh0dXJlID0gdGhpcy5iYXNlVGV4dHVyZXNbY3VycmVudC5jYW52YXNdXG4gICAgICAgICAgICAgICAgY3VycmVudC50ZXh0dXJlLmZyYW1lID0gbmV3IFBJWEkuUmVjdGFuZ2xlKGN1cnJlbnQueCwgY3VycmVudC55LCBjdXJyZW50LndpZHRoLCBjdXJyZW50LmhlaWdodClcbiAgICAgICAgICAgICAgICBjdXJyZW50LnRleHR1cmUudXBkYXRlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zaG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNob3dDYW52YXNlcygpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIG1lYXN1cmVzIGNhbnZhcyByZW5kZXJpbmdzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBtZWFzdXJlKClcbiAgICB7XG4gICAgICAgIGNvbnN0IGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxuICAgICAgICBjLndpZHRoID0gdGhpcy5tYXhTaXplXG4gICAgICAgIGMuaGVpZ2h0ID0gdGhpcy5tYXhTaXplXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjLmdldENvbnRleHQoJzJkJylcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IE1hdGguY2VpbCh0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uKVxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNba2V5XVxuICAgICAgICAgICAgc3dpdGNoICh0ZXh0dXJlLnR5cGUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBDQU5WQVM6XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSB0ZXh0dXJlLm1lYXN1cmUoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgYylcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS53aWR0aCA9IE1hdGguY2VpbChzaXplLndpZHRoICogbXVsdGlwbGllcilcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwoc2l6ZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJTUFHRTogY2FzZSBEQVRBOlxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLndpZHRoID0gTWF0aC5jZWlsKHRleHR1cmUuaW1hZ2Uud2lkdGggKiBtdWx0aXBsaWVyKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmhlaWdodCA9IE1hdGguY2VpbCh0ZXh0dXJlLmltYWdlLmhlaWdodCAqIG11bHRpcGxpZXIpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNvcnRlZC5wdXNoKHRleHR1cmUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzb3J0IHRleHR1cmVzIGJ5IGxhcmdlc3QgZGltZW5zaW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzb3J0KClcbiAgICB7XG4gICAgICAgIHRoaXMuc29ydGVkLnNvcnQoXG4gICAgICAgICAgICBmdW5jdGlvbihhLCBiKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxldCBhU2l6ZSA9IE1hdGgubWF4KGEuaGVpZ2h0LCBhLndpZHRoKVxuICAgICAgICAgICAgICAgIGxldCBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxuICAgICAgICAgICAgICAgIGlmIChhU2l6ZSA9PT0gYlNpemUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhU2l6ZSA9IE1hdGgubWluKGEuaGVpZ2h0LCBhLndpZHRoKVxuICAgICAgICAgICAgICAgICAgICBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYlNpemUgLSBhU2l6ZVxuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3JlYXRlIHNxdWFyZSBjYW52YXNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3NpemU9dGhpcy5tYXhTaXplXVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY3JlYXRlQ2FudmFzKHNpemUpXG4gICAge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxuICAgICAgICBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ID0gc2l6ZSB8fCB0aGlzLm1heFNpemVcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGNhbnZhcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIGEgcmFuZG9tIHJnYiBjb2xvclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcmFuZG9tQ29sb3IoKVxuICAgIHtcbiAgICAgICAgZnVuY3Rpb24gcigpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNTUpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCAwLjIpJ1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGRyYXcgcmVuZGVyaW5ncyB0byByZW5kZXJ0ZXh0dXJlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkcmF3KClcbiAgICB7XG4gICAgICAgIGxldCBjdXJyZW50LCBjb250ZXh0XG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSBNYXRoLmNlaWwodGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvbilcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW2tleV1cbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLmNhbnZhcyAhPT0gY3VycmVudClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnQgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHRleHR1cmUuY2FudmFzXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IHRoaXMuY2FudmFzZXNbY3VycmVudF0uZ2V0Q29udGV4dCgnMmQnKVxuICAgICAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpXG4gICAgICAgICAgICAgICAgY29udGV4dC5zY2FsZShtdWx0aXBsaWVyLCBtdWx0aXBsaWVyKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5zYXZlKClcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKE1hdGguY2VpbCh0ZXh0dXJlLnggLyBtdWx0aXBsaWVyKSwgTWF0aC5jZWlsKHRleHR1cmUueSAvIG11bHRpcGxpZXIpKVxuICAgICAgICAgICAgaWYgKHRoaXMudGVzdEJveGVzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5yYW5kb21Db2xvcigpXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCBNYXRoLmNlaWwodGV4dHVyZS53aWR0aCAvIG11bHRpcGxpZXIpLCBNYXRoLmNlaWwodGV4dHVyZS5oZWlnaHQgLyBtdWx0aXBsaWVyKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAodGV4dHVyZS50eXBlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgQ0FOVkFTOlxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgdGhpcy5jYW52YXNlc1tjdXJyZW50XSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgIGNhc2UgSU1BR0U6IGNhc2UgREFUQTpcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGV4dHVyZS5pbWFnZSwgMCwgMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQucmVzdG9yZSgpXG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dC5yZXN0b3JlKClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBleHRydWRlIHBpeGVscyBmb3IgZW50cnlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGV4dHVyZVxuICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjb250ZXh0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBleHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcbiAgICB7XG4gICAgICAgIGZ1bmN0aW9uIGdldCh4LCB5KVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9ICh4ICsgeSAqIHRleHR1cmUud2lkdGgpICogNFxuICAgICAgICAgICAgY29uc3QgZCA9IGRhdGEuZGF0YVxuICAgICAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyBkW2VudHJ5XSArICcsJyArIGRbZW50cnkgKyAxXSArICcsJyArIGRbZW50cnkgKyAyXSArICcsJyArIChkW2VudHJ5ICsgM10gLyAweGZmKSArICcpJ1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tjdXJyZW50XVxuICAgICAgICBjb25zdCBkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEodGV4dHVyZS54LCB0ZXh0dXJlLnksIHRleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0KVxuICAgICAgICBpZiAodGV4dHVyZS54ICE9PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoMCwgeSlcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KC0xLCB5LCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCAwKVxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoLTEsIC0xLCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0dXJlLnggKyB0ZXh0dXJlLndpZHRoICE9PSBjYW52YXMud2lkdGggLSAxKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQodGV4dHVyZS53aWR0aCAtIDEsIHkpXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh0ZXh0dXJlLndpZHRoLCB5LCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSArIHRleHR1cmUuaGVpZ2h0ICE9PSBjYW52YXMuaGVpZ2h0IC0gMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh0ZXh0dXJlLndpZHRoIC0gMSwgdGV4dHVyZS5oZWlnaHQgLSAxKVxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QodGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQsIDEsIDEpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0ZXh0dXJlLndpZHRoOyB4KyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoeCwgMClcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIC0xLCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0dXJlLnkgKyB0ZXh0dXJlLmhlaWdodCAhPT0gY2FudmFzLmhlaWdodCAtIDEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGV4dHVyZS53aWR0aDsgeCsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHgsIHRleHR1cmUuaGVpZ2h0IC0gMSlcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjcmVhdGVCYXNlVGV4dHVyZXMoKVxuICAgIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuYmFzZVRleHR1cmVzLmxlbmd0aClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucG9wKCkuZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBmcm9tID0gUElYSS5CYXNlVGV4dHVyZS5mcm9tQ2FudmFzIHx8IFBJWEkuQmFzZVRleHR1cmUuZnJvbVxuICAgICAgICAgICAgY29uc3QgYmFzZSA9IGZyb20odGhpcy5jYW52YXNlc1tpXSlcbiAgICAgICAgICAgIGJhc2Uuc2NhbGVNb2RlID0gdGhpcy5zY2FsZU1vZGVcbiAgICAgICAgICAgIHRoaXMuYmFzZVRleHR1cmVzLnB1c2goYmFzZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHBhY2sgdGV4dHVyZXMgYWZ0ZXIgbWVhc3VyZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHBhY2soKVxuICAgIHtcbiAgICAgICAgY29uc3QgcGFja2VycyA9IFtuZXcgdGhpcy5wYWNrZXIodGhpcy5tYXhTaXplLCB0aGlzLnNvcnRlZFswXSwgdGhpcy5idWZmZXIpXVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc29ydGVkLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBibG9jayA9IHRoaXMuc29ydGVkW2ldXG4gICAgICAgICAgICBsZXQgcGFja2VkID0gZmFsc2VcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFja2Vycy5sZW5ndGg7IGorKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAocGFja2Vyc1tqXS5hZGQoYmxvY2ssIGopKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0galxuICAgICAgICAgICAgICAgICAgICBwYWNrZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwYWNrZWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFja2Vycy5wdXNoKG5ldyB0aGlzLnBhY2tlcih0aGlzLm1heFNpemUsIGJsb2NrLCB0aGlzLmJ1ZmZlcikpXG4gICAgICAgICAgICAgICAgaWYgKCFwYWNrZXJzW2pdLmFkZChibG9jaywgaikpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3l5LXJlbmRlcnNoZWV0OiAnICsgYmxvY2submFtZSArICcgaXMgdG9vIGJpZyBmb3IgdGhlIHNwcml0ZXNoZWV0LicpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBibG9jay5jYW52YXMgPSBqXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWNrZXJzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBzaXplID0gcGFja2Vyc1tpXS5maW5pc2godGhpcy5tYXhTaXplKVxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDYW52YXMoc2l6ZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgdGhlIGRyYXdpbmcgZnVuY3Rpb24gb2YgYSB0ZXh0dXJlXG4gICAgICogTk9URTogdGhpcyBvbmx5IHdvcmtzIGlmIHRoZSB0ZXh0dXJlIHJlbWFpbnMgdGhlIHNhbWUgc2l6ZTsgdXNlIFNoZWV0LnJlbmRlcigpIHRvIHJlc2l6ZSB0aGUgdGV4dHVyZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZHJhd1xuICAgICAqL1xuICAgIGNoYW5nZURyYXcobmFtZSwgZHJhdylcbiAgICB7XG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW25hbWVdXG4gICAgICAgIGlmICh0ZXh0dXJlLnR5cGUgIT09IENBTlZBUylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1zaGVldC5jaGFuZ2VUZXh0dXJlRHJhdyBvbmx5IHdvcmtzIHdpdGggdHlwZTogQ0FOVkFTLicpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0ZXh0dXJlLmRyYXcgPSBkcmF3XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNhbnZhc2VzW3RleHR1cmUuY2FudmFzXS5nZXRDb250ZXh0KCcyZCcpXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSB0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uXG4gICAgICAgIGNvbnRleHQuc2F2ZSgpXG4gICAgICAgIGNvbnRleHQuc2NhbGUobXVsdGlwbGllciwgbXVsdGlwbGllcilcbiAgICAgICAgY29udGV4dC50cmFuc2xhdGUodGV4dHVyZS54IC8gbXVsdGlwbGllciwgdGV4dHVyZS55IC8gbXVsdGlwbGllcilcbiAgICAgICAgdGV4dHVyZS5kcmF3KGNvbnRleHQsIHRleHR1cmUucGFyYW0pXG4gICAgICAgIGNvbnRleHQucmVzdG9yZSgpXG4gICAgICAgIHRleHR1cmUudGV4dHVyZS51cGRhdGUoKVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJTaGVldFxuXG4vKipcbiAqIGZpcmVzIHdoZW4gcmVuZGVyIGNvbXBsZXRlc1xuICogQGV2ZW50IFJlbmRlclNoZWV0I3JlbmRlclxuICovIl19