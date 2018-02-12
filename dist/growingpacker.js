"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @file growingpacker.js
 * @author David Figatner
 * @license MIT
 * @copyright YOPEY YOPEY LLC 2016
 * {@link https://github.com/davidfig/rendersheet}
 *
 * based on
 * packer.growing.js {@link https://github.com/jakesgordon/bin-packing/}
 * by Jake Gordon
 * MIT license
 * Copyright (c) 2011-2016 Jake Gordon and contributors
 */

var GrowingPacker = function () {
    function GrowingPacker(max, first, buffer) {
        _classCallCheck(this, GrowingPacker);

        this.max = max;
        this.buffer = buffer;
        this.root = { x: 0, y: 0, w: first.width + buffer, h: first.height + buffer };
    }

    _createClass(GrowingPacker, [{
        key: "finish",
        value: function finish(maxSize) {
            var n = 1,
                next = void 0;
            var squared = [];
            do {
                next = Math.pow(2, n++);
                squared.push(next);
            } while (next <= maxSize);

            var max = Math.max(this.root.w, this.root.h);

            for (var i = squared.length - 1; i >= 0; i--) {
                if (squared[i] < max) {
                    return squared[i + 1];
                }
            }
        }
    }, {
        key: "add",
        value: function add(block, canvasNumber) {
            var result = void 0,
                node = void 0;
            if (node = this.findNode(this.root, block.width + this.buffer, block.height + this.buffer)) {
                result = this.splitNode(node, block.width + this.buffer, block.height + this.buffer);
            } else {
                result = this.growNode(block.width + this.buffer, block.height + this.buffer);
                if (!result) {
                    return false;
                }
            }
            block.x = result.x;
            block.y = result.y;
            block.canvas = canvasNumber;
            return true;
        }
    }, {
        key: "findNode",
        value: function findNode(root, w, h) {
            if (root.used) {
                return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
            } else if (w <= root.w && h <= root.h) {
                return root;
            } else {
                return null;
            }
        }
    }, {
        key: "splitNode",
        value: function splitNode(node, w, h) {
            node.used = true;
            node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
            node.right = { x: node.x + w, y: node.y, w: node.w - w, h: h };
            return node;
        }
    }, {
        key: "growNode",
        value: function growNode(w, h) {
            var canGrowDown = w <= this.root.w;
            var canGrowRight = h <= this.root.h;

            var shouldGrowRight = canGrowRight && this.root.h >= this.root.w + w; // attempt to keep square-ish by growing right when height is much greater than width
            var shouldGrowDown = canGrowDown && this.root.w >= this.root.h + h; // attempt to keep square-ish by growing down  when width  is much greater than height

            if (shouldGrowRight) {
                return this.growRight(w, h);
            } else if (shouldGrowDown) {
                return this.growDown(w, h);
            } else if (canGrowRight) {
                return this.growRight(w, h);
            } else if (canGrowDown) {
                return this.growDown(w, h);
            } else {
                return null;
            }
        }
    }, {
        key: "growRight",
        value: function growRight(w, h) {
            if (this.root.w + w >= this.max) {
                return null;
            }
            this.root = {
                used: true,
                x: 0,
                y: 0,
                w: this.root.w + w,
                h: this.root.h,
                down: this.root,
                right: { x: this.root.w, y: 0, w: w, h: this.root.h }
            };
            var node = void 0;
            if (node = this.findNode(this.root, w, h)) {
                return this.splitNode(node, w, h);
            } else {
                return null;
            }
        }
    }, {
        key: "growDown",
        value: function growDown(w, h) {
            if (this.root.h + h >= this.max) {
                return null;
            }
            this.root = {
                used: true,
                x: 0,
                y: 0,
                w: this.root.w,
                h: this.root.h + h,
                down: { x: 0, y: this.root.h, w: this.root.w, h: h },
                right: this.root
            };
            var node = void 0;
            if (node = this.findNode(this.root, w, h)) {
                return this.splitNode(node, w, h);
            } else {
                return null;
            }
        }
    }]);

    return GrowingPacker;
}();

module.exports = GrowingPacker;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ncm93aW5ncGFja2VyLmpzIl0sIm5hbWVzIjpbIkdyb3dpbmdQYWNrZXIiLCJtYXgiLCJmaXJzdCIsImJ1ZmZlciIsInJvb3QiLCJ4IiwieSIsInciLCJ3aWR0aCIsImgiLCJoZWlnaHQiLCJtYXhTaXplIiwibiIsIm5leHQiLCJzcXVhcmVkIiwiTWF0aCIsInBvdyIsInB1c2giLCJpIiwibGVuZ3RoIiwiYmxvY2siLCJjYW52YXNOdW1iZXIiLCJyZXN1bHQiLCJub2RlIiwiZmluZE5vZGUiLCJzcGxpdE5vZGUiLCJncm93Tm9kZSIsImNhbnZhcyIsInVzZWQiLCJyaWdodCIsImRvd24iLCJjYW5Hcm93RG93biIsImNhbkdyb3dSaWdodCIsInNob3VsZEdyb3dSaWdodCIsInNob3VsZEdyb3dEb3duIiwiZ3Jvd1JpZ2h0IiwiZ3Jvd0Rvd24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7SUFjTUEsYTtBQUVGLDJCQUFZQyxHQUFaLEVBQWlCQyxLQUFqQixFQUF3QkMsTUFBeEIsRUFDQTtBQUFBOztBQUNJLGFBQUtGLEdBQUwsR0FBV0EsR0FBWDtBQUNBLGFBQUtFLE1BQUwsR0FBY0EsTUFBZDtBQUNBLGFBQUtDLElBQUwsR0FBWSxFQUFFQyxHQUFHLENBQUwsRUFBUUMsR0FBRyxDQUFYLEVBQWNDLEdBQUdMLE1BQU1NLEtBQU4sR0FBY0wsTUFBL0IsRUFBdUNNLEdBQUdQLE1BQU1RLE1BQU4sR0FBZVAsTUFBekQsRUFBWjtBQUNIOzs7OytCQUVNUSxPLEVBQ1A7QUFDSSxnQkFBSUMsSUFBSSxDQUFSO0FBQUEsZ0JBQVdDLGFBQVg7QUFDQSxnQkFBTUMsVUFBVSxFQUFoQjtBQUNBLGVBQ0E7QUFDSUQsdUJBQU9FLEtBQUtDLEdBQUwsQ0FBUyxDQUFULEVBQVlKLEdBQVosQ0FBUDtBQUNBRSx3QkFBUUcsSUFBUixDQUFhSixJQUFiO0FBQ0gsYUFKRCxRQUlTQSxRQUFRRixPQUpqQjs7QUFN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Ii8qKlxuICogQGZpbGUgZ3Jvd2luZ3BhY2tlci5qc1xuICogQGF1dGhvciBEYXZpZCBGaWdhdG5lclxuICogQGxpY2Vuc2UgTUlUXG4gKiBAY29weXJpZ2h0IFlPUEVZIFlPUEVZIExMQyAyMDE2XG4gKiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2RhdmlkZmlnL3JlbmRlcnNoZWV0fVxuICpcbiAqIGJhc2VkIG9uXG4gKiBwYWNrZXIuZ3Jvd2luZy5qcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2pha2VzZ29yZG9uL2Jpbi1wYWNraW5nL31cbiAqIGJ5IEpha2UgR29yZG9uXG4gKiBNSVQgbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTYgSmFrZSBHb3Jkb24gYW5kIGNvbnRyaWJ1dG9yc1xuICovXG5cbmNsYXNzIEdyb3dpbmdQYWNrZXJcbntcbiAgICBjb25zdHJ1Y3RvcihtYXgsIGZpcnN0LCBidWZmZXIpXG4gICAge1xuICAgICAgICB0aGlzLm1heCA9IG1heFxuICAgICAgICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlclxuICAgICAgICB0aGlzLnJvb3QgPSB7IHg6IDAsIHk6IDAsIHc6IGZpcnN0LndpZHRoICsgYnVmZmVyLCBoOiBmaXJzdC5oZWlnaHQgKyBidWZmZXIgfVxuICAgIH1cblxuICAgIGZpbmlzaChtYXhTaXplKVxuICAgIHtcbiAgICAgICAgbGV0IG4gPSAxLCBuZXh0XG4gICAgICAgIGNvbnN0IHNxdWFyZWQgPSBbXVxuICAgICAgICBkb1xuICAgICAgICB7XG4gICAgICAgICAgICBuZXh0ID0gTWF0aC5wb3coMiwgbisrKVxuICAgICAgICAgICAgc3F1YXJlZC5wdXNoKG5leHQpXG4gICAgICAgIH0gd2hpbGUgKG5leHQgPD0gbWF4U2l6ZSlcblxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCh0aGlzLnJvb3QudywgdGhpcy5yb290LmgpXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHNxdWFyZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChzcXVhcmVkW2ldIDwgbWF4KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcXVhcmVkW2kgKyAxXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRkKGJsb2NrLCBjYW52YXNOdW1iZXIpXG4gICAge1xuICAgICAgICBsZXQgcmVzdWx0LCBub2RlXG4gICAgICAgIGlmIChub2RlID0gdGhpcy5maW5kTm9kZSh0aGlzLnJvb3QsIGJsb2NrLndpZHRoICsgdGhpcy5idWZmZXIsIGJsb2NrLmhlaWdodCArIHRoaXMuYnVmZmVyKSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5zcGxpdE5vZGUobm9kZSwgYmxvY2sud2lkdGggKyB0aGlzLmJ1ZmZlciwgYmxvY2suaGVpZ2h0ICsgdGhpcy5idWZmZXIpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLmdyb3dOb2RlKGJsb2NrLndpZHRoICsgdGhpcy5idWZmZXIsIGJsb2NrLmhlaWdodCArIHRoaXMuYnVmZmVyKVxuICAgICAgICAgICAgaWYgKCFyZXN1bHQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYmxvY2sueCA9IHJlc3VsdC54XG4gICAgICAgIGJsb2NrLnkgPSByZXN1bHQueVxuICAgICAgICBibG9jay5jYW52YXMgPSBjYW52YXNOdW1iZXJcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICBmaW5kTm9kZShyb290LCB3LCBoKVxuICAgIHtcbiAgICAgICAgaWYgKHJvb3QudXNlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluZE5vZGUocm9vdC5yaWdodCwgdywgaCkgfHwgdGhpcy5maW5kTm9kZShyb290LmRvd24sIHcsIGgpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKHcgPD0gcm9vdC53KSAmJiAoaCA8PSByb290LmgpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gcm9vdFxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNwbGl0Tm9kZShub2RlLCB3LCBoKVxuICAgIHtcbiAgICAgICAgbm9kZS51c2VkID0gdHJ1ZVxuICAgICAgICBub2RlLmRvd24gID0geyB4OiBub2RlLngsICAgICB5OiBub2RlLnkgKyBoLCB3OiBub2RlLncsICAgICBoOiBub2RlLmggLSBoIH1cbiAgICAgICAgbm9kZS5yaWdodCA9IHsgeDogbm9kZS54ICsgdywgeTogbm9kZS55LCAgICAgdzogbm9kZS53IC0gdywgaDogaCAgICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlXG4gICAgfVxuXG4gICAgZ3Jvd05vZGUodywgaClcbiAgICB7XG4gICAgICAgIGNvbnN0IGNhbkdyb3dEb3duICA9ICh3IDw9IHRoaXMucm9vdC53KVxuICAgICAgICBjb25zdCBjYW5Hcm93UmlnaHQgPSAoaCA8PSB0aGlzLnJvb3QuaClcblxuICAgICAgICBjb25zdCBzaG91bGRHcm93UmlnaHQgPSBjYW5Hcm93UmlnaHQgJiYgKHRoaXMucm9vdC5oID49ICh0aGlzLnJvb3QudyArIHcpKSAvLyBhdHRlbXB0IHRvIGtlZXAgc3F1YXJlLWlzaCBieSBncm93aW5nIHJpZ2h0IHdoZW4gaGVpZ2h0IGlzIG11Y2ggZ3JlYXRlciB0aGFuIHdpZHRoXG4gICAgICAgIGNvbnN0IHNob3VsZEdyb3dEb3duICA9IGNhbkdyb3dEb3duICAmJiAodGhpcy5yb290LncgPj0gKHRoaXMucm9vdC5oICsgaCkpIC8vIGF0dGVtcHQgdG8ga2VlcCBzcXVhcmUtaXNoIGJ5IGdyb3dpbmcgZG93biAgd2hlbiB3aWR0aCAgaXMgbXVjaCBncmVhdGVyIHRoYW4gaGVpZ2h0XG5cbiAgICAgICAgaWYgKHNob3VsZEdyb3dSaWdodClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3Jvd1JpZ2h0KHcsIGgpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2hvdWxkR3Jvd0Rvd24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdyb3dEb3duKHcsIGgpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY2FuR3Jvd1JpZ2h0KVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ncm93UmlnaHQodywgaClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjYW5Hcm93RG93bilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3Jvd0Rvd24odywgaClcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBncm93UmlnaHQodywgaClcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnJvb3QudyArIHcgPj0gdGhpcy5tYXgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yb290ID0ge1xuICAgICAgICAgICAgdXNlZDogdHJ1ZSxcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgdzogdGhpcy5yb290LncgKyB3LFxuICAgICAgICAgICAgaDogdGhpcy5yb290LmgsXG4gICAgICAgICAgICBkb3duOiB0aGlzLnJvb3QsXG4gICAgICAgICAgICByaWdodDogeyB4OiB0aGlzLnJvb3QudywgeTogMCwgdzogdywgaDogdGhpcy5yb290LmggfVxuICAgICAgICB9XG4gICAgICAgIGxldCBub2RlXG4gICAgICAgIGlmIChub2RlID0gdGhpcy5maW5kTm9kZSh0aGlzLnJvb3QsIHcsIGgpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zcGxpdE5vZGUobm9kZSwgdywgaClcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBncm93RG93bih3LCBoKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMucm9vdC5oICsgaCA+PSB0aGlzLm1heClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJvb3QgPSB7XG4gICAgICAgICAgICB1c2VkOiB0cnVlLFxuICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICB3OiB0aGlzLnJvb3QudyxcbiAgICAgICAgICAgIGg6IHRoaXMucm9vdC5oICsgaCxcbiAgICAgICAgICAgIGRvd246ICB7IHg6IDAsIHk6IHRoaXMucm9vdC5oLCB3OiB0aGlzLnJvb3QudywgaDogaCB9LFxuICAgICAgICAgICAgcmlnaHQ6IHRoaXMucm9vdFxuICAgICAgICB9XG4gICAgICAgIGxldCBub2RlXG4gICAgICAgIGlmIChub2RlID0gdGhpcy5maW5kTm9kZSh0aGlzLnJvb3QsIHcsIGgpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zcGxpdE5vZGUobm9kZSwgdywgaClcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3Jvd2luZ1BhY2tlciJdfQ==