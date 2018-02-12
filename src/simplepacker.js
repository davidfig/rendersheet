/**
 * @file simple-packer.js
 * @author David Figatner
 * @license MIT
 * @copyright YOPEY YOPEY LLC 2016
 * {@link https://github.com/davidfig/rendersheet}
 */

module.exports = class SimplePacker
{
    /**
     * ridiculously simple packer, optimized (if you can call it that) only for speed
     * @param {number} max size
     * @param {boolean} first block
     * @param {number} buffer between each block
     */
    constructor(max, first, buffer)
    {
        this.max = max
        this.buffer = buffer
        this.list = []
        this.x = 0
        this.y = 0
        this.largest = 0
    }

    finish(maxSize)
    {
        let n = 1, next
        const squared = []
        do
        {
            next = Math.pow(2, n++)
            squared.push(next)
        } while (next <= maxSize)

        const max = Math.max(this.x - this.buffer, this.y - this.buffer)

        for (let i = squared.length - 1; i >= 0; i--)
        {
            if (squared[i] < max)
            {
                return squared[i + 1]
            }
        }
    }

    add(block, canvasNumber)
    {
        if (this.x + block.width < this.max)
        {
            if (this.y + block.height < this.max)
            {
                block.x = this.x
                block.y = this.y
                block.canvas = canvasNumber
                this.largest = block.height > this.largest ? block.height : this.largest
                this.x += block.width + this.buffer
                return true
            }
            else
            {
                return false
            }
        }
        else
        {
            this.y += this.largest + this.buffer
            if (this.y > this.max)
            {
                return false
            }
            this.x = 0
            this.largest = 0
            return this.add(block, canvasNumber)
        }
    }
}