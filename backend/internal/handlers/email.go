package handlers

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"github.com/putra-kawan-lama/backend/internal/config"
)

// SendEmail sends an email via SMTP. Returns silently if SMTP is not configured.
func SendEmail(cfg *config.Config, to, subject, htmlBody string) {
	if cfg.SMTPHost == "" || cfg.SMTPUser == "" {
		log.Println("📧 Email skipped: SMTP not configured")
		return
	}

	from := cfg.SMTPFrom
	if from == "" {
		from = cfg.SMTPUser
	}

	headers := []string{
		"From: " + from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=UTF-8",
	}

	msg := []byte(strings.Join(headers, "\r\n") + "\r\n\r\n" + htmlBody)

	auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)

	if err := smtp.SendMail(addr, auth, from, []string{to}, msg); err != nil {
		log.Printf("❌ Failed to send email to %s: %v", to, err)
	} else {
		log.Printf("✅ Email sent to %s: %s", to, subject)
	}
}

// SendPaymentSuccessEmail sends a nicely formatted email after payment success
func SendPaymentSuccessEmail(cfg *config.Config, customerName, customerEmail, propertyTitle, paymentLabel, amount, invoiceNo string) {
	subject := fmt.Sprintf("✅ Pembayaran Berhasil - %s | PKWL", paymentLabel)

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif; background:#f4f4f4; padding:20px; margin:0;">
<div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1a1f2e,#2d3548); padding:30px; text-align:center;">
    <h1 style="color:#c9a84c; margin:0; font-size:24px;">PKWL</h1>
    <p style="color:rgba(255,255,255,0.6); font-size:13px; margin-top:4px;">PT. Putra Kawan Lama</p>
  </div>
  <div style="padding:30px;">
    <div style="text-align:center; margin-bottom:24px;">
      <span style="font-size:48px;">✅</span>
      <h2 style="color:#10b981; margin:8px 0 0;">Pembayaran Berhasil!</h2>
    </div>
    <p style="color:#333; line-height:1.6;">Halo <strong>%s</strong>,</p>
    <p style="color:#666; line-height:1.6;">Pembayaran Anda telah berhasil diproses. Berikut detailnya:</p>
    <table style="width:100%%; margin:20px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0; color:#888; border-bottom:1px solid #f0f0f0;">Properti</td>
        <td style="padding:10px 0; text-align:right; font-weight:600; border-bottom:1px solid #f0f0f0;">%s</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:#888; border-bottom:1px solid #f0f0f0;">Keterangan</td>
        <td style="padding:10px 0; text-align:right; font-weight:600; border-bottom:1px solid #f0f0f0;">%s</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:#888; border-bottom:1px solid #f0f0f0;">Jumlah</td>
        <td style="padding:10px 0; text-align:right; font-weight:700; color:#c9a84c; border-bottom:1px solid #f0f0f0;">%s</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:#888;">No. Invoice</td>
        <td style="padding:10px 0; text-align:right; font-weight:600;">%s</td>
      </tr>
    </table>
    <p style="color:#666; font-size:13px; line-height:1.6;">Anda dapat melihat dan mencetak invoice melalui Dashboard → Pembayaran.</p>
  </div>
  <div style="background:#f8f9fa; padding:16px 30px; text-align:center; color:#94a3b8; font-size:12px;">
    <p>Email ini dikirim otomatis oleh sistem PKWL. Jangan membalas email ini.</p>
  </div>
</div>
</body>
</html>`,
		customerName,
		propertyTitle,
		paymentLabel,
		amount,
		invoiceNo,
	)

	SendEmail(cfg, customerEmail, subject, html)
}

// SendWelcomeEmail sends a welcome email after registration
func SendWelcomeEmail(cfg *config.Config, name, email string) {
	subject := "🎉 Selamat Datang di PKWL Property!"

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif; background:#f4f4f4; padding:20px; margin:0;">
<div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1a1f2e,#2d3548); padding:30px; text-align:center;">
    <h1 style="color:#c9a84c; margin:0; font-size:24px;">PKWL</h1>
    <p style="color:rgba(255,255,255,0.6); font-size:13px; margin-top:4px;">PT. Putra Kawan Lama</p>
  </div>
  <div style="padding:30px;">
    <div style="text-align:center; margin-bottom:24px;">
      <span style="font-size:48px;">🎉</span>
      <h2 style="color:#c9a84c; margin:8px 0 0;">Selamat Datang!</h2>
    </div>
    <p style="color:#333; line-height:1.6;">Halo <strong>%s</strong>,</p>
    <p style="color:#666; line-height:1.6;">Terima kasih telah mendaftar di <strong>PT. Putra Kawan Lama Property</strong>. Akun Anda telah berhasil dibuat.</p>
    <p style="color:#666; line-height:1.6;">Anda sekarang dapat:</p>
    <ul style="color:#666; line-height:2;">
      <li>🏠 Menjelajahi properti yang tersedia</li>
      <li>📅 Menjadwalkan survey properti</li>
      <li>💰 Melakukan booking dan pembayaran</li>
      <li>💬 Berkomunikasi langsung dengan admin</li>
    </ul>
    <div style="text-align:center; margin-top:24px;">
      <a href="#" style="display:inline-block; padding:12px 32px; background:linear-gradient(135deg,#c9a84c,#e0c068); color:#1a1a2e; text-decoration:none; border-radius:8px; font-weight:700;">Mulai Jelajahi Properti</a>
    </div>
  </div>
  <div style="background:#f8f9fa; padding:16px 30px; text-align:center; color:#94a3b8; font-size:12px;">
    <p>Email ini dikirim otomatis oleh sistem PKWL. Jangan membalas email ini.</p>
  </div>
</div>
</body>
</html>`, name)

	SendEmail(cfg, email, subject, html)
}

