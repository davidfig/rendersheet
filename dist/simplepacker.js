"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, e) { if ("object" != _typeof(t) || !t) return t; var r; if ("undefined" != typeof Symbol && void 0 !== (r = t[Symbol.toPrimitive])) { var i = r.call(t, e || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === e ? String : Number)(t); }
/**
 * @file simple-packer.js
 * @author David Figatner
 * @license MIT
 * @copyright YOPEY YOPEY LLC 2016
 * {@link https://github.com/davidfig/rendersheet}
 */

module.exports = /*#__PURE__*/function () {
  /**
   * ridiculously simple packer, optimized (if you can call it that) only for speed
   * @param {number} max size
   * @param {boolean} first block
   * @param {number} buffer between each block
   */
  function SimplePacker(max, first, buffer) {
    _classCallCheck(this, SimplePacker);
    this.max = max;
    this.buffer = buffer;
    this.list = [];
    this.x = 0;
    this.y = 0;
    this.largest = 0;
  }
  return _createClass(SimplePacker, [{
    key: "finish",
    value: function finish(maxSize) {
      var n = 1,
        next;
      var squared = [];
      do {
        next = Math.pow(2, n++);
        squared.push(next);
      } while (next <= maxSize);
      var max = Math.max(this.x - this.buffer, this.y - this.buffer);
      for (var i = squared.length - 1; i >= 0; i--) {
        if (squared[i] < max) {
          return squared[i + 1];
        }
      }
    }
  }, {
    key: "add",
    value: function add(block, canvasNumber) {
      if (this.x + block.width < this.max) {
        if (this.y + block.height < this.max) {
          block.x = this.x;
          block.y = this.y;
          block.canvas = canvasNumber;
          this.largest = block.height > this.largest ? block.height : this.largest;
          this.x += block.width + this.buffer;
          return true;
        } else {
          return false;
        }
      } else {
        this.y += this.largest + this.buffer;
        if (this.y > this.max) {
          return false;
        }
        this.x = 0;
        this.largest = 0;
        return this.add(block, canvasNumber);
      }
    }
  }]);
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiU2ltcGxlUGFja2VyIiwibWF4IiwiZmlyc3QiLCJidWZmZXIiLCJfY2xhc3NDYWxsQ2hlY2siLCJsaXN0IiwieCIsInkiLCJsYXJnZXN0IiwiX2NyZWF0ZUNsYXNzIiwia2V5IiwidmFsdWUiLCJmaW5pc2giLCJtYXhTaXplIiwibiIsIm5leHQiLCJzcXVhcmVkIiwiTWF0aCIsInBvdyIsInB1c2giLCJpIiwibGVuZ3RoIiwiYWRkIiwiYmxvY2siLCJjYW52YXNOdW1iZXIiLCJ3aWR0aCIsImhlaWdodCIsImNhbnZhcyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9zaW1wbGVwYWNrZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSBzaW1wbGUtcGFja2VyLmpzXG4gKiBAYXV0aG9yIERhdmlkIEZpZ2F0bmVyXG4gKiBAbGljZW5zZSBNSVRcbiAqIEBjb3B5cmlnaHQgWU9QRVkgWU9QRVkgTExDIDIwMTZcbiAqIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZGF2aWRmaWcvcmVuZGVyc2hlZXR9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTaW1wbGVQYWNrZXJcbntcbiAgICAvKipcbiAgICAgKiByaWRpY3Vsb3VzbHkgc2ltcGxlIHBhY2tlciwgb3B0aW1pemVkIChpZiB5b3UgY2FuIGNhbGwgaXQgdGhhdCkgb25seSBmb3Igc3BlZWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IHNpemVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZpcnN0IGJsb2NrXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJ1ZmZlciBiZXR3ZWVuIGVhY2ggYmxvY2tcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtYXgsIGZpcnN0LCBidWZmZXIpXG4gICAge1xuICAgICAgICB0aGlzLm1heCA9IG1heFxuICAgICAgICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlclxuICAgICAgICB0aGlzLmxpc3QgPSBbXVxuICAgICAgICB0aGlzLnggPSAwXG4gICAgICAgIHRoaXMueSA9IDBcbiAgICAgICAgdGhpcy5sYXJnZXN0ID0gMFxuICAgIH1cblxuICAgIGZpbmlzaChtYXhTaXplKVxuICAgIHtcbiAgICAgICAgbGV0IG4gPSAxLCBuZXh0XG4gICAgICAgIGNvbnN0IHNxdWFyZWQgPSBbXVxuICAgICAgICBkb1xuICAgICAgICB7XG4gICAgICAgICAgICBuZXh0ID0gTWF0aC5wb3coMiwgbisrKVxuICAgICAgICAgICAgc3F1YXJlZC5wdXNoKG5leHQpXG4gICAgICAgIH0gd2hpbGUgKG5leHQgPD0gbWF4U2l6ZSlcblxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCh0aGlzLnggLSB0aGlzLmJ1ZmZlciwgdGhpcy55IC0gdGhpcy5idWZmZXIpXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHNxdWFyZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChzcXVhcmVkW2ldIDwgbWF4KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcXVhcmVkW2kgKyAxXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRkKGJsb2NrLCBjYW52YXNOdW1iZXIpXG4gICAge1xuICAgICAgICBpZiAodGhpcy54ICsgYmxvY2sud2lkdGggPCB0aGlzLm1heClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMueSArIGJsb2NrLmhlaWdodCA8IHRoaXMubWF4KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJsb2NrLnggPSB0aGlzLnhcbiAgICAgICAgICAgICAgICBibG9jay55ID0gdGhpcy55XG4gICAgICAgICAgICAgICAgYmxvY2suY2FudmFzID0gY2FudmFzTnVtYmVyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXJnZXN0ID0gYmxvY2suaGVpZ2h0ID4gdGhpcy5sYXJnZXN0ID8gYmxvY2suaGVpZ2h0IDogdGhpcy5sYXJnZXN0XG4gICAgICAgICAgICAgICAgdGhpcy54ICs9IGJsb2NrLndpZHRoICsgdGhpcy5idWZmZXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy55ICs9IHRoaXMubGFyZ2VzdCArIHRoaXMuYnVmZmVyXG4gICAgICAgICAgICBpZiAodGhpcy55ID4gdGhpcy5tYXgpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnggPSAwXG4gICAgICAgICAgICB0aGlzLmxhcmdlc3QgPSAwXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoYmxvY2ssIGNhbnZhc051bWJlcilcbiAgICAgICAgfVxuICAgIH1cbn0iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUFBLE1BQU0sQ0FBQ0MsT0FBTztFQUVWO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJLFNBQUFDLGFBQVlDLEdBQUcsRUFBRUMsS0FBSyxFQUFFQyxNQUFNLEVBQzlCO0lBQUFDLGVBQUEsT0FBQUosWUFBQTtJQUNJLElBQUksQ0FBQ0MsR0FBRyxHQUFHQSxHQUFHO0lBQ2QsSUFBSSxDQUFDRSxNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDRSxJQUFJLEdBQUcsRUFBRTtJQUNkLElBQUksQ0FBQ0MsQ0FBQyxHQUFHLENBQUM7SUFDVixJQUFJLENBQUNDLENBQUMsR0FBRyxDQUFDO0lBQ1YsSUFBSSxDQUFDQyxPQUFPLEdBQUcsQ0FBQztFQUNwQjtFQUFDLE9BQUFDLFlBQUEsQ0FBQVQsWUFBQTtJQUFBVSxHQUFBO0lBQUFDLEtBQUEsRUFFRCxTQUFBQyxNQUFNQSxDQUFDQyxPQUFPLEVBQ2Q7TUFDSSxJQUFJQyxDQUFDLEdBQUcsQ0FBQztRQUFFQyxJQUFJO01BQ2YsSUFBTUMsT0FBTyxHQUFHLEVBQUU7TUFDbEIsR0FDQTtRQUNJRCxJQUFJLEdBQUdFLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsRUFBRUosQ0FBQyxFQUFFLENBQUM7UUFDdkJFLE9BQU8sQ0FBQ0csSUFBSSxDQUFDSixJQUFJLENBQUM7TUFDdEIsQ0FBQyxRQUFRQSxJQUFJLElBQUlGLE9BQU87TUFFeEIsSUFBTVosR0FBRyxHQUFHZ0IsSUFBSSxDQUFDaEIsR0FBRyxDQUFDLElBQUksQ0FBQ0ssQ0FBQyxHQUFHLElBQUksQ0FBQ0gsTUFBTSxFQUFFLElBQUksQ0FBQ0ksQ0FBQyxHQUFHLElBQUksQ0FBQ0osTUFBTSxDQUFDO01BRWhFLEtBQUssSUFBSWlCLENBQUMsR0FBR0osT0FBTyxDQUFDSyxNQUFNLEdBQUcsQ0FBQyxFQUFFRCxDQUFDLElBQUksQ0FBQyxFQUFFQSxDQUFDLEVBQUUsRUFDNUM7UUFDSSxJQUFJSixPQUFPLENBQUNJLENBQUMsQ0FBQyxHQUFHbkIsR0FBRyxFQUNwQjtVQUNJLE9BQU9lLE9BQU8sQ0FBQ0ksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QjtNQUNKO0lBQ0o7RUFBQztJQUFBVixHQUFBO0lBQUFDLEtBQUEsRUFFRCxTQUFBVyxHQUFHQSxDQUFDQyxLQUFLLEVBQUVDLFlBQVksRUFDdkI7TUFDSSxJQUFJLElBQUksQ0FBQ2xCLENBQUMsR0FBR2lCLEtBQUssQ0FBQ0UsS0FBSyxHQUFHLElBQUksQ0FBQ3hCLEdBQUcsRUFDbkM7UUFDSSxJQUFJLElBQUksQ0FBQ00sQ0FBQyxHQUFHZ0IsS0FBSyxDQUFDRyxNQUFNLEdBQUcsSUFBSSxDQUFDekIsR0FBRyxFQUNwQztVQUNJc0IsS0FBSyxDQUFDakIsQ0FBQyxHQUFHLElBQUksQ0FBQ0EsQ0FBQztVQUNoQmlCLEtBQUssQ0FBQ2hCLENBQUMsR0FBRyxJQUFJLENBQUNBLENBQUM7VUFDaEJnQixLQUFLLENBQUNJLE1BQU0sR0FBR0gsWUFBWTtVQUMzQixJQUFJLENBQUNoQixPQUFPLEdBQUdlLEtBQUssQ0FBQ0csTUFBTSxHQUFHLElBQUksQ0FBQ2xCLE9BQU8sR0FBR2UsS0FBSyxDQUFDRyxNQUFNLEdBQUcsSUFBSSxDQUFDbEIsT0FBTztVQUN4RSxJQUFJLENBQUNGLENBQUMsSUFBSWlCLEtBQUssQ0FBQ0UsS0FBSyxHQUFHLElBQUksQ0FBQ3RCLE1BQU07VUFDbkMsT0FBTyxJQUFJO1FBQ2YsQ0FBQyxNQUVEO1VBQ0ksT0FBTyxLQUFLO1FBQ2hCO01BQ0osQ0FBQyxNQUVEO1FBQ0ksSUFBSSxDQUFDSSxDQUFDLElBQUksSUFBSSxDQUFDQyxPQUFPLEdBQUcsSUFBSSxDQUFDTCxNQUFNO1FBQ3BDLElBQUksSUFBSSxDQUFDSSxDQUFDLEdBQUcsSUFBSSxDQUFDTixHQUFHLEVBQ3JCO1VBQ0ksT0FBTyxLQUFLO1FBQ2hCO1FBQ0EsSUFBSSxDQUFDSyxDQUFDLEdBQUcsQ0FBQztRQUNWLElBQUksQ0FBQ0UsT0FBTyxHQUFHLENBQUM7UUFDaEIsT0FBTyxJQUFJLENBQUNjLEdBQUcsQ0FBQ0MsS0FBSyxFQUFFQyxZQUFZLENBQUM7TUFDeEM7SUFDSjtFQUFDO0FBQUEsR0FDSiIsImlnbm9yZUxpc3QiOltdfQ==