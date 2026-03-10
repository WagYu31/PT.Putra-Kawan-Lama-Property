package models

import "time"

type PageView struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SessionID string    `gorm:"size:64;index" json:"session_id"`
	PagePath  string    `gorm:"size:500;index" json:"page_path"`
	IPAddress string    `gorm:"size:45" json:"ip_address"`
	UserAgent string    `gorm:"size:500" json:"user_agent"`
	Referrer  string    `gorm:"size:500" json:"referrer"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}
