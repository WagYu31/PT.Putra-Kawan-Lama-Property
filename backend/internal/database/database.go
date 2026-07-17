package database

import (
	"fmt"
	"log"
	"time"

	gomysql "github.com/go-sql-driver/mysql"
	"github.com/putra-kawan-lama/backend/internal/config"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	loc, _ := time.LoadLocation("Asia/Jakarta")
	mysqlCfg := gomysql.Config{
		User:                 cfg.DBUser,
		Passwd:               cfg.DBPass,
		Net:                  "tcp",
		Addr:                 fmt.Sprintf("%s:%s", cfg.DBHost, cfg.DBPort),
		DBName:               cfg.DBName,
		ParseTime:            true,
		Loc:                  loc,
		AllowNativePasswords: true,
		Collation:            "utf8mb4_unicode_ci",
	}
	dsn := mysqlCfg.FormatDSN()

	log.Printf("🔗 Connecting to MySQL at %s:%s/%s as %s", cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBUser)

	logLevel := logger.Info
	if cfg.GinMode == "release" {
		logLevel = logger.Warn
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
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
