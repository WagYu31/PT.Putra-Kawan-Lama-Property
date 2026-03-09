package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type DocumentHandler struct {
	DB *gorm.DB
}

// Upload handles document file upload for a booking
func (h *DocumentHandler) Upload(c *gin.Context) {
	userID, _ := c.Get("userID")
	bookingID := c.Param("booking_id")
	docType := c.PostForm("type")

	if docType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document type is required"})
		return
	}

	// Validate doc type
	validTypes := map[string]bool{"ktp": true, "kk": true, "npwp": true, "slip_gaji": true}
	if !validTypes[docType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document type"})
		return
	}

	// Check booking belongs to user
	var booking models.Booking
	if err := h.DB.First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}
	if booking.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your booking"})
		return
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large (max 5MB)"})
		return
	}

	// Validate file type
	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only JPG, PNG, PDF allowed"})
		return
	}

	// Save file
	filename := fmt.Sprintf("doc_%d_%s_%d%s", booking.ID, docType, time.Now().UnixMilli(), ext)
	savePath := filepath.Join("uploads", "documents", filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Delete existing document of same type for this booking (re-upload)
	h.DB.Unscoped().Where("booking_id = ? AND type = ?", booking.ID, docType).Delete(&models.Document{})

	// Create document record
	doc := models.Document{
		BookingID:    booking.ID,
		UserID:       userID.(uint),
		Type:         models.DocumentType(docType),
		FilePath:     "/" + savePath,
		OriginalName: file.Filename,
		Status:       models.DocStatusPending,
	}
	h.DB.Create(&doc)

	// Update booking doc_status to pending
	h.DB.Model(&booking).Update("doc_status", "doc_pending")

	c.JSON(http.StatusOK, gin.H{
		"message":  fmt.Sprintf("%s berhasil diupload", models.DocTypeLabel(models.DocumentType(docType))),
		"document": doc,
	})
}

// ListByBooking returns all documents for a booking
func (h *DocumentHandler) ListByBooking(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")
	bookingID := c.Param("booking_id")

	var booking models.Booking
	if err := h.DB.First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Only owner or admin
	if userRole.(models.Role) != models.RoleAdmin && booking.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var docs []models.Document
	h.DB.Where("booking_id = ?", bookingID).Order("created_at ASC").Find(&docs)

	// Get required docs for this booking type
	required := models.RequiredDocs(booking.BookingType, booking.PaymentMethod)

	c.JSON(http.StatusOK, gin.H{
		"documents":      docs,
		"required_types": required,
		"booking_type":   booking.BookingType,
		"payment_method": booking.PaymentMethod,
		"doc_status":     booking.DocStatus,
	})
}

// Verify allows admin to approve or reject a document
func (h *DocumentHandler) Verify(c *gin.Context) {
	docID := c.Param("id")
	adminID, _ := c.Get("userID")

	var req struct {
		Action string `json:"action" binding:"required"` // approve, reject
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Action is required (approve/reject)"})
		return
	}

	var doc models.Document
	if err := h.DB.First(&doc, docID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	now := time.Now()
	aid := adminID.(uint)

	switch req.Action {
	case "approve":
		doc.Status = models.DocStatusApproved
		doc.VerifiedAt = &now
		doc.VerifiedBy = &aid
		doc.RejectedReason = ""
	case "reject":
		doc.Status = models.DocStatusRejected
		doc.VerifiedAt = &now
		doc.VerifiedBy = &aid
		doc.RejectedReason = req.Reason
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Action must be 'approve' or 'reject'"})
		return
	}
	h.DB.Save(&doc)

	// Check if all required docs for this booking are approved
	var booking models.Booking
	h.DB.First(&booking, doc.BookingID)
	requiredTypes := models.RequiredDocs(booking.BookingType, booking.PaymentMethod)

	allApproved := true
	hasRejected := false
	for _, rt := range requiredTypes {
		var d models.Document
		err := h.DB.Where("booking_id = ? AND type = ?", doc.BookingID, rt).First(&d).Error
		if err != nil || d.Status != models.DocStatusApproved {
			allApproved = false
		}
		if err == nil && d.Status == models.DocStatusRejected {
			hasRejected = true
		}
	}

	if allApproved {
		h.DB.Model(&booking).Update("doc_status", "doc_approved")
		// Create notification for customer
		title := "✅ Dokumen Disetujui"
		msg := "Semua dokumen Anda telah diverifikasi. Silakan lanjutkan pembayaran."
		bid := booking.ID
		CreateNotification(h.DB, booking.CustomerID, title, msg, models.NotifPaymentSuccess, &bid)
	} else if hasRejected {
		h.DB.Model(&booking).Update("doc_status", "doc_rejected")
		title := "❌ Dokumen Ditolak"
		msg := fmt.Sprintf("Dokumen %s ditolak: %s. Silakan upload ulang.",
			models.DocTypeLabel(doc.Type), req.Reason)
		bid := booking.ID
		CreateNotification(h.DB, booking.CustomerID, title, msg, models.NotifPaymentSuccess, &bid)
	} else {
		h.DB.Model(&booking).Update("doc_status", "doc_pending")
	}

	statusLabel := "disetujui"
	if req.Action == "reject" {
		statusLabel = "ditolak"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    fmt.Sprintf("Dokumen %s %s", models.DocTypeLabel(doc.Type), statusLabel),
		"document":   doc,
		"doc_status": booking.DocStatus,
	})
}
