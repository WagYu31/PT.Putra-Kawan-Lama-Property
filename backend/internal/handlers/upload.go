package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/config"
)

type UploadHandler struct {
	Cfg *config.Config
}

func (h *UploadHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File type not allowed. Use: jpg, jpeg, png, webp, gif"})
		return
	}

	// Max 10MB
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum 10MB"})
		return
	}

	// Create upload directory
	os.MkdirAll(h.Cfg.UploadDir, os.ModePerm)

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), strings.ReplaceAll(file.Filename, " ", "_"))
	filepath := filepath.Join(h.Cfg.UploadDir, filename)

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	url := fmt.Sprintf("/uploads/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"message":  "File uploaded successfully",
		"url":      url,
		"filename": filename,
	})
}

func (h *UploadHandler) UploadMultiple(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
		return
	}

	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 files at once"})
		return
	}

	os.MkdirAll(h.Cfg.UploadDir, os.ModePerm)

	var urls []string
	for _, file := range files {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
		if !allowed[ext] {
			continue
		}
		if file.Size > 10*1024*1024 {
			continue
		}

		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), strings.ReplaceAll(file.Filename, " ", "_"))
		fp := filepath.Join(h.Cfg.UploadDir, filename)
		if err := c.SaveUploadedFile(file, fp); err != nil {
			continue
		}
		urls = append(urls, fmt.Sprintf("/uploads/%s", filename))
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%d files uploaded", len(urls)),
		"urls":    urls,
	})
}
