'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth';
import { LiveChatProvider } from '@/lib/livechat';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatBot from '@/components/layout/ChatBot';
import { api, formatPrice, propertyCategories, cities } from '@/lib/api';
import styles from './properties.module.css';

/* fallback images per category */
const defaultImages: Record<string, string> = {
    house: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
    villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
    commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
    warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
};

interface Property {
    id: number; slug: string; title: string; type: string; category: string;
    price: number; rent_period?: string; city: string; province: string;
    bedrooms?: number; bathrooms?: number; build_area?: number; land_area?: number;
    images?: string[] | null; status: string; featured?: boolean;
}

const typeLabels: Record<string, string> = { sell: 'DIJUAL', rent: 'DISEWA', both: 'JUAL/SEWA' };
const categoryLabels: Record<string, string> = { house: 'Rumah', apartment: 'Apartemen', villa: 'Villa', land: 'Tanah', commercial: 'Komersial', warehouse: 'Gudang' };

function getImage(p: Property): string {
    if (p.images && p.images.length > 0 && !p.images[0].startsWith('/uploads/')) return p.images[0];
    return defaultImages[p.category] || defaultImages.house;
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [search, setSearch] = useState('');
    const [favIds, setFavIds] = useState<number[]>([]);

    useEffect(() => {
        api<{ properties: Property[] }>('/api/properties?status=available')
            .then(data => setProperties(data.properties || []))
            .catch(() => setProperties([]))
            .finally(() => setLoading(false));

        // Load favorite IDs
        const token = localStorage.getItem('pkwl_token');
        if (token) {
            fetch('http://localhost:8081/api/favorites/ids', {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json()).then(d => setFavIds(d.favorited_ids || [])).catch(() => { });
        }
    }, []);

    const toggleFav = async (e: React.MouseEvent, propId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const token = localStorage.getItem('pkwl_token');
        if (!token) { alert('Silakan login terlebih dahulu untuk menambah favorit'); return; }
        await fetch(`http://localhost:8081/api/favorites/${propId}/toggle`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        setFavIds(prev => prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]);
    };

    const filtered = properties.filter(p => {
        if (filterType && p.type !== filterType) return false;
        if (filterCategory && p.category !== filterCategory) return false;
        if (filterCity && p.city !== filterCity) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.city.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    /* collect unique cities from actual data for the dropdown */
    const allCities = [...new Set(properties.map(p => p.city).filter(Boolean))].sort();

    return (
        <AuthProvider><LiveChatProvider>
            <Navbar />
            <main className={styles.page}>
                <div className={styles.hero}>
                    <div className="container">
                        <span className="section-label">Properti Kami</span>
                        <h1 className={styles.pageTitle}>Daftar <span className="gold-text">Properti</span></h1>
                        <p className={styles.pageSubtitle}>Temukan properti impian dari koleksi premium kami</p>
                    </div>
                </div>

                <div className="container">
                    <div className={styles.filters}>
                        <div className={styles.searchBar}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            <input type="text" placeholder="Cari properti..." className="form-input" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="">Semua Tipe</option>
                            <option value="sell">Dijual</option>
                            <option value="rent">Disewa</option>
                            <option value="both">Jual &amp; Sewa</option>
                        </select>
                        <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                            <option value="">Semua Kategori</option>
                            {propertyCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <select className="form-select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                            <option value="">Semua Kota</option>
                            {allCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Memuat properti...</p>
                    ) : (
                        <>
                            <p className={styles.resultCount}>{filtered.length} properti ditemukan</p>

                            <div className={styles.grid}>
                                {filtered.map((p, i) => (
                                    <Link href={`/properties/${p.id}`} key={p.id} className={styles.card} style={{ animationDelay: `${i * 80}ms` }}>
                                        <div className={styles.cardImage}>
                                            <img src={getImage(p)} alt={p.title} loading="lazy" />
                                            <div className={styles.badges}>
                                                <span className={`${styles.typeBadge} ${styles[p.type]}`}>{typeLabels[p.type]}</span>
                                                <span className={styles.catBadge}>{categoryLabels[p.category]}</span>
                                            </div>
                                            <button onClick={(e) => toggleFav(e, p.id)} style={{
                                                position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)',
                                                border: 'none', borderRadius: '50%', width: 36, height: 36,
                                                cursor: 'pointer', fontSize: '1.1rem', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                transition: 'transform 0.2s',
                                            }} title={favIds.includes(p.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}>
                                                {favIds.includes(p.id) ? '❤️' : '🤍'}
                                            </button>
                                        </div>
                                        <div className={styles.cardBody}>
                                            <div className={styles.price}>
                                                {formatPrice(p.price)}
                                                {p.rent_period && <span>/{p.rent_period === 'monthly' ? 'bulan' : p.rent_period}</span>}
                                            </div>
                                            <h3>{p.title}</h3>
                                            <p className={styles.location}>📍 {p.city}, {p.province}</p>
                                            <div className={styles.specs}>
                                                {p.bedrooms && p.bedrooms > 0 && <span>🛏 {p.bedrooms} KT</span>}
                                                {p.bathrooms && p.bathrooms > 0 && <span>🚿 {p.bathrooms} KM</span>}
                                                {p.build_area && p.build_area > 0 && <span>🏗 {p.build_area}m²</span>}
                                                {p.land_area && p.land_area > 0 && <span>📐 {p.land_area}m²</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {filtered.length === 0 && (
                                <div className={styles.empty}>
                                    <p>Tidak ada properti yang cocok dengan filter Anda.</p>
                                    <button className="btn btn-outline" onClick={() => { setFilterType(''); setFilterCategory(''); setFilterCity(''); setSearch(''); }}>
                                        Reset Filter
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
            <ChatBot />
        </LiveChatProvider></AuthProvider>
    );
}
