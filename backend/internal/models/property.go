package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// StringArray is a MySQL-compatible replacement for pq.StringArray
// It stores string slices as JSON arrays in the database
type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	b, err := json.Marshal(s)
	return string(b), err
}

func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = StringArray{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	default:
		return fmt.Errorf("cannot scan %T into StringArray", value)
	}
	return json.Unmarshal(bytes, s)
}

type PropertyType string
type PropertyCategory string
type PropertyStatus string

const (
	TypeRent PropertyType = "rent"
	TypeSell PropertyType = "sell"
	TypeBoth PropertyType = "both"

	CategoryHouse      PropertyCategory = "house"
	CategoryApartment  PropertyCategory = "apartment"
	CategoryVilla      PropertyCategory = "villa"
	CategoryLand       PropertyCategory = "land"
	CategoryCommercial PropertyCategory = "commercial"
	CategoryWarehouse  PropertyCategory = "warehouse"

	StatusAvailable PropertyStatus = "available"
	StatusRented    PropertyStatus = "rented"
	StatusSold      PropertyStatus = "sold"
	StatusPending   PropertyStatus = "pending"
)

type Property struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	OwnerID     uint             `gorm:"not null;index" json:"owner_id"`
	Title       string           `gorm:"size:200;not null" json:"title"`
	Slug        string           `gorm:"size:200;uniqueIndex" json:"slug"`
	Description string           `gorm:"type:text" json:"description"`
	Type        PropertyType     `gorm:"size:10;not null" json:"type"`
	Category    PropertyCategory `gorm:"size:20;not null" json:"category"`
	Price       float64          `gorm:"not null" json:"price"`
	RentPeriod  string           `gorm:"size:20" json:"rent_period"`
	Currency    string           `gorm:"size:5;default:IDR" json:"currency"`

	// Location
	Address  string  `gorm:"size:255" json:"address"`
	City     string  `gorm:"size:100;index" json:"city"`
	Province string  `gorm:"size:100;index" json:"province"`
	ZipCode  string  `gorm:"size:10" json:"zip_code"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`

	// Specs
	Bedrooms    int     `json:"bedrooms"`
	Bathrooms   int     `json:"bathrooms"`
	GarageSize  int     `json:"garage_size"`
	BuildArea   float64 `json:"build_area"`
	LandArea    float64 `json:"land_area"`
	Floors      int     `json:"floors"`
	YearBuilt   int     `json:"year_built"`
	Certificate string  `gorm:"size:50" json:"certificate"`

	// Media
	Images     StringArray `gorm:"type:json" json:"images"`
	VideoURL   string         `gorm:"size:255" json:"video_url"`
	VirtualTour string        `gorm:"size:255" json:"virtual_tour"`

	// Features
	Facilities StringArray `gorm:"type:json" json:"facilities"`

	// Status
	Status   PropertyStatus `gorm:"size:20;default:available;index" json:"status"`
	Featured bool           `gorm:"default:false;index" json:"featured"`
	Views    int            `gorm:"default:0" json:"views"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Owner    User      `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Bookings []Booking `gorm:"foreignKey:PropertyID" json:"bookings,omitempty"`
}
