package database

import (
	"log"
	"time"

	"github.com/lib/pq"
	"github.com/putra-kawan-lama/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) error {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("⏭️  Database already seeded, skipping...")
		return nil
	}

	log.Println("🌱 Seeding database...")

	// Hash passwords
	adminPass, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	ownerPass, _ := bcrypt.GenerateFromPassword([]byte("owner123"), bcrypt.DefaultCost)
	customerPass, _ := bcrypt.GenerateFromPassword([]byte("customer123"), bcrypt.DefaultCost)

	// Create users
	admin := models.User{
		Name:     "Admin PKWL",
		Email:    "admin@putrakawanlama.com",
		Password: string(adminPass),
		Phone:    "081234567890",
		Role:     models.RoleAdmin,
	}
	owner := models.User{
		Name:     "Budi Santoso",
		Email:    "owner@putrakawanlama.com",
		Password: string(ownerPass),
		Phone:    "081234567891",
		Role:     models.RoleOwner,
	}
	customer := models.User{
		Name:     "Siti Rahayu",
		Email:    "customer@putrakawanlama.com",
		Password: string(customerPass),
		Phone:    "081234567892",
		Role:     models.RoleCustomer,
	}

	db.Create(&admin)
	db.Create(&owner)
	db.Create(&customer)

	// Create properties
	properties := []models.Property{
		{
			OwnerID:     owner.ID,
			Title:       "Rumah Mewah Golf Island PIK 2",
			Slug:        "rumah-mewah-golf-island-pik-2",
			Description: "Rumah mewah 3 lantai dengan pemandangan lapangan golf di kawasan prestisius Golf Island PIK 2. Dilengkapi dengan smart home system, kolam renang pribadi, dan taman yang luas. Lokasi strategis dekat dengan pusat perbelanjaan dan akses tol langsung.",
			Type:        models.TypeSell,
			Category:    models.CategoryHouse,
			Price:       12500000000,
			Currency:    "IDR",
			Address:     "Golf Island Blok A No. 15",
			City:        "Jakarta Utara",
			Province:    "DKI Jakarta",
			Lat:         -6.1024,
			Lng:         106.7312,
			Bedrooms:    5,
			Bathrooms:   4,
			GarageSize:  2,
			BuildArea:   350,
			LandArea:    500,
			Floors:      3,
			YearBuilt:   2024,
			Certificate: "SHM",
			Images:      pq.StringArray{"/uploads/property-1a.jpg", "/uploads/property-1b.jpg", "/uploads/property-1c.jpg"},
			Facilities:  pq.StringArray{"Kolam Renang", "Smart Home", "Taman", "CCTV", "Carport", "Rooftop"},
			Status:      models.StatusAvailable,
			Featured:    true,
		},
		{
			OwnerID:     owner.ID,
			Title:       "Apartemen Luxury Ebony Tower",
			Slug:        "apartemen-luxury-ebony-tower",
			Description: "Unit apartemen premium di Ebony Tower dengan full furnished design interior modern. 180° city view, fasilitas lengkap termasuk infinity pool, gym, dan sky lounge. Cocok untuk investasi maupun hunian.",
			Type:        models.TypeRent,
			Category:    models.CategoryApartment,
			Price:       25000000,
			RentPeriod:  "bulan",
			Currency:    "IDR",
			Address:     "Ebony Tower Lt. 25 Unit A",
			City:        "Jakarta Utara",
			Province:    "DKI Jakarta",
			Lat:         -6.1100,
			Lng:         106.7400,
			Bedrooms:    3,
			Bathrooms:   2,
			BuildArea:   120,
			LandArea:    0,
			Floors:      1,
			YearBuilt:   2023,
			Certificate: "PPJB",
			Images:      pq.StringArray{"/uploads/property-2a.jpg", "/uploads/property-2b.jpg"},
			Facilities:  pq.StringArray{"Infinity Pool", "Gym", "Sky Lounge", "Concierge", "Parking"},
			Status:      models.StatusAvailable,
			Featured:    true,
		},
		{
			OwnerID:     owner.ID,
			Title:       "Villa Resort Bali Style di Sentul",
			Slug:        "villa-resort-bali-style-sentul",
			Description: "Villa bergaya Bali modern dengan private pool dan pemandangan gunung. Sangat cocok untuk weekend getaway atau investasi vila sewa harian. Terletak di kawasan pegunungan Sentul dengan udara sejuk.",
			Type:        models.TypeBoth,
			Category:    models.CategoryVilla,
			Price:       8500000000,
			Currency:    "IDR",
			Address:     "Sentul Highland Blok V No. 8",
			City:        "Bogor",
			Province:    "Jawa Barat",
			Lat:         -6.5998,
			Lng:         106.8499,
			Bedrooms:    4,
			Bathrooms:   3,
			GarageSize:  1,
			BuildArea:   280,
			LandArea:    600,
			Floors:      2,
			YearBuilt:   2023,
			Certificate: "SHM",
			Images:      pq.StringArray{"/uploads/property-3a.jpg", "/uploads/property-3b.jpg"},
			Facilities:  pq.StringArray{"Private Pool", "Garden", "BBQ Area", "Mountain View", "Gazebo"},
			Status:      models.StatusAvailable,
			Featured:    true,
		},
		{
			OwnerID:     owner.ID,
			Title:       "Ruko Strategis BSD City",
			Slug:        "ruko-strategis-bsd-city",
			Description: "Ruko 3 lantai di lokasi paling strategis BSD City, cocok untuk segala jenis usaha. Area parkir luas, foot traffic tinggi, dekat sekolah dan perkantoran.",
			Type:        models.TypeSell,
			Category:    models.CategoryCommercial,
			Price:       5200000000,
			Currency:    "IDR",
			Address:     "BSD Junction Blok R No. 12",
			City:        "Tangerang Selatan",
			Province:    "Banten",
			Lat:         -6.3020,
			Lng:         106.6530,
			Bedrooms:    0,
			Bathrooms:   3,
			BuildArea:   240,
			LandArea:    100,
			Floors:      3,
			YearBuilt:   2022,
			Certificate: "SHM",
			Images:      pq.StringArray{"/uploads/property-4a.jpg"},
			Facilities:  pq.StringArray{"Parking Area", "Loading Dock", "Security 24/7"},
			Status:      models.StatusAvailable,
			Featured:    false,
		},
		{
			OwnerID:     owner.ID,
			Title:       "Kavling Premium Pantai Indah Kapuk",
			Slug:        "kavling-premium-pantai-indah-kapuk",
			Description: "Kavling tanah premium di kawasan elit PIK dengan luas 800m². Lokasi hook, akses jalan lebar, siap bangun. Sangat cocok untuk membangun rumah impian atau investasi jangka panjang.",
			Type:        models.TypeSell,
			Category:    models.CategoryLand,
			Price:       15000000000,
			Currency:    "IDR",
			Address:     "PIK Cluster Diamond Blok D",
			City:        "Jakarta Utara",
			Province:    "DKI Jakarta",
			Lat:         -6.1050,
			Lng:         106.7350,
			LandArea:    800,
			Certificate: "SHM",
			Images:      pq.StringArray{"/uploads/property-5a.jpg"},
			Facilities:  pq.StringArray{"Corner Lot", "Wide Road Access", "Gated Community"},
			Status:      models.StatusAvailable,
			Featured:    true,
		},
		{
			OwnerID:     owner.ID,
			Title:       "Gudang Modern Cikupa Industrial",
			Slug:        "gudang-modern-cikupa-industrial",
			Description: "Gudang modern dengan sistem keamanan 24 jam dan akses kontainer. Dekat dengan akses tol dan pelabuhan. Cocok untuk logistik dan distribusi.",
			Type:        models.TypeRent,
			Category:    models.CategoryWarehouse,
			Price:       75000000,
			RentPeriod:  "bulan",
			Currency:    "IDR",
			Address:     "Cikupa Industrial Park Blok G",
			City:        "Tangerang",
			Province:    "Banten",
			Lat:         -6.2400,
			Lng:         106.5100,
			BuildArea:   2000,
			LandArea:    3000,
			Floors:      1,
			YearBuilt:   2021,
			Certificate: "HGB",
			Images:      pq.StringArray{"/uploads/property-6a.jpg"},
			Facilities:  pq.StringArray{"Container Access", "Security 24/7", "Office Space", "Loading Area"},
			Status:      models.StatusAvailable,
			Featured:    false,
		},
	}

	for i := range properties {
		properties[i].CreatedAt = time.Now().Add(time.Duration(-i*24) * time.Hour)
		db.Create(&properties[i])
	}

	log.Printf("✅ Seeded %d users and %d properties", 3, len(properties))
	return nil
}
