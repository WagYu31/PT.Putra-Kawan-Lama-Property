package handlers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type PropertyHandler struct {
	DB *gorm.DB
}

type PropertyInput struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Type        string   `json:"type" binding:"required"`
	Category    string   `json:"category" binding:"required"`
	Price       float64  `json:"price" binding:"required"`
	RentPeriod  string   `json:"rent_period"`
	Address     string   `json:"address"`
	City        string   `json:"city"`
	Province    string   `json:"province"`
	ZipCode     string   `json:"zip_code"`
	Lat         float64  `json:"lat"`
	Lng         float64  `json:"lng"`
	Bedrooms    int      `json:"bedrooms"`
	Bathrooms   int      `json:"bathrooms"`
	GarageSize  int      `json:"garage_size"`
	BuildArea   float64  `json:"build_area"`
	LandArea    float64  `json:"land_area"`
	Floors      int      `json:"floors"`
	YearBuilt   int      `json:"year_built"`
	Certificate string   `json:"certificate"`
	Images      []string `json:"images"`
	VideoURL    string   `json:"video_url"`
	VirtualTour string   `json:"virtual_tour"`
	Facilities  []string `json:"facilities"`
	Featured    bool     `json:"featured"`
}

func (h *PropertyHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 12
	}

	query := h.DB.Model(&models.Property{}).Preload("Owner")

	// Filters
	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}
	if cat := c.Query("category"); cat != "" {
		query = query.Where("category = ?", cat)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("LOWER(city) LIKE ?", "%"+strings.ToLower(city)+"%")
	}
	if province := c.Query("province"); province != "" {
		query = query.Where("LOWER(province) LIKE ?", "%"+strings.ToLower(province)+"%")
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if featured := c.Query("featured"); featured == "true" {
		query = query.Where("featured = ?", true)
	}
	if minPrice := c.Query("min_price"); minPrice != "" {
		if p, err := strconv.ParseFloat(minPrice, 64); err == nil {
			query = query.Where("price >= ?", p)
		}
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		if p, err := strconv.ParseFloat(maxPrice, 64); err == nil {
			query = query.Where("price <= ?", p)
		}
	}
	if minBed := c.Query("min_bedrooms"); minBed != "" {
		if b, err := strconv.Atoi(minBed); err == nil {
			query = query.Where("bedrooms >= ?", b)
		}
	}
	if search := c.Query("search"); search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(city) LIKE ? OR LOWER(address) LIKE ?", s, s, s, s)
	}

	// Sort
	sortBy := c.DefaultQuery("sort", "created_at")
	order := c.DefaultQuery("order", "desc")
	allowedSorts := map[string]bool{"created_at": true, "price": true, "views": true, "title": true}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}
	if order != "asc" && order != "desc" {
		order = "desc"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, order))

	var total int64
	query.Count(&total)

	var properties []models.Property
	offset := (page - 1) * limit
	query.Offset(offset).Limit(limit).Find(&properties)

	c.JSON(http.StatusOK, gin.H{
		"properties": properties,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": int(math.Ceil(float64(total) / float64(limit))),
		},
	})
}

