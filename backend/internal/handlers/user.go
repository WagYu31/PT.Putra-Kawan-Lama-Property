package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB *gorm.DB
}

func (h *UserHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 50 { limit = 10 }

	query := h.DB.Model(&models.User{})

	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	offset := (page - 1) * limit
	query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": int(math.Ceil(float64(total) / float64(limit))),
		},
	})
}

func (h *UserHandler) UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validRoles := map[string]bool{"customer": true, "owner": true, "admin": true}
	if !validRoles[input.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	var user models.User
	if err := h.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	h.DB.Model(&user).Update("role", input.Role)
	c.JSON(http.StatusOK, gin.H{"message": "User role updated"})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := h.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	h.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

func (h *UserHandler) GetDashboardStats(c *gin.Context) {
	var totalUsers int64
	var totalProperties int64
	var totalBookings int64
	var totalInquiries int64

	h.DB.Model(&models.User{}).Count(&totalUsers)
	h.DB.Model(&models.Property{}).Count(&totalProperties)
	h.DB.Model(&models.Booking{}).Count(&totalBookings)
	h.DB.Model(&models.Inquiry{}).Count(&totalInquiries)

	var pendingBookings int64
	h.DB.Model(&models.Booking{}).Where("status = ?", "pending").Count(&pendingBookings)

	var unreadInquiries int64
	h.DB.Model(&models.Inquiry{}).Where("is_read = ?", false).Count(&unreadInquiries)

	c.JSON(http.StatusOK, gin.H{
		"users":            totalUsers,
		"properties":       totalProperties,
		"bookings":         totalBookings,
		"inquiries":        totalInquiries,
		"pending_bookings": pendingBookings,
		"unread_inquiries": unreadInquiries,
	})
}
