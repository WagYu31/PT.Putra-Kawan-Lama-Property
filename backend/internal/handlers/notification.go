package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type NotificationHandler struct {
	DB *gorm.DB
}

// List returns notifications for the current user
func (h *NotificationHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")

	var notifications []models.Notification
	h.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(50).Find(&notifications)

	c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

// UnreadCount returns the count of unread notifications
func (h *NotificationHandler) UnreadCount(c *gin.Context) {
	userID, _ := c.Get("userID")

	var count int64
	h.DB.Model(&models.Notification{}).Where("user_id = ? AND is_read = false", userID).Count(&count)

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkRead marks a single notification as read
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	notifID := c.Param("id")

	result := h.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notifID, userID).
		Update("is_read", true)

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}

// MarkAllRead marks all notifications as read for the current user
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID, _ := c.Get("userID")

	h.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Update("is_read", true)

	c.JSON(http.StatusOK, gin.H{"message": "All marked as read"})
}

// CreateNotification is a helper to create a new notification
func CreateNotification(db *gorm.DB, userID uint, title, message string, notifType models.NotificationType, relatedID *uint) {
	notif := models.Notification{
		UserID:    userID,
		Title:     title,
		Message:   message,
		Type:      notifType,
		RelatedID: relatedID,
	}
	db.Create(&notif)
}
