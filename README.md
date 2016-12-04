libshapes
====

`libshapes` is a package exporting classes and functions for representing, manipulating, and inspecting 2d geometric shapes.

## `Vertex`
Building block for all shapes. A `Vertex` is defined by an `x` and a `y` coordinates.

`class Vertex([x, y])`

Constructs a new `Vertex`.

`function same(Vertex, Vertex)`

Whether two `Vertex`s share the same coordinates.

`function rotate(Vertex, angle)`

Returns a new `Vertex` rotated about the origin (0,0). `angle` is given in radians.

`function translate(Vertex, [x, y])`

Returns a new `Vertex` translated by `Vertex.x + x` and `Vertex.y + y`.


## `Edge`
Composed of two vertices, an `Edge` is the line between to `Vertex`s.

`class Edge([[x0, y0], [x1, y1]])`

Constructs a new `Edge`. _Note_: takes an array of length 2, containing two arrays of two real numbers. Does _not_ take two `Vertex`s.

`Edge.slope()`

Returns the slope of the `Edge`.

`Edge.vertices()`

Returns the `Vertex`s of the `Edge`.

`Edge.yIntercept()`

Returns the y-intercept of the line defined by the `Edge`. _Note_: The `Edge` does _not_ need to intersect the y-axis to have a y-intercept.

`Edge.left()`

Returns the `Vertex` of the `Edge` with the lesser x coordinate.

`Edge.right()`

Returns the `Vertex` of the `Edge` with the greater x coordinate.

`Edge.top()`

Returns the `Vertex` of the `Edge` with the greater y coordinate.

`Edge.bottom()`

Returns the `Vertex` of the `Edge` with the lesser y coordinate.

`function intersect(Edge, Edge)`

Whether two `Edge`s intersect.

`function coincident(Edge, Edge)`

Whether two `Edge`s are _coincident_. That is, whether they are parallel and overlapped.

`function subsect(Edge, Edge)`

Returns a new array of `Edge`s. Derived from the `Vertex`s of two coincident `Edge`s. If the given `Edge`s are _not_ coincident, an empty array is returned.

## `Shape`
A geometric object composed of three or more `Vertex`s.

`class Shape([[x0, y0], [x1, y1], [x2, x2][, ...[xN, yN]]])`

Constructs a new `Shape`. _Note_: takes an array, `V`, of [x, y] coordinates where `V.length >= 2`.