// SendBookingCreatedEmail sends email when a new booking is created
func SendBookingCreatedEmail(cfg *config.Config, customerName, customerEmail, propertyTitle, bookingType, detail string) {
	typeLabel := map[string]string{"survey": "Survey", "purchase": "Pembelian", "rental": "Sewa"}
	label := typeLabel[bookingType]
	if label == "" {
		label = bookingType
	}

	subject := fmt.Sprintf("📋 Booking %s Baru - %s | PKWL", label, propertyTitle)

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif; background:#f4f4f4; padding:20px; margin:0;">
<div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1a1f2e,#2d3548); padding:30px; text-align:center;">
    <h1 style="color:#c9a84c; margin:0; font-size:24px;">PKWL</h1>
    <p style="color:rgba(255,255,255,0.6); font-size:13px; margin-top:4px;">PT. Putra Kawan Lama</p>
  </div>
  <div style="padding:30px;">
    <div style="text-align:center; margin-bottom:24px;">
      <span style="font-size:48px;">📋</span>
      <h2 style="color:#3b82f6; margin:8px 0 0;">Booking %s Berhasil Dibuat</h2>
    </div>
    <p style="color:#333; line-height:1.6;">Halo <strong>%s</strong>,</p>
    <p style="color:#666; line-height:1.6;">Booking Anda telah berhasil dibuat. Berikut detailnya:</p>
    <table style="width:100%%; margin:20px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0; color:#888; border-bottom:1px solid #f0f0f0;">Properti</td>
        <td style="padding:10px 0; text-align:right; font-weight:600; border-bottom:1px solid #f0f0f0;">%s</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:#888; border-bottom:1px solid #f0f0f0;">Tipe</td>
        <td style="padding:10px 0; text-align:right; font-weight:600; border-bottom:1px solid #f0f0f0;">%s</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:#888;">Detail</td>
        <td style="padding:10px 0; text-align:right; font-weight:600;">%s</td>
      </tr>
    </table>
    <p style="color:#666; font-size:13px; line-height:1.6;">Status booking Anda saat ini: <strong>Menunggu Konfirmasi</strong>. Admin kami akan segera memproses booking Anda.</p>
  </div>
  <div style="background:#f8f9fa; padding:16px 30px; text-align:center; color:#94a3b8; font-size:12px;">
    <p>Email ini dikirim otomatis oleh sistem PKWL. Jangan membalas email ini.</p>
  </div>
</div>
</body>
</html>`, label, customerName, propertyTitle, label, detail)

	SendEmail(cfg, customerEmail, subject, html)
}

// SendBookingStatusEmail sends email when booking status changes (confirmed, cancelled, etc.)
func SendBookingStatusEmail(cfg *config.Config, customerName, customerEmail, propertyTitle, status string) {
	var emoji, color, statusLabel, message string
	switch status {
	case "confirmed":
		emoji, color, statusLabel = "✅", "#10b981", "Dikonfirmasi"
		message = "Booking Anda telah dikonfirmasi oleh admin. Silakan lanjutkan ke tahap berikutnya."
	case "cancelled":
		emoji, color, statusLabel = "❌", "#ef4444", "Dibatalkan"
		message = "Maaf, booking Anda telah dibatalkan. Silakan hubungi admin untuk informasi lebih lanjut."
	case "completed":
		emoji, color, statusLabel = "🎉", "#c9a84c", "Selesai"
		message = "Selamat! Proses booking Anda telah selesai. Terima kasih telah menggunakan layanan kami."
	default:
		emoji, color, statusLabel = "📋", "#3b82f6", status
		message = "Status booking Anda telah diperbarui."
	}

	subject := fmt.Sprintf("%s Booking %s - %s | PKWL", emoji, statusLabel, propertyTitle)

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif; background:#f4f4f4; padding:20px; margin:0;">
<div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1a1f2e,#2d3548); padding:30px; text-align:center;">
    <h1 style="color:#c9a84c; margin:0; font-size:24px;">PKWL</h1>
    <p style="color:rgba(255,255,255,0.6); font-size:13px; margin-top:4px;">PT. Putra Kawan Lama</p>
  </div>
  <div style="padding:30px;">
    <div style="text-align:center; margin-bottom:24px;">
      <span style="font-size:48px;">%s</span>
      <h2 style="color:%s; margin:8px 0 0;">Booking %s</h2>
    </div>
    <p style="color:#333; line-height:1.6;">Halo <strong>%s</strong>,</p>
    <p style="color:#666; line-height:1.6;">%s</p>
    <table style="width:100%%; margin:20px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0; color:#888; border-bottom:1px solid #f0f0f0;">Properti</td>
        <td style="padding:10px 0; text-align:right; font-weight:600; border-bottom:1px solid #f0f0f0;">%s</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:#888;">Status</td>
        <td style="padding:10px 0; text-align:right; font-weight:700; color:%s;">%s</td>
      </tr>
    </table>
    <p style="color:#666; font-size:13px; line-height:1.6;">Lihat detail selengkapnya di Dashboard → Booking Saya.</p>
  </div>
  <div style="background:#f8f9fa; padding:16px 30px; text-align:center; color:#94a3b8; font-size:12px;">
    <p>Email ini dikirim otomatis oleh sistem PKWL. Jangan membalas email ini.</p>
  </div>
</div>
</body>
</html>`, emoji, color, statusLabel, customerName, message, propertyTitle, color, statusLabel)

	SendEmail(cfg, customerEmail, subject, html)
}

