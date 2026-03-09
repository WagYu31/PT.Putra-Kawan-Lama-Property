'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

export default function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: 'Temukan Hunian',
            highlight: 'Premium Impian',
            subtitle: 'Jual & sewa properti eksklusif di lokasi strategis dengan kualitas terbaik',
            label: 'WELCOME TO PKWL PROPERTY',
        },
        {
            title: 'Investasi Properti',
            highlight: 'Terpercaya',
            subtitle: 'Pilihan rumah, apartemen, villa, dan tanah premium dengan return maksimal',
            label: 'YOUR TRUSTED PARTNER',
        },
        {
            title: 'Layanan Properti',
            highlight: 'Profesional',
            subtitle: 'Didukung tim ahli berpengalaman untuk membantu menemukan properti ideal Anda',
            label: 'PROFESSIONAL SERVICE',
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    return (
        <section className={styles.hero}>
            <div className={styles.bgOverlay} />
            <div className={styles.bgPattern} />

            <div className={`container ${styles.heroContent}`}>
                <div className={styles.heroText}>
                    <span className={styles.label}>{slides[currentSlide].label}</span>
                    <h1 className={styles.title}>
                        {slides[currentSlide].title}{' '}
                        <span className="gold-text">{slides[currentSlide].highlight}</span>
                    </h1>
                    <p className={styles.subtitle}>{slides[currentSlide].subtitle}</p>

                    <div className={styles.heroCTA}>
                        <Link href="/properties" className="btn btn-primary btn-lg">
                            Jelajahi Properti
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                        <Link href="/contact" className="btn btn-outline btn-lg">
                            Hubungi Kami
                        </Link>
                    </div>

                    <div className={styles.heroMeta}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaValue}>500+</span>
                            <span className={styles.metaLabel}>Properti</span>
                        </div>
                        <div className={styles.metaDivider} />
                        <div className={styles.metaItem}>
                            <span className={styles.metaValue}>1000+</span>
                            <span className={styles.metaLabel}>Klien Puas</span>
                        </div>
                        <div className={styles.metaDivider} />
                        <div className={styles.metaItem}>
                            <span className={styles.metaValue}>15+</span>
                            <span className={styles.metaLabel}>Kota</span>
                        </div>
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    <div className={styles.heroCard}>
                        <div className={styles.cardGlow} />
                        <div className={styles.cardInner}>
                            <div className={styles.searchBox}>
                                <h3>Cari Properti</h3>
                                <div className={styles.searchGrid}>
                                    <div className={styles.searchField}>
                                        <label>Tipe</label>
                                        <select className="form-select">
                                            <option value="">Semua Tipe</option>
                                            <option value="sell">Dijual</option>
                                            <option value="rent">Disewa</option>
                                        </select>
                                    </div>
                                    <div className={styles.searchField}>
                                        <label>Kategori</label>
                                        <select className="form-select">
                                            <option value="">Semua</option>
                                            <option value="house">Rumah</option>
                                            <option value="apartment">Apartemen</option>
                                            <option value="villa">Villa</option>
                                            <option value="land">Tanah</option>
                                        </select>
                                    </div>
                                    <div className={styles.searchField}>
                                        <label>Lokasi</label>
                                        <select className="form-select">
                                            <option value="">Semua Kota</option>
                                            <option value="Jakarta Utara">Jakarta Utara</option>
                                            <option value="Jakarta Selatan">Jakarta Selatan</option>
                                            <option value="Tangerang">Tangerang</option>
                                            <option value="Bogor">Bogor</option>
                                        </select>
                                    </div>
                                </div>
                                <Link href="/properties" className={`btn btn-primary ${styles.searchBtn}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                    Cari Sekarang
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.slideIndicators}>
                {slides.map((_, i) => (
                    <button
                        key={i}
                        className={`${styles.indicator} ${i === currentSlide ? styles.active : ''}`}
                        onClick={() => setCurrentSlide(i)}
                    />
                ))}
            </div>

            <div className={styles.scrollDown}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
            </div>
        </section>
    );
}
