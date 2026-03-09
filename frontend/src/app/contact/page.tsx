'use client';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { LiveChatProvider } from '@/lib/livechat';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatBot from '@/components/layout/ChatBot';
import styles from './contact.module.css';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // In production: api('/api/inquiries', { method: 'POST', body: form })
        setSent(true);
        setTimeout(() => setSent(false), 4000);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    };

    return (
        <AuthProvider><LiveChatProvider>
            <Navbar />
            <main className={styles.page}>
                <section className={styles.hero}>
                    <div className="container">
                        <span className="section-label">Hubungi Kami</span>
                        <h1 className={styles.title}>Mari <span className="gold-text">Berbicara</span></h1>
                        <p className={styles.subtitle}>Kami siap membantu Anda menemukan properti impian</p>
                    </div>
                </section>

                <section className="section">
                    <div className="container">
                        <div className={styles.contactGrid}>
                            <div className={styles.contactInfo}>
                                <h2>Informasi Kontak</h2>
                                <div className={styles.infoList}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoIcon}>📍</span>
                                        <div>
                                            <h4>Alamat</h4>
                                            <p>Jakarta, Indonesia</p>
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoIcon}>📞</span>
                                        <div>
                                            <h4>Telepon</h4>
                                            <p>+62 812-3456-7890</p>
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoIcon}>✉️</span>
                                        <div>
                                            <h4>Email</h4>
                                            <p>info@putrakawanlama.com</p>
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoIcon}>🕒</span>
                                        <div>
                                            <h4>Jam Kerja</h4>
                                            <p>Senin - Sabtu: 08:00 - 17:00</p>
                                        </div>
                                    </div>
                                </div>
                                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 24 }}>
                                    💬 Chat via WhatsApp
                                </a>
                            </div>

                            <form className={styles.contactForm} onSubmit={handleSubmit}>
                                <h2>Kirim Pesan</h2>
                                {sent && <div className={styles.success}>Pesan terkirim! Kami akan segera menghubungi Anda.</div>}
                                <div className="form-group">
                                    <label className="form-label">Nama</label>
                                    <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className={styles.formRow}>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Telepon</label>
                                        <input type="tel" className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subjek</label>
                                    <input type="text" className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Pesan</label>
                                    <textarea className="form-input" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} />
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Kirim Pesan</button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
            <ChatBot />
        </LiveChatProvider></AuthProvider>
    );
}
