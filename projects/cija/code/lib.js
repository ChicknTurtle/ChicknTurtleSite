
// classes

class Vec2 {
  constructor(x = 0, y = null) {
    if (Array.isArray(x)) {
      let newVec = Vec2.fromArray(x);
      this.x = newVec.x;
      this.y = newVec.y;
    } else {
      y = y ?? x;
      this.x = x;
      this.y = y;
    }
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  plus(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }
  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  minus(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }
  multiply(scalar) {
    this.x *= (scalar.x ?? scalar);
    this.y *= (scalar.y ?? scalar);
    return this;
  }
  times(scalar) {
    return new Vec2(this.x * (scalar.x ?? scalar), this.y * (scalar.y ?? scalar));
  }
  divide(scalar) {
    if (scalar === 0 || scalar.x === 0 || scalar.y === 0) { throw new Error("Division by zero is not allowed."); }
    this.x /= (scalar.x ?? scalar);
    this.y /= (scalar.y ?? scalar);
    return this;
  }
  divided(scalar) {
    if (scalar === 0 || scalar.x === 0 || scalar.y === 0) { throw new Error("Division by zero is not allowed."); }
    return new Vec2(this.x / (scalar.x ?? scalar), this.y / (scalar.y ?? scalar));
  }
  power(exponent) {
    this.x = Math.pow(this.x, exponent);
    this.y = Math.pow(this.y, exponent);
    return this;
  }
  powerto(exponent) {
    return new Vec2(Math.pow(this.x, exponent), Math.pow(this.y, exponent));
  }
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  isZero() {
    return (this.x === 0 && this.y === 0);
  }
  normalize() {
    const mag = this.magnitude();
    if (mag !== 0) {
      this.divide(mag);
    }
    return this;
  }
  normalized() {
    const mag = this.magnitude();
    if (mag !== 0) {
      return this.divided(mag);
    }
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  distance(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }
  rounded() {
    return new Vec2(Math.round(this.x), Math.round(this.y));
  }
  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }
  floored() {
    return new Vec2(Math.floor(this.x), Math.floor(this.y));
  }
  ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    return this;
  }
  ceiled() {
    return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
  }
  mod(div) {
    if (!(div instanceof Vec2)) { div = new Vec2(div) }
    this.x = this.x % div.x;
    this.y = this.y % div.y;
    return this;
  }
  modded(div) {
    if (!(div instanceof Vec2)) { div = new Vec2(div) }
    return new Vec2(this.x % div.x, this.y % div.y);
  }
  emod(div) {
    if (!(div instanceof Vec2)) { div = new Vec2(div) }
    this.x = ((this.x % div.x) + div.x) % div.x;
    this.y = ((this.y % div.y) + div.y) % div.y;
    return this;
  }
  emodded(div) {
    if (!(div instanceof Vec2)) { div = new Vec2(div) }
    return new Vec2(
      ((this.x % div.x) + div.x) % div.x,
      ((this.y % div.y) + div.y) % div.y
    );
  }
  clone() {
    return new Vec2(this.x, this.y);
  }
  equals(other) {
    return (this.x === other.x && this.y === other.y);
  }
  toArray() {
    return [this.x, this.y];
  }
  static fromArray(array) {
    if (!Array.isArray(array) || array.length !== 2) {
      throw new Error("Invalid array format. Array must contain two numbers.");
    }
    return new Vec2(array[0], array[1]);
  }
  toString() {
    return `Vec2(${this.x},${this.y})`;
  }
}

class Color {
  constructor(r = 0, g = 0, b = 0, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  addValue(x) {
    this.r = Math.max(0, this.r + x)
    this.g = Math.max(0, this.g + x)
    this.b = Math.max(0, this.b + x)
    return this
  }
  multValue(scalar) {
    this.r = Math.max(0, this.r * scalar)
    this.g = Math.max(0, this.g * scalar)
    this.b = Math.max(0, this.b * scalar)
    return this
  }
  clone() {
    return new Color(this.r, this.g, this.b, this.a);
  }
  toArray() {
    return [this.r, this.g, this.b, this.a];
  }
  toString() {
    if (this.a == 1) {
      return `rgb(${this.r},${this.g},${this.b})`;
    }
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }
}

// functions

function randInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * @param {number} start Start number
 * @param {number} end End number
 * @param {number} amount Amount to tween from 0-1, or smoothing strength if dt > 0, default = `0.5`
 * @param {number} dt Delta time for smooth tweening, if <= 0, use frame dependent logic, default = `0` */
function tween(start, end, amount = 0.5, dt = 0) {
  if (dt <= 0) {
    return (1 - amount) * start + amount * end;
  } else {
    const speed = -Math.log(1 - amount);
    const t = 1 - Math.exp(-speed * dt);
    return start + (end - start) * t;
  }
}
