package shapes

import "math"

const (
	Epsilon    float64 = 0.0000001
	ALessThanB int     = iota
	AEqualB
	AGreaterThanB
)

func compareFloat64(a, b float64) int {
	if a-b < Epsilon {
		return AEqualB
	} else if a < b {
		return ALessThanB
	} else {
		return AGreaterThanB
	}
}

type Vertex struct {
	x, y float64
}

func SameVertex(a, b Vertex) bool {
	return compareFloat64(a.x, b.x) == AEqualB && compareFloat64(a.y, b.y) == AEqualB
}

type Shape []Vertex

func (s Shape) Has(va Vertex) bool {
	for _, vb := range s {
		if SameVertex(va, vb) {
			return true
		}
	}
	return false
}

func (s Shape) Rotate(a float64) Shape {
	var rotated Shape
	for k, _ := range s {
		rotated = append(rotated, Vertex{
			math.Cos(a)*s[k].x + -math.Sin(a)*s[k].y,
			math.Sin(a)*s[k].x + math.Cos(a)*s[k].y,
		})
	}
	return rotated
}

func (s Shape) Translate(x, y float64) Shape {
	var translated Shape
	for k, _ := range s {
		translated = append(translated, Vertex{s[k].x + x, s[k].y + y})
	}
	return translated
}

type Object struct {
	Name   string
	Shape  Shape
	Anchor Vertex
	Angle  float64
}

func (o Object) Has(va Vertex) bool {
	for _, vb := range o.Vertices() {
		if SameVertex(va, vb) {
			return true
		}
	}
	return false
}

func (o Object) Vertices() []Vertex {
	return o.Shape.Rotate(o.Angle).Translate(o.Anchor.x, o.Anchor.y)
}

type Set interface {
	Has(Vertex) bool
}

type ObjectSet []Object

func (s ObjectSet) Has(v Vertex) bool {
	return len(s.Find(v)) > 0
}

func (s ObjectSet) Find(v Vertex) []Object {
	var found []Object
	for _, o := range s {
		if o.Has(v) {
			found = append(found, o)
		}
	}
	return found
}

func (s ObjectSet) Vertices() []Vertex {
	var all []Vertex
	for _, o := range s {
		all = append(all, o.Vertices()...)
	}
	return all
}

func (s ObjectSet) UnpairedVertices() []Vertex {
	var check map[float64]map[float64]uint
	var unpaired []Vertex
	for _, v := range s.Vertices() {
		check[v.x][v.y] += 1
	}
	for x, counts := range check {
		for y, count := range counts {
			if count == 1 {
				unpaired = append(unpaired, Vertex{x, y})
			}
		}
	}
	return unpaired
}

type Board interface {
	Insert(Object) error
	Objects() []Object
	Valid() bool
}

type DefaultBoard struct {
	Template Object
	objects  []Object
}

func (b *DefaultBoard) Insert(o Object) error {
	// @todo: check for illegal insertion
	b.objects = append(b.objects, o)
	return nil
}

func (b *DefaultBoard) Objects() []Object {
	return b.objects
}

func (b *DefaultBoard) Valid() bool {
	// @todo: implement rules for checking board validity
	return true
}
