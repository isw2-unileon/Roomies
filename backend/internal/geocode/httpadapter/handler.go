package httpadapter

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/geocode"
	geocodenominatim "github.com/isw2-unileon/proyect-scaffolding/backend/internal/geocode/nominatim"
)

type handler struct {
	geocodeService *geocodenominatim.Service
}

// RegisterRoutes registers the GET /geocode/reverse endpoint on the given router group.
func RegisterRoutes(api *gin.RouterGroup, geocodeService *geocodenominatim.Service) {
	h := &handler{geocodeService: geocodeService}
	api.GET("/geocode/reverse", h.reverseGeocode)
}

func (h *handler) reverseGeocode(c *gin.Context) {
	latStr := c.Query("lat")
	lngStr := c.Query("lng")

	if latStr == "" || lngStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat and lng query params are required"})
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil || lat < -90 || lat > 90 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid latitude"})
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil || lng < -180 || lng > 180 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid longitude"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	result, err := h.geocodeService.ReverseGeocode(ctx, geocode.ReverseGeocodeInput{
		Latitude:  lat,
		Longitude: lng,
	})
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			c.JSON(http.StatusGatewayTimeout, gin.H{"error": "geocode service timeout"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "geocode lookup failed"})
		return
	}

	c.JSON(http.StatusOK, result)
}
