package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type FavoriteHandler struct {
	DB *gorm.DB
}

// List returns all favorites for the current user with property details
func (h *FavoriteHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")

	var favorites []models.Favorite
	h.DB.Where("user_id = ?", userID).
		Preload("Property").
		Order("created_at DESC").
		Find(&favorites)

	c.JSON(http.StatusOK, gin.H{"favorites": favorites})
}

// Toggle adds or removes a property from favorites
func (h *FavoriteHandler) Toggle(c *gin.Context) {
	userID, _ := c.Get("userID")
	propertyID := c.Param("id")

	// Check if property exists
	var property models.Property
	if err := h.DB.First(&property, propertyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	// Check if already favorited (including soft-deleted)
	var existing models.Favorite
	err := h.DB.Unscoped().Where("user_id = ? AND property_id = ?", userID, propertyID).First(&existing).Error

	if err == nil {
		// Already exists → hard delete
		h.DB.Unscoped().Delete(&existing)
		c.JSON(http.StatusOK, gin.H{"action": "removed", "message": "Dihapus dari favorit"})
		return
	}

	// Not favorited → add
	fav := models.Favorite{
		UserID:     userID.(uint),
		PropertyID: property.ID,
	}
	h.DB.Create(&fav)
	c.JSON(http.StatusOK, gin.H{"action": "added", "message": "Ditambahkan ke favorit", "favorite": fav})
}

// Check returns whether a property is favorited by the current user
func (h *FavoriteHandler) Check(c *gin.Context) {
	userID, _ := c.Get("userID")
	propertyID := c.Param("id")

	var count int64
	h.DB.Model(&models.Favorite{}).Where("user_id = ? AND property_id = ?", userID, propertyID).Count(&count)

	c.JSON(http.StatusOK, gin.H{"is_favorited": count > 0})
}

// CheckBulk returns favorite status for multiple properties
func (h *FavoriteHandler) CheckBulk(c *gin.Context) {
	userID, _ := c.Get("userID")

	var favorites []models.Favorite
	h.DB.Where("user_id = ?", userID).Select("property_id").Find(&favorites)

	ids := make([]uint, len(favorites))
	for i, f := range favorites {
		ids[i] = f.PropertyID
	}

	c.JSON(http.StatusOK, gin.H{"favorited_ids": ids})
}
