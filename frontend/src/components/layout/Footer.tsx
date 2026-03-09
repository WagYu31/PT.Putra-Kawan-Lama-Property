import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <h3>PKWL <span>PROPERTY</span></h3>
                        <p>Platform properti premium untuk sewa dan jual rumah, apartemen, villa, tanah, dan komersial di Indonesia.</p>
                        <div className={styles.socialLinks}>
                            <a href="#" aria-label="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" /></svg>
                            </a>
                            <a href="#" aria-label="Facebook">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                            </a>
                            <a href="#" aria-label="YouTube">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2c.312-1.805.473-3.636.46-5.54a29 29 0 00-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
                            </a>
                        </div>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>Navigasi</h4>
                        <ul>
                            <li><Link href="/">Beranda</Link></li>
                            <li><Link href="/properties">Properti</Link></li>
                            <li><Link href="/about">Tentang Kami</Link></li>
                            <li><Link href="/contact">Hubungi Kami</Link></li>
                        </ul>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>Kategori</h4>
                        <ul>
                            <li><Link href="/properties?category=house">Rumah</Link></li>
                            <li><Link href="/properties?category=apartment">Apartemen</Link></li>
                            <li><Link href="/properties?category=villa">Villa</Link></li>
                            <li><Link href="/properties?category=land">Tanah</Link></li>
                            <li><Link href="/properties?category=commercial">Komersial</Link></li>
                        </ul>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>Kontak</h4>
                        <ul>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                Jakarta, Indonesia
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                                +62 812-3456-7890
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                info@putrakawanlama.com
                            </li>
                        </ul>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>&copy; {new Date().getFullYear()} PT. Putra Kawan Lama. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
