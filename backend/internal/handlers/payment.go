package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
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

type PaymentHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

// CreateSnapToken creates a Midtrans Snap token for a payment
func (h *PaymentHandler) CreateSnapToken(c *gin.Context) {
	var input struct {
		BookingID uint `json:"booking_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")

	var booking models.Booking
	if err := h.DB.Preload("Property").Preload("Customer").Preload("Payments", func(db *gorm.DB) *gorm.DB {
		return db.Order("billing_period ASC")
	}).First(&booking, input.BookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	if booking.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your booking"})
		return
	}

	// ===== INSTALLMENT PURCHASE: auto-generate schedule & pay next =====
	if booking.BookingType == models.BookingTypePurchase && booking.PaymentMethod == "installment" {
		if len(booking.Payments) == 0 {
			h.generateInstallmentSchedule(&booking)
			// Reload
			h.DB.Where("booking_id = ?", booking.ID).Order("billing_period ASC").Find(&booking.Payments)
		}

		// Find first unpaid
		var target *models.Payment
		for i := range booking.Payments {
			if booking.Payments[i].Status == models.PaymentPending {
				target = &booking.Payments[i]
				break
			}
		}
		if target == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Semua cicilan sudah dibayar"})
			return
		}

		// Reuse existing snap token
		if target.SnapToken != "" {
			c.JSON(http.StatusOK, gin.H{
				"snap_token": target.SnapToken,
				"order_id":   target.OrderID,
				"payment_id": target.ID,
				"client_key": h.Cfg.MidtransClientKey,
			})
			return
		}

		itemName := truncateString(booking.Property.Title, 30) + " - "
		if target.BillingPeriod == 0 {
			itemName += "DP (10%)"
		} else {
			itemName += fmt.Sprintf("Cicilan %d/%d", target.BillingPeriod, booking.InstallmentTenor)
		}

		token, redirectURL, err := h.callMidtransSnap(target.OrderID, target.Amount, itemName, booking)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		target.SnapToken = token
		h.DB.Save(target)

		c.JSON(http.StatusOK, gin.H{
			"snap_token":   token,
			"redirect_url": redirectURL,
			"order_id":     target.OrderID,
			"payment_id":   target.ID,
			"client_key":   h.Cfg.MidtransClientKey,
		})
		return
	}

	// ===== CASH or RENTAL: single payment =====
	var amount float64
	switch booking.BookingType {
	case models.BookingTypePurchase:
		amount = booking.TotalPrice
	case models.BookingTypeRental:
		amount = booking.RentPrice
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid booking type"})
		return
	}
	if amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment amount"})
		return
	}

	orderID := fmt.Sprintf("PKWL-%d-%d", booking.ID, time.Now().Unix())
	token, redirectURL, err := h.callMidtransSnap(orderID, amount, truncateString(booking.Property.Title, 50), booking)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	payment := models.Payment{
		BookingID:   booking.ID,
		OrderID:     orderID,
		SnapToken:   token,
		Amount:      amount,
		TotalAmount: amount,
		Status:      models.PaymentPending,
		PaymentType: models.PaymentTypeCash,
	}
	if booking.BookingType == models.BookingTypeRental {
		payment.PaymentType = models.PaymentTypeRental
		now := time.Now()
		switch booking.RentPeriod {
		case models.RentDaily:
			due := now.AddDate(0, 0, 1)
			payment.DueDate = &due
		case models.RentMonthly:
			due := now.AddDate(0, 1, 0)
			payment.DueDate = &due
		case models.RentYearly:
			due := now.AddDate(1, 0, 0)
			payment.DueDate = &due
		}
		payment.BillingPeriod = 1
	}
	h.DB.Create(&payment)

	c.JSON(http.StatusOK, gin.H{
		"snap_token":   token,
		"redirect_url": redirectURL,
		"order_id":     orderID,
		"payment_id":   payment.ID,
		"client_key":   h.Cfg.MidtransClientKey,
	})
}

// generateInstallmentSchedule creates DP + N monthly payment records
func (h *PaymentHandler) generateInstallmentSchedule(booking *models.Booking) {
	tenor := booking.InstallmentTenor
	if tenor == 0 {
		tenor = 12
	}
	dpAmount := booking.DPAmount
	if dpAmount <= 0 {
		dpAmount = math.Round(booking.TotalPrice * 0.10)
	}
	remaining := booking.TotalPrice - dpAmount
	monthlyAmount := math.Round(remaining / float64(tenor))
	now := time.Now()

	// DP payment (billing_period = 0)
	dpDue := now.AddDate(0, 0, 7)
	dp := models.Payment{
		BookingID:     booking.ID,
		OrderID:       fmt.Sprintf("PKWL-%d-DP-%d", booking.ID, now.Unix()),
		Amount:        dpAmount,
		TotalAmount:   dpAmount,
		Status:        models.PaymentPending,
		PaymentType:   models.PaymentTypeInstallment,
		BillingPeriod: 0,
		DueDate:       &dpDue,
	}
	h.DB.Create(&dp)

	// Monthly installments (billing_period = 1..N)
	for i := 1; i <= tenor; i++ {
		due := now.AddDate(0, i, 0)
		inst := models.Payment{
			BookingID:     booking.ID,
			OrderID:       fmt.Sprintf("PKWL-%d-C%d-%d", booking.ID, i, now.Unix()),
			Amount:        monthlyAmount,
			TotalAmount:   monthlyAmount,
			Status:        models.PaymentPending,
			PaymentType:   models.PaymentTypeInstallment,
			BillingPeriod: i,
			DueDate:       &due,
		}
		h.DB.Create(&inst)
	}
}

// PayInstallment pays a specific installment by payment ID
func (h *PaymentHandler) PayInstallment(c *gin.Context) {
	var input struct {
		PaymentID uint `json:"payment_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")

	var payment models.Payment
	if err := h.DB.Preload("Booking.Property").Preload("Booking.Customer").First(&payment, input.PaymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	if payment.Booking.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your payment"})
		return
	}

	// Anti double payment: already paid
	if payment.Status == models.PaymentPaid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cicilan ini sudah dibayar"})
		return
	}

	// Sequential enforcement: check previous installment is paid
	if payment.BillingPeriod > 0 {
		var prevPayment models.Payment
		err := h.DB.Where("booking_id = ? AND billing_period = ?",
			payment.BookingID, payment.BillingPeriod-1).First(&prevPayment).Error
		if err == nil && prevPayment.Status != models.PaymentPaid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bayar cicilan sebelumnya dulu"})
			return
		}
	}

	// Reuse existing snap token
	if payment.SnapToken != "" {
		c.JSON(http.StatusOK, gin.H{
			"snap_token": payment.SnapToken,
			"order_id":   payment.OrderID,
			"payment_id": payment.ID,
			"client_key": h.Cfg.MidtransClientKey,
		})
		return
	}

	// Create snap token
	itemName := truncateString(payment.Booking.Property.Title, 30) + " - "
	if payment.BillingPeriod == 0 {
		itemName += "DP (10%)"
	} else {
		itemName += fmt.Sprintf("Cicilan %d/%d", payment.BillingPeriod, payment.Booking.InstallmentTenor)
	}

	token, redirectURL, err := h.callMidtransSnap(payment.OrderID, payment.Amount, itemName, payment.Booking)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	payment.SnapToken = token
	h.DB.Save(&payment)

	c.JSON(http.StatusOK, gin.H{
		"snap_token":   token,
		"redirect_url": redirectURL,
		"order_id":     payment.OrderID,
		"payment_id":   payment.ID,
		"client_key":   h.Cfg.MidtransClientKey,
	})
}

// GetInstallmentSchedule returns all payment records for a booking
func (h *PaymentHandler) GetInstallmentSchedule(c *gin.Context) {
	bookingID := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	var booking models.Booking
	if err := h.DB.Preload("Property").First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Only allow owner or admin
	if userRole.(models.Role) == models.RoleCustomer && booking.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your booking"})
		return
	}

	var payments []models.Payment
	h.DB.Where("booking_id = ?", booking.ID).Order("billing_period ASC").Find(&payments)

	// Calculate summary
	var totalPaid, totalRemaining float64
	var paidCount, totalCount int
	for _, p := range payments {
		totalCount++
		if p.Status == models.PaymentPaid {
			paidCount++
			totalPaid += p.Amount
		} else {
			totalRemaining += p.Amount
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"booking":         booking,
		"payments":        payments,
		"total_paid":      totalPaid,
		"total_remaining": totalRemaining,
		"paid_count":      paidCount,
		"total_count":     totalCount,
		"tenor":           booking.InstallmentTenor,
		"dp_amount":       booking.DPAmount,
	})
}

// HandleNotification handles Midtrans webhook notifications
func (h *PaymentHandler) HandleNotification(c *gin.Context) {
	var notification map[string]interface{}
	if err := c.ShouldBindJSON(&notification); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orderID, _ := notification["order_id"].(string)
	transactionStatus, _ := notification["transaction_status"].(string)
	fraudStatus, _ := notification["fraud_status"].(string)
	paymentType, _ := notification["payment_type"].(string)
	transactionID, _ := notification["transaction_id"].(string)

	log.Printf("📥 Midtrans notification: order=%s status=%s fraud=%s", orderID, transactionStatus, fraudStatus)

	var payment models.Payment
	if err := h.DB.Where("order_id = ?", orderID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	payment.MidtransID = transactionID
	payment.PaymentMethod = paymentType

	switch transactionStatus {
	case "capture":
		if fraudStatus == "accept" {
			payment.Status = models.PaymentPaid
			now := time.Now()
			payment.PaidAt = &now
		}
	case "settlement":
		payment.Status = models.PaymentPaid
		now := time.Now()
		payment.PaidAt = &now
	case "pending":
		payment.Status = models.PaymentPending
	case "deny", "cancel":
		payment.Status = models.PaymentFailed
		// Clear snap token so a new one can be generated
		payment.SnapToken = ""
	case "expire":
		payment.Status = models.PaymentExpired
		payment.SnapToken = ""
	case "refund":
		payment.Status = models.PaymentRefunded
	}

	h.DB.Save(&payment)

	// Update booking status when paid
	if payment.Status == models.PaymentPaid {
		var booking models.Booking
		h.DB.First(&booking, payment.BookingID)

		if booking.PaymentMethod == "installment" {
			// Check if ALL installments are paid
			var unpaidCount int64
			h.DB.Model(&models.Payment{}).Where("booking_id = ? AND status != ?",
				booking.ID, models.PaymentPaid).Count(&unpaidCount)

			if unpaidCount == 0 {
				// All paid → completed
				h.DB.Model(&booking).Update("status", models.BookingCompleted)
				h.DB.Model(&models.Property{}).Where("id = ?", booking.PropertyID).
					Update("status", models.StatusSold)
			} else if payment.BillingPeriod == 0 {
				// DP paid → confirmed
				h.DB.Model(&booking).Update("status", models.BookingConfirmed)
			}
		} else {
			// Cash: single payment → confirmed
			h.DB.Model(&booking).Update("status", models.BookingConfirmed)
			if booking.BookingType == models.BookingTypePurchase {
				h.DB.Model(&models.Property{}).Where("id = ?", booking.PropertyID).
					Update("status", models.StatusSold)
			} else if booking.BookingType == models.BookingTypeRental {
				h.DB.Model(&models.Property{}).Where("id = ?", booking.PropertyID).
					Update("status", models.StatusRented)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetPaymentStatus gets payment status
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	id := c.Param("id")
	var payment models.Payment
	if err := h.DB.Preload("Booking.Property").First(&payment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"payment": payment})
}

// List lists payments for admin or current user
func (h *PaymentHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	query := h.DB.Model(&models.Payment{}).
		Preload("Booking.Property").
		Preload("Booking.Customer").
		Joins("JOIN bookings ON bookings.id = payments.booking_id")

	switch userRole.(models.Role) {
	case models.RoleCustomer:
		query = query.Where("bookings.customer_id = ?", userID)
	case models.RoleAdmin:
		// see all
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("payments.status = ?", status)
	}
	if bookingID := c.Query("booking_id"); bookingID != "" {
		query = query.Where("payments.booking_id = ?", bookingID)
	}

	var total int64
	query.Count(&total)

	var payments []models.Payment
	offset := (page - 1) * limit
	query.Order("payments.created_at DESC").Offset(offset).Limit(limit).Find(&payments)

	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": int(math.Ceil(float64(total) / float64(limit))),
		},
	})
}

