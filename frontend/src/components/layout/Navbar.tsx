'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={`container ${styles.navInner}`}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="2" y="8" width="12" height="22" rx="2" stroke="currentColor" strokeWidth="2" />
                            <rect x="18" y="2" width="12" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
                            <rect x="5" y="12" width="3" height="3" rx="0.5" fill="currentColor" />
                            <rect x="5" y="18" width="3" height="3" rx="0.5" fill="currentColor" />
                            <rect x="5" y="24" width="3" height="3" rx="0.5" fill="currentColor" />
                            <rect x="21" y="6" width="3" height="3" rx="0.5" fill="currentColor" />
                            <rect x="21" y="12" width="3" height="3" rx="0.5" fill="currentColor" />
                            <rect x="21" y="18" width="3" height="3" rx="0.5" fill="currentColor" />
                            <rect x="21" y="24" width="3" height="3" rx="0.5" fill="currentColor" />
                            <rect x="26" y="6" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
                            <rect x="26" y="12" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
                        </svg>
                    </div>
                    <div className={styles.logoText}>
                        <span className={styles.logoTitle}>PKWL</span>
                        <span className={styles.logoSub}>PROPERTY</span>
                    </div>
                </Link>

                <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
                    <Link href="/" onClick={() => setMenuOpen(false)}>Beranda</Link>
                    <Link href="/properties" onClick={() => setMenuOpen(false)}>Properti</Link>
                    <Link href="/about" onClick={() => setMenuOpen(false)}>Tentang</Link>
                    <Link href="/contact" onClick={() => setMenuOpen(false)}>Kontak</Link>
                    {user ? (
                        <Link href="/dashboard" className={`btn btn-primary btn-sm ${styles.dashBtn}`} onClick={() => setMenuOpen(false)}>
                            Dashboard
                        </Link>
                    ) : (
                        <Link href="/auth/login" className={`btn btn-outline btn-sm ${styles.dashBtn}`} onClick={() => setMenuOpen(false)}>
                            Masuk
                        </Link>
                    )}
                </div>

                <button className={`${styles.hamburger} ${menuOpen ? styles.active : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}
