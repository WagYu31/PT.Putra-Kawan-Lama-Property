'use client';
import { useRef, useState, useEffect } from 'react';
import styles from './FacilitiesGrid.module.css';

const facilities = [
    { icon: '🏊', title: 'Swimming Pool', desc: 'Kolam renang infinity premium' },
    { icon: '🏋️', title: 'Fitness Center', desc: 'Gym modern dengan peralatan lengkap' },
    { icon: '🌳', title: 'Green Park', desc: 'Taman hijau seluas 5 hektar' },
    { icon: '🛡️', title: 'Security 24/7', desc: 'Keamanan berlapis dengan CCTV' },
    { icon: '🏫', title: 'Edu Center', desc: 'Fasilitas pendidikan berkualitas' },
    { icon: '🛣️', title: 'Akses Tol', desc: 'Akses langsung ke jalan tol utama' },
    { icon: '🏥', title: 'Healthcare', desc: 'Klinik dan rumah sakit terdekat' },
    { icon: '🛒', title: 'Shopping Mall', desc: 'Pusat perbelanjaan modern' },
];

export default function FacilitiesGrid() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        if (sectionRef.current) obs.observe(sectionRef.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section className={`section ${styles.facilities}`}>
            <div className="container" ref={sectionRef}>
                <div className={styles.header} style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
                }}>
                    <span className="section-label">Fasilitas Premium</span>
                    <h2 className="section-title">Kehidupan <span className="gold-text">Berkualitas</span></h2>
                    <p className="section-subtitle">Fasilitas lengkap untuk menunjang gaya hidup modern dan nyaman</p>
                </div>

                <div className={styles.grid}>
                    {facilities.map((f, i) => (
                        <div key={i} className={styles.facilityCard} style={{
                            animationDelay: `${i * 80}ms`,
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(30px)',
                            transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
                        }}>
                            <span className={styles.facilityIcon}>{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
