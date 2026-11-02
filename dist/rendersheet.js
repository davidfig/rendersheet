"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, e) { if ("object" != _typeof(t) || !t) return t; var r; if ("undefined" != typeof Symbol && void 0 !== (r = t[Symbol.toPrimitive])) { var i = r.call(t, e || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === e ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
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
var RenderSheet = /*#__PURE__*/function (_Events) {
  /**
   * @param {object} options
   * @param {number} [options.maxSize=2048]
   * @param {number} [options.buffer=5] around each texture
   * @param {number} [options.scale=1] of texture
   * @param {number} [options.resolution=1] of rendersheet
   * @param {number} [options.extrude] the edges--useful for removing gaps in sprites when tiling
   * @param {number} [options.wait=250] number of milliseconds to wait between checks for onload of addImage images before rendering
   * @param {boolean} [options.testBoxes] draw a different colored boxes behind each rendering (useful for debugging)
   * @param {number|boolean} [options.scaleMode] scale mode ('nearest' or 'linear') for rendersheet (use =true for 'nearest' for pixel art)
   * @param {boolean} [options.useSimplePacker] use a stupidly simple packer instead of growing packer algorithm
   * @param {boolean|object} [options.show] set to true or a CSS object (e.g., {zIndex: 10, background: 'blue'}) to attach the final canvas to document.body--useful for debugging
   * @fire render
   */
  function RenderSheet(options) {
    var _this;
    _classCallCheck(this, RenderSheet);
    _this = _callSuper(this, RenderSheet);
    options = options || {};
    _this.wait = options.wait || WAIT;
    _this.testBoxes = options.testBoxes || false;
    _this.maxSize = options.maxSize || 2048;
    _this.buffer = options.buffer || 5;
    _this.scale = options.scale || 1;
    _this.scaleMode = options.scaleMode === true ? 'nearest' : options.scaleMode;
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
  _inherits(RenderSheet, _Events);
  return _createClass(RenderSheet, [{
    key: "clear",
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
    key: "add",
    value: function add(name, draw, measure, param) {
      var object = this.textures[name] = {
        name: name,
        draw: draw,
        measure: measure,
        param: param,
        type: CANVAS,
        texture: new PIXI.Texture({
          dynamic: true
        })
      };
      return object;
    }

    /**
     * adds an image rendering
     * @param {string} name of rendering
     * @param {string} src for image
     * @return {object} rendersheet object for texture
     */
  }, {
    key: "addImage",
    value: function addImage(name, src) {
      var object = this.textures[name] = {
        name: name,
        file: src,
        type: IMAGE,
        texture: new PIXI.Texture({
          dynamic: true
        })
      };
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
    key: "addData",
    value: function addData(name, data, header) {
      header = typeof header !== 'undefined' ? header : 'data:image/png;base64,';
      var object = this.textures[name] = {
        name: name,
        type: DATA,
        texture: new PIXI.Texture({
          dynamic: true
        })
      };
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
    key: "showCanvases",
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
        if (this.scaleMode === 'nearest') {
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
    key: "exists",
    value: function exists(name) {
      return this.textures[name] ? true : false;
    }

    /**
     * @param {string} name of texture
     * @return {(PIXI.Texture|null)}
     */
  }, {
    key: "getTexture",
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
    key: "getSprite",
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
    key: "get",
    value: function get(name) {
      return this.getSprite(name);
    }

    /**
     * @return {number} amount of textures in this rendersheet
     */
  }, {
    key: "entries",
    value: function entries() {
      return Object.keys(this.textures).length;
    }

    /**
     * prints statistics of canvases to console.log
     */
  }, {
    key: "debug",
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
    key: "getIndex",
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
    key: "checkLoaded",
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
     * @param {boolean} skipTextures - don't create PIXI.TextureSources and PIXI.Textures (useful for generating external spritesheets)
     */
  }, {
    key: "asyncRender",
    value: function asyncRender(skipTextures) {
      var _this2 = this;
      return new Promise(function (resolve) {
        _this2.render(resolve, skipTextures);
      });
    }

    /**
     * create (or refresh) the rendersheet
     * @param {boolean} skipTextures - don't create PIXI.TextureSources and PIXI.Textures (useful for generating external spritesheets)
     * @param {function} callback - convenience function that calls RenderSheet.once('render', callback)
     */
  }, {
    key: "render",
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
          var texture = current.texture;
          texture.source = this.baseTextures[current.canvas];
          texture.noFrame = false;
          texture.frame.copyFrom(new PIXI.Rectangle(current.x, current.y, current.width, current.height));
          texture.update();
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
    key: "measure",
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
          case IMAGE:
          case DATA:
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
    key: "sort",
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
    key: "createCanvas",
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
    key: "randomColor",
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
    key: "draw",
    value: function draw() {
      var current, context;
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
          case IMAGE:
          case DATA:
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
    key: "extrudeEntry",
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
    key: "createBaseTextures",
    value: function createBaseTextures() {
      while (this.baseTextures.length) {
        this.baseTextures.pop().destroy();
      }
      for (var i = 0; i < this.canvases.length; i++) {
        var base = new PIXI.CanvasSource({
          resource: this.canvases[i],
          resolution: 1
        });
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
    key: "pack",
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
    key: "changeDraw",
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
      texture.texture.source.update();
    }
  }]);
}(Events);
module.exports = RenderSheet;

/**
 * fires when render completes
 * @event RenderSheet#render
 */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQSVhJIiwicmVxdWlyZSIsIkV2ZW50cyIsIkdyb3dpbmdQYWNrZXIiLCJTaW1wbGVQYWNrZXIiLCJDQU5WQVMiLCJJTUFHRSIsIkRBVEEiLCJXQUlUIiwiUmVuZGVyU2hlZXQiLCJfRXZlbnRzIiwib3B0aW9ucyIsIl90aGlzIiwiX2NsYXNzQ2FsbENoZWNrIiwiX2NhbGxTdXBlciIsIndhaXQiLCJ0ZXN0Qm94ZXMiLCJtYXhTaXplIiwiYnVmZmVyIiwic2NhbGUiLCJzY2FsZU1vZGUiLCJyZXNvbHV0aW9uIiwic2hvdyIsImV4dHJ1ZGUiLCJwYWNrZXIiLCJ1c2VTaW1wbGVQYWNrZXIiLCJjbGVhciIsIl9pbmhlcml0cyIsIl9jcmVhdGVDbGFzcyIsImtleSIsInZhbHVlIiwiY2FudmFzZXMiLCJiYXNlVGV4dHVyZXMiLCJ0ZXh0dXJlcyIsImFkZCIsIm5hbWUiLCJkcmF3IiwibWVhc3VyZSIsInBhcmFtIiwib2JqZWN0IiwidHlwZSIsInRleHR1cmUiLCJUZXh0dXJlIiwiZHluYW1pYyIsImFkZEltYWdlIiwic3JjIiwiZmlsZSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJhZGREYXRhIiwiZGF0YSIsImhlYWRlciIsImNvbXBsZXRlIiwic2hvd0NhbnZhc2VzIiwiZGl2Q2FudmFzZXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJoYXNDaGlsZE5vZGVzIiwicmVtb3ZlQ2hpbGQiLCJsYXN0Q2hpbGQiLCJwZXJjZW50IiwibGVuZ3RoIiwiaSIsImNhbnZhcyIsInN0eWxlIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiTWF0aCIsInJvdW5kIiwid2lkdGgiLCJoZWlnaHQiLCJ6SW5kZXgiLCJpbWFnZVJlbmRlcmluZyIsImJhY2tncm91bmQiLCJyYW5kb21Db2xvciIsIl90eXBlb2YiLCJleGlzdHMiLCJnZXRUZXh0dXJlIiwiY29uc29sZSIsIndhcm4iLCJnZXRTcHJpdGUiLCJzcHJpdGUiLCJTcHJpdGUiLCJhbmNob3IiLCJzZXQiLCJnZXQiLCJlbnRyaWVzIiwiT2JqZWN0Iiwia2V5cyIsImRlYnVnIiwibG9nIiwiZ2V0SW5kZXgiLCJmaW5kIiwiY2hlY2tMb2FkZWQiLCJjdXJyZW50IiwiYXN5bmNSZW5kZXIiLCJza2lwVGV4dHVyZXMiLCJfdGhpczIiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlbmRlciIsImNhbGxiYWNrIiwiX3RoaXMzIiwib25jZSIsImVtaXQiLCJzZXRUaW1lb3V0Iiwic29ydGVkIiwic29ydCIsInBhY2siLCJjcmVhdGVCYXNlVGV4dHVyZXMiLCJzb3VyY2UiLCJub0ZyYW1lIiwiZnJhbWUiLCJjb3B5RnJvbSIsIlJlY3RhbmdsZSIsIngiLCJ5IiwidXBkYXRlIiwiYyIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwibXVsdGlwbGllciIsImNlaWwiLCJzaXplIiwicHVzaCIsImEiLCJiIiwiYVNpemUiLCJtYXgiLCJiU2l6ZSIsIm1pbiIsImNyZWF0ZUNhbnZhcyIsInIiLCJmbG9vciIsInJhbmRvbSIsInJlc3RvcmUiLCJzYXZlIiwidHJhbnNsYXRlIiwiZmlsbFN0eWxlIiwiZmlsbFJlY3QiLCJkcmF3SW1hZ2UiLCJleHRydWRlRW50cnkiLCJlbnRyeSIsImQiLCJnZXRJbWFnZURhdGEiLCJwb3AiLCJkZXN0cm95IiwiYmFzZSIsIkNhbnZhc1NvdXJjZSIsInJlc291cmNlIiwicGFja2VycyIsImJsb2NrIiwicGFja2VkIiwiaiIsImZpbmlzaCIsImNoYW5nZURyYXciLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiLi4vc3JjL3JlbmRlcnNoZWV0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHl5LXJlbmRlcnNoZWV0XG4vLyBieSBEYXZpZCBGaWdhdG5lclxuLy8gKGMpIFlPUEVZIFlPUEVZIExMQyAyMDE5XG4vLyBNSVQgTGljZW5zZVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2RhdmlkZmlnL3JlbmRlcnNoZWV0XG5cbmNvbnN0IFBJWEkgPSByZXF1aXJlKCdwaXhpLmpzJylcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKVxuXG5jb25zdCBHcm93aW5nUGFja2VyID0gcmVxdWlyZSgnLi9ncm93aW5ncGFja2VyJylcbmNvbnN0IFNpbXBsZVBhY2tlciA9IHJlcXVpcmUoJy4vc2ltcGxlcGFja2VyJylcblxuLy8gdHlwZXNcbmNvbnN0IENBTlZBUyA9IDAgLy8gZGVmYXVsdFxuY29uc3QgSU1BR0UgPSAxIC8vIGltYWdlIHVybFxuY29uc3QgREFUQSA9IDIgLy8gZGF0YSBzcmMgKGUuZy4sIHJlc3VsdCBvZiAudG9EYXRhVVJMKCkpXG5cbi8vIGRlZmF1bHQgbXMgdG8gd2FpdCB0byBjaGVjayBpZiBhbiBpbWFnZSBoYXMgZmluaXNoZWQgbG9hZGluZ1xuY29uc3QgV0FJVCA9IDI1MFxuXG5jbGFzcyBSZW5kZXJTaGVldCBleHRlbmRzIEV2ZW50c1xue1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFNpemU9MjA0OF1cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuYnVmZmVyPTVdIGFyb3VuZCBlYWNoIHRleHR1cmVcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2NhbGU9MV0gb2YgdGV4dHVyZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5yZXNvbHV0aW9uPTFdIG9mIHJlbmRlcnNoZWV0XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmV4dHJ1ZGVdIHRoZSBlZGdlcy0tdXNlZnVsIGZvciByZW1vdmluZyBnYXBzIGluIHNwcml0ZXMgd2hlbiB0aWxpbmdcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMud2FpdD0yNTBdIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3Igb25sb2FkIG9mIGFkZEltYWdlIGltYWdlcyBiZWZvcmUgcmVuZGVyaW5nXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50ZXN0Qm94ZXNdIGRyYXcgYSBkaWZmZXJlbnQgY29sb3JlZCBib3hlcyBiZWhpbmQgZWFjaCByZW5kZXJpbmcgKHVzZWZ1bCBmb3IgZGVidWdnaW5nKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW59IFtvcHRpb25zLnNjYWxlTW9kZV0gc2NhbGUgbW9kZSAoJ25lYXJlc3QnIG9yICdsaW5lYXInKSBmb3IgcmVuZGVyc2hlZXQgKHVzZSA9dHJ1ZSBmb3IgJ25lYXJlc3QnIGZvciBwaXhlbCBhcnQpXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51c2VTaW1wbGVQYWNrZXJdIHVzZSBhIHN0dXBpZGx5IHNpbXBsZSBwYWNrZXIgaW5zdGVhZCBvZiBncm93aW5nIHBhY2tlciBhbGdvcml0aG1cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW58b2JqZWN0fSBbb3B0aW9ucy5zaG93XSBzZXQgdG8gdHJ1ZSBvciBhIENTUyBvYmplY3QgKGUuZy4sIHt6SW5kZXg6IDEwLCBiYWNrZ3JvdW5kOiAnYmx1ZSd9KSB0byBhdHRhY2ggdGhlIGZpbmFsIGNhbnZhcyB0byBkb2N1bWVudC5ib2R5LS11c2VmdWwgZm9yIGRlYnVnZ2luZ1xuICAgICAqIEBmaXJlIHJlbmRlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXG4gICAge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgICAgIHRoaXMud2FpdCA9IG9wdGlvbnMud2FpdCB8fCBXQUlUXG4gICAgICAgIHRoaXMudGVzdEJveGVzID0gb3B0aW9ucy50ZXN0Qm94ZXMgfHwgZmFsc2VcbiAgICAgICAgdGhpcy5tYXhTaXplID0gb3B0aW9ucy5tYXhTaXplIHx8IDIwNDhcbiAgICAgICAgdGhpcy5idWZmZXIgPSBvcHRpb25zLmJ1ZmZlciB8fCA1XG4gICAgICAgIHRoaXMuc2NhbGUgPSBvcHRpb25zLnNjYWxlIHx8IDFcbiAgICAgICAgdGhpcy5zY2FsZU1vZGUgPSBvcHRpb25zLnNjYWxlTW9kZSA9PT0gdHJ1ZSA/ICduZWFyZXN0JyA6IG9wdGlvbnMuc2NhbGVNb2RlXG4gICAgICAgIHRoaXMucmVzb2x1dGlvbiA9IG9wdGlvbnMucmVzb2x1dGlvbiB8fCAxXG4gICAgICAgIHRoaXMuc2hvdyA9IG9wdGlvbnMuc2hvd1xuICAgICAgICB0aGlzLmV4dHJ1ZGUgPSBvcHRpb25zLmV4dHJ1ZGVcbiAgICAgICAgaWYgKHRoaXMuZXh0cnVkZSAmJiB0aGlzLmJ1ZmZlciA8IDIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyID0gMlxuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFja2VyID0gb3B0aW9ucy51c2VTaW1wbGVQYWNrZXIgPyBTaW1wbGVQYWNrZXIgOiBHcm93aW5nUGFja2VyXG4gICAgICAgIHRoaXMuY2xlYXIoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZXMgYWxsIHRleHR1cmVzIGZyb20gcmVuZGVyc2hlZXRzXG4gICAgICovXG4gICAgY2xlYXIoKVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmVzID0gW11cbiAgICAgICAgdGhpcy50ZXh0dXJlcyA9IHt9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWRkcyBhIGNhbnZhcyByZW5kZXJpbmdcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiByZW5kZXJpbmdcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBkcmF3IGZ1bmN0aW9uKGNvbnRleHQpIC0gdXNlIHRoZSBjb250ZXh0IHRvIGRyYXcgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIG1lYXN1cmUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZWFzdXJlIGZ1bmN0aW9uKGNvbnRleHQpIC0gbmVlZHMgdG8gcmV0dXJuIHt3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSBmb3IgdGhlIHJlbmRlcmluZ1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBvYmplY3QgdG8gcGFzcyB0aGUgZHJhdygpIGFuZCBtZWFzdXJlKCkgZnVuY3Rpb25zXG4gICAgICogQHJldHVybiB7b2JqZWN0fSByZW5kZXJzaGVldCBvYmplY3QgZm9yIHRleHR1cmVcbiAgICAgKi9cbiAgICBhZGQobmFtZSwgZHJhdywgbWVhc3VyZSwgcGFyYW0pXG4gICAge1xuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lOiBuYW1lLCBkcmF3OiBkcmF3LCBtZWFzdXJlOiBtZWFzdXJlLCBwYXJhbTogcGFyYW0sIHR5cGU6IENBTlZBUywgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZSh7IGR5bmFtaWM6IHRydWUgfSkgfVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWRkcyBhbiBpbWFnZSByZW5kZXJpbmdcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiByZW5kZXJpbmdcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3JjIGZvciBpbWFnZVxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXG4gICAgICovXG4gICAgYWRkSW1hZ2UobmFtZSwgc3JjKVxuICAgIHtcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy50ZXh0dXJlc1tuYW1lXSA9IHsgbmFtZSwgZmlsZTogc3JjLCB0eXBlOiBJTUFHRSwgdGV4dHVyZTogbmV3IFBJWEkuVGV4dHVyZSh7IGR5bmFtaWM6IHRydWUgfSkgIH1cbiAgICAgICAgb2JqZWN0LmltYWdlID0gbmV3IEltYWdlKClcbiAgICAgICAgb2JqZWN0LmltYWdlLm9ubG9hZCA9ICgpID0+IG9iamVjdC5sb2FkZWQgPSB0cnVlXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBzcmNcbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFkZHMgYSBkYXRhIHNvdXJjZSAoZS5nLiwgYSBQTkcgZmlsZSBpbiBkYXRhIGZvcm1hdClcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBvZiByZW5kZXJpbmcgKG5vdCBmaWxlbmFtZSlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2hlYWRlcj1kYXRhOmltYWdlL3BuZztiYXNlNjQsXSBmb3IgZGF0YVxuICAgICAqIEByZXR1cm4ge29iamVjdH0gcmVuZGVyc2hlZXQgb2JqZWN0IGZvciB0ZXh0dXJlXG4gICAgICovXG4gICAgYWRkRGF0YShuYW1lLCBkYXRhLCBoZWFkZXIpXG4gICAge1xuICAgICAgICBoZWFkZXIgPSB0eXBlb2YgaGVhZGVyICE9PSAndW5kZWZpbmVkJyA/IGhlYWRlciA6ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJ1xuICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLnRleHR1cmVzW25hbWVdID0geyBuYW1lLCB0eXBlOiBEQVRBLCB0ZXh0dXJlOiBuZXcgUElYSS5UZXh0dXJlKHsgZHluYW1pYzogdHJ1ZSB9KSB9XG4gICAgICAgIG9iamVjdC5pbWFnZSA9IG5ldyBJbWFnZSgpXG4gICAgICAgIG9iamVjdC5pbWFnZS5zcmMgPSBoZWFkZXIgKyBkYXRhXG4gICAgICAgIGlmIChvYmplY3QuaW1hZ2UuY29tcGxldGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG9iamVjdC5sb2FkZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBvYmplY3QuaW1hZ2Uub25sb2FkID0gKCkgPT4gb2JqZWN0LmxvYWRlZCA9IHRydWVcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYXR0YWNoZXMgUmVuZGVyU2hlZXQgdG8gRE9NIGZvciB0ZXN0aW5nXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHN0eWxlcyAtIENTUyBzdHlsZXMgdG8gdXNlIGZvciByZW5kZXJzaGVldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc2hvd0NhbnZhc2VzKClcbiAgICB7XG4gICAgICAgIGlmICghdGhpcy5kaXZDYW52YXNlcylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZGl2Q2FudmFzZXMpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB3aGlsZSAodGhpcy5kaXZDYW52YXNlcy5oYXNDaGlsZE5vZGVzKCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcy5yZW1vdmVDaGlsZCh0aGlzLmRpdkNhbnZhc2VzLmxhc3RDaGlsZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwZXJjZW50ID0gMSAvIHRoaXMuY2FudmFzZXMubGVuZ3RoXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tpXVxuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBjYW52YXMuc3R5bGVcbiAgICAgICAgICAgIHN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJ1xuICAgICAgICAgICAgc3R5bGUubGVmdCA9ICcwcHgnXG4gICAgICAgICAgICBzdHlsZS50b3AgPSBpICogTWF0aC5yb3VuZChwZXJjZW50ICogMTAwKSArICclJ1xuICAgICAgICAgICAgc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgIHN0eWxlLmhlaWdodCA9IE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJSdcbiAgICAgICAgICAgIHN0eWxlLnpJbmRleCA9IDEwMDBcbiAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlTW9kZSA9PT0gJ25lYXJlc3QnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHN0eWxlLmltYWdlUmVuZGVyaW5nID0gJ3BpeGVsYXRlZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnJhbmRvbUNvbG9yKClcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5zaG93ID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5zaG93KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVba2V5XSA9IHRoaXMuc2hvd1trZXldXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kaXZDYW52YXNlcy5hcHBlbmRDaGlsZChjYW52YXMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB0ZXN0cyB3aGV0aGVyIGEgdGV4dHVyZSBleGlzdHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiB0ZXh0dXJlXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBleGlzdHMobmFtZSlcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHR1cmVzW25hbWVdID8gdHJ1ZSA6IGZhbHNlXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgdGV4dHVyZVxuICAgICAqIEByZXR1cm4geyhQSVhJLlRleHR1cmV8bnVsbCl9XG4gICAgICovXG4gICAgZ2V0VGV4dHVyZShuYW1lKVxuICAgIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNbbmFtZV1cbiAgICAgICAgaWYgKHRleHR1cmUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0dXJlLnRleHR1cmVcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktcmVuZGVyc2hlZXQ6IHRleHR1cmUgJyArIG5hbWUgKyAnIG5vdCBmb3VuZCBpbiBzcHJpdGVzaGVldC4nKVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJldHVybnMgYSBQSVhJLlNwcml0ZSAod2l0aCBhbmNob3Igc2V0IHRvIDAuNSwgYmVjYXVzZSB0aGF0J3Mgd2hlcmUgaXQgc2hvdWxkIGJlKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcbiAgICAgKiBAcmV0dXJuIHtQSVhJLlNwcml0ZX1cbiAgICAgKi9cbiAgICBnZXRTcHJpdGUobmFtZSlcbiAgICB7XG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFRleHR1cmUobmFtZSlcbiAgICAgICAgaWYgKHRleHR1cmUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHNwcml0ZSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlKVxuICAgICAgICAgICAgc3ByaXRlLmFuY2hvci5zZXQoMC41KVxuICAgICAgICAgICAgcmV0dXJuIHNwcml0ZVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFsaWFzIGZvciBnZXRTcHJpdGUoKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHRleHR1cmVcbiAgICAgKiBAcmV0dXJuIHtQSVhJLlNwcml0ZX1cbiAgICAgKi9cbiAgICBnZXQobmFtZSlcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFNwcml0ZShuYW1lKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gYW1vdW50IG9mIHRleHR1cmVzIGluIHRoaXMgcmVuZGVyc2hlZXRcbiAgICAgKi9cbiAgICBlbnRyaWVzKClcbiAgICB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnRleHR1cmVzKS5sZW5ndGhcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBwcmludHMgc3RhdGlzdGljcyBvZiBjYW52YXNlcyB0byBjb25zb2xlLmxvZ1xuICAgICAqL1xuICAgIGRlYnVnKClcbiAgICB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYW52YXNlcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tpXVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3l5LXJlbmRlcnNoZWV0OiBTaGVldCAjJyArIChpICsgMSkgKyAnIHwgc2l6ZTogJyArIGNhbnZhcy53aWR0aCArICd4JyArIGNhbnZhcy5oZWlnaHQgKyAnIHwgcmVzb2x1dGlvbjogJyArIHRoaXMucmVzb2x1dGlvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGZpbmQgdGhlIGluZGV4IG9mIHRoZSB0ZXh0dXJlIGJhc2VkIG9uIHRoZSB0ZXh0dXJlIG9iamVjdFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmaW5kIHRoaXMgaW5kZXhlZCB0ZXh0dXJlXG4gICAgICogQHJldHVybnMge1BJWEkuVGV4dHVyZX1cbiAgICAgKi9cbiAgICBnZXRJbmRleChmaW5kKVxuICAgIHtcbiAgICAgICAgbGV0IGkgPSAwXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLnRleHR1cmVzKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoaSA9PT0gZmluZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlc1trZXldLnRleHR1cmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrK1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY2hlY2tzIGlmIGFsbCB0ZXh0dXJlcyBhcmUgbG9hZGVkXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjaGVja0xvYWRlZCgpXG4gICAge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMudGV4dHVyZXNba2V5XVxuICAgICAgICAgICAgaWYgKChjdXJyZW50LnR5cGUgPT09IElNQUdFIHx8IGN1cnJlbnQudHlwZSA9PT0gREFUQSkgJiYgIWN1cnJlbnQubG9hZGVkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3JlYXRlIChvciByZWZyZXNoKSB0aGUgcmVuZGVyc2hlZXQgKHN1cHBvcnRzIGFzeW5jIGluc3RlYWQgb2YgY2FsbGJhY2spXG4gICAgICogQHBhcmFtIHtib29sZWFufSBza2lwVGV4dHVyZXMgLSBkb24ndCBjcmVhdGUgUElYSS5UZXh0dXJlU291cmNlcyBhbmQgUElYSS5UZXh0dXJlcyAodXNlZnVsIGZvciBnZW5lcmF0aW5nIGV4dGVybmFsIHNwcml0ZXNoZWV0cylcbiAgICAgKi9cbiAgICBhc3luY1JlbmRlcihza2lwVGV4dHVyZXMpXG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcihyZXNvbHZlLCBza2lwVGV4dHVyZXMpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3JlYXRlIChvciByZWZyZXNoKSB0aGUgcmVuZGVyc2hlZXRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBUZXh0dXJlcyAtIGRvbid0IGNyZWF0ZSBQSVhJLlRleHR1cmVTb3VyY2VzIGFuZCBQSVhJLlRleHR1cmVzICh1c2VmdWwgZm9yIGdlbmVyYXRpbmcgZXh0ZXJuYWwgc3ByaXRlc2hlZXRzKVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBjYWxscyBSZW5kZXJTaGVldC5vbmNlKCdyZW5kZXInLCBjYWxsYmFjaylcbiAgICAgKi9cbiAgICByZW5kZXIoY2FsbGJhY2ssIHNraXBUZXh0dXJlcylcbiAgICB7XG4gICAgICAgIGlmIChjYWxsYmFjaylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5vbmNlKCdyZW5kZXInLCBjYWxsYmFjaylcbiAgICAgICAgfVxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHRoaXMudGV4dHVyZXMpLmxlbmd0aClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrTG9hZGVkKCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5yZW5kZXIoKSwgdGhpcy53YWl0KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdXG4gICAgICAgIHRoaXMuc29ydGVkID0gW11cblxuICAgICAgICB0aGlzLm1lYXN1cmUoKVxuICAgICAgICB0aGlzLnNvcnQoKVxuICAgICAgICB0aGlzLnBhY2soKVxuICAgICAgICB0aGlzLmRyYXcoKVxuICAgICAgICBpZiAoIXNraXBUZXh0dXJlcylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVCYXNlVGV4dHVyZXMoKVxuXG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy50ZXh0dXJlc1trZXldXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IGN1cnJlbnQudGV4dHVyZVxuICAgICAgICAgICAgICAgIHRleHR1cmUuc291cmNlID0gdGhpcy5iYXNlVGV4dHVyZXNbY3VycmVudC5jYW52YXNdXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5ub0ZyYW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLmZyYW1lLmNvcHlGcm9tKG5ldyBQSVhJLlJlY3RhbmdsZShjdXJyZW50LngsIGN1cnJlbnQueSwgY3VycmVudC53aWR0aCwgY3VycmVudC5oZWlnaHQpKVxuICAgICAgICAgICAgICAgIHRleHR1cmUudXBkYXRlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zaG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNob3dDYW52YXNlcygpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KCdyZW5kZXInKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIG1lYXN1cmVzIGNhbnZhcyByZW5kZXJpbmdzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBtZWFzdXJlKClcbiAgICB7XG4gICAgICAgIGNvbnN0IGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxuICAgICAgICBjLndpZHRoID0gdGhpcy5tYXhTaXplXG4gICAgICAgIGMuaGVpZ2h0ID0gdGhpcy5tYXhTaXplXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjLmdldENvbnRleHQoJzJkJylcbiAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IE1hdGguY2VpbCh0aGlzLnNjYWxlICogdGhpcy5yZXNvbHV0aW9uKVxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy50ZXh0dXJlcylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNba2V5XVxuICAgICAgICAgICAgc3dpdGNoICh0ZXh0dXJlLnR5cGUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBDQU5WQVM6XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSB0ZXh0dXJlLm1lYXN1cmUoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgYylcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS53aWR0aCA9IE1hdGguY2VpbChzaXplLndpZHRoICogbXVsdGlwbGllcilcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5oZWlnaHQgPSBNYXRoLmNlaWwoc2l6ZS5oZWlnaHQgKiBtdWx0aXBsaWVyKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJTUFHRTogY2FzZSBEQVRBOlxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLndpZHRoID0gTWF0aC5jZWlsKHRleHR1cmUuaW1hZ2Uud2lkdGggKiBtdWx0aXBsaWVyKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmhlaWdodCA9IE1hdGguY2VpbCh0ZXh0dXJlLmltYWdlLmhlaWdodCAqIG11bHRpcGxpZXIpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNvcnRlZC5wdXNoKHRleHR1cmUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzb3J0IHRleHR1cmVzIGJ5IGxhcmdlc3QgZGltZW5zaW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzb3J0KClcbiAgICB7XG4gICAgICAgIHRoaXMuc29ydGVkLnNvcnQoXG4gICAgICAgICAgICBmdW5jdGlvbihhLCBiKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxldCBhU2l6ZSA9IE1hdGgubWF4KGEuaGVpZ2h0LCBhLndpZHRoKVxuICAgICAgICAgICAgICAgIGxldCBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxuICAgICAgICAgICAgICAgIGlmIChhU2l6ZSA9PT0gYlNpemUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhU2l6ZSA9IE1hdGgubWluKGEuaGVpZ2h0LCBhLndpZHRoKVxuICAgICAgICAgICAgICAgICAgICBiU2l6ZSA9IE1hdGgubWF4KGIuaGVpZ2h0LCBiLndpZHRoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYlNpemUgLSBhU2l6ZVxuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3JlYXRlIHNxdWFyZSBjYW52YXNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3NpemU9dGhpcy5tYXhTaXplXVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY3JlYXRlQ2FudmFzKHNpemUpXG4gICAge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxuICAgICAgICBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ID0gc2l6ZSB8fCB0aGlzLm1heFNpemVcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGNhbnZhcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIGEgcmFuZG9tIHJnYiBjb2xvclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcmFuZG9tQ29sb3IoKVxuICAgIHtcbiAgICAgICAgZnVuY3Rpb24gcigpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNTUpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCcgKyByKCkgKyAnLCAwLjIpJ1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGRyYXcgcmVuZGVyaW5ncyB0byByZW5kZXJ0ZXh0dXJlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkcmF3KClcbiAgICB7XG4gICAgICAgIGxldCBjdXJyZW50LCBjb250ZXh0XG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSBNYXRoLmNlaWwodGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvbilcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMudGV4dHVyZXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW2tleV1cbiAgICAgICAgICAgIGlmICh0ZXh0dXJlLmNhbnZhcyAhPT0gY3VycmVudClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnQgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHRleHR1cmUuY2FudmFzXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IHRoaXMuY2FudmFzZXNbY3VycmVudF0uZ2V0Q29udGV4dCgnMmQnKVxuICAgICAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpXG4gICAgICAgICAgICAgICAgY29udGV4dC5zY2FsZShtdWx0aXBsaWVyLCBtdWx0aXBsaWVyKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5zYXZlKClcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKE1hdGguY2VpbCh0ZXh0dXJlLnggLyBtdWx0aXBsaWVyKSwgTWF0aC5jZWlsKHRleHR1cmUueSAvIG11bHRpcGxpZXIpKVxuICAgICAgICAgICAgaWYgKHRoaXMudGVzdEJveGVzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5yYW5kb21Db2xvcigpXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCBNYXRoLmNlaWwodGV4dHVyZS53aWR0aCAvIG11bHRpcGxpZXIpLCBNYXRoLmNlaWwodGV4dHVyZS5oZWlnaHQgLyBtdWx0aXBsaWVyKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAodGV4dHVyZS50eXBlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgQ0FOVkFTOlxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmRyYXcoY29udGV4dCwgdGV4dHVyZS5wYXJhbSwgdGhpcy5jYW52YXNlc1tjdXJyZW50XSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgIGNhc2UgSU1BR0U6IGNhc2UgREFUQTpcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGV4dHVyZS5pbWFnZSwgMCwgMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmV4dHJ1ZGUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQucmVzdG9yZSgpXG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dC5yZXN0b3JlKClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBleHRydWRlIHBpeGVscyBmb3IgZW50cnlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGV4dHVyZVxuICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjb250ZXh0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBleHRydWRlRW50cnkodGV4dHVyZSwgY29udGV4dCwgY3VycmVudClcbiAgICB7XG4gICAgICAgIGZ1bmN0aW9uIGdldCh4LCB5KVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9ICh4ICsgeSAqIHRleHR1cmUud2lkdGgpICogNFxuICAgICAgICAgICAgY29uc3QgZCA9IGRhdGEuZGF0YVxuICAgICAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyBkW2VudHJ5XSArICcsJyArIGRbZW50cnkgKyAxXSArICcsJyArIGRbZW50cnkgKyAyXSArICcsJyArIChkW2VudHJ5ICsgM10gLyAweGZmKSArICcpJ1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlc1tjdXJyZW50XVxuICAgICAgICBjb25zdCBkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEodGV4dHVyZS54LCB0ZXh0dXJlLnksIHRleHR1cmUud2lkdGgsIHRleHR1cmUuaGVpZ2h0KVxuICAgICAgICBpZiAodGV4dHVyZS54ICE9PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoMCwgeSlcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KC0xLCB5LCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCgwLCAwKVxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoLTEsIC0xLCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0dXJlLnggKyB0ZXh0dXJlLndpZHRoICE9PSBjYW52YXMud2lkdGggLSAxKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRleHR1cmUuaGVpZ2h0OyB5KyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQodGV4dHVyZS53aWR0aCAtIDEsIHkpXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh0ZXh0dXJlLndpZHRoLCB5LCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRleHR1cmUueSArIHRleHR1cmUuaGVpZ2h0ICE9PSBjYW52YXMuaGVpZ2h0IC0gMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdldCh0ZXh0dXJlLndpZHRoIC0gMSwgdGV4dHVyZS5oZWlnaHQgLSAxKVxuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QodGV4dHVyZS53aWR0aCwgdGV4dHVyZS5oZWlnaHQsIDEsIDEpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHR1cmUueSAhPT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0ZXh0dXJlLndpZHRoOyB4KyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBnZXQoeCwgMClcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIC0xLCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0dXJlLnkgKyB0ZXh0dXJlLmhlaWdodCAhPT0gY2FudmFzLmhlaWdodCAtIDEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGV4dHVyZS53aWR0aDsgeCsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZ2V0KHgsIHRleHR1cmUuaGVpZ2h0IC0gMSlcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIHRleHR1cmUuaGVpZ2h0LCAxLCAxKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjcmVhdGVCYXNlVGV4dHVyZXMoKVxuICAgIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuYmFzZVRleHR1cmVzLmxlbmd0aClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5iYXNlVGV4dHVyZXMucG9wKCkuZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbnZhc2VzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBiYXNlID0gbmV3IFBJWEkuQ2FudmFzU291cmNlKHsgcmVzb3VyY2U6IHRoaXMuY2FudmFzZXNbaV0sIHJlc29sdXRpb246IDEgfSlcbiAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlTW9kZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBiYXNlLnNjYWxlTW9kZSA9IHRoaXMuc2NhbGVNb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJhc2VUZXh0dXJlcy5wdXNoKGJhc2UpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBwYWNrIHRleHR1cmVzIGFmdGVyIG1lYXN1cmVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwYWNrKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHBhY2tlcnMgPSBbbmV3IHRoaXMucGFja2VyKHRoaXMubWF4U2l6ZSwgdGhpcy5zb3J0ZWRbMF0sIHRoaXMuYnVmZmVyKV1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNvcnRlZC5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgYmxvY2sgPSB0aGlzLnNvcnRlZFtpXVxuICAgICAgICAgICAgbGV0IHBhY2tlZCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhY2tlcnMubGVuZ3RoOyBqKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tlcnNbal0uYWRkKGJsb2NrLCBqKSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmNhbnZhcyA9IGpcbiAgICAgICAgICAgICAgICAgICAgcGFja2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcGFja2VkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhY2tlcnMucHVzaChuZXcgdGhpcy5wYWNrZXIodGhpcy5tYXhTaXplLCBibG9jaywgdGhpcy5idWZmZXIpKVxuICAgICAgICAgICAgICAgIGlmICghcGFja2Vyc1tqXS5hZGQoYmxvY2ssIGopKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCd5eS1yZW5kZXJzaGVldDogJyArIGJsb2NrLm5hbWUgKyAnIGlzIHRvbyBiaWcgZm9yIHRoZSBzcHJpdGVzaGVldC4nKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0galxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2Vycy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHBhY2tlcnNbaV0uZmluaXNoKHRoaXMubWF4U2l6ZSlcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ2FudmFzKHNpemUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIHRoZSBkcmF3aW5nIGZ1bmN0aW9uIG9mIGEgdGV4dHVyZVxuICAgICAqIE5PVEU6IHRoaXMgb25seSB3b3JrcyBpZiB0aGUgdGV4dHVyZSByZW1haW5zIHRoZSBzYW1lIHNpemU7IHVzZSBTaGVldC5yZW5kZXIoKSB0byByZXNpemUgdGhlIHRleHR1cmVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRyYXdcbiAgICAgKi9cbiAgICBjaGFuZ2VEcmF3KG5hbWUsIGRyYXcpXG4gICAge1xuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tuYW1lXVxuICAgICAgICBpZiAodGV4dHVyZS50eXBlICE9PSBDQU5WQVMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigneXktc2hlZXQuY2hhbmdlVGV4dHVyZURyYXcgb25seSB3b3JrcyB3aXRoIHR5cGU6IENBTlZBUy4nKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdGV4dHVyZS5kcmF3ID0gZHJhd1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jYW52YXNlc1t0ZXh0dXJlLmNhbnZhc10uZ2V0Q29udGV4dCgnMmQnKVxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gdGhpcy5zY2FsZSAqIHRoaXMucmVzb2x1dGlvblxuICAgICAgICBjb250ZXh0LnNhdmUoKVxuICAgICAgICBjb250ZXh0LnNjYWxlKG11bHRpcGxpZXIsIG11bHRpcGxpZXIpXG4gICAgICAgIGNvbnRleHQudHJhbnNsYXRlKHRleHR1cmUueCAvIG11bHRpcGxpZXIsIHRleHR1cmUueSAvIG11bHRpcGxpZXIpXG4gICAgICAgIHRleHR1cmUuZHJhdyhjb250ZXh0LCB0ZXh0dXJlLnBhcmFtKVxuICAgICAgICBjb250ZXh0LnJlc3RvcmUoKVxuICAgICAgICB0ZXh0dXJlLnRleHR1cmUuc291cmNlLnVwZGF0ZSgpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlclNoZWV0XG5cbi8qKlxuICogZmlyZXMgd2hlbiByZW5kZXIgY29tcGxldGVzXG4gKiBAZXZlbnQgUmVuZGVyU2hlZXQjcmVuZGVyXG4gKi8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsSUFBSSxHQUFHQyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQy9CLElBQU1DLE1BQU0sR0FBR0QsT0FBTyxDQUFDLGVBQWUsQ0FBQztBQUV2QyxJQUFNRSxhQUFhLEdBQUdGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztBQUNoRCxJQUFNRyxZQUFZLEdBQUdILE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7QUFFOUM7QUFDQSxJQUFNSSxNQUFNLEdBQUcsQ0FBQyxFQUFDO0FBQ2pCLElBQU1DLEtBQUssR0FBRyxDQUFDLEVBQUM7QUFDaEIsSUFBTUMsSUFBSSxHQUFHLENBQUMsRUFBQzs7QUFFZjtBQUNBLElBQU1DLElBQUksR0FBRyxHQUFHO0FBQUEsSUFFVkMsV0FBVywwQkFBQUMsT0FBQTtFQUViO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDSSxTQUFBRCxZQUFZRSxPQUFPLEVBQ25CO0lBQUEsSUFBQUMsS0FBQTtJQUFBQyxlQUFBLE9BQUFKLFdBQUE7SUFDSUcsS0FBQSxHQUFBRSxVQUFBLE9BQUFMLFdBQUE7SUFDQUUsT0FBTyxHQUFHQSxPQUFPLElBQUksQ0FBQyxDQUFDO0lBQ3ZCQyxLQUFBLENBQUtHLElBQUksR0FBR0osT0FBTyxDQUFDSSxJQUFJLElBQUlQLElBQUk7SUFDaENJLEtBQUEsQ0FBS0ksU0FBUyxHQUFHTCxPQUFPLENBQUNLLFNBQVMsSUFBSSxLQUFLO0lBQzNDSixLQUFBLENBQUtLLE9BQU8sR0FBR04sT0FBTyxDQUFDTSxPQUFPLElBQUksSUFBSTtJQUN0Q0wsS0FBQSxDQUFLTSxNQUFNLEdBQUdQLE9BQU8sQ0FBQ08sTUFBTSxJQUFJ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