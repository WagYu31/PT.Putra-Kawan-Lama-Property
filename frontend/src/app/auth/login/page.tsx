'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import styles from './auth.module.css';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.splitWrapper}>
                {/* Left Side: Login Form */}
                <div className={styles.formSide}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Link href="/" className={styles.logo}>PKWL <span>PROPERTY</span></Link>
                            <h1>Selamat Datang</h1>
                            <p>Masuk ke akun Anda</p>
                        </div>
                        {error && <div className={styles.error}>{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Memproses...' : 'Masuk'}
                            </button>
                        </form>
                        <p className={styles.switchAuth}>
                            Belum punya akun? <Link href="/auth/register">Daftar Sekarang</Link>
                        </p>
                        <div className={styles.demo}>
                            <p>Demo Accounts:</p>
                            <code>admin@putrakawanlama.com / admin123</code>
                            <code>owner@putrakawanlama.com / owner123</code>
                            <code>customer@putrakawanlama.com / customer123</code>
                        </div>
                    </div>
                </div>

                {/* Right Side: Banner */}
                <div className={styles.bannerSide}>
                    <div className={styles.bannerOverlay}>
                        <div className={styles.bannerContent}>
                            <div className={styles.bannerBadge}>
                                🏰 PT. Putra Kawan Lama
                            </div>
                            <h2>Temukan Hunian Premium Impian Anda</h2>
                            <p>Layanan terpercaya jual & sewa tempat tinggal serta properti komersial eksklusif dengan kualitas terbaik.</p>
                            <div className={styles.bannerStats}>
                                <div>
                                    <strong>500+</strong>
                                    <span>Properti</span>
                                </div>
                                <div>
                                    <strong>1,000+</strong>
                                    <span>Klien Puas</span>
                                </div>
                                <div>
                                    <strong>15+</strong>
                                    <span>Kota Besar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return <AuthProvider><LoginForm /></AuthProvider>;
}
