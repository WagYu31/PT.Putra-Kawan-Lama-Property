package models

import (
	"time"
)

type DocumentType string
type DocumentStatus string

const (
	DocKTP      DocumentType = "ktp"
	DocKK       DocumentType = "kk"
	DocNPWP     DocumentType = "npwp"
	DocSlipGaji DocumentType = "slip_gaji"

	DocStatusPending  DocumentStatus = "pending"
	DocStatusApproved DocumentStatus = "approved"
	DocStatusRejected DocumentStatus = "rejected"
)

type Document struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	BookingID      uint           `gorm:"not null;index" json:"booking_id"`
	UserID         uint           `gorm:"not null;index" json:"user_id"`
	Type           DocumentType   `gorm:"size:20;not null" json:"type"`
	FilePath       string         `gorm:"size:500;not null" json:"file_path"`
	OriginalName   string         `gorm:"size:255" json:"original_name"`
	Status         DocumentStatus `gorm:"size:20;default:pending" json:"status"`
	RejectedReason string         `gorm:"size:500" json:"rejected_reason,omitempty"`
	VerifiedAt     *time.Time     `json:"verified_at,omitempty"`
	VerifiedBy     *uint          `json:"verified_by,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`

	Booking  Booking `gorm:"foreignKey:BookingID" json:"-"`
	User     User    `gorm:"foreignKey:UserID" json:"-"`
	Verifier *User   `gorm:"foreignKey:VerifiedBy" json:"verifier,omitempty"`
}

// DocTypeLabel returns Indonesian label for document type
func DocTypeLabel(dt DocumentType) string {
	switch dt {
	case DocKTP:
		return "KTP"
	case DocKK:
		return "Kartu Keluarga"
	case DocNPWP:
		return "NPWP"
	case DocSlipGaji:
		return "Slip Gaji"
	default:
		return string(dt)
	}
}

// RequiredDocs returns required document types based on booking type and payment method
func RequiredDocs(bookingType BookingType, paymentMethod string) []DocumentType {
	switch bookingType {
	case BookingTypePurchase:
		if paymentMethod == "installment" {
			return []DocumentType{DocKTP, DocKK, DocNPWP, DocSlipGaji}
		}
		return []DocumentType{DocKTP, DocKK, DocNPWP}
	case BookingTypeRental:
		return []DocumentType{DocKTP}
	default:
		return []DocumentType{DocKTP}
	}
}
