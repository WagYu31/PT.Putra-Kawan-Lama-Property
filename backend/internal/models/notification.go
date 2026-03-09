package models

import (
	"time"

	"gorm.io/gorm"
)

type NotificationType string

const (
	NotifPaymentSuccess  NotificationType = "payment_success"
	NotifInstallmentDue  NotificationType = "installment_due"
	NotifBookingConfirmed NotificationType = "booking_confirmed"
	NotifBookingCancelled NotificationType = "booking_cancelled"
	NotifGeneral         NotificationType = "general"
)

type Notification struct {
	ID        uint             `gorm:"primaryKey" json:"id"`
	UserID    uint             `gorm:"not null;index" json:"user_id"`
	Title     string           `gorm:"size:200;not null" json:"title"`
	Message   string           `gorm:"type:text;not null" json:"message"`
	Type      NotificationType `gorm:"size:30;default:general" json:"type"`
	IsRead    bool             `gorm:"default:false" json:"is_read"`
	RelatedID *uint            `json:"related_id"` // booking or payment ID
	CreatedAt time.Time        `json:"created_at"`
	DeletedAt gorm.DeletedAt   `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}
