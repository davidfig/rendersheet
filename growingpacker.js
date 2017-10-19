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

class GrowingPacker
{
    constructor(max, first, buffer)
    {
        this.max = max
        this.buffer = buffer
        this.root = { x: 0, y: 0, w: first.width + buffer, h: first.height + buffer }
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

        const max = Math.max(this.root.w, this.root.h)

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
        let result, node
        if (node = this.findNode(this.root, block.width + this.buffer, block.height + this.buffer))
        {
            result = this.splitNode(node, block.width + this.buffer, block.height + this.buffer)
        }
        else
        {
            result = this.growNode(block.width + this.buffer, block.height + this.buffer)
            if (!result)
            {
                return false
            }
        }
        block.x = result.x
        block.y = result.y
        block.canvas = canvasNumber
        return true
    }

    findNode(root, w, h)
    {
        if (root.used)
        {
            return this.findNode(root.right, w, h) || this.findNode(root.down, w, h)
        }
        else if ((w <= root.w) && (h <= root.h))
        {
            return root
        }
        else
        {
            return null
        }
    }

    splitNode(node, w, h)
    {
        node.used = true
        node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h }
        node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          }
        return node
    }

    growNode(w, h)
    {
        const canGrowDown  = (w <= this.root.w)
        const canGrowRight = (h <= this.root.h)

        const shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w)) // attempt to keep square-ish by growing right when height is much greater than width
        const shouldGrowDown  = canGrowDown  && (this.root.w >= (this.root.h + h)) // attempt to keep square-ish by growing down  when width  is much greater than height

        if (shouldGrowRight)
        {
            return this.growRight(w, h)
        }
        else if (shouldGrowDown)
        {
            return this.growDown(w, h)
        }
        else if (canGrowRight)
        {
            return this.growRight(w, h)
        }
        else if (canGrowDown)
        {
            return this.growDown(w, h)
        }
        else
        {
            return null
        }
    }

    growRight(w, h)
    {
        if (this.root.w + w >= this.max)
        {
            return null
        }
        this.root = {
            used: true,
            x: 0,
            y: 0,
            w: this.root.w + w,
            h: this.root.h,
            down: this.root,
            right: { x: this.root.w, y: 0, w: w, h: this.root.h }
        }
        let node
        if (node = this.findNode(this.root, w, h))
        {
            return this.splitNode(node, w, h)
        }
        else
        {
            return null
        }
    }

    growDown(w, h)
    {
        if (this.root.h + h >= this.max)
        {
            return null
        }
        this.root = {
            used: true,
            x: 0,
            y: 0,
            w: this.root.w,
            h: this.root.h + h,
            down:  { x: 0, y: this.root.h, w: this.root.w, h: h },
            right: this.root
        }
        let node
        if (node = this.findNode(this.root, w, h))
        {
            return this.splitNode(node, w, h)
        }
        else
        {
            return null
        }
    }
}

module.exports = GrowingPacker