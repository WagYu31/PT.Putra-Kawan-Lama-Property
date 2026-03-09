package models

import (
	"time"

	"gorm.io/gorm"
)

type PaymentStatus string
type PaymentType string

const (
	PaymentPending  PaymentStatus = "pending"
	PaymentPaid     PaymentStatus = "paid"
	PaymentExpired  PaymentStatus = "expired"
	PaymentFailed   PaymentStatus = "failed"
	PaymentRefunded PaymentStatus = "refunded"

	PaymentTypeCash        PaymentType = "cash"
	PaymentTypeInstallment PaymentType = "installment"
	PaymentTypeRental      PaymentType = "rental"
)

type Payment struct {
	ID            uint          `gorm:"primaryKey" json:"id"`
	BookingID     uint          `gorm:"not null;index" json:"booking_id"`
	OrderID       string        `gorm:"size:100;uniqueIndex" json:"order_id"`
	SnapToken     string        `gorm:"size:255" json:"snap_token"`
	Amount        float64       `gorm:"not null" json:"amount"`
	PenaltyAmount float64       `gorm:"default:0" json:"penalty_amount"`
	TotalAmount   float64       `gorm:"not null" json:"total_amount"`
	Status        PaymentStatus `gorm:"size:20;default:pending;index" json:"status"`
	PaymentType   PaymentType   `gorm:"size:20;not null" json:"payment_type"`
	PaymentMethod string        `gorm:"size:50" json:"payment_method"` // bank_transfer, gopay, etc
	DueDate       *time.Time    `json:"due_date"`
	PaidAt        *time.Time    `json:"paid_at"`
	BillingPeriod int           `gorm:"default:0" json:"billing_period"` // cycle number for rental
	MidtransID    string        `gorm:"size:100" json:"midtrans_id"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Booking Booking `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
}
