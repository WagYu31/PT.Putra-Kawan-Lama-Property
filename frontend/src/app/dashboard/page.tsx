'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LiveChatProvider, useLiveChat } from '@/lib/livechat';
import AdminLiveChat from '@/components/dashboard/AdminLiveChat';
import styles from './dashboard.module.css';

function DashboardContent() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return <div className={styles.loading}>Loading...</div>;

    const menuItems = user.role === 'admin'
        ? [
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'livechat', label: 'Live Chat', icon: '💬' },
            { key: 'properties', label: 'Properti', icon: '🏠' },
            { key: 'users', label: 'Users', icon: '👥' },
            { key: 'bookings', label: 'Booking', icon: '📋' },
            { key: 'payments', label: 'Pembayaran', icon: '💰' },
            { key: 'inquiries', label: 'Inquiry', icon: '📩' },
        ]
        : user.role === 'owner'
            ? [
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'properties', label: 'Properti Saya', icon: '🏠' },
                { key: 'bookings', label: 'Booking', icon: '📋' },
            ]
            : [
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'bookings', label: 'Booking Saya', icon: '📋' },
                { key: 'payments', label: 'Pembayaran', icon: '💰' },
                { key: 'saved', label: 'Favorit', icon: '❤️' },
            ];

    return (
        <div className={styles.dashboard}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>PKWL</Link>
                    <span className={styles.roleTag}>{user.role}</span>
                </div>
                <nav className={styles.sideNav}>
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            className={`${styles.navItem} ${activeTab === item.key ? styles.active : ''}`}
                            onClick={() => setActiveTab(item.key)}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                            {item.key === 'livechat' && <LiveChatBadge />}
                        </button>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user.name.charAt(0)}</div>
                        <div>
                            <p className={styles.userName}>{user.name}</p>
                            <p className={styles.userEmail}>{user.email}</p>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={() => { logout(); router.push('/'); }}>
                        Keluar
                    </button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.topbar}>
                    <h1>
                        {activeTab === 'overview' ? `Halo, ${user.name}!` : menuItems.find(m => m.key === activeTab)?.label}
                    </h1>
                    <Link href="/" className="btn btn-ghost btn-sm">← Ke Website</Link>
                </header>

                <div className={styles.content}>
                    {activeTab === 'overview' && (
                        <div className={styles.overviewGrid}>
                            {(user.role === 'admin' ? [
                                { label: 'Total Properti', value: '6', icon: '🏠', color: '#c9a84c' },
                                { label: 'Total Users', value: '3', icon: '👥', color: '#3b82f6' },
                                { label: 'Booking Pending', value: '0', icon: '📋', color: '#f59e0b' },
                                { label: 'Live Chat', value: '0', icon: '💬', color: '#10b981' },
                            ] : user.role === 'owner' ? [
                                { label: 'Properti Saya', value: '6', icon: '🏠', color: '#c9a84c' },
                                { label: 'Booking Masuk', value: '0', icon: '📋', color: '#3b82f6' },
                                { label: 'Total Views', value: '0', icon: '👁', color: '#10b981' },
                                { label: 'Pendapatan', value: 'Rp 0', icon: '💰', color: '#f59e0b' },
                            ] : [
                                { label: 'Booking Saya', value: '0', icon: '📋', color: '#3b82f6' },
                                { label: 'Favorit', value: '0', icon: '❤️', color: '#ef4444' },
                                { label: 'Properti Dilihat', value: '0', icon: '👁', color: '#10b981' },
                                { label: 'Pesan Terkirim', value: '0', icon: '💬', color: '#c9a84c' },
                            ]).map((s, i) => (
                                <div key={i} className={styles.statCard}>
                                    <div className={styles.statIcon} style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                                    <div>
                                        <p className={styles.statValue}>{s.value}</p>
                                        <p className={styles.statLabel}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'livechat' && user.role === 'admin' && (
                        <AdminLiveChat />
                    )}

                    {activeTab === 'properties' && (
                        <PropertyManager />
                    )}

                    {activeTab === 'users' && user.role === 'admin' && (
                        <div className={styles.tableContainer}>
                            <h2>Manajemen User</h2>
                            <table className={styles.table}>
                                <thead>
                                    <tr><th>Nama</th><th>Email</th><th>Role</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Admin PKWL</td><td>admin@putrakawanlama.com</td><td><span className="badge badge-gold">Admin</span></td><td>—</td></tr>
                                    <tr><td>Budi Santoso</td><td>owner@putrakawanlama.com</td><td><span className="badge badge-warning">Owner</span></td><td><button className="btn btn-ghost btn-sm">Edit Role</button></td></tr>
                                    <tr><td>Siti Rahayu</td><td>customer@putrakawanlama.com</td><td><span className="badge badge-success">Customer</span></td><td><button className="btn btn-ghost btn-sm">Edit Role</button></td></tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <BookingManager />
                    )}

                    {activeTab === 'payments' && (
                        <CicilanManager />
                    )}

                    {(activeTab === 'inquiries' || activeTab === 'saved') && (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📭</span>
                            <h3>Data Kosong</h3>
                            <p>Belum ada data yang tersedia untuk ditampilkan</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

/* ========== PROPERTY MANAGER ========== */
interface Property {
    id: number; title: string; type: string; category: string;
    price: number; status: string; views: number; city: string;
    address: string; description: string; rent_period: string;
    province: string; zip_code: string; lat: number; lng: number;
    bedrooms: number; bathrooms: number; garage_size: number;
    build_area: number; land_area: number; floors: number;
    year_built: number; certificate: string; images: string[];
    video_url: string; virtual_tour: string; facilities: string[];
    featured: boolean;
}

const emptyForm = {
    title: '', description: '', type: 'sell', category: 'house',
    price: 0, rent_period: 'monthly', address: '', city: '', province: 'DKI Jakarta',
    zip_code: '', lat: -6.2, lng: 106.8, bedrooms: 0, bathrooms: 0,
    garage_size: 0, build_area: 0, land_area: 0, floors: 1, year_built: 2024,
    certificate: 'SHM', images: [] as string[], video_url: '', virtual_tour: '',
    facilities: [] as string[], featured: false,
};

const typeOptions = [{ v: 'sell', l: 'Jual' }, { v: 'rent', l: 'Sewa' }, { v: 'both', l: 'Jual & Sewa' }];
const catOptions = [
    { v: 'house', l: 'Rumah' }, { v: 'apartment', l: 'Apartemen' },
    { v: 'villa', l: 'Villa' }, { v: 'land', l: 'Tanah' },
    { v: 'commercial', l: 'Komersial' }, { v: 'warehouse', l: 'Gudang' },
];
const certOptions = ['SHM', 'SHGB', 'HGB', 'Strata', 'Girik', 'Lainnya'];
const facilityList = [
    'Swimming Pool', 'Gym', 'Garden', 'Parking', 'Security 24h', 'CCTV',
    'Playground', 'Jogging Track', 'Clubhouse', 'Sky Lounge', 'Concierge',
    'Smart Home', 'Elevator', 'Rooftop', 'Infinity Pool', 'Tennis Court',
];

function PropertyManager() {
    const { token } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [facInput, setFacInput] = useState('');

    const fetchProps = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/properties', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            setProperties(data.properties || []);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchProps(); }, []);

    const openNew = () => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); };
    const openEdit = (p: Property) => {
        setForm({
            title: p.title, description: p.description || '', type: p.type, category: p.category,
            price: p.price, rent_period: p.rent_period || 'monthly', address: p.address || '',
            city: p.city || '', province: p.province || 'DKI Jakarta', zip_code: p.zip_code || '',
            lat: p.lat || -6.2, lng: p.lng || 106.8, bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0, garage_size: p.garage_size || 0,
            build_area: p.build_area || 0, land_area: p.land_area || 0, floors: p.floors || 1,
            year_built: p.year_built || 2024, certificate: p.certificate || 'SHM',
            images: p.images || [], video_url: p.video_url || '', virtual_tour: p.virtual_tour || '',
            facilities: p.facilities || [], featured: p.featured || false,
        });
        setEditId(p.id);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.title || !form.price) { alert('Nama dan Harga properti wajib diisi!'); return; }
        setSaving(true);
        try {
            const url = editId
                ? `http://localhost:8081/api/properties/${editId}`
                : 'http://localhost:8081/api/properties';
            const res = await fetch(url, {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
            setShowForm(false);
            fetchProps();
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan properti');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus properti ini?')) return;
        try {
            await fetch(`http://localhost:8081/api/properties/${id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            fetchProps();
        } catch { alert('Gagal menghapus'); }
    };

    const setField = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
    const toggleFacility = (f: string) =>
        setForm(prev => ({
            ...prev,
            facilities: prev.facilities.includes(f)
                ? prev.facilities.filter(x => x !== f) : [...prev.facilities, f],
        }));

    const fmtPrice = (p: number) => p >= 1e9 ? `Rp ${(p / 1e9).toFixed(1)} M` : p >= 1e6 ? `Rp ${(p / 1e6).toFixed(0)} Juta` : `Rp ${p.toLocaleString('id-ID')}`;
    const typeLabel: Record<string, string> = { sell: 'DIJUAL', rent: 'DISEWA', both: 'JUAL/SEWA' };
    const typeBadge: Record<string, string> = { sell: 'badge-gold', rent: 'badge-success', both: 'badge-warning' };

    return (
        <>
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2>Daftar Properti</h2>
                    <button className="btn btn-primary btn-sm" onClick={openNew}>+ Tambah Properti</button>
                </div>
                {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat data...</p> : (
                    <table className={styles.table}>
                        <thead>
                            <tr><th>Properti</th><th>Tipe</th><th>Harga</th><th>Status</th><th>Views</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {properties.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Belum ada properti. Klik &quot;+ Tambah Properti&quot; untuk menambahkan.</td></tr>
                            ) : properties.map(p => (
                                <tr key={p.id}>
                                    <td>{p.title}</td>
                                    <td><span className={`badge ${typeBadge[p.type] || 'badge-gold'}`}>{typeLabel[p.type] || p.type}</span></td>
                                    <td>{fmtPrice(p.price)}{p.type === 'rent' ? '/bln' : ''}</td>
                                    <td><span className={`badge ${p.status === 'available' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                                    <td>{p.views || 0}</td>
                                    <td style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(p.id)}>Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ===== ADD/EDIT MODAL ===== */}
            {showForm && (
                <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editId ? '✏️ Edit Properti' : '🏠 Tambah Properti Baru'}</h2>
                            <button className={styles.modalClose} onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Section: Info Dasar */}
                            <div className={styles.formSection}>
                                <h3>📝 Informasi Dasar</h3>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
                                        <label>Nama Properti *</label>
                                        <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Contoh: Rumah Mewah Golf Island PIK 2" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Tipe *</label>
                                        <select value={form.type} onChange={e => setField('type', e.target.value)}>
                                            {typeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Kategori *</label>
                                        <select value={form.category} onChange={e => setField('category', e.target.value)}>
                                            {catOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Harga (Rp) *</label>
                                        <input type="number" value={form.price || ''} onChange={e => setField('price', Number(e.target.value))} placeholder="12500000000" />
                                    </div>
                                    {(form.type === 'rent' || form.type === 'both') && (
                                        <div className={styles.formGroup}>
                                            <label>Periode Sewa</label>
                                            <select value={form.rent_period} onChange={e => setField('rent_period', e.target.value)}>
                                                <option value="daily">Harian</option>
                                                <option value="monthly">Bulanan</option>
                                                <option value="yearly">Tahunan</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
                                        <label>Deskripsi</label>
                                        <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} placeholder="Deskripsi lengkap properti..." />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Lokasi */}
                            <div className={styles.formSection}>
                                <h3>📍 Lokasi</h3>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
                                        <label>Alamat</label>
                                        <input value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Jl. Golf Island Blok A No. 15" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Kota</label>
                                        <input value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Jakarta Utara" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Provinsi</label>
                                        <input value={form.province} onChange={e => setField('province', e.target.value)} placeholder="DKI Jakarta" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Kode Pos</label>
                                        <input value={form.zip_code} onChange={e => setField('zip_code', e.target.value)} placeholder="14470" />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Spesifikasi (dynamic by category) */}
                            <div className={styles.formSection}>
                                <h3>📐 Spesifikasi — {catOptions.find(c => c.v === form.category)?.l || 'Properti'}</h3>
                                <div className={styles.formGrid}>

                                    {/* === RUMAH / VILLA === */}
                                    {(form.category === 'house' || form.category === 'villa') && (<>
                                        <div className={styles.formGroup}>
                                            <label>Kamar Tidur</label>
                                            <input type="number" value={form.bedrooms || ''} onChange={e => setField('bedrooms', Number(e.target.value))} placeholder="5" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Kamar Mandi</label>
                                            <input type="number" value={form.bathrooms || ''} onChange={e => setField('bathrooms', Number(e.target.value))} placeholder="4" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Garasi (mobil)</label>
                                            <input type="number" value={form.garage_size || ''} onChange={e => setField('garage_size', Number(e.target.value))} placeholder="2" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Jumlah Lantai</label>
                                            <input type="number" value={form.floors || ''} onChange={e => setField('floors', Number(e.target.value))} placeholder="2" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Luas Bangunan (m²)</label>
                                            <input type="number" value={form.build_area || ''} onChange={e => setField('build_area', Number(e.target.value))} placeholder="350" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Luas Tanah (m²)</label>
                                            <input type="number" value={form.land_area || ''} onChange={e => setField('land_area', Number(e.target.value))} placeholder="500" />
                                        </div>
                                    </>)}

                                    {/* === APARTEMEN === */}
                                    {form.category === 'apartment' && (<>
                                        <div className={styles.formGroup}>
                                            <label>Kamar Tidur</label>
                                            <input type="number" value={form.bedrooms || ''} onChange={e => setField('bedrooms', Number(e.target.value))} placeholder="3" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Kamar Mandi</label>
                                            <input type="number" value={form.bathrooms || ''} onChange={e => setField('bathrooms', Number(e.target.value))} placeholder="2" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Luas Unit (m²)</label>
                                            <input type="number" value={form.build_area || ''} onChange={e => setField('build_area', Number(e.target.value))} placeholder="120" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Lantai Unit</label>
                                            <input type="number" value={form.floors || ''} onChange={e => setField('floors', Number(e.target.value))} placeholder="25" />
                                        </div>
                                    </>)}

                                    {/* === TANAH === */}
                                    {form.category === 'land' && (<>
                                        <div className={styles.formGroup}>
                                            <label>Luas Tanah (m²)</label>
                                            <input type="number" value={form.land_area || ''} onChange={e => setField('land_area', Number(e.target.value))} placeholder="800" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Lebar Depan (m)</label>
                                            <input type="number" value={form.build_area || ''} onChange={e => setField('build_area', Number(e.target.value))} placeholder="20" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Peruntukan</label>
                                            <select value={form.certificate} onChange={e => setField('certificate', e.target.value)}>
                                                <option value="SHM">Residensial</option>
                                                <option value="HGB">Komersial</option>
                                                <option value="Girik">Campuran</option>
                                                <option value="Lainnya">Industri</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Kontur Tanah</label>
                                            <select value={form.virtual_tour || 'flat'} onChange={e => setField('virtual_tour', e.target.value)}>
                                                <option value="flat">Rata / Datar</option>
                                                <option value="sloped">Miring</option>
                                                <option value="contoured">Berkontur</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Akses Jalan (ROW)</label>
                                            <input value={form.video_url || ''} onChange={e => setField('video_url', e.target.value)} placeholder="Jalan ROW 12m" />
                                        </div>
                                    </>)}

                                    {/* === KOMERSIAL (RUKO/OFFICE) === */}
                                    {form.category === 'commercial' && (<>
                                        <div className={styles.formGroup}>
                                            <label>Jumlah Lantai</label>
                                            <input type="number" value={form.floors || ''} onChange={e => setField('floors', Number(e.target.value))} placeholder="3" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Kamar Mandi / Toilet</label>
                                            <input type="number" value={form.bathrooms || ''} onChange={e => setField('bathrooms', Number(e.target.value))} placeholder="3" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Luas Bangunan (m²)</label>
                                            <input type="number" value={form.build_area || ''} onChange={e => setField('build_area', Number(e.target.value))} placeholder="240" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Luas Tanah (m²)</label>
                                            <input type="number" value={form.land_area || ''} onChange={e => setField('land_area', Number(e.target.value))} placeholder="100" />
                                        </div>
                                    </>)}

                                    {/* === GUDANG === */}
                                    {form.category === 'warehouse' && (<>
                                        <div className={styles.formGroup}>
                                            <label>Luas Bangunan (m²)</label>
                                            <input type="number" value={form.build_area || ''} onChange={e => setField('build_area', Number(e.target.value))} placeholder="2000" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Luas Tanah (m²)</label>
                                            <input type="number" value={form.land_area || ''} onChange={e => setField('land_area', Number(e.target.value))} placeholder="3000" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Tinggi Plafon (m)</label>
                                            <input type="number" value={form.floors || ''} onChange={e => setField('floors', Number(e.target.value))} placeholder="10" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Kamar Mandi / Toilet</label>
                                            <input type="number" value={form.bathrooms || ''} onChange={e => setField('bathrooms', Number(e.target.value))} placeholder="2" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Loading Dock</label>
                                            <input type="number" value={form.garage_size || ''} onChange={e => setField('garage_size', Number(e.target.value))} placeholder="2" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Kapasitas Lantai (Ton/m²)</label>
                                            <input type="number" value={form.bedrooms || ''} onChange={e => setField('bedrooms', Number(e.target.value))} placeholder="5" />
                                        </div>
                                    </>)}

                                    {/* === SHARED: Sertifikat & Tahun (not for Tanah) === */}
                                    {form.category !== 'land' && (<>
                                        <div className={styles.formGroup}>
                                            <label>Tahun Dibangun</label>
                                            <input type="number" value={form.year_built || ''} onChange={e => setField('year_built', Number(e.target.value))} placeholder="2024" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Sertifikat</label>
                                            <select value={form.certificate} onChange={e => setField('certificate', e.target.value)}>
                                                {certOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </>)}

                                    {/* Tanah: Sertifikat */}
                                    {form.category === 'land' && (
                                        <div className={styles.formGroup}>
                                            <label>Sertifikat Tanah</label>
                                            <select value={form.certificate} onChange={e => setField('certificate', e.target.value)}>
                                                <option value="SHM">SHM (Hak Milik)</option>
                                                <option value="SHGB">SHGB</option>
                                                <option value="HGB">HGB</option>
                                                <option value="Girik">Girik / Letter C</option>
                                                <option value="AJB">AJB</option>
                                                <option value="Lainnya">Lainnya</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Fasilitas */}
                            <div className={styles.formSection}>
                                <h3>✨ Fasilitas</h3>
                                <div className={styles.facilityGrid}>
                                    {facilityList.map(f => (
                                        <label key={f} className={`${styles.facilityChip} ${form.facilities.includes(f) ? styles.facilityActive : ''}`}>
                                            <input type="checkbox" checked={form.facilities.includes(f)} onChange={() => toggleFacility(f)} style={{ display: 'none' }} />
                                            {f}
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <input value={facInput} onChange={e => setFacInput(e.target.value)} placeholder="Fasilitas lainnya..." style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && facInput.trim()) { toggleFacility(facInput.trim()); setFacInput(''); } }} />
                                    <button className="btn btn-ghost btn-sm" onClick={() => { if (facInput.trim()) { toggleFacility(facInput.trim()); setFacInput(''); } }}>+ Tambah</button>
                                </div>
                            </div>

                            {/* Section: Media */}
                            <div className={styles.formSection}>
                                <h3>🖼️ Media</h3>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
                                        <label>URL Gambar (satu per baris)</label>
                                        <textarea value={form.images.join('\n')} onChange={e => setField('images', e.target.value.split('\n').filter(Boolean))} rows={3} placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>URL Video</label>
                                        <input value={form.video_url} onChange={e => setField('video_url', e.target.value)} placeholder="https://youtube.com/..." />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Virtual Tour URL</label>
                                        <input value={form.virtual_tour} onChange={e => setField('virtual_tour', e.target.value)} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>

                            {/* Featured toggle */}
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={form.featured} onChange={e => setField('featured', e.target.checked)} />
                                <span>⭐ Tandai sebagai Properti Unggulan (Featured)</span>
                            </label>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                                {saving ? '⏳ Menyimpan...' : editId ? '💾 Update Properti' : '🏠 Simpan Properti'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ========== BOOKING MANAGER ========== */
function BookingManager() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    // Payment modal state
    const [payModal, setPayModal] = useState<any>(null);
    const [payMethod, setPayMethod] = useState<'cash' | 'installment'>('cash');
    const [isPaying, setIsPaying] = useState(false);
    const [tenor, setTenor] = useState(12); // 3, 6, 12 months

    // Installment calculation
    const dpPercent = 0.10; // 10% DP
    const calcDP = (price: number) => Math.round(price * dpPercent);
    const calcMonthly = (price: number, months: number) => Math.round((price - calcDP(price)) / months);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('pkwl_token');
            if (!token) return;
            const url = filter === 'all'
                ? 'http://localhost:8081/api/bookings'
                : `http://localhost:8081/api/bookings?status=${filter}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setBookings(data.bookings || []);
        } catch { setBookings([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBookings(); }, [filter]);

    const updateStatus = async (id: number, status: string) => {
        if (!confirm(`Ubah status booking menjadi "${status}"?`)) return;
        const token = localStorage.getItem('pkwl_token');
        try {
            await fetch(`http://localhost:8081/api/bookings/${id}/status`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            fetchBookings();
        } catch { alert('Gagal update status'); }
    };

    // Handle payment via Midtrans Snap
    const handlePay = async (booking: any) => {
        const token = localStorage.getItem('pkwl_token');
        if (!token) { alert('Silakan login terlebih dahulu'); return; }

        // Load Midtrans Snap if not loaded
        if (!(window as any).snap) {
            const script = document.createElement('script');
            script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
            script.setAttribute('data-client-key', 'Mid-client-mGA7v04cXrux3KNF');
            document.head.appendChild(script);
            await new Promise(r => setTimeout(r, 2000));
        }

        setIsPaying(true);
        try {
            // Step 1: Create purchase booking
            const purchaseRes = await fetch('http://localhost:8081/api/bookings/purchase', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: booking.property_id,
                    payment_method: payMethod,
                    tenor: payMethod === 'installment' ? tenor : 0,
                }),
            });
            if (!purchaseRes.ok) throw new Error('Gagal membuat booking pembelian');
            const purchaseData = await purchaseRes.json();
            const bookingId = purchaseData.booking?.id || purchaseData.id;

            // Step 2: Get Snap token
            const snapRes = await fetch('http://localhost:8081/api/payments/snap', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId }),
            });
            if (!snapRes.ok) throw new Error('Gagal memuat pembayaran');
            const snapData = await snapRes.json();

            // Step 3: Open Midtrans popup
            (window as any).snap.pay(snapData.snap_token, {
                onSuccess: () => {
                    alert('🎉 Pembayaran berhasil! Terima kasih.');
                    setPayModal(null);
                    fetchBookings();
                },
                onPending: () => {
                    alert('⏳ Pembayaran pending. Silakan selesaikan pembayaran Anda.');
                    setPayModal(null);
                },
                onError: () => {
                    alert('❌ Pembayaran gagal. Silakan coba lagi.');
                },
                onClose: () => { setIsPaying(false); },
            });
        } catch (err: any) {
            alert(err.message || 'Terjadi kesalahan saat memproses pembayaran');
        } finally {
            setIsPaying(false);
        }
    };

    const typeLabel: Record<string, string> = { survey: '🔍 Survey', purchase: '🏠 Pembelian', rental: '📋 Sewa' };
    const statusBadge: Record<string, { label: string; cls: string }> = {
        pending: { label: 'Pending', cls: 'badge-warning' },
        confirmed: { label: 'Dikonfirmasi', cls: 'badge-success' },
        completed: { label: 'Selesai', cls: 'badge-gold' },
        cancelled: { label: 'Dibatalkan', cls: 'badge-danger' },
        surveyed: { label: 'Sudah Survey', cls: 'badge-info' },
    };
    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const fmtPrice = (p: number) => p ? `Rp ${(p >= 1_000_000_000 ? (p / 1_000_000_000).toFixed(1) + ' M' : p >= 1_000_000 ? (p / 1_000_000).toFixed(0) + ' Juta' : p.toLocaleString('id-ID'))}` : '-';

    if (loading) return <div className={styles.emptyState}><p>Memuat data booking...</p></div>;

    return (
        <div className={styles.tableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2>Daftar Booking</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                        <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => { setFilter(f); setLoading(true); }}>
                            {f === 'all' ? 'Semua' : (statusBadge[f]?.label || f)}
                        </button>
                    ))}
                </div>
            </div>

            {bookings.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <h3>Belum Ada Booking</h3>
                    <p>Belum ada booking {filter !== 'all' ? `dengan status "${statusBadge[filter]?.label || filter}"` : ''}</p>
                </div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Properti</th>
                            <th>Customer</th>
                            <th>Tipe</th>
                            <th>Status</th>
                            <th>Tanggal</th>
                            <th>Harga</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((b: any) => (
                            <tr key={b.id}>
                                <td>{b.property?.title || `Properti #${b.property_id}`}</td>
                                <td>
                                    <div>
                                        <strong>{b.customer?.name || '-'}</strong>
                                        <br /><small style={{ color: 'var(--text-muted)' }}>{b.customer?.email || ''}</small>
                                    </div>
                                </td>
                                <td>{typeLabel[b.booking_type] || b.booking_type}</td>
                                <td>
                                    <span className={`badge ${statusBadge[b.status]?.cls || ''}`}>
                                        {statusBadge[b.status]?.label || b.status}
                                    </span>
                                </td>
                                <td>
                                    {b.booking_type === 'survey'
                                        ? fmtDate(b.survey_date)
                                        : b.start_date
                                            ? `${fmtDate(b.start_date)} - ${fmtDate(b.end_date)}`
                                            : fmtDate(b.created_at)}
                                </td>
                                <td>{fmtPrice(b.total_price)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {/* Admin actions */}
                                        {user?.role === 'admin' && b.status === 'pending' && (<>
                                            <button className="btn btn-sm btn-primary" onClick={() => updateStatus(b.id, 'confirmed')}>✅ Konfirmasi</button>
                                            <button className="btn btn-sm" style={{ color: '#ef4444' }} onClick={() => updateStatus(b.id, 'cancelled')}>Tolak</button>
                                        </>)}
                                        {user?.role === 'admin' && (b.status === 'confirmed' || b.status === 'surveyed') && (
                                            <button className="btn btn-sm btn-primary" onClick={() => updateStatus(b.id, 'completed')}>Selesai</button>
                                        )}

                                        {/* Customer actions */}
                                        {user?.role === 'customer' && b.status === 'pending' && b.booking_type === 'survey' && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>⏳ Menunggu konfirmasi admin</span>
                                        )}
                                        {user?.role === 'customer' && b.status === 'confirmed' && b.booking_type === 'survey' && (
                                            <button className="btn btn-sm btn-primary" onClick={() => { setPayModal(b); setPayMethod('cash'); }}>
                                                💳 Lanjut Bayar
                                            </button>
                                        )}
                                        {user?.role === 'customer' && b.status === 'completed' && (
                                            <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✅ Selesai</span>
                                        )}
                                        {user?.role === 'customer' && b.booking_type === 'purchase' && b.status === 'pending' && (
                                            <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⏳ Menunggu pembayaran</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ===== PAYMENT MODAL ===== */}
            {payModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => !isPaying && setPayModal(null)}>
                    <div style={{
                        background: 'var(--bg-card, #1a1f2e)', borderRadius: 16,
                        padding: 32, maxWidth: 480, width: '90%',
                        border: '1px solid rgba(201,168,76,0.2)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 20 }}>💳 Pembayaran</h3>

                        {/* Property info */}
                        <div style={{
                            background: 'rgba(201,168,76,0.08)', borderRadius: 12,
                            padding: 16, marginBottom: 20,
                        }}>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>{payModal.property?.title}</p>
                            <p style={{ color: 'var(--gold)', fontSize: '1.2rem', fontWeight: 700 }}>
                                {fmtPrice(payModal.total_price)}
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                                Survey: {fmtDate(payModal.survey_date)} — ✅ Dikonfirmasi
                            </p>
                        </div>

                        {/* Payment method */}
                        <p style={{ fontWeight: 600, marginBottom: 12 }}>Pilih Metode Pembayaran</p>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                            <button
                                onClick={() => setPayMethod('cash')}
                                style={{
                                    flex: 1, padding: '14px 16px', borderRadius: 12,
                                    border: payMethod === 'cash' ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                                    background: payMethod === 'cash' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                                    cursor: 'pointer', textAlign: 'left', color: 'inherit',
                                }}
                            >
                                <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>💵</div>
                                <strong>Cash</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Bayar lunas</p>
                            </button>
                            <button
                                onClick={() => setPayMethod('installment')}
                                style={{
                                    flex: 1, padding: '14px 16px', borderRadius: 12,
                                    border: payMethod === 'installment' ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                                    background: payMethod === 'installment' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                                    cursor: 'pointer', textAlign: 'left', color: 'inherit',
                                }}
                            >
                                <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>💳</div>
                                <strong>Cicilan</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>DP 10% + cicilan bulanan</p>
                            </button>
                        </div>

                        {/* Tenor selector for installment */}
                        {payMethod === 'installment' && (
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Pilih Tenor Cicilan</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[3, 6, 12].map(m => (
                                        <button key={m} onClick={() => setTenor(m)} style={{
                                            flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                                            border: tenor === m ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                                            background: tenor === m ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                                            color: 'inherit', textAlign: 'center',
                                        }}>
                                            <strong style={{ fontSize: '1.1rem' }}>{m}</strong>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>bulan</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price summary */}
                        <div style={{
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: 16, marginBottom: 20,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Harga Properti</span>
                                <strong>{fmtPrice(payModal.total_price)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Metode</span>
                                <strong>{payMethod === 'cash' ? 'Bayar Lunas' : `Cicilan ${tenor} Bulan`}</strong>
                            </div>

                            {payMethod === 'cash' ? (
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 12,
                                }}>
                                    <span style={{ fontWeight: 600 }}>Total Bayar</span>
                                    <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                                        {fmtPrice(payModal.total_price)}
                                    </strong>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>DP (10%)</span>
                                        <strong style={{ color: '#f59e0b' }}>{fmtPrice(calcDP(payModal.total_price))}</strong>
                                    </div>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 12,
                                    }}>
                                        <span style={{ fontWeight: 600 }}>Cicilan/bulan</span>
                                        <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                                            {fmtPrice(calcMonthly(payModal.total_price, tenor))}
                                        </strong>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8, textAlign: 'right' }}>
                                        Bayar DP {fmtPrice(calcDP(payModal.total_price))} + {tenor}x cicilan {fmtPrice(calcMonthly(payModal.total_price, tenor))}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Action buttons */}
                        <button
                            onClick={() => handlePay(payModal)}
                            disabled={isPaying}
                            style={{
                                width: '100%', padding: '14px 0', borderRadius: 12,
                                background: 'linear-gradient(135deg, #c9a84c, #b8963f)',
                                color: '#000', fontWeight: 700, fontSize: '1rem',
                                border: 'none', cursor: isPaying ? 'wait' : 'pointer',
                                opacity: isPaying ? 0.6 : 1,
                            }}
                        >
                            {isPaying ? '⏳ Memproses Pembayaran...' : payMethod === 'cash' ? `🔒 Bayar ${fmtPrice(payModal.total_price)}` : `🔒 Bayar DP ${fmtPrice(calcDP(payModal.total_price))}`}
                        </button>
                        <button
                            onClick={() => setPayModal(null)}
                            disabled={isPaying}
                            style={{
                                width: '100%', padding: '10px 0', marginTop: 8,
                                background: 'transparent', border: 'none',
                                color: 'var(--text-muted)', cursor: 'pointer',
                            }}
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ========== CICILAN MANAGER ========== */
function CicilanManager() {
    const { user, token } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [expandedBooking, setExpandedBooking] = useState<number | null>(null);

    const fmtP = (n: number) => {
        if (!n) return 'Rp 0';
        if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)} M`;
        if (n >= 1e6) return `Rp ${Math.round(n / 1e6)} Juta`;
        if (n >= 1e3) return `Rp ${Math.round(n / 1e3)} Ribu`;
        return `Rp ${n}`;
    };
    const fmtD = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch('http://localhost:8081/api/bookings', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const installBk = (data.bookings || []).filter((b: any) =>
                    b.booking_type === 'purchase' && b.payment_method === 'installment'
                );
                setBookings(installBk);
                for (const bk of installBk) {
                    const sRes = await fetch(`http://localhost:8081/api/bookings/${bk.id}/installments`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (sRes.ok) {
                        const sData = await sRes.json();
                        setSchedules(prev => ({ ...prev, [bk.id]: sData }));
                    }
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [token]);

    const handlePayInstallment = async (paymentId: number) => {
        if (isPaying || !token) return;
        setIsPaying(true);
        try {
            if (!(window as any).snap) {
                const s = document.createElement('script');
                s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
                s.setAttribute('data-client-key', 'Mid-client-mGA7v04cXrux3KNF');
                document.head.appendChild(s);
                await new Promise(r => setTimeout(r, 2000));
            }
            const res = await fetch('http://localhost:8081/api/payments/installment/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ payment_id: paymentId }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Gagal'); return; }
            (window as any).snap.pay(data.snap_token, {
                onSuccess: () => { alert('✅ Pembayaran berhasil!'); window.location.reload(); },
                onPending: () => alert('⏳ Pembayaran pending.'),
                onError: () => alert('❌ Pembayaran gagal.'),
                onClose: () => { },
            });
        } catch (e) { alert('Error: ' + e); }
        finally { setIsPaying(false); }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>⏳ Memuat data pembayaran...</div>;
    if (bookings.length === 0) {
        return (
            <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>💰</span>
                <h3>Belum Ada Cicilan</h3>
                <p>Anda belum memiliki booking cicilan.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: 20 }}>💰 Manajemen Pembayaran Cicilan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {bookings.map(bk => {
                    const sch = schedules[bk.id];
                    const payments: any[] = sch?.payments || [];
                    const paidCount = sch?.paid_count || 0;
                    const totalCount = sch?.total_count || 0;
                    const totalPaid = sch?.total_paid || 0;
                    const totalRemaining = sch?.total_remaining || 0;
                    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                    const isExp = expandedBooking === bk.id;

                    return (
                        <div key={bk.id} style={{
                            background: 'var(--bg-card, #1a1f2e)', borderRadius: 16,
                            border: '1px solid rgba(201,168,76,0.15)', overflow: 'hidden',
                        }}>
                            {/* Header */}
                            <div onClick={() => setExpandedBooking(isExp ? null : bk.id)} style={{
                                padding: '20px 24px', cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <h3 style={{ marginBottom: 4, fontSize: '1rem' }}>{bk.property?.title || 'Properti'}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {fmtP(bk.total_price)} • Cicilan {bk.installment_tenor || 12} bulan
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                        {paidCount}/{totalCount} terbayar
                                    </p>
                                    <span style={{ fontSize: '1.3rem' }}>{isExp ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div style={{ padding: '0 24px 16px' }}>
                                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 4, width: `${progress}%`,
                                        background: progress === 100
                                            ? 'linear-gradient(90deg, #10b981, #059669)'
                                            : 'linear-gradient(90deg, #c9a84c, #b8963f)',
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.8rem' }}>
                                    <span style={{ color: '#10b981' }}>✅ Terbayar: {fmtP(totalPaid)}</span>
                                    <span style={{ color: '#f59e0b' }}>⏳ Sisa: {fmtP(totalRemaining)}</span>
                                </div>
                            </div>

                            {/* Installment table */}
                            {isExp && (
                                <div style={{ padding: '0 24px 24px' }}>
                                    <table className={styles.table} style={{ marginTop: 0 }}>
                                        <thead>
                                            <tr><th>#</th><th>Keterangan</th><th>Jumlah</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th></tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((p: any) => {
                                                const isPaid = p.status === 'paid';
                                                const isOverdue = p.due_date && !isPaid && new Date(p.due_date) < new Date();
                                                const canPay = !isPaid && p.status === 'pending' && (
                                                    p.billing_period === 0 ||
                                                    payments.find((pp: any) => pp.billing_period === p.billing_period - 1)?.status === 'paid'
                                                );
                                                return (
                                                    <tr key={p.id} style={{
                                                        opacity: isPaid ? 0.6 : 1,
                                                        background: canPay ? 'rgba(201,168,76,0.05)' : undefined,
                                                    }}>
                                                        <td>{p.billing_period === 0 ? 'DP' : p.billing_period}</td>
                                                        <td>{p.billing_period === 0 ? 'Uang Muka (10%)' : `Cicilan ke-${p.billing_period}`}</td>
                                                        <td style={{ fontWeight: 600 }}>{fmtP(p.amount)}</td>
                                                        <td>{fmtD(p.due_date)}</td>
                                                        <td>
                                                            {isPaid ? (
                                                                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem' }}>✅ Lunas</span>
                                                            ) : isOverdue ? (
                                                                <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem' }}>🔴 Jatuh Tempo</span>
                                                            ) : (
                                                                <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem' }}>⏳ Belum Bayar</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {canPay && user?.role === 'customer' && (
                                                                <button className="btn btn-sm btn-primary" disabled={isPaying}
                                                                    onClick={() => handlePayInstallment(p.id)} style={{ whiteSpace: 'nowrap' }}>
                                                                    {isPaying ? '⏳...' : `💳 Bayar ${fmtP(p.amount)}`}
                                                                </button>
                                                            )}
                                                            {isPaid && p.paid_at && (
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{fmtD(p.paid_at)}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LiveChatBadge() {
    const { totalUnread } = useLiveChat();
    if (totalUnread <= 0) return null;
    return <span className={styles.chatBadge}>{totalUnread}</span>;
}

export default function DashboardPage() {
    return (
        <AuthProvider>
            <LiveChatProvider>
                <DashboardContent />
            </LiveChatProvider>
        </AuthProvider>
    );
}
