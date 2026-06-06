package apartment

import (
	"math"
	"testing"
)

func TestHaversineDistanceZero(t *testing.T) {
	lat := 42.598
	lng := -5.567
	d := HaversineDistance(lat, lng, lat, lng)
	if d != 0 {
		t.Fatalf("HaversineDistance(same point) = %f, want 0", d)
	}
}

func TestHaversineDistanceKnown(t *testing.T) {
	// Madrid (approx): 40.4168, -3.7038
	// León (approx):    42.5980, -5.5670
	d := HaversineDistance(42.598, -5.567, 40.4168, -3.7038)
	expected := 288.0
	if math.Abs(d-expected) > 5.0 {
		t.Fatalf("HaversineDistance(Leon, Madrid) = %f, want approx %f", d, expected)
	}
}

func TestHaversineDistanceSmall(t *testing.T) {
	// Two points ~1 km apart
	d := HaversineDistance(42.598, -5.567, 42.605, -5.557)
	if d < 0.5 || d > 2.0 {
		t.Fatalf("HaversineDistance(small) = %f, want approx 1.0 km", d)
	}
}

func TestHaversineDistanceEquator(t *testing.T) {
	// Points on the equator: 0°, 0° and 0°, 1° (≈111 km at equator)
	d := HaversineDistance(0, 0, 0, 1)
	expected := 111.0
	if math.Abs(d-expected) > 2.0 {
		t.Fatalf("HaversineDistance(equator) = %f, want approx %f km", d, expected)
	}
}

func TestHaversineDistanceAntipodal(t *testing.T) {
	// Approximately antipodal points (should be ~20015 km, half Earth circumference)
	d := HaversineDistance(0, 0, 0, 180)
	// Half circumference ≈ 20015 km
	if d < 19900 || d > 20100 {
		t.Fatalf("HaversineDistance(antipodal) = %f, want approx 20015 km", d)
	}
}

func TestHaversineDistanceSymmetric(t *testing.T) {
	d1 := HaversineDistance(42.598, -5.567, 40.4168, -3.7038)
	d2 := HaversineDistance(40.4168, -3.7038, 42.598, -5.567)
	if math.Abs(d1-d2) > 0.001 {
		t.Fatalf("HaversineDistance not symmetric: %f vs %f", d1, d2)
	}
}

func TestHaversineDistancePoleToEquator(t *testing.T) {
	// North pole to equator ≈ 10007.5 km
	d := HaversineDistance(90, 0, 0, 0)
	expected := 10007.5
	if math.Abs(d-expected) > 10.0 {
		t.Fatalf("HaversineDistance(pole to equator) = %f, want approx %f", d, expected)
	}
}
