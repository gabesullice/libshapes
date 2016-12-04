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

`function shift(Vertex, [x, y])`

Returns a new `Vertex` translated by `Vertex.x + x` and `Vertex.y + y`.


## `Edge`
Composed of two vertices, an `Edge` is the line between to `Vertex`s.

`class Edge([[x0, y0], [x1, y1]])`

Constructs a new `Edge`. _Note_: takes an array of length 2, containing two arrays of two real numbers. Does _not_ take two `Vertex`s.


## `Shape`
A geometric object composed of three or more `Vertex`s.

`class Shape([[x0, y0], [x1, y1], [x2, x2][, ...[xN, yN]]])`

Constructs a new `Shape`. _Note_: takes an array, `V`, of [x, y] coordinates where `V.length >= 2`.