// CheckOverdueRentals calculates penalties for overdue rental payments
func (h *PaymentHandler) CheckOverdueRentals(c *gin.Context) {
	var overduePayments []models.Payment
	h.DB.Where("status = ? AND due_date < ? AND payment_type = ?",
		models.PaymentPending, time.Now(), models.PaymentTypeRental).
		Preload("Booking.Property").
		Find(&overduePayments)

	for i := range overduePayments {
		p := &overduePayments[i]
		if p.DueDate != nil {
			daysLate := int(time.Since(*p.DueDate).Hours() / 24)
			if daysLate > 0 {
				penaltyRate := math.Min(float64(daysLate)*0.02, 0.20)
				p.PenaltyAmount = p.Amount * penaltyRate
				p.TotalAmount = p.Amount + p.PenaltyAmount
				h.DB.Save(p)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"overdue_count": len(overduePayments),
		"payments":      overduePayments,
	})
}

// GetClientKey returns the Midtrans client key for the frontend
func (h *PaymentHandler) GetClientKey(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"client_key":    h.Cfg.MidtransClientKey,
		"is_production": h.Cfg.MidtransIsProduction,
	})
}

// callMidtransSnap is a helper to call Midtrans Snap API
func (h *PaymentHandler) callMidtransSnap(orderID string, amount float64, itemName string, booking models.Booking) (string, string, error) {
	snapReq := map[string]interface{}{
		"transaction_details": map[string]interface{}{
			"order_id":     orderID,
			"gross_amount": int64(amount),
		},
		"customer_details": map[string]interface{}{
			"first_name": booking.Customer.Name,
			"email":      booking.Customer.Email,
			"phone":      booking.Customer.Phone,
		},
		"item_details": []map[string]interface{}{
			{
				"id":       fmt.Sprintf("PROP-%d", booking.PropertyID),
				"price":    int64(amount),
				"quantity": 1,
				"name":     truncateString(itemName, 50),
			},
		},
	}

	snapURL := "https://app.sandbox.midtrans.com/snap/v1/transactions"
	if h.Cfg.MidtransIsProduction {
		snapURL = "https://app.midtrans.com/snap/v1/transactions"
	}

	jsonBody, _ := json.Marshal(snapReq)
	req, err := http.NewRequest("POST", snapURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", "", fmt.Errorf("failed to create request")
	}

	authStr := base64.StdEncoding.EncodeToString([]byte(h.Cfg.MidtransServerKey + ":"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Basic "+authStr)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Midtrans API error: %v", err)
		return "", "", fmt.Errorf("failed to connect to payment gateway")
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var snapResp struct {
		Token         string   `json:"token"`
		RedirectURL   string   `json:"redirect_url"`
		ErrorMessages []string `json:"error_messages"`
	}
	json.Unmarshal(body, &snapResp)

	if snapResp.Token == "" {
		log.Printf("Midtrans response: %s", string(body))
		return "", "", fmt.Errorf("failed to create payment token: %v", snapResp.ErrorMessages)
	}

	return snapResp.Token, snapResp.RedirectURL, nil
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
