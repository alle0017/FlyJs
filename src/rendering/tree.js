"use strict";
class Tree {
    constructor() {
        this.root = {
            dx: null,
            sx: null,
            value: null,
        };
    }
    set(data) {
    }
    fetch(value) {
        if (value <= this.root.value)
            return this.root;
        this.fetchSx(value, this.root);
    }
    fetchSx(value, node) {
        if (!node.sx)
            return null;
        else if (node.sx.value) {
            if (node.sx.value >= value)
                return node.sx;
        }
        let res = this.fetchSx(value, node.sx);
        if (res)
            return res;
        return this.fetchDx(value, node.sx);
    }
    fetchDx(value, node) {
        if (!node.dx)
            return null;
        else if (node.dx.value) {
            if (node.dx.value >= value)
                return node.sx;
        }
        let res = this.fetchSx(value, node.dx);
        if (res)
            return res;
        return this.fetchDx(value, node.dx);
    }
}
const tree = new Tree();
tree.root.sx = {
    sx: {
        value: 1,
        sx: {
            value: 2,
            sx: null,
            dx: null,
        },
        dx: {
            value: 3,
            sx: null,
            dx: null,
        }
    },
    dx: {
        sx: {
            value: 5,
            sx: {
                value: 6,
                sx: null,
                dx: null,
            },
            dx: null,
        },
        dx: null,
        value: 4
    },
    value: 0
};
console.log(tree.fetch(4));
