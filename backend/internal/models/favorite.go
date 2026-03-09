package models

import (
	"time"
)

type Favorite struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;uniqueIndex:idx_user_property" json:"user_id"`
	PropertyID uint      `gorm:"not null;uniqueIndex:idx_user_property" json:"property_id"`
	CreatedAt  time.Time `json:"created_at"`

	User     User     `gorm:"foreignKey:UserID" json:"-"`
	Property Property `gorm:"foreignKey:PropertyID" json:"property,omitempty"`
}
