'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, formatPrice } from '@/lib/api';
import styles from './FeaturedProperties.module.css';

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

export default function FeaturedProperties() {
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        api<{ properties: Property[] }>('/api/properties?status=available')
            .then(data => {
                const all = data.properties || [];
                /* Show featured properties first, then most recent, max 6 */
                const featured = all.filter(p => p.featured);
                const rest = all.filter(p => !p.featured);
                setProperties([...featured, ...rest].slice(0, 6));
            })
            .catch(() => setProperties([]));
    }, []);

    if (properties.length === 0) return null;

    return (
        <section className={`section ${styles.featured}`}>
            <div className="container">
                <ScrollReveal>
                    <div className={styles.header}>
                        <div>
                            <span className="section-label">Properti Unggulan</span>
                            <h2 className="section-title">Koleksi <span className="gold-text">Premium</span> Kami</h2>
                            <p className="section-subtitle">Pilihan properti terbaik yang telah kami kurasi untuk Anda</p>
                        </div>
                        <Link href="/properties" className="btn btn-outline">
                            Lihat Semua
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </div>

                    <div className={styles.grid}>
                        {properties.map((p, i) => (
                            <Link href={`/properties/${p.id}`} key={p.id} className={styles.propertyCard} style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={styles.cardImage}>
                                    <img src={getImage(p)} alt={p.title} loading="lazy" />
                                    <div className={styles.cardBadges}>
                                        <span className={`${styles.typeBadge} ${styles[p.type]}`}>{typeLabels[p.type]}</span>
                                        <span className={styles.categoryBadge}>{categoryLabels[p.category]}</span>
                                    </div>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardPrice}>
                                        {formatPrice(p.price)}
                                        {p.rent_period && <span className={styles.period}>/{p.rent_period === 'monthly' ? 'bulan' : p.rent_period}</span>}
                                    </div>
                                    <h3 className={styles.cardTitle}>{p.title}</h3>
                                    <p className={styles.cardLocation}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        {p.city}, {p.province}
                                    </p>
                                    <div className={styles.cardSpecs}>
                                        {p.bedrooms !== undefined && p.bedrooms > 0 && (
                                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7" /><path d="M21 11H3V7a2 2 0 012-2h14a2 2 0 012 2v4z" /></svg>{p.bedrooms} KT</span>
                                        )}
                                        {p.bathrooms !== undefined && p.bathrooms > 0 && (
                                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z" /><path d="M6 12V5a2 2 0 012-2h3v2.25" /></svg>{p.bathrooms} KM</span>
                                        )}
                                        {p.build_area !== undefined && p.build_area > 0 && <span>🏗 {p.build_area}m²</span>}
                                        {p.land_area !== undefined && p.land_area > 0 && <span>📐 {p.land_area}m²</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}

/* Scroll reveal wrapper */
function ScrollReveal({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}>{children}</div>
    );
}
