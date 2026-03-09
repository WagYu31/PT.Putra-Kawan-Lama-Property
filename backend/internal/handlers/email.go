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
