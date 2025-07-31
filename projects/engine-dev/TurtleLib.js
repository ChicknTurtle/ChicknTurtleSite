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
        power(exponent) {
            this.x = tlib.pow(this.x,exponent);
            this.y = tlib.pow(this.y,exponent);
            return this;
        }
        magnitude() {
            return Math.sqrt(this.x*this.x + this.y*this.y);
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
            return `Vec2(${this.x},${this.y})`;
        }
        equals(other) {
            return this.x === other.x && this.y === other.y;
        }
    },

    Color: class {
        constructor(r=0,g=0,b=0,a=1) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
        addValue(x) {
            this.r = Math.max(0,this.r+x)
            this.g = Math.max(0,this.g+x)
            this.b = Math.max(0,this.b+x)
            return this
        }
        multValue(scalar) {
            this.r = Math.max(0,this.r*scalar)
            this.g = Math.max(0,this.g*scalar)
            this.b = Math.max(0,this.b*scalar)
            return this
        }
        clone() {
            return new tlib.Color(this.r,this.g,this.b,this.a);
        }
        toArray() {
            return [this.r,this.g,this.b,this.a];
        }
        toString() {
            if (this.a == 1) {
                return `rgb(${this.r},${this.g},${this.b})`;
            }
            return `rgba(${this.r},${this.g},${this.b},${this.a})`;
        }
    },

    // functions

    randInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    pow: function(x,y) {
        let result = Math.pow(Math.abs(x),y);
        if (x < 0) { result *= -1; }
        return result;
    },

    /** Check AABB collision between two objects with pos and size Vec2 values
     * @param {{pos:tlib.Vec2,size:tlib.Vec2}} box1 First object
     * @param {{pos:tlib.Vec2,size:tlib.Vec2}} box2 Second object
     * @returns {boolean} Whether the objects are colliding */
    checkAABB: function(box1, box2) {
        return (
            box1.pos.x < box2.pos.x + box2.size.x &&
            box1.pos.x + box1.size.x > box2.pos.x &&
            box1.pos.y < box2.pos.y + box2.size.y &&
            box1.pos.y + box1.size.y > box2.pos.y
        );
    },
    /** Check circular collision between two objects with pos and size Vec2 values  
     * Radius is calculated as half of the smallest of the object's width or height
     * @param {{pos:tlib.Vec2,radius:number}} box1 First object
     * @param {{pos:tlib.Vec2,radius:number}} box2 Second object
     * @returns {boolean} Whether the objects are colliding */
    checkCirclular: function(ball1, ball2) {
        ball1Center = ball1.pos.clone().add(new tlib.Vec2(ball1.radius)); 
        ball2Center = ball2.pos.clone().add(new tlib.Vec2(ball2.radius));
        const delta = ball1Center.clone().subtract(ball2Center);
        const distance = Math.sqrt(delta.x*delta.x + delta.y*delta.y);
        return distance < ball1.radius+ball2.radius;
    },
    /** Check collision between a box and ball, each with pos and size Vec2 values  
     * Ball radius is calculated as half of the smallest of the object's width or height
     * @param {{pos:tlib.Vec2,size:tlib.Vec2}} box Box object
     * @param {{pos:tlib.Vec2,radius:number}} ball Ball object
     * @returns {boolean} Whether the objects are colliding */
    checkRectCircle: function(box, ball) {
        ballCenter = ball.pos.clone().add(new tlib.Vec2(ball.radius));
        const radius = Math.min(ball.size.x,ball.size.y)/2;
        let closest = ballCenter;
        // Find closest edge of rectangle to circle center
        if (ballCenter.x < box.pos.x) {
            closest.x = box.pos.x;
        } else if (ballCenter.x > box.pos.x + box.size.x) {
            closest.x = box.pos.x + box.size.x;
        }
        if (ballCenter.y < box.pos.y) {
            closest.y = box.pos.y;
        } else if (ballCenter.y > box.pos.y + box.size.y) {
            closest.y = box.pos.y + box.size.y;
        }
        const distancePos = ballCenter.clone().subtract(closest);
        const distance = Math.sqrt(distancePos.x*distancePos.x + distancePos.y*distancePos.y);
        return distance <= radius;
    },

    /** A simple tweening function
     * @param {number} start Start number
     * @param {number} end End number
     * @param {number} amount Amount to tween from 0-1, default = `0.5` */
    tween: function(start, end, amount=0.5) {
        return (1 - amount) * start + amount * end;
    }
}

// expose methods to global scope
Object.keys(tlib).forEach(key => {
    if (window[key]) {
        console.warn(`[TurtleLib] '${key}' global var already exists`);
    } else {
        window[key] = tlib[key];
    }
});
