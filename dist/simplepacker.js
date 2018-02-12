"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @file simple-packer.js
 * @author David Figatner
 * @license MIT
 * @copyright YOPEY YOPEY LLC 2016
 * {@link https://github.com/davidfig/rendersheet}
 */

module.exports = function () {
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

    _createClass(SimplePacker, [{
        key: "finish",
        value: function finish(maxSize) {
            var n = 1,
                next = void 0;
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

    return SimplePacker;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zaW1wbGVwYWNrZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1heCIsImZpcnN0IiwiYnVmZmVyIiwibGlzdCIsIngiLCJ5IiwibGFyZ2VzdCIsIm1heFNpemUiLCJuIiwibmV4dCIsInNxdWFyZWQiLCJNYXRoIiwicG93IiwicHVzaCIsImkiLCJsZW5ndGgiLCJibG9jayIsImNhbnZhc051bWJlciIsIndpZHRoIiwiaGVpZ2h0IiwiY2FudmFzIiwiYWRkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7Ozs7Ozs7QUFRQUEsT0FBT0MsT0FBUDtBQUVJOzs7Ozs7QUFNQSwwQkFBWUMsR0FBWixFQUFpQkMsS0FBakIsRUFBd0JDLE1BQXhCLEVBQ0E7QUFBQTs7QUFDSSxhQUFLRixHQUFMLEdBQVdBLEdBQVg7QUFDQSxhQUFLRSxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxhQUFLQyxJQUFMLEdBQVksRUFBWjtBQUNBLGFBQUtDLENBQUwsR0FBUyxDQUFUO0FBQ0EsYUFBS0MsQ0FBTCxHQUFTLENBQVQ7QUFDQSxhQUFLQyxPQUFMLEdBQWUsQ0FBZjtBQUNIOztBQWhCTDtBQUFBO0FBQUEsK0JBa0JXQyxPQWxCWCxFQW1CSTtBQUNJLGdCQUFJQyxJQUFJLENBQVI7QUFBQSxnQkFBV0MsYUFBWDtBQUNBLGdCQUFNQyxVQUFVLEVBQWhCO0FBQ0EsZUFDQTtBQUNJRCx1QkFBT0UsS0FBS0MsR0FBTCxDQUFTLENBQVQsRUFBWUosR0FBWixDQUFQO0FBQ0FFLHdCQUFRRyxJQUFSLENBQWFKLElBQWI7QUFDSCxhQUpELFFBSVNBLFFBQVFGLE9BSmpCOztBQU1BLGdCQUFNUCxNQUFNVyxLQUFLWCxHQUFMLENBQVMsS0FBS0ksQ0FBTCxHQUFTLEtBQUtGLE1BQXZCLEVBQStCLEtBQUtHLENBQUwsR0FBUyxLQUFLSCxNQUE3QyxDQUFaOztBQUVBLGlCQUFLLElBQUlZLElBQUlKLFFBQVFLLE1BQVIsR0FBaUIsQ0FBOUIsRUFBaUNELEtBQUssQ0FBdEMsRUFBeUNBLEdBQXpDLEVBQ0E7QUFDSSxvQkFBSUosUUFBUUksQ0FBUixJQUFhZCxHQUFqQixFQUNBO0FBQ0ksMkJBQU9VLFFBQVFJLElBQUksQ0FBWixDQUFQO0FBQ0g7QUFDSjtBQUNKO0FBckNMO0FBQUE7QUFBQSw0QkF1Q1FFLEtBdkNSLEVBdUNlQyxZQXZDZixFQXdDSTtBQUNJLGdCQUFJLEtBQUtiLENBQUwsR0FBU1ksTUFBTUUsS0FBZixHQUF1QixLQUFLbEIsR0FBaEMsRUFDQTtBQUNJLG9CQUFJLEtBQUtLLENBQUwsR0FBU1csTUFBTUcsTUFBZixHQUF3QixLQUFLbkIsR0FBakMsRUFDQTtBQUNJZ0IsMEJBQU1aLENBQU4sR0FBVSxLQUFLQSxDQUFmO0FBQ0FZLDBCQUFNWCxDQUFOLEdBQVUsS0FBS0EsQ0FBZjtBQUNBVywwQkFBTUksTUFBTixHQUFlSCxZQUFmO0FBQ0EseUJBQUtYLE9BQUwsR0FBZVUsTUFBTUcsTUFBTixHQUFlLEtBQUtiLE9BQXBCLEdBQThCVSxNQUFNRyxNQUFwQyxHQUE2QyxLQUFLYixPQUFqRTtBQUNBLHlCQUFLRixDQUFMLElBQVVZLE1BQU1FLEtBQU4sR0FBYyxLQUFLaEIsTUFBN0I7QUFDQSwyQkFBTyxJQUFQO0FBQ0gsaUJBUkQsTUFVQTtBQUNJLDJCQUFPLEtBQVA7QUFDSDtBQUNKLGFBZkQsTUFpQkE7QUFDSSxxQkFBS0csQ0FBTCxJQUFVLEtBQUtDLE9BQUwsR0FBZSxLQUFLSixNQUE5QjtBQUNBLG9CQUFJLEtBQUtHLENBQUwsR0FBUyxLQUFLTCxHQUFsQixFQUNBO0FBQ0ksMkJBQU8sS0FBUDtBQUNIO0FBQ0QscUJBQUtJLENBQUwsR0FBUyxDQUFUO0FBQ0EscUJBQUtFLE9BQUwsR0FBZSxDQUFmO0FBQ0EsdUJBQU8sS0FBS2UsR0FBTCxDQUFTTCxLQUFULEVBQWdCQyxZQUFoQixDQUFQO0FBQ0g7QUFDSjtBQXBFTDs7QUFBQTtBQUFBIiwiZmlsZSI6InNpbXBsZXBhY2tlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGUgc2ltcGxlLXBhY2tlci5qc1xuICogQGF1dGhvciBEYXZpZCBGaWdhdG5lclxuICogQGxpY2Vuc2UgTUlUXG4gKiBAY29weXJpZ2h0IFlPUEVZIFlPUEVZIExMQyAyMDE2XG4gKiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2RhdmlkZmlnL3JlbmRlcnNoZWV0fVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2ltcGxlUGFja2VyXG57XG4gICAgLyoqXG4gICAgICogcmlkaWN1bG91c2x5IHNpbXBsZSBwYWNrZXIsIG9wdGltaXplZCAoaWYgeW91IGNhbiBjYWxsIGl0IHRoYXQpIG9ubHkgZm9yIHNwZWVkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBzaXplXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmaXJzdCBibG9ja1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBidWZmZXIgYmV0d2VlbiBlYWNoIGJsb2NrXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWF4LCBmaXJzdCwgYnVmZmVyKVxuICAgIHtcbiAgICAgICAgdGhpcy5tYXggPSBtYXhcbiAgICAgICAgdGhpcy5idWZmZXIgPSBidWZmZXJcbiAgICAgICAgdGhpcy5saXN0ID0gW11cbiAgICAgICAgdGhpcy54ID0gMFxuICAgICAgICB0aGlzLnkgPSAwXG4gICAgICAgIHRoaXMubGFyZ2VzdCA9IDBcbiAgICB9XG5cbiAgICBmaW5pc2gobWF4U2l6ZSlcbiAgICB7XG4gICAgICAgIGxldCBuID0gMSwgbmV4dFxuICAgICAgICBjb25zdCBzcXVhcmVkID0gW11cbiAgICAgICAgZG9cbiAgICAgICAge1xuICAgICAgICAgICAgbmV4dCA9IE1hdGgucG93KDIsIG4rKylcbiAgICAgICAgICAgIHNxdWFyZWQucHVzaChuZXh0KVxuICAgICAgICB9IHdoaWxlIChuZXh0IDw9IG1heFNpemUpXG5cbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5tYXgodGhpcy54IC0gdGhpcy5idWZmZXIsIHRoaXMueSAtIHRoaXMuYnVmZmVyKVxuXG4gICAgICAgIGZvciAobGV0IGkgPSBzcXVhcmVkLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoc3F1YXJlZFtpXSA8IG1heClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3F1YXJlZFtpICsgMV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZChibG9jaywgY2FudmFzTnVtYmVyKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMueCArIGJsb2NrLndpZHRoIDwgdGhpcy5tYXgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnkgKyBibG9jay5oZWlnaHQgPCB0aGlzLm1heClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBibG9jay54ID0gdGhpcy54XG4gICAgICAgICAgICAgICAgYmxvY2sueSA9IHRoaXMueVxuICAgICAgICAgICAgICAgIGJsb2NrLmNhbnZhcyA9IGNhbnZhc051bWJlclxuICAgICAgICAgICAgICAgIHRoaXMubGFyZ2VzdCA9IGJsb2NrLmhlaWdodCA+IHRoaXMubGFyZ2VzdCA/IGJsb2NrLmhlaWdodCA6IHRoaXMubGFyZ2VzdFxuICAgICAgICAgICAgICAgIHRoaXMueCArPSBibG9jay53aWR0aCArIHRoaXMuYnVmZmVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMueSArPSB0aGlzLmxhcmdlc3QgKyB0aGlzLmJ1ZmZlclxuICAgICAgICAgICAgaWYgKHRoaXMueSA+IHRoaXMubWF4KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy54ID0gMFxuICAgICAgICAgICAgdGhpcy5sYXJnZXN0ID0gMFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKGJsb2NrLCBjYW52YXNOdW1iZXIpXG4gICAgICAgIH1cbiAgICB9XG59Il19