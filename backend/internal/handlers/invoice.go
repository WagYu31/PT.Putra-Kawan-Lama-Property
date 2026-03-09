package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/putra-kawan-lama/backend/internal/models"
	"gorm.io/gorm"
)

type InvoiceHandler struct {
	DB *gorm.DB
}

func formatRupiah(amount float64) string {
	if amount == 0 {
		return "Rp 0"
	}
	s := fmt.Sprintf("%.0f", amount)
	n := len(s)
	if n <= 3 {
		return "Rp " + s
	}
	var result []string
	for i, j := n, 0; i > 0; j++ {
		end := i
		i -= 3
		if i < 0 {
			i = 0
		}
		result = append([]string{s[i:end]}, result...)
		_ = j
	}
	return "Rp " + strings.Join(result, ".")
}

// GenerateInvoice returns a printable HTML invoice for a payment
// This endpoint is public (no auth) so it can be opened directly in a browser tab.
func (h *InvoiceHandler) GenerateInvoice(c *gin.Context) {
	paymentID := c.Param("id")

	var payment models.Payment
	if err := h.DB.Preload("Booking.Property").Preload("Booking.Customer").First(&payment, paymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Generate invoice number
	invoiceNo := fmt.Sprintf("INV-%05d-%s", payment.ID, payment.CreatedAt.Format("20060102"))

	// Determine payment label
	paymentLabel := "Pembayaran"
	if payment.BillingPeriod == 0 && payment.PaymentType == models.PaymentTypeInstallment {
		paymentLabel = "Uang Muka (DP 10%)"
	} else if payment.PaymentType == models.PaymentTypeInstallment {
		paymentLabel = fmt.Sprintf("Cicilan ke-%d", payment.BillingPeriod)
	} else if payment.PaymentType == models.PaymentTypeCash {
		paymentLabel = "Pembayaran Lunas (Cash)"
	} else if payment.PaymentType == models.PaymentTypeRental {
		paymentLabel = "Pembayaran Sewa"
	}

	// Payment status
	statusLabel := "Belum Bayar"
	statusColor := "#f59e0b"
	if payment.Status == models.PaymentPaid {
		statusLabel = "LUNAS"
		statusColor = "#10b981"
	} else if payment.Status == models.PaymentExpired {
		statusLabel = "Expired"
		statusColor = "#ef4444"
	}

	paidAtStr := "-"
	if payment.PaidAt != nil {
		paidAtStr = payment.PaidAt.Format("02 Jan 2006, 15:04 WIB")
	}

	dueDateStr := "-"
	if payment.DueDate != nil {
		dueDateStr = payment.DueDate.Format("02 Jan 2006")
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice %s</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #f8f9fa; padding: 20px; }
  .invoice { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #1a1f2e, #2d3548); color: #fff; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header h1 { font-size: 28px; color: #c9a84c; margin-bottom: 4px; }
  .header p { color: rgba(255,255,255,0.7); font-size: 14px; }
  .invoice-number { text-align: right; }
  .invoice-number h2 { font-size: 16px; color: #c9a84c; margin-bottom: 4px; }
  .invoice-number p { color: rgba(255,255,255,0.6); font-size: 13px; }
  .body { padding: 40px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
  .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
  .info-box p { font-size: 14px; line-height: 1.6; }
  .info-box strong { color: #1a1f2e; }
  table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
  td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #1a1f2e; border-bottom: none; padding-top: 16px; }
  .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #fff; background: %s; }
  .footer { border-top: 1px solid #e2e8f0; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 12px; }
  @media print {
    body { background: #fff; padding: 0; }
    .invoice { box-shadow: none; }
    .no-print { display: none !important; }
  }
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #c9a84c; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; z-index: 100; }
  .print-btn:hover { background: #b8943f; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Cetak Invoice</button>
<div class="invoice">
  <div class="header">
    <div>
      <h1>PKWL</h1>
      <p>PT. Putra Kawan Lama</p>
      <p style="margin-top:8px; font-size:12px">Properti & Real Estate</p>
    </div>
    <div class="invoice-number">
      <h2>INVOICE</h2>
      <p>%s</p>
      <p>%s</p>
    </div>
  </div>
  <div class="body">
    <div class="info-grid">
      <div class="info-box">
        <h3>Ditagihkan Kepada</h3>
        <p><strong>%s</strong></p>
        <p>%s</p>
      </div>
      <div class="info-box">
        <h3>Detail Properti</h3>
        <p><strong>%s</strong></p>
        <p>%s</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Keterangan</th>
          <th>Jatuh Tempo</th>
          <th>Status</th>
          <th style="text-align:right">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>%s</td>
          <td>%s</td>
          <td><span class="status-badge">%s</span></td>
          <td style="text-align:right"><strong>%s</strong></td>
        </tr>
        <tr class="total-row">
          <td colspan="3">Total</td>
          <td style="text-align:right">%s</td>
        </tr>
      </tbody>
    </table>
    <div class="info-grid" style="margin-top:20px">
      <div class="info-box">
        <h3>Metode Pembayaran</h3>
        <p><strong>%s</strong></p>
      </div>
      <div class="info-box">
        <h3>Tanggal Bayar</h3>
        <p><strong>%s</strong></p>
      </div>
    </div>
  </div>
  <div class="footer">
    <p>Invoice ini sah dan diproses secara otomatis oleh sistem PKWL.</p>
    <p>Order ID: %s</p>
  </div>
</div>
</body>
</html>`,
		invoiceNo,
		statusColor,
		invoiceNo,
		payment.CreatedAt.Format("02 Jan 2006"),
		payment.Booking.Customer.Name,
		payment.Booking.Customer.Email,
		payment.Booking.Property.Title,
		formatRupiah(payment.Booking.TotalPrice),
		paymentLabel,
		dueDateStr,
		statusLabel,
		formatRupiah(payment.Amount),
		formatRupiah(payment.TotalAmount),
		func() string {
			if payment.PaymentMethod != "" {
				return strings.ToUpper(strings.ReplaceAll(payment.PaymentMethod, "_", " "))
			}
			return "Belum bayar"
		}(),
		paidAtStr,
		payment.OrderID,
	)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

// GetInvoiceJSON returns invoice data as JSON (for frontend rendering)
func (h *InvoiceHandler) GetInvoiceJSON(c *gin.Context) {
	paymentID := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	var payment models.Payment
	if err := h.DB.Preload("Booking.Property").Preload("Booking.Customer").First(&payment, paymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	if userRole.(models.Role) == models.RoleCustomer && payment.Booking.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your payment"})
		return
	}

	invoiceNo := fmt.Sprintf("INV-%05d-%s", payment.ID, payment.CreatedAt.Format("20060102"))

	c.JSON(http.StatusOK, gin.H{
		"invoice_no": invoiceNo,
		"date":       payment.CreatedAt.Format(time.RFC3339),
		"customer":   payment.Booking.Customer.Name,
		"email":      payment.Booking.Customer.Email,
		"property":   payment.Booking.Property.Title,
		"amount":     payment.Amount,
		"status":     payment.Status,
		"paid_at":    payment.PaidAt,
		"order_id":   payment.OrderID,
		"payment":    payment,
	})
}
