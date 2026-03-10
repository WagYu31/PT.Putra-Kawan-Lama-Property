package database

import (
	"fmt"
	"log"

	"github.com/putra-kawan-lama/backend/internal/config"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPass, cfg.DBName,
	)

	logLevel := logger.Info
	if cfg.GinMode == "release" {
		logLevel = logger.Warn
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("✅ Database connected successfully")
	return db, nil
}

func Migrate(db *gorm.DB) error {
	log.Println("🔄 Running database migrations...")
	err := db.AutoMigrate(
		&models.User{},
		&models.Property{},
		&models.Booking{},
		&models.Inquiry{},
		&models.Payment{},
		&models.Notification{},
		&models.Favorite{},
		&models.Document{},
		&models.PageView{},
	)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}
	log.Println("✅ Database migrations completed")
	return nil
}
