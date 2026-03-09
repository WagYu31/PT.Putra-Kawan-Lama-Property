package models

import (
	"time"

	"gorm.io/gorm"
)

type BookingStatus string
type BookingType string
type RentPeriodType string

const (
	BookingPending   BookingStatus = "pending"
	BookingConfirmed BookingStatus = "confirmed"
	BookingCancelled BookingStatus = "cancelled"
	BookingCompleted BookingStatus = "completed"
	BookingSurveyed  BookingStatus = "surveyed"

	BookingTypeSurvey   BookingType = "survey"
	BookingTypePurchase BookingType = "purchase"
	BookingTypeRental   BookingType = "rental"

	RentDaily   RentPeriodType = "daily"
	RentMonthly RentPeriodType = "monthly"
	RentYearly  RentPeriodType = "yearly"
)

type Booking struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	PropertyID   uint           `gorm:"not null;index" json:"property_id"`
	CustomerID   uint           `gorm:"not null;index" json:"customer_id"`
	BookingType  BookingType    `gorm:"size:20;not null;default:survey" json:"booking_type"`
	Status       BookingStatus  `gorm:"size:20;default:pending" json:"status"`
	Message      string         `gorm:"type:text" json:"message"`

	// Survey fields
	SurveyDate *time.Time `json:"survey_date"`

	// Purchase fields (Cash / Installment)
	PaymentMethod    string  `gorm:"size:20" json:"payment_method"` // cash, installment
	TotalPrice       float64 `json:"total_price"`
	InstallmentTenor int     `gorm:"default:0" json:"installment_tenor"` // 3, 6, 12 months
	DPAmount         float64 `gorm:"default:0" json:"dp_amount"`

	// Rental fields
	RentPeriod RentPeriodType `gorm:"size:20" json:"rent_period"`
	StartDate  *time.Time     `json:"start_date"`
	EndDate    *time.Time     `json:"end_date"`
	RentPrice  float64        `json:"rent_price"` // price per period

	// Document verification status
	DocStatus string `gorm:"size:20;default:''" json:"doc_status"` // "", doc_pending, doc_approved, doc_rejected

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Property  Property   `gorm:"foreignKey:PropertyID" json:"property,omitempty"`
	Customer  User       `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Payments  []Payment  `gorm:"foreignKey:BookingID" json:"payments,omitempty"`
	Documents []Document `gorm:"foreignKey:BookingID" json:"documents,omitempty"`
}

type Inquiry struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	PropertyID *uint     `gorm:"index" json:"property_id"`
	Name       string    `gorm:"size:100;not null" json:"name"`
	Email      string    `gorm:"size:100;not null" json:"email"`
	Phone      string    `gorm:"size:20" json:"phone"`
	Subject    string    `gorm:"size:200" json:"subject"`
	Message    string    `gorm:"type:text;not null" json:"message"`
	IsRead     bool      `gorm:"default:false" json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`

	Property *Property `gorm:"foreignKey:PropertyID" json:"property,omitempty"`
}
