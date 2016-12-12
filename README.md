libshapes
====

[![Travis](https://img.shields.io/travis/gabesullice/libshapes.svg)](https://travis-ci.org/gabesullice/libshapes)

`libshapes` is a package exporting classes and functions for representing, manipulating, and inspecting 2d geometric shapes.

**Version Note**: API should not be considered stable until a 1.0.0 release.

# Contents

- [Overview](#overview)
- [Documentation](#documentation)
  - [Vertex](#vertex)
  - [Edge](#edge)
  - [Shape](#shape)
  - [Figure](#figure)
  - [Composition](#composition)

# Overview

`libshapes` is composed of small modules which can be combined to represent complex geometric shapes and collections of shapes. At the most basic level is the `Vertex`, which provides a class for an (x,y) coordinate. This includes methods and functions for comparing, rotating, and translating vertices. Above this, is the `Edge` module. This module provides a class which contains two `Vertex`s, the line between them being the "edge". This module also includes comparison, mutation, and a few other utilities for working with edges. Above this, the `Shape`. This is a class composed of many edges. These too can be compared and mutated. A `Figure` is a `Shape` paired with a position and angle of rotation. This allows a shape to be represented and moved about a cartesian plane. `Figure`s can be compared for overlap, colocation, and shape. `Figure`s can all be mutated.

# Documentation

## Vertex
Building block for all shapes. A `Vertex` is defined by an `x` and a `y` coordinates.

###`class Vertex([x, y])`

Constructs a new `Vertex`.

###`function distance(Vertex, Vertex)`

Computes the absolute distance between two `Vertex`s.

###`function same(Vertex, Vertex)`

Whether two `Vertex`s share the same coordinates, accurate to within `0.0000001`.

###`function rotate(Vertex, angle)`

Returns a new `Vertex` rotated about the origin (0,0). `angle` is given in radians.

###`function translate(Vertex, [offsetX, offsetY])`

Returns a new `Vertex` translated by `Vertex.x + offsetX` and `Vertex.y + offsetY`.


## Edge
Composed of two vertices, an `Edge` is the line between to `Vertex`s.

###`class Edge([[x0, y0], [x1, y1]])`

Constructs a new `Edge`. _Note_: takes an array of length 2, containing two arrays of two real numbers. Does _not_ take two `Vertex`s.

###`Edge.slope()`

Returns the slope of the `Edge`.

###`Edge.vertices()`

Returns the `Vertex`s of the `Edge`.

###`Edge.yIntercept()`

Returns the y-intercept of the line defined by the `Edge`. _Note_: The `Edge` does _not_ need to intersect the y-axis to have a y-intercept.

###`Edge.left()`

Returns the `Vertex` of the `Edge` with the lesser x coordinate.

###`Edge.right()`

Returns the `Vertex` of the `Edge` with the greater x coordinate.

###`Edge.top()`

Returns the `Vertex` of the `Edge` with the greater y coordinate.

###`Edge.bottom()`

Returns the `Vertex` of the `Edge` with the lesser y coordinate.

###`function same(Edge, Edge)`

Whether the given `Edge`s share the same `Vertex`s.

###`function intersect(Edge, Edge)`

Whether two `Edge`s intersect.

###`function coincident(Edge, Edge)`

Whether two `Edge`s are _coincident_. That is, whether they are parallel and overlapped.

###`function subsect(Edge, Edge)`

Returns a new array of `Edge`s. Derived from the `Vertex`s of two coincident `Edge`s. If the given `Edge`s are _not_ coincident, an empty array is returned.

###`function vertexIntersection(Edge, Vertex)`

Finds a `Vertex`, `iv`, along `Edge` where a line perpendicular to `Edge` also passes through `Vertex`. If one does not exist, returns `null`.

###`function vertexDistance(Edge, Vertex)`

Find the shortest distance between any point on `Edge` to `Vertex`.

## Shape
A geometric object composed of three or more `Vertex`s.

###`class Shape([[x0, y0], [x1, y1], [x2, x2][, ...[xN, yN]]])`

Constructs a new `Shape`. _Note_: takes an array, `V`, of [x, y] coordinates where `V.length >= 2`.

###`Shape.vertices()`

Returns the `Vertex`s of the `Shape`.

###`Shape.edges()`

Returns the `Edge`s defined by the `Vertex`s of the `Shape`.

###`Shape.rotate(angle)`

Returns a new `Shape` rotated about the origin (0,0). `angle` is given in radians.

###`Shape.translate([offsetX, offsetY])`

Returns a new `Shape` translated by the given offsets.

## Figure
A representation of a `Shape` combined with positional coordinates and a rotation angle.

###`class Figure({shape: Shape[, position: [offsetX, offsetY][, rotation: angle]})`

Constructs a new `Figure`. The only required key is `shape`. Defaults: `{position: [0,0], rotation: 0}`. `rotation` is given in radians.

###`Figure.shape()`

Returns the original `Shape` of the figure, with _no_ mutations for position or rotation taken into account.

###`Figure.vertices()`

Returns the computed `Vertex`s of the figure, taking into account the shape, position, and rotation of the `Figure`.

###`Figure.edges()`

Returns the computed `Edge`s of the figure, taking into account the shape, position, and rotation of the `Figure`.

###`Figure.position()`
###`Figure.position([offsetX, offsetY])`

Getter/Setter for the `Figure`'s position. Always returns the final position of the `Figure`.

###`Figure.translate([offsetX, offsetY])`

Translates the `Figure`'s position by the given offset. Always returns the final position of the `Figure`.

###`Figure.rotation(angle)`

Getter/Setter for the `Figure`'s rotation. Always returns the final rotation of the `Figure`.

###`Figure.rotate(angle)`

Rotates the `Figure`'s by the given angle. Always returns the final rotation angle of the `Figure`.

###`function overlap(Figure, Figure)`

Whether the given `Figure`s overlap.

## Composition
Can represent many figures on a plane and answer questions of the relationships between those figures.

###`class Composition()`
###`class Composition({bounds: [boundX, boundY][, snap: bool[, snapTolerance: Number]]})`

Constructs a new `Composition`.

**Options:**
```
`bounds`: sets the bounds of the plane (_see_: `Composition.bounds()`). Default: `[[0,0], [100,100]]`
`snap`: Whether figures should snap to other figures when they are manipulated. Default: `true`
`snapTolerance`: `snapTolerance` is multiplied by distance between the left and right bounds of the composition (_see_: `Composition.snapTolerance()`). Default: `0.001`
```

###`Composition.bounds()`
###`Composition.bounds([boundX, boundY], [boundX, boundY])`

Getter/Setter for the `Composition`'s position. Bounds are used to determine the allowable placement of a figure. The defualt bounds are the bounding box created by (0,0) and (100,100). Always returns the final bounds of the `Composition`.

###`Composition.snapTolerance()`

`snapTolerance` is multiplied by the diagnal distance between the lower and right bounds of the composition. The result is an absolute distance relative to the size of the composition. When the distance between two vertices is less than this value, the figure being manipulated will be slighty adjusted so that these vertices are brought together.

###`Composition.figures()`

Returns an object containing all the `Figure`s within the composition. Each figure is assigned a unique key.

###`Composition.add(Figure[, options])`

Inserts a new `Figure` into the `Composition`. Returns a unique string to be used to identify the `Figure` within the composition.

###`Composition.remove(id)`

Deletes a `Figure` by its ID.

###`Composition.get(id)`

Retrieves a figure within `Composition` by its ID. Returns `null` if no `Figure` by the given ID exists.

###`Composition.move(id[, options])`

Moves a figure within a `Composition` by its ID. Takes an options options object. Defaults to `{snap: true}`.

###`Composition.overlapping()`

Retrieves a list of `Figure` IDs which are overlapping with another `Figure`.
