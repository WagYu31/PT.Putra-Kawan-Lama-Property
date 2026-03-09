'use client';
import { AuthProvider } from '@/lib/auth';
import { LiveChatProvider } from '@/lib/livechat';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatBot from '@/components/layout/ChatBot';
import styles from './about.module.css';

export default function AboutPage() {
    return (
        <AuthProvider><LiveChatProvider>
            <Navbar />
            <main className={styles.page}>
                <section className={styles.hero}>
                    <div className="container">
                        <span className="section-label">Tentang Kami</span>
                        <h1 className={styles.title}>PT. Putra <span className="gold-text">Kawan Lama</span></h1>
                        <p className={styles.subtitle}>Mitra terpercaya Anda dalam investasi dan properti premium di Indonesia</p>
                    </div>
                </section>

                <section className={`section ${styles.story}`}>
                    <div className="container">
                        <div className={styles.storyGrid}>
                            <div className={styles.storyContent}>
                                <span className="section-label">Cerita Kami</span>
                                <h2 className="section-title">Membangun <span className="gold-text">Kepercayaan</span> Sejak Hari Pertama</h2>
                                <p>PT. Putra Kawan Lama didirikan dengan visi menjadi platform properti terdepan di Indonesia. Kami menghubungkan pemilik properti premium dengan calon pembeli dan penyewa yang tepat.</p>
                                <p>Dengan pengalaman bertahun-tahun di industri properti, kami memahami bahwa setiap klien memiliki kebutuhan unik. Tim profesional kami siap memberikan layanan konsultasi personal untuk membantu Anda menemukan properti yang sempurna.</p>
                            </div>
                            <div className={styles.storyImage}>
                                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=500&fit=crop" alt="About Us" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className={`section ${styles.values}`}>
                    <div className="container">
                        <div className={styles.valuesHeader}>
                            <span className="section-label">Nilai Kami</span>
                            <h2 className="section-title">Kenapa Memilih <span className="gold-text">Kami</span>?</h2>
                        </div>
                        <div className={styles.valuesGrid}>
                            {[
                                { icon: '🎯', title: 'Properti Terkurasi', desc: 'Setiap properti melewati seleksi ketat untuk menjamin kualitas terbaik' },
                                { icon: '🤝', title: 'Layanan Personal', desc: 'Konsultasi one-on-one dengan agen properti berpengalaman' },
                                { icon: '🔒', title: 'Transaksi Aman', desc: 'Proses transaksi transparan dengan dokumen legal yang lengkap' },
                                { icon: '💎', title: 'Kualitas Premium', desc: 'Fokus pada properti premium di lokasi strategis terbaik' },
                                { icon: '📊', title: 'Analisis Pasar', desc: 'Data dan insight pasar terkini untuk keputusan investasi yang tepat' },
                                { icon: '🏆', title: 'Track Record', desc: 'Rekam jejak positif dengan ratusan klien yang puas' },
                            ].map((v, i) => (
                                <div key={i} className={styles.valueCard}>
                                    <span className={styles.valueIcon}>{v.icon}</span>
                                    <h3>{v.title}</h3>
                                    <p>{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
            <ChatBot />
        </LiveChatProvider></AuthProvider>
    );
}
