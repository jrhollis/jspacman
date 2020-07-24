/**
 * Vector class with some helpful vector math functions. 
 * A Vector represents an x, y coordinate pair. could be tile 
 * location, pixel locations, whatever. 
 */
class Vector {
    //helpful vectors used for directions and tile math
    static ZERO = {x: 0, y: 0};
    static LEFT = {x: -1, y: 0};
    static RIGHT = {x: 1, y: 0};
    static UP = {x: 0, y: -1};
    static DOWN = {x: 0, y: 1};
    
    /**
     * add two coordinate pairs together
     * 
     * @param {*} v1 x,y coordinate pair
     * @param {*} v2 x,y coordinate pair
     */
    static add(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }
    /**
     * find the euclidian distance between two coordinate pairs
     * 
     * @param {*} v1 x,y coordinate pair
     * @param {*} v2 x,y coordinate pair
     */
    static distance(v1, v2) {
        return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
    }
    /**
     * invert the coordinate pair
     * 
     * @param {*} v x,y coordinate pair
     */
    static inverse(v) {
        return { x: -v.x, y: -v.y };
    }
    /**
     * create a copy of a coordinate pair
     * 
     * @param {*} v x,y coordinate pair
     */
    static clone(v) {
        return { x: v.x, y: v.y };
    }
    /**
     * see if two coordinate pairs are the same
     * 
     * @param {*} v1 x,y coordinate pair
     * @param {*} v2 x,y coordinate pair
     */
    static equals(v1, v2) {
        return v1.x == v2.x && v1.y == v2.y;
    }
}