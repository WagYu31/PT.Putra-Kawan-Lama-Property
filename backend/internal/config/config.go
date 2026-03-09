package config

import "os"

type Config struct {
	DBHost    string
	DBPort    string
	DBUser    string
	DBPass    string
	DBName    string
	JWTSecret string
	Port      string
	GinMode   string
	UploadDir string

	// Midtrans
	MidtransServerKey    string
	MidtransClientKey    string
	MidtransIsProduction bool
}

func Load() *Config {
	return &Config{
		DBHost:    getEnv("DB_HOST", "localhost"),
		DBPort:    getEnv("DB_PORT", "5432"),
		DBUser:    getEnv("DB_USER", "pkwl_user"),
		DBPass:    getEnv("DB_PASSWORD", "pkwl_secret_2024"),
		DBName:    getEnv("DB_NAME", "pkwl_property"),
		JWTSecret: getEnv("JWT_SECRET", "pkwl-jwt-super-secret"),
		Port:      getEnv("PORT", "8080"),
		GinMode:   getEnv("GIN_MODE", "debug"),
		UploadDir: getEnv("UPLOAD_DIR", "./uploads"),

		MidtransServerKey:    getEnv("MIDTRANS_SERVER_KEY", "SB-Mid-server-YOUR_KEY_HERE"),
		MidtransClientKey:    getEnv("MIDTRANS_CLIENT_KEY", "SB-Mid-client-YOUR_KEY_HERE"),
		MidtransIsProduction: getEnv("MIDTRANS_IS_PRODUCTION", "false") == "true",
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
