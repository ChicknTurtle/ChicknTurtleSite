var tlib = {

    // classes

    Vec2: class {
        constructor(x=0,y=null) {
            y = y || x;
            this.x = x;
            this.y = y;
        }
        add(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }
        subtract(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }
        multiply(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        }
        divide(scalar) {
            if (scalar === 0) { throw new Error("Division by zero is not allowed."); }
            this.x /= scalar;
            this.y /= scalar;
            return this;
        }
        magnitude() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        normalize() {
            const mag = this.magnitude();
            if (mag !== 0) {
                this.divide(mag);
            }
            return this;
        }
        dot(v) {
            return this.x*v.x + this.y*v.y;
        }
        distance(v) {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            return Math.sqrt(dx*dx + dy*dy);
        }
        clone() {
            return new tlib.Vec2(this.x, this.y);
        }
        toArray() {
            return [this.x, this.y];
        }
        static fromArray(array) {
            if (!Array.isArray(array) || array.length !== 2) {
                throw new Error("Invalid array format. Array must contain two numbers.");
            }
            return new tlib.Vec2(array[0], array[1]);
        }
        toString() {
            return `Vec2(${this.x}, ${this.y})`;
        }
    },

    Color: class {
        constructor(r=0,g=0,b=0,a=1) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
        toString() {
            return `rgba(${this.r},${this.g},${this.b},${this.a})`;
        }
    },

    // functions

    randInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    /** A simple tweening function
     * @param {number} start Start number
     * @param {number} end End number
     * @param {number} amount Amount to tween from 0-1, default = `0.5` */
    tween: function(start, end, amount=0.5) {
        return (1 - amount) * start + amount * end;
    }
}