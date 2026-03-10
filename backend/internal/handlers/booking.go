package handlers

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/config"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type BookingHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

// CreateSurvey schedules a property survey (for sell properties)
func (h *BookingHandler) CreateSurvey(c *gin.Context) {
	var input struct {
		PropertyID uint   `json:"property_id" binding:"required"`
		SurveyDate string `json:"survey_date" binding:"required"`
		Message    string `json:"message"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")

	var property models.Property
	if err := h.DB.First(&property, input.PropertyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	surveyDate, err := time.Parse("2006-01-02", input.SurveyDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	if surveyDate.Before(time.Now().Truncate(24 * time.Hour)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Survey date must be in the future"})
		return
	}

	// Check for date conflict - same property, same date, not cancelled
	var conflictCount int64
	h.DB.Model(&models.Booking{}).
		Where("property_id = ? AND survey_date = ? AND status != ?",
			input.PropertyID, surveyDate.Format("2006-01-02"), models.BookingCancelled).
		Count(&conflictCount)
	if conflictCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Tanggal ini sudah dibooking. Silakan pilih tanggal lain."})
		return
	}

	booking := models.Booking{
		PropertyID:  input.PropertyID,
		CustomerID:  userID.(uint),
		BookingType: models.BookingTypeSurvey,
		Status:      models.BookingPending,
		SurveyDate:  &surveyDate,
		Message:     input.Message,
		TotalPrice:  property.Price,
	}

	if err := h.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create survey"})
		return
	}

	h.DB.Preload("Property").Preload("Customer").First(&booking, booking.ID)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Survey scheduled successfully",
		"booking": booking,
	})

	// Send booking email (async)
	go SendBookingCreatedEmail(h.Cfg, booking.Customer.Name, booking.Customer.Email,
		booking.Property.Title, string(booking.BookingType),
		fmt.Sprintf("Survey tanggal %s", surveyDate.Format("02 Jan 2006")))
}

// CreatePurchase creates a purchase booking (after survey)
func (h *BookingHandler) CreatePurchase(c *gin.Context) {
	var input struct {
		PropertyID    uint   `json:"property_id" binding:"required"`
		PaymentMethod string `json:"payment_method" binding:"required"` // cash, installment
		Tenor         int    `json:"tenor"`                             // 3, 6, 12 months (for installment)
		Message       string `json:"message"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.PaymentMethod != "cash" && input.PaymentMethod != "installment" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment method must be 'cash' or 'installment'"})
		return
	}

	// Validate tenor for installment
	if input.PaymentMethod == "installment" {
		if input.Tenor != 3 && input.Tenor != 6 && input.Tenor != 12 {
			input.Tenor = 12
		}
	}

	userID, _ := c.Get("userID")

	var property models.Property
	if err := h.DB.First(&property, input.PropertyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	if property.Status != models.StatusAvailable {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Property is not available"})
		return
	}

	// Calculate DP for installment (10%)
	var dpAmount float64
	if input.PaymentMethod == "installment" {
		dpAmount = math.Round(property.Price * 0.10)
	}

	booking := models.Booking{
		PropertyID:       input.PropertyID,
		CustomerID:       userID.(uint),
		BookingType:      models.BookingTypePurchase,
		Status:           models.BookingPending,
		PaymentMethod:    input.PaymentMethod,
		TotalPrice:       property.Price,
		InstallmentTenor: input.Tenor,
		DPAmount:         dpAmount,
		Message:          input.Message,
	}

	if err := h.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
		return
	}

	h.DB.Preload("Property").Preload("Customer").First(&booking, booking.ID)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Booking created, proceed to payment",
		"booking": booking,
	})

	// Send booking email (async)
	detail := fmt.Sprintf("Pembayaran: %s", input.PaymentMethod)
	if input.PaymentMethod == "installment" {
		detail = fmt.Sprintf("Cicilan %d bulan", input.Tenor)
	}
	go SendBookingCreatedEmail(h.Cfg, booking.Customer.Name, booking.Customer.Email,
		booking.Property.Title, string(booking.BookingType), detail)
}

// CreateRental creates a rental booking
func (h *BookingHandler) CreateRental(c *gin.Context) {
	var input struct {
		PropertyID uint   `json:"property_id" binding:"required"`
		RentPeriod string `json:"rent_period" binding:"required"` // daily, monthly, yearly
		StartDate  string `json:"start_date" binding:"required"`
		Duration   int    `json:"duration" binding:"required"` // number of periods
		Message    string `json:"message"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validPeriod := map[string]bool{"daily": true, "monthly": true, "yearly": true}
	if !validPeriod[input.RentPeriod] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rent period must be 'daily', 'monthly', or 'yearly'"})
		return
	}

	userID, _ := c.Get("userID")

	var property models.Property
	if err := h.DB.First(&property, input.PropertyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	if property.Status != models.StatusAvailable {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Property is not available for rent"})
		return
	}

	startDate, err := time.Parse("2006-01-02", input.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	// Calculate end date and price per period
	var endDate time.Time
	rentPrice := property.Price // base price per period

	switch models.RentPeriodType(input.RentPeriod) {
	case models.RentDaily:
		endDate = startDate.AddDate(0, 0, input.Duration)
		// daily price = monthly price / 30
		rentPrice = property.Price / 30
	case models.RentMonthly:
		endDate = startDate.AddDate(0, input.Duration, 0)
		rentPrice = property.Price
	case models.RentYearly:
		endDate = startDate.AddDate(input.Duration, 0, 0)
		rentPrice = property.Price * 12 * 0.9 // 10% discount for yearly
	}

	totalPrice := rentPrice * float64(input.Duration)

	booking := models.Booking{
		PropertyID: input.PropertyID,
		CustomerID: userID.(uint),
		BookingType: models.BookingTypeRental,
		Status:      models.BookingPending,
		RentPeriod:  models.RentPeriodType(input.RentPeriod),
		StartDate:   &startDate,
		EndDate:     &endDate,
		RentPrice:   rentPrice,
		TotalPrice:  totalPrice,
		Message:     input.Message,
	}

	if err := h.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create rental"})
		return
	}

	h.DB.Preload("Property").Preload("Customer").First(&booking, booking.ID)
	c.JSON(http.StatusCreated, gin.H{
		"message":     "Rental booking created, proceed to payment",
		"booking":     booking,
		"rent_price":  rentPrice,
		"total_price": totalPrice,
		"duration":    input.Duration,
	})

	// Send booking email (async)
	go SendBookingCreatedEmail(h.Cfg, booking.Customer.Name, booking.Customer.Email,
		booking.Property.Title, string(booking.BookingType),
		fmt.Sprintf("Sewa %d %s", input.Duration, input.RentPeriod))
}

// List lists bookings
func (h *BookingHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 50 { limit = 10 }

	query := h.DB.Model(&models.Booking{}).
		Preload("Property").
		Preload("Customer").
		Preload("Payments")

	switch userRole.(models.Role) {
	case models.RoleCustomer:
		query = query.Where("customer_id = ?", userID)
	case models.RoleAdmin:
		// Admin sees all
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("bookings.status = ?", status)
	}
	if bookingType := c.Query("type"); bookingType != "" {
		query = query.Where("bookings.booking_type = ?", bookingType)
	}

	var total int64
	query.Count(&total)

	var bookings []models.Booking
	offset := (page - 1) * limit
	query.Order("bookings.created_at DESC").Offset(offset).Limit(limit).Find(&bookings)

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": int(math.Ceil(float64(total) / float64(limit))),
		},
	})
}

// UpdateStatus updates booking status
func (h *BookingHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var booking models.Booking
	if err := h.DB.Preload("Property").Preload("Customer").First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	h.DB.Model(&booking).Update("status", input.Status)
	c.JSON(http.StatusOK, gin.H{"message": "Booking status updated"})

	// Send status update email (async)
	go SendBookingStatusEmail(h.Cfg, booking.Customer.Name, booking.Customer.Email,
		booking.Property.Title, input.Status)
	log.Printf("📧 Booking status email queued: %s → %s", booking.Customer.Email, input.Status)
}

// GetByID gets a single booking by ID
func (h *BookingHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	var booking models.Booking
	if err := h.DB.Preload("Property").Preload("Customer").Preload("Payments").First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Check permission
	if userRole.(models.Role) == models.RoleCustomer && booking.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"booking": booking})
}

// GetBookedDates returns all booked dates for a property
func (h *BookingHandler) GetBookedDates(c *gin.Context) {
	propertyID := c.Param("id")

	var bookings []models.Booking
	h.DB.Where("property_id = ? AND status != ?", propertyID, models.BookingCancelled).
		Find(&bookings)

	var dates []string
	for _, b := range bookings {
		if b.SurveyDate != nil {
			dates = append(dates, b.SurveyDate.Format("2006-01-02"))
		}
		if b.StartDate != nil && b.EndDate != nil {
			// For rental bookings, add all dates in the range
			for d := *b.StartDate; !d.After(*b.EndDate); d = d.AddDate(0, 0, 1) {
				dates = append(dates, d.Format("2006-01-02"))
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"booked_dates": dates})
}