// SendDocumentStatusEmail sends email when document is approved or rejected
func SendDocumentStatusEmail(cfg *config.Config, customerName, customerEmail, propertyTitle, docLabel, action, reason string) {
	var emoji, color, statusLabel, message string
	if action == "all_approved" {
		emoji, color, statusLabel = "✅", "#10b981", "Semua Dokumen Disetujui"
		message = "Semua dokumen Anda telah diverifikasi dan disetujui. Silakan lanjutkan ke proses pembayaran."
	} else {
		emoji, color, statusLabel = "❌", "#ef4444", "Dokumen Ditolak"
		message = fmt.Sprintf("Dokumen <strong>%s</strong> Anda ditolak. Alasan: %s. Silakan upload ulang dokumen yang benar.", docLabel, reason)
	}

	subject := fmt.Sprintf("%s %s - %s | PKWL", emoji, statusLabel, propertyTitle)

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif; background:#f4f4f4; padding:20px; margin:0;">
<div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1a1f2e,#2d3548); padding:30px; text-align:center;">
    <h1 style="color:#c9a84c; margin:0; font-size:24px;">PKWL</h1>
    <p style="color:rgba(255,255,255,0.6); font-size:13px; margin-top:4px;">PT. Putra Kawan Lama</p>
  </div>
  <div style="padding:30px;">
    <div style="text-align:center; margin-bottom:24px;">
      <span style="font-size:48px;">%s</span>
      <h2 style="color:%s; margin:8px 0 0;">%s</h2>
    </div>
    <p style="color:#333; line-height:1.6;">Halo <strong>%s</strong>,</p>
    <p style="color:#666; line-height:1.6;">%s</p>
    <table style="width:100%%; margin:20px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0; color:#888;">Properti</td>
        <td style="padding:10px 0; text-align:right; font-weight:600;">%s</td>
      </tr>
    </table>
    <p style="color:#666; font-size:13px; line-height:1.6;">Lihat detail selengkapnya di Dashboard → Booking Saya.</p>
  </div>
  <div style="background:#f8f9fa; padding:16px 30px; text-align:center; color:#94a3b8; font-size:12px;">
    <p>Email ini dikirim otomatis oleh sistem PKWL. Jangan membalas email ini.</p>
  </div>
</div>
</body>
</html>`, emoji, color, statusLabel, customerName, message, propertyTitle)

	SendEmail(cfg, customerEmail, subject, html)
}

