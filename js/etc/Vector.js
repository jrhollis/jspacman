//represents an x, y pair. could be tile location, pixel locations, whatever
class Vector {
    static ZERO = {x: 0, y: 0};
    static LEFT = {x: -1, y: 0};
    static RIGHT = {x: 1, y: 0};
    static UP = {x: 0, y: -1};
    static DOWN = {x: 0, y: 1};
    static add(t1, t2) {
        return { x: t1.x + t2.x, y: t1.y + t2.y };
    }
    static distance(t1, t2) {
        return Math.sqrt(Math.pow(t1.x - t2.x, 2) + Math.pow(t1.y - t2.y, 2));
    }
    static inverse(v) {
        return { x: -v.x, y: -v.y };
    }
    static clone(v) {
        return { x: v.x, y: v.y };
    }
    static equals(v1, v2) {
        return v1.x==v2.x && v1.y == v2.y;
    }
}