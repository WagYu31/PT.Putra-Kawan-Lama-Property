package models

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleCustomer Role = "customer"
	RoleOwner    Role = "owner"
	RoleAdmin    Role = "admin"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Email     string         `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Phone     string         `gorm:"size:20" json:"phone"`
	Role      Role           `gorm:"size:20;default:customer" json:"role"`
	Avatar    string         `gorm:"size:255" json:"avatar"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Properties []Property `gorm:"foreignKey:OwnerID" json:"properties,omitempty"`
	Bookings   []Booking  `gorm:"foreignKey:CustomerID" json:"bookings,omitempty"`
}
