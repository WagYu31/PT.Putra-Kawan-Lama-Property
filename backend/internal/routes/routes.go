package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/config"
	"github.com/putra-kawan-lama/backend/internal/handlers"
	"github.com/putra-kawan-lama/backend/internal/middleware"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "PT. Putra Kawan Lama Property API",
		})
	})

	// Initialize handlers
	authHandler := &handlers.AuthHandler{DB: db, Cfg: cfg}
	propertyHandler := &handlers.PropertyHandler{DB: db}
	bookingHandler := &handlers.BookingHandler{DB: db}
	paymentHandler := &handlers.PaymentHandler{DB: db, Cfg: cfg}
	inquiryHandler := &handlers.InquiryHandler{DB: db}
	uploadHandler := &handlers.UploadHandler{Cfg: cfg}
	userHandler := &handlers.UserHandler{DB: db}

	api := r.Group("/api")

	// Auth routes (public)
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// Auth routes (protected)
	authProtected := api.Group("/auth")
	authProtected.Use(middleware.AuthRequired(cfg))
	{
		authProtected.GET("/me", authHandler.GetProfile)
		authProtected.PUT("/profile", authHandler.UpdateProfile)
	}

	// Property routes (public)
	api.GET("/properties", propertyHandler.List)
	api.GET("/properties/:id", propertyHandler.GetByID)
	api.GET("/properties/slug/:slug", propertyHandler.GetBySlug)
	api.GET("/properties/stats", propertyHandler.GetStats)

	// Property routes (protected - admin only since this is a PT)
	propertiesProtected := api.Group("/properties")
	propertiesProtected.Use(middleware.AuthRequired(cfg), middleware.RoleRequired(models.RoleOwner, models.RoleAdmin))
	{
		propertiesProtected.POST("", propertyHandler.Create)
		propertiesProtected.PUT("/:id", propertyHandler.Update)
		propertiesProtected.DELETE("/:id", propertyHandler.Delete)
		propertiesProtected.PATCH("/:id/status", propertyHandler.UpdateStatus)
	}

	// Upload routes (protected)
	upload := api.Group("/upload")
	upload.Use(middleware.AuthRequired(cfg), middleware.RoleRequired(models.RoleOwner, models.RoleAdmin))
	{
		upload.POST("", uploadHandler.Upload)
		upload.POST("/multiple", uploadHandler.UploadMultiple)
	}

	// === SURVEY, BOOKING & RENTAL ===
	customerAuth := middleware.AuthRequired(cfg)

	// Public: get booked dates for a property (no auth needed)
	api.GET("/properties/:id/booked-dates", bookingHandler.GetBookedDates)

	// Survey (customer only)
	api.POST("/surveys", customerAuth, middleware.RoleRequired(models.RoleCustomer), bookingHandler.CreateSurvey)

	// Purchase booking (customer only)
	api.POST("/bookings/purchase", customerAuth, middleware.RoleRequired(models.RoleCustomer), bookingHandler.CreatePurchase)

	// Rental booking (customer only)
	api.POST("/bookings/rental", customerAuth, middleware.RoleRequired(models.RoleCustomer), bookingHandler.CreateRental)

	// Booking management
	bookings := api.Group("/bookings")
	bookings.Use(middleware.AuthRequired(cfg))
	{
		bookings.GET("", bookingHandler.List)
		bookings.GET("/:id", bookingHandler.GetByID)
		bookings.GET("/:id/installments", paymentHandler.GetInstallmentSchedule)
		bookings.PATCH("/:id/status", middleware.RoleRequired(models.RoleAdmin), bookingHandler.UpdateStatus)
	}

	// === PAYMENTS (Midtrans) ===
	// Public: Midtrans webhook (no auth needed)
	api.POST("/payments/notification", paymentHandler.HandleNotification)

	// Public: get Midtrans client key
	api.GET("/payments/client-key", paymentHandler.GetClientKey)

	// Protected payment routes
	payments := api.Group("/payments")
	payments.Use(middleware.AuthRequired(cfg))
	{
		payments.POST("/snap", middleware.RoleRequired(models.RoleCustomer), paymentHandler.CreateSnapToken)
		payments.POST("/installment/pay", middleware.RoleRequired(models.RoleCustomer), paymentHandler.PayInstallment)
		payments.GET("", paymentHandler.List)
		payments.GET("/:id", paymentHandler.GetPaymentStatus)
		payments.GET("/overdue", middleware.RoleRequired(models.RoleAdmin), paymentHandler.CheckOverdueRentals)
		payments.POST("/:id/sync", paymentHandler.SyncPaymentStatus)
	}

	// Inquiry routes
	api.POST("/inquiries", inquiryHandler.Create)
	inquiriesProtected := api.Group("/inquiries")
	inquiriesProtected.Use(middleware.AuthRequired(cfg), middleware.RoleRequired(models.RoleAdmin))
	{
		inquiriesProtected.GET("", inquiryHandler.List)
		inquiriesProtected.PATCH("/:id/read", inquiryHandler.MarkRead)
	}

	// User routes (admin only)
	users := api.Group("/users")
	users.Use(middleware.AuthRequired(cfg), middleware.RoleRequired(models.RoleAdmin))
	{
		users.GET("", userHandler.List)
		users.PUT("/:id/role", userHandler.UpdateRole)
		users.DELETE("/:id", userHandler.Delete)
	}

	invoiceHandler := &handlers.InvoiceHandler{DB: db}
	notifHandler := &handlers.NotificationHandler{DB: db}

	// Dashboard stats (admin)
	api.GET("/dashboard/stats", middleware.AuthRequired(cfg), middleware.RoleRequired(models.RoleAdmin), userHandler.GetDashboardStats)

	// Invoice routes
	api.GET("/payments/:id/invoice", invoiceHandler.GenerateInvoice) // public for browser tabs
	api.GET("/payments/:id/invoice-json", middleware.AuthRequired(cfg), invoiceHandler.GetInvoiceJSON)

	// Notification routes (protected)
	notifs := api.Group("/notifications")
	notifs.Use(middleware.AuthRequired(cfg))
	{
		notifs.GET("", notifHandler.List)
		notifs.GET("/unread-count", notifHandler.UnreadCount)
		notifs.PATCH("/:id/read", notifHandler.MarkRead)
		notifs.PATCH("/read-all", notifHandler.MarkAllRead)
	}

	// Favorite routes (protected)
	favoriteHandler := &handlers.FavoriteHandler{DB: db}
	favs := api.Group("/favorites")
	favs.Use(middleware.AuthRequired(cfg))
	{
		favs.GET("", favoriteHandler.List)
		favs.POST("/:id/toggle", favoriteHandler.Toggle)
		favs.GET("/:id/check", favoriteHandler.Check)
		favs.GET("/ids", favoriteHandler.CheckBulk)
	}
}