func (h *PropertyHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var property models.Property
	if err := h.DB.Preload("Owner").First(&property, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	// Increment views
	h.DB.Model(&property).Update("views", property.Views+1)

	c.JSON(http.StatusOK, gin.H{"property": property})
}

func (h *PropertyHandler) GetBySlug(c *gin.Context) {
	s := c.Param("slug")
	var property models.Property
	if err := h.DB.Preload("Owner").Where("slug = ?", s).First(&property).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	h.DB.Model(&property).Update("views", property.Views+1)
	c.JSON(http.StatusOK, gin.H{"property": property})
}

func (h *PropertyHandler) Create(c *gin.Context) {
	var input PropertyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	propertySlug := slug.Make(input.Title)

	// Ensure unique slug
	var count int64
	h.DB.Model(&models.Property{}).Where("slug = ?", propertySlug).Count(&count)
	if count > 0 {
		propertySlug = fmt.Sprintf("%s-%d", propertySlug, count+1)
	}

	property := models.Property{
		OwnerID:     userID.(uint),
		Title:       input.Title,
		Slug:        propertySlug,
		Description: input.Description,
		Type:        models.PropertyType(input.Type),
		Category:    models.PropertyCategory(input.Category),
		Price:       input.Price,
		RentPeriod:  input.RentPeriod,
		Currency:    "IDR",
		Address:     input.Address,
		City:        input.City,
		Province:    input.Province,
		ZipCode:     input.ZipCode,
		Lat:         input.Lat,
		Lng:         input.Lng,
		Bedrooms:    input.Bedrooms,
		Bathrooms:   input.Bathrooms,
		GarageSize:  input.GarageSize,
		BuildArea:   input.BuildArea,
		LandArea:    input.LandArea,
		Floors:      input.Floors,
		YearBuilt:   input.YearBuilt,
		Certificate: input.Certificate,
		Images:      input.Images,
		VideoURL:    input.VideoURL,
		VirtualTour: input.VirtualTour,
		Facilities:  input.Facilities,
		Featured:    input.Featured,
		Status:      models.StatusAvailable,
	}

	if err := h.DB.Create(&property).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create property"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Property created", "property": property})
}

func (h *PropertyHandler) Update(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	var property models.Property
	if err := h.DB.First(&property, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	if userRole.(models.Role) != models.RoleAdmin && property.OwnerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own properties"})
		return
	}

	var input PropertyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"title":        input.Title,
		"description":  input.Description,
		"type":         input.Type,
		"category":     input.Category,
		"price":        input.Price,
		"rent_period":  input.RentPeriod,
		"address":      input.Address,
		"city":         input.City,
		"province":     input.Province,
		"zip_code":     input.ZipCode,
		"lat":          input.Lat,
		"lng":          input.Lng,
		"bedrooms":     input.Bedrooms,
		"bathrooms":    input.Bathrooms,
		"garage_size":  input.GarageSize,
		"build_area":   input.BuildArea,
		"land_area":    input.LandArea,
		"floors":       input.Floors,
		"year_built":   input.YearBuilt,
		"certificate":  input.Certificate,
		"images":       input.Images,
		"video_url":    input.VideoURL,
		"virtual_tour": input.VirtualTour,
		"facilities":   input.Facilities,
		"featured":     input.Featured,
	}

	h.DB.Model(&property).Updates(updates)
	h.DB.Preload("Owner").First(&property, id)

	c.JSON(http.StatusOK, gin.H{"message": "Property updated", "property": property})
}

func (h *PropertyHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	var property models.Property
	if err := h.DB.First(&property, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	if userRole.(models.Role) != models.RoleAdmin && property.OwnerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own properties"})
		return
	}

	h.DB.Delete(&property)
	c.JSON(http.StatusOK, gin.H{"message": "Property deleted"})
}

func (h *PropertyHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var property models.Property
	if err := h.DB.First(&property, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	h.DB.Model(&property).Update("status", input.Status)
	c.JSON(http.StatusOK, gin.H{"message": "Status updated"})
}

func (h *PropertyHandler) GetStats(c *gin.Context) {
	var totalProperties int64
	var totalAvailable int64
	var totalRented int64
	var totalSold int64

	h.DB.Model(&models.Property{}).Count(&totalProperties)
	h.DB.Model(&models.Property{}).Where("status = ?", "available").Count(&totalAvailable)
	h.DB.Model(&models.Property{}).Where("status = ?", "rented").Count(&totalRented)
	h.DB.Model(&models.Property{}).Where("status = ?", "sold").Count(&totalSold)

	c.JSON(http.StatusOK, gin.H{
		"total":     totalProperties,
		"available": totalAvailable,
		"rented":    totalRented,
		"sold":      totalSold,
	})
}
