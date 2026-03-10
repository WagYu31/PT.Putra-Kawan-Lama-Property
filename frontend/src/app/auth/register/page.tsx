'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import styles from '../login/auth.module.css';

function RegisterForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register({ name, email, password, phone, role: 'customer' });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registrasi gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Link href="/" className={styles.logo}>PKWL <span>PROPERTY</span></Link>
                        <h1>Buat Akun</h1>
                        <p>Daftar untuk mulai mencari properti</p>
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nama Lengkap</label>
                            <input type="text" className="form-input" placeholder="Nama Anda" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" placeholder="Minimal 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">No. Telepon</label>
                            <input type="tel" className="form-input" placeholder="081234567890" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Memproses...' : 'Daftar'}
                        </button>
                    </form>
                    <p className={styles.switchAuth}>
                        Sudah punya akun? <Link href="/auth/login">Masuk</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return <AuthProvider><RegisterForm /></AuthProvider>;
}
