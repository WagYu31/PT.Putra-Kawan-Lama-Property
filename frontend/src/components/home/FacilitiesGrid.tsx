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
    return (
        <section className={`section ${styles.facilities}`}>
            <div className="container">
                <div className={styles.header}>
                    <span className="section-label">Fasilitas Premium</span>
                    <h2 className="section-title">Kehidupan <span className="gold-text">Berkualitas</span></h2>
                    <p className="section-subtitle">Fasilitas lengkap untuk menunjang gaya hidup modern dan nyaman</p>
                </div>

                <div className={styles.grid}>
                    {facilities.map((f, i) => (
                        <div key={i} className={styles.facilityCard} style={{ animationDelay: `${i * 80}ms` }}>
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
