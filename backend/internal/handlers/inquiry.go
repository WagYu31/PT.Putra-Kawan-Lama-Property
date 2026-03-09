package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type InquiryHandler struct {
	DB *gorm.DB
}

type InquiryInput struct {
	PropertyID *uint  `json:"property_id"`
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Phone      string `json:"phone"`
	Subject    string `json:"subject"`
	Message    string `json:"message" binding:"required"`
}

func (h *InquiryHandler) Create(c *gin.Context) {
	var input InquiryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	inquiry := models.Inquiry{
		PropertyID: input.PropertyID,
		Name:       input.Name,
		Email:      input.Email,
		Phone:      input.Phone,
		Subject:    input.Subject,
		Message:    input.Message,
	}

	if err := h.DB.Create(&inquiry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send inquiry"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Inquiry sent successfully"})
}

func (h *InquiryHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 50 { limit = 10 }

	query := h.DB.Model(&models.Inquiry{}).Preload("Property")

	if isRead := c.Query("is_read"); isRead != "" {
		query = query.Where("is_read = ?", isRead == "true")
	}

	var total int64
	query.Count(&total)

	var inquiries []models.Inquiry
	offset := (page - 1) * limit
	query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&inquiries)

	c.JSON(http.StatusOK, gin.H{
		"inquiries": inquiries,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": int(math.Ceil(float64(total) / float64(limit))),
		},
	})
}

func (h *InquiryHandler) MarkRead(c *gin.Context) {
	id := c.Param("id")
	h.DB.Model(&models.Inquiry{}).Where("id = ?", id).Update("is_read", true)
	c.JSON(http.StatusOK, gin.H{"message": "Inquiry marked as read"})
}
