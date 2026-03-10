package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type AnalyticsHandler struct {
	DB *gorm.DB
}

// Track records a page view (public endpoint)
func (h *AnalyticsHandler) Track(c *gin.Context) {
	var input struct {
		SessionID string `json:"session_id" binding:"required"`
		PagePath  string `json:"page_path" binding:"required"`
		Referrer  string `json:"referrer"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pv := models.PageView{
		SessionID: input.SessionID,
		PagePath:  input.PagePath,
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
		Referrer:  input.Referrer,
	}
	h.DB.Create(&pv)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Stats returns analytics data for admin dashboard
func (h *AnalyticsHandler) Stats(c *gin.Context) {
	now := time.Now()
	fiveMinAgo := now.Add(-5 * time.Minute)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))

	// Live visitors (unique sessions in last 5 min)
	var liveCount int64
	h.DB.Model(&models.PageView{}).
		Where("created_at >= ?", fiveMinAgo).
		Distinct("session_id").
		Count(&liveCount)

	// Today: unique visitors + total page views
	var todayVisitors int64
	h.DB.Model(&models.PageView{}).
		Where("created_at >= ?", todayStart).
		Distinct("session_id").
		Count(&todayVisitors)

	var todayPageViews int64
	h.DB.Model(&models.PageView{}).
		Where("created_at >= ?", todayStart).
		Count(&todayPageViews)

	// This week: unique visitors
	var weekVisitors int64
	h.DB.Model(&models.PageView{}).
		Where("created_at >= ?", weekStart).
		Distinct("session_id").
		Count(&weekVisitors)

	// Total all time
	var totalPageViews int64
	h.DB.Model(&models.PageView{}).Count(&totalPageViews)

	// Top 5 pages (last 7 days)
	type PageStat struct {
		PagePath string `json:"page_path"`
		Count    int64  `json:"count"`
	}
	var topPages []PageStat
	h.DB.Model(&models.PageView{}).
		Select("page_path, count(*) as count").
		Where("created_at >= ?", weekStart).
		Group("page_path").
		Order("count desc").
		Limit(5).
		Find(&topPages)

	// Hourly chart (last 24h)
	type HourlyStat struct {
		Hour  int   `json:"hour"`
		Count int64 `json:"count"`
	}
	var hourlyRaw []HourlyStat
	twentyFourHoursAgo := now.Add(-24 * time.Hour)
	h.DB.Model(&models.PageView{}).
		Select("EXTRACT(HOUR FROM created_at)::int as hour, count(distinct session_id) as count").
		Where("created_at >= ?", twentyFourHoursAgo).
		Group("hour").
		Order("hour").
		Find(&hourlyRaw)

	// Fill all 24 hours
	hourlyMap := make(map[int]int64)
	for _, h := range hourlyRaw {
		hourlyMap[h.Hour] = h.Count
	}
	hourly := make([]HourlyStat, 24)
	for i := 0; i < 24; i++ {
		hourly[i] = HourlyStat{Hour: i, Count: hourlyMap[i]}
	}

	c.JSON(http.StatusOK, gin.H{
		"live_visitors":    liveCount,
		"today_visitors":   todayVisitors,
		"today_page_views": todayPageViews,
		"week_visitors":    weekVisitors,
		"total_page_views": totalPageViews,
		"top_pages":        topPages,
		"hourly":           hourly,
	})
}
