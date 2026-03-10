'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/lib/theme';
import { LiveChatProvider, useLiveChat } from '@/lib/livechat';
import AdminLiveChat from '@/components/dashboard/AdminLiveChat';
import styles from './dashboard.module.css';

function DashboardContent() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileOpen, setMobileOpen] = useState(false);
    const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('pkwl_sidebar') === 'collapsed';
        return false;
    });
    const [overviewStats, setOverviewStats] = useState({
        bookings: 0, properties: 0, users: 0, pendingBookings: 0,
        favorites: 0, propertiesViewed: 0, messagesSent: 0,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentBookings, setRecentBookings] = useState<any[]>([]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user) return;
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
        const token = localStorage.getItem('pkwl_token');
        const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
        const fetchStats = async () => {
            try {
                const bRes = await fetch(`${API}/api/bookings`, { headers });
                if (bRes.ok) {
                    const bData = await bRes.json();
                    const bookings = bData.bookings || [];
                    const pendingBookings = bookings.filter((b: { status: string }) => b.status === 'pending').length;
                    setOverviewStats(prev => ({ ...prev, bookings: bookings.length, pendingBookings }));
                    setRecentBookings(bookings.slice(0, 5));
                }
                const pRes = await fetch(`${API}/api/properties`);
                if (pRes.ok) {
                    const pData = await pRes.json();
                    const properties = pData.properties || [];
                    setOverviewStats(prev => ({ ...prev, properties: properties.length, propertiesViewed: properties.length }));
                }
                if (user.role === 'admin') {
                    const uRes = await fetch(`${API}/api/users`, { headers });
                    if (uRes.ok) {
                        const uData = await uRes.json();
                        const users = uData.users || [];
                        setOverviewStats(prev => ({ ...prev, users: users.length }));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchStats();
    }, [user]);

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

    const toggleSidebar = () => {
        if (isMobile()) {
            setMobileOpen(!mobileOpen);
        } else {
            const next = !sidebarCollapsed;
            setSidebarCollapsed(next);
            localStorage.setItem('pkwl_sidebar', next ? 'collapsed' : 'expanded');
        }
    };

    const handleNavClick = (key: string) => {
        setActiveTab(key);
        if (isMobile()) setMobileOpen(false);
    };

    return (
        <div className={styles.dashboard}>
            {mobileOpen && <div className={styles.sidebarBackdrop} onClick={() => setMobileOpen(false)} />}
            <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>{sidebarCollapsed ? 'P' : 'PKWL'}</Link>
                    {!sidebarCollapsed && <span className={styles.roleTag}>{user.role}</span>}
                </div>
                <nav className={styles.sideNav}>
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            className={`${styles.navItem} ${activeTab === item.key ? styles.active : ''}`}
                            onClick={() => handleNavClick(item.key)}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <span>{item.icon}</span>
                            {!sidebarCollapsed && item.label}
                            {!sidebarCollapsed && item.key === 'livechat' && <LiveChatBadge />}
                        </button>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user.name.charAt(0)}</div>
                        {!sidebarCollapsed && (
                            <div>
                                <p className={styles.userName}>{user.name}</p>
                                <p className={styles.userEmail}>{user.email}</p>
                            </div>
                        )}
                    </div>
                    <button className={styles.logoutBtn} onClick={() => { logout(); router.push('/'); }}>
                        {sidebarCollapsed ? '🚪' : 'Keluar'}
                    </button>
                </div>
            </aside>

            <main className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainCollapsed : ''}`}>
                <header className={styles.topbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className={styles.toggleBtn} onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
                            <div className={`${styles.hamburger} ${sidebarCollapsed ? styles.hamburgerActive : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                        <h1>
                            {activeTab === 'overview' ? `Halo, ${user.name}!` : menuItems.find(m => m.key === activeTab)?.label}
                        </h1>
                    </div>
                    <div className={styles.topbarActions}>
                        <ThemeToggle />
                        <NotificationBell />
                        <Link href="/" className="btn btn-ghost btn-sm" title="Ke Website">
                            <span className={styles.hideOnMobile}>← Ke Website</span>
                            <span className={styles.showOnMobile}>🏠</span>
                        </Link>
                    </div>
                </header>

                <div className={styles.content}>
                    {activeTab === 'overview' && (
                        <div>
                            {/* Stats Cards */}
                            <div className={styles.overviewGrid}>
                                {(user.role === 'admin' ? [
                                    { label: 'Total Properti', value: String(overviewStats.properties), icon: '🏠', color: '#c9a84c' },
                                    { label: 'Total Users', value: String(overviewStats.users), icon: '👥', color: '#3b82f6' },
                                    { label: 'Booking Pending', value: String(overviewStats.pendingBookings), icon: '📋', color: '#f59e0b' },
                                    { label: 'Total Booking', value: String(overviewStats.bookings), icon: '💬', color: '#10b981' },
                                ] : user.role === 'owner' ? [
                                    { label: 'Properti Saya', value: String(overviewStats.properties), icon: '🏠', color: '#c9a84c' },
                                    { label: 'Booking Masuk', value: String(overviewStats.bookings), icon: '📋', color: '#3b82f6' },
                                    { label: 'Total Properti', value: String(overviewStats.properties), icon: '👁', color: '#10b981' },
                                    { label: 'Booking Pending', value: String(overviewStats.pendingBookings), icon: '💰', color: '#f59e0b' },
                                ] : [
                                    { label: 'Booking Saya', value: String(overviewStats.bookings), icon: '📋', color: '#3b82f6' },
                                    { label: 'Favorit', value: String(overviewStats.favorites), icon: '❤️', color: '#ef4444' },
                                    { label: 'Properti Tersedia', value: String(overviewStats.propertiesViewed), icon: '👁', color: '#10b981' },
                                    { label: 'Pesan Terkirim', value: String(overviewStats.messagesSent), icon: '💬', color: '#c9a84c' },
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

                            {/* Two Column Layout */}
                            <div className={styles.overviewColumns}>
                                {/* Recent Bookings */}
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>📋 Booking Terbaru</h3>
                                        <button onClick={() => setActiveTab('bookings')} style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}>Lihat Semua →</button>
                                    </div>
                                    {recentBookings.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {recentBookings.map((b: { id: number; booking_type: string; status: string; property?: { title: string }; created_at: string; total_price?: number; payment_method?: string }) => (
                                                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '0.5rem', overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                                                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{b.booking_type === 'survey' ? '🔍' : b.booking_type === 'purchase' ? '🏠' : '📝'}</span>
                                                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                            <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.property?.title || 'Properti'}</p>
                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {b.booking_type === 'survey' ? 'Survey' : b.booking_type === 'purchase' ? (b.payment_method === 'installment' ? 'Cicilan' : 'Cash') : 'Sewa'}
                                                                {' · '}{new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600,
                                                            background: b.status === 'completed' ? 'rgba(16,185,129,0.15)' : b.status === 'confirmed' ? 'rgba(59,130,246,0.15)' : b.status === 'cancelled' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                            color: b.status === 'completed' ? '#10b981' : b.status === 'confirmed' ? '#3b82f6' : b.status === 'cancelled' ? '#ef4444' : '#f59e0b'
                                                        }}>
                                                            {b.status === 'completed' ? '✅ Selesai' : b.status === 'confirmed' ? '✅ Dikonfirmasi' : b.status === 'cancelled' ? '❌ Dibatalkan' : '⏳ Pending'}
                                                        </span>
                                                        {b.total_price ? <p style={{ color: 'var(--gold-primary)', fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>Rp {(b.total_price / 1e9).toFixed(1)} M</p> : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
                                            <p>Belum ada booking</p>
                                            <button onClick={() => router.push('/properties')} style={{ marginTop: '0.75rem', padding: '8px 16px', background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Jelajahi Properti</button>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions & Info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Quick Actions */}
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>⚡ Aksi Cepat</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <button onClick={() => router.push('/properties')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '10px', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, textAlign: 'left' }}>
                                                🏠 Cari Properti
                                            </button>
                                            <button onClick={() => setActiveTab('bookings')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, textAlign: 'left' }}>
                                                📋 Lihat Booking
                                            </button>
                                            {user.role !== 'customer' && (
                                                <button onClick={() => setActiveTab('properties')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', color: '#10b981', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, textAlign: 'left' }}>
                                                    ➕ Kelola Properti
                                                </button>
                                            )}
                                            <button onClick={() => setActiveTab('payments')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', color: '#f59e0b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, textAlign: 'left' }}>
                                                💰 Pembayaran
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info Card */}
                                    <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.03))', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>💡 Tips</h3>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>• Jadwalkan survey terlebih dahulu sebelum membeli</li>
                                            <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>• Cicilan tersedia untuk tenor 3, 6, atau 12 bulan</li>
                                            <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>• Pantau status pembayaran di menu Pembayaran</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Live Analytics Widget (Admin Only) */}
                            {user.role === 'admin' && <AnalyticsWidget />}
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
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <BookingManager />
                    )}

                    {activeTab === 'payments' && (
                        <CicilanManager />
                    )}

                    {activeTab === 'saved' && <FavoritesTab />}

                    {activeTab === 'inquiries' && (
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

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:8081/api/properties/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed');
            fetchProps();
        } catch { alert('Gagal mengubah status'); }
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
                <div className={styles.tableHeader} style={{ flexWrap: 'wrap', gap: 8 }}>
                    <h2>Daftar Properti</h2>
                    <button className="btn btn-primary btn-sm" onClick={openNew} style={{ whiteSpace: 'nowrap' }}>+ Tambah Properti</button>
                </div>
                {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat data...</p> : (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                                        <td style={{ whiteSpace: 'nowrap' }}>{fmtPrice(p.price)}{p.type === 'rent' ? '/bln' : ''}</td>
                                        <td>
                                            <select
                                                value={p.status}
                                                onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                                style={{
                                                    background: p.status === 'available' ? 'rgba(16,185,129,0.15)' : p.status === 'sold' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                    color: p.status === 'available' ? '#10b981' : p.status === 'sold' ? '#ef4444' : '#f59e0b',
                                                    border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600,
                                                    cursor: 'pointer', appearance: 'auto',
                                                }}
                                            >
                                                <option value="available">Tersedia</option>
                                                <option value="sold">Terjual</option>
                                                <option value="rented">Disewa</option>
                                            </select>
                                        </td>
                                        <td>{p.views || 0}</td>
                                        <td style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                            <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(p.id)}>Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
    const { user, token } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    // Payment modal state
    const [payModal, setPayModal] = useState<any>(null);
    const [payMethod, setPayMethod] = useState<'cash' | 'installment'>('cash');
    const [isPaying, setIsPaying] = useState(false);
    const [tenor, setTenor] = useState(12); // 3, 6, 12 months
    const [docModal, setDocModal] = useState<any>(null);
    const [docReviewModal, setDocReviewModal] = useState<any>(null);
    const [dealModal, setDealModal] = useState<any>(null);

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
                onSuccess: async () => {
                    try {
                        await fetch(`http://localhost:8081/api/payments/${snapData.payment_id}/sync`, {
                            method: 'POST', headers: { Authorization: `Bearer ${token}` },
                        });
                    } catch (e) { console.error('Sync error:', e); }
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
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                <h2 style={{ fontSize: '1.1rem' }}>Daftar Booking</h2>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexShrink: 0, maxWidth: '100%' }}>
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                        <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '4px 10px' }}
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
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                                            {/* Survey confirmed = admin sudah setuju, menunggu jadwal survey */}
                                            {user?.role === 'customer' && b.status === 'confirmed' && b.booking_type === 'survey' && (
                                                <span style={{ color: '#3b82f6', fontSize: '0.8rem' }}>📅 Survey dikonfirmasi</span>
                                            )}
                                            {/* Purchase/Rental CONFIRMED + no docs → Upload Dokumen */}
                                            {user?.role === 'customer' && b.status === 'confirmed' && (b.booking_type === 'purchase' || b.booking_type === 'rental') && (!b.doc_status || b.doc_status === '' || b.doc_status === 'doc_rejected') && (
                                                <button className="btn btn-sm" style={{ background: '#3b82f6', color: '#fff' }} onClick={() => setDocModal(b)}>
                                                    📄 Upload Dokumen
                                                </button>
                                            )}
                                            {user?.role === 'customer' && (b.booking_type === 'purchase' || b.booking_type === 'rental') && b.doc_status === 'doc_rejected' && (
                                                <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>❌ Dokumen ditolak, upload ulang</span>
                                            )}
                                            {user?.role === 'customer' && (b.booking_type === 'purchase' || b.booking_type === 'rental') && b.doc_status === 'doc_pending' && (
                                                <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⏳ Dokumen menunggu verifikasi</span>
                                            )}
                                            {user?.role === 'customer' && b.status === 'confirmed' && (b.booking_type === 'purchase' || b.booking_type === 'rental') && b.doc_status === 'doc_approved' && (
                                                <button className="btn btn-sm btn-primary" onClick={() => { setPayModal(b); setPayMethod('cash'); }}>
                                                    💳 Lanjut Bayar
                                                </button>
                                            )}
                                            {user?.role === 'admin' && (b.booking_type === 'purchase' || b.booking_type === 'rental') && b.doc_status === 'doc_pending' && (
                                                <button className="btn btn-sm" style={{ background: '#8b5cf6', color: '#fff' }} onClick={() => setDocReviewModal(b)}>
                                                    📋 Review Dokumen
                                                </button>
                                            )}
                                            {user?.role === 'customer' && b.status === 'completed' && b.booking_type === 'survey' && (
                                                <>
                                                    <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✅ Survey Selesai</span>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setDealModal(b)} style={{ marginLeft: 4 }}>
                                                        🏠 Lanjut Proses
                                                    </button>
                                                </>
                                            )}
                                            {user?.role === 'customer' && b.status === 'completed' && b.booking_type !== 'survey' && (
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
                </div>
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

            {/* Document Upload Modal (Customer) */}
            {docModal && <DocumentUploadModal booking={docModal} token={token!} onClose={() => { setDocModal(null); fetchBookings(); }} />}

            {/* Document Review Modal (Admin) */}
            {docReviewModal && <DocumentReviewModal booking={docReviewModal} token={token!} onClose={() => { setDocReviewModal(null); fetchBookings(); }} />}

            {/* Deal Modal (Post-Survey) */}
            {dealModal && <DealModal booking={dealModal} token={token!} onClose={() => { setDealModal(null); fetchBookings(); }} />}
        </div>
    );
}

/* ========== DEAL MODAL (Post-Survey → Purchase/Rental) ========== */
function DealModal({ booking, token, onClose }: { booking: any; token: string; onClose: () => void }) {
    const [dealType, setDealType] = useState<'purchase' | 'rental'>('purchase');
    const [payMethod, setPayMethod] = useState<'cash' | 'installment'>('cash');
    const [tenor, setTenor] = useState(12);
    const [rentPeriod, setRentPeriod] = useState('monthly');
    const [startDate, setStartDate] = useState('');
    const [duration, setDuration] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const propertyPrice = booking.total_price || booking.property?.price || 0;
    const fmtPrice = (n: number) => {
        if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)} M`;
        if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)} Juta`;
        return `Rp ${n.toLocaleString('id-ID')}`;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let res;
            if (dealType === 'purchase') {
                res = await fetch('http://localhost:8081/api/bookings/purchase', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        property_id: booking.property_id,
                        payment_method: payMethod,
                        tenor: payMethod === 'installment' ? tenor : 0,
                        message: `Lanjutan dari survey #${booking.id}`,
                    }),
                });
            } else {
                if (!startDate) { alert('Pilih tanggal mulai sewa'); setSubmitting(false); return; }
                res = await fetch('http://localhost:8081/api/bookings/rental', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        property_id: booking.property_id,
                        rent_period: rentPeriod,
                        start_date: startDate,
                        duration,
                        message: `Lanjutan dari survey #${booking.id}`,
                    }),
                });
            }
            if (res.ok) {
                alert(dealType === 'purchase' ? '✅ Booking pembelian berhasil dibuat! Silakan upload dokumen.' : '✅ Booking sewa berhasil dibuat! Silakan upload dokumen.');
                onClose();
            } else {
                const d = await res.json();
                alert(d.error || 'Gagal membuat booking');
            }
        } catch { alert('Error membuat booking'); }
        setSubmitting(false);
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.9rem',
    };

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#1a1f2e', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500,
                border: '1px solid rgba(201,168,76,0.2)', maxHeight: '85vh', overflowY: 'auto',
            }}>
                <h2 style={{ marginBottom: 4 }}>🏠 Lanjut Proses</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                    {booking.property?.title || 'Properti'} — {fmtPrice(propertyPrice)}
                </p>

                {/* Deal Type Selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <button onClick={() => setDealType('purchase')} style={{
                        flex: 1, padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: dealType === 'purchase' ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                        color: dealType === 'purchase' ? '#000' : '#fff', fontWeight: 600,
                    }}>🏷️ Beli</button>
                    <button onClick={() => setDealType('rental')} style={{
                        flex: 1, padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: dealType === 'rental' ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                        color: dealType === 'rental' ? '#000' : '#fff', fontWeight: 600,
                    }}>🔑 Sewa</button>
                </div>

                {dealType === 'purchase' ? (
                    <>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Metode Pembayaran</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <button onClick={() => setPayMethod('cash')} style={{
                                flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: payMethod === 'cash' ? '#10b981' : 'rgba(255,255,255,0.05)',
                                color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                            }}>💵 Cash</button>
                            <button onClick={() => setPayMethod('installment')} style={{
                                flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: payMethod === 'installment' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                            }}>📋 Cicilan</button>
                        </div>
                        {payMethod === 'installment' && (
                            <>
                                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tenor</label>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                    {[3, 6, 12].map(t => (
                                        <button key={t} onClick={() => setTenor(t)} style={{
                                            flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
                                            background: tenor === t ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                            color: '#fff', fontWeight: 600,
                                        }}>{t} bulan</button>
                                    ))}
                                </div>
                                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(59,130,246,0.1)', marginBottom: 16, fontSize: '0.85rem' }}>
                                    <p>💰 DP (10%): <strong>{fmtPrice(Math.round(propertyPrice * 0.1))}</strong></p>
                                    <p>📋 Cicilan/bulan: <strong>{fmtPrice(Math.round((propertyPrice * 0.9) / tenor))}</strong></p>
                                </div>
                            </>
                        )}
                        {payMethod === 'cash' && (
                            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16,185,129,0.1)', marginBottom: 16, fontSize: '0.85rem' }}>
                                <p>💰 Total Bayar: <strong>{fmtPrice(propertyPrice)}</strong></p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Periode Sewa</label>
                        <select value={rentPeriod} onChange={e => setRentPeriod(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
                            <option value="daily">Harian</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tanggal Mulai</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Durasi ({rentPeriod === 'daily' ? 'hari' : rentPeriod === 'monthly' ? 'bulan' : 'tahun'})</label>
                        <input type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ ...inputStyle, marginBottom: 16 }} />
                    </>
                )}

                <button onClick={handleSubmit} disabled={submitting} style={{
                    width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: '1rem',
                    opacity: submitting ? 0.6 : 1,
                }}>
                    {submitting ? '⏳ Memproses...' : dealType === 'purchase' ? '🏷️ Buat Booking Pembelian' : '🔑 Buat Booking Sewa'}
                </button>
                <button onClick={onClose} style={{
                    width: '100%', padding: 10, marginTop: 8, background: 'transparent',
                    border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                }}>Batal</button>
            </div>
        </div>
    );
}

/* ========== DOCUMENT UPLOAD MODAL (Customer) ========== */
function DocumentUploadModal({ booking, token, onClose }: { booking: any; token: string; onClose: () => void }) {
    const [docs, setDocs] = useState<any[]>([]);
    const [requiredTypes, setRequiredTypes] = useState<string[]>([]);
    const [uploading, setUploading] = useState<string | null>(null);

    const typeLabels: Record<string, string> = { ktp: 'KTP', kk: 'Kartu Keluarga (KK)', npwp: 'NPWP', slip_gaji: 'Slip Gaji / Surat Penghasilan' };

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        const res = await fetch(`http://localhost:8081/api/documents/booking/${booking.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setDocs(data.documents || []);
            setRequiredTypes(data.required_types || ['ktp']);
        }
    };

    const uploadFile = async (docType: string, file: File) => {
        setUploading(docType);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', docType);
        const res = await fetch(`http://localhost:8081/api/documents/upload/${booking.id}`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
        if (res.ok) { await fetchDocs(); }
        else { const d = await res.json(); alert(d.error || 'Upload gagal'); }
        setUploading(null);
    };

    const getDocStatus = (docType: string) => docs.find(d => d.type === docType);

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#1a1f2e', borderRadius: 16, padding: 32, width: '90%', maxWidth: 550,
                border: '1px solid rgba(201,168,76,0.2)',
            }}>
                <h2 style={{ marginBottom: 8 }}>📄 Upload Dokumen</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
                    Upload dokumen yang diperlukan untuk melanjutkan pembayaran.
                </p>

                {requiredTypes.map(type => {
                    const existing = getDocStatus(type);
                    return (
                        <div key={type} style={{
                            padding: 16, marginBottom: 12, borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <strong>{typeLabels[type] || type}</strong>
                                {existing && (
                                    <span style={{
                                        padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                        background: existing.status === 'approved' ? 'rgba(16,185,129,0.15)' : existing.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                        color: existing.status === 'approved' ? '#10b981' : existing.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                    }}>{existing.status === 'approved' ? '✅ Disetujui' : existing.status === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu'}</span>
                                )}
                            </div>
                            {existing?.status === 'rejected' && existing.rejected_reason && (
                                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 8 }}>
                                    Alasan: {existing.rejected_reason}
                                </p>
                            )}
                            {existing?.original_name && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>
                                    📎 {existing.original_name}
                                </p>
                            )}
                            {(!existing || existing.status === 'rejected') && (
                                <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
                                    background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '0.8rem',
                                }}>
                                    {uploading === type ? '⏳ Mengupload...' : (existing ? '🔄 Upload Ulang' : '📤 Pilih File')}
                                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                                        onChange={e => { if (e.target.files?.[0]) uploadFile(type, e.target.files[0]); }}
                                        disabled={uploading !== null} />
                                </label>
                            )}
                        </div>
                    );
                })}

                <button onClick={onClose} style={{
                    width: '100%', padding: 12, marginTop: 8, background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer',
                }}>Tutup</button>
            </div>
        </div>
    );
}

/* ========== DOCUMENT REVIEW MODAL (Admin) ========== */
function DocumentReviewModal({ booking, token, onClose }: { booking: any; token: string; onClose: () => void }) {
    const [docs, setDocs] = useState<any[]>([]);
    const [requiredTypes, setRequiredTypes] = useState<string[]>([]);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<number | null>(null);

    const typeLabels: Record<string, string> = { ktp: 'KTP', kk: 'Kartu Keluarga (KK)', npwp: 'NPWP', slip_gaji: 'Slip Gaji' };

    useEffect(() => { fetchDocs(); }, []);

    const fetchDocs = async () => {
        const res = await fetch(`http://localhost:8081/api/documents/booking/${booking.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setDocs(data.documents || []);
            setRequiredTypes(data.required_types || []);
        }
    };

    const verifyDoc = async (docId: number, action: 'approve' | 'reject', reason = '') => {
        const res = await fetch(`http://localhost:8081/api/documents/${docId}/verify`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, reason }),
        });
        if (res.ok) { await fetchDocs(); setRejectingId(null); setRejectReason(''); }
    };

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#1a1f2e', borderRadius: 16, padding: 32, width: '90%', maxWidth: 600,
                border: '1px solid rgba(201,168,76,0.2)', maxHeight: '80vh', overflowY: 'auto',
            }}>
                <h2 style={{ marginBottom: 8 }}>📋 Review Dokumen</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                    Booking #{booking.id} — {booking.property?.title || 'Properti'}
                </p>

                {docs.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Belum ada dokumen di-upload.</p>
                ) : docs.map(doc => (
                    <div key={doc.id} style={{
                        padding: 16, marginBottom: 12, borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong>{typeLabels[doc.type] || doc.type}</strong>
                            <span style={{
                                padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                background: doc.status === 'approved' ? 'rgba(16,185,129,0.15)' : doc.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                color: doc.status === 'approved' ? '#10b981' : doc.status === 'rejected' ? '#ef4444' : '#f59e0b',
                            }}>{doc.status === 'approved' ? '✅ Disetujui' : doc.status === 'rejected' ? '❌ Ditolak' : '⏳ Pending'}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>📎 {doc.original_name}</p>
                        <a href={`http://localhost:8081${doc.file_path}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#3b82f6', fontSize: '0.8rem', textDecoration: 'underline' }}>
                            👁 Lihat Dokumen
                        </a>

                        {doc.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button onClick={() => verifyDoc(doc.id, 'approve')} style={{
                                    padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: '#10b981', color: '#fff', fontSize: '0.8rem',
                                }}>✅ Setujui</button>
                                {rejectingId === doc.id ? (
                                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                                        <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Alasan penolakan..." style={{
                                                flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.8rem',
                                            }} />
                                        <button onClick={() => verifyDoc(doc.id, 'reject', rejectReason)} style={{
                                            padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                            background: '#ef4444', color: '#fff', fontSize: '0.8rem',
                                        }}>Tolak</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setRejectingId(doc.id)} style={{
                                        padding: '6px 16px', borderRadius: 8, border: '1px solid #ef4444', cursor: 'pointer',
                                        background: 'transparent', color: '#ef4444', fontSize: '0.8rem',
                                    }}>❌ Tolak</button>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Missing docs warning */}
                {requiredTypes.filter(t => !docs.find(d => d.type === t)).length > 0 && (
                    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.1)', marginBottom: 12 }}>
                        <p style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                            ⚠️ Dokumen belum lengkap: {requiredTypes.filter(t => !docs.find(d => d.type === t)).map(t => typeLabels[t]).join(', ')}
                        </p>
                    </div>
                )}

                <button onClick={onClose} style={{
                    width: '100%', padding: 12, marginTop: 8, background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer',
                }}>Tutup</button>
            </div>
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
                onSuccess: async () => {
                    try {
                        await fetch(`http://localhost:8081/api/payments/${data.payment_id}/sync`, {
                            method: 'POST', headers: { Authorization: `Bearer ${token}` },
                        });
                    } catch (e) { console.error('Sync error:', e); }
                    alert('✅ Pembayaran berhasil!');
                    window.location.reload();
                },
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
                                padding: '20px 16px', cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                            }}>
                                <div>
                                    <h3 style={{ marginBottom: 4, fontSize: '1rem' }}>{bk.property?.title || 'Properti'}</h3>
                                    {bk.customer && user?.role === 'admin' && (
                                        <p style={{ color: '#c9a84c', fontSize: '0.8rem', marginBottom: 4 }}>
                                            👤 {bk.customer.name} — <span style={{ color: 'var(--text-muted)' }}>{bk.customer.email}</span>
                                        </p>
                                    )}
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {fmtP(bk.total_price)} • Cicilan {bk.installment_tenor || 12} bulan
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                        {paidCount}/{totalCount} terbayar
                                    </p>
                                    <span style={{ fontSize: '1.3rem' }}>{isExp ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div style={{ padding: '0 16px 16px' }}>
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
                                <div style={{ padding: '0 16px 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <table className={styles.table} style={{ marginTop: 0, minWidth: 520 }}>
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
                                                            {isPaid && (
                                                                <a href={`http://localhost:8081/api/payments/${p.id}/invoice`}
                                                                    target="_blank" rel="noopener noreferrer"
                                                                    style={{ display: 'inline-block', marginLeft: 8, padding: '3px 10px', background: 'rgba(201,168,76,0.15)', color: '#c9a84c', borderRadius: 6, fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                                                                    📄 Invoice
                                                                </a>
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

/* ========== FAVORITES TAB ========== */
function FavoritesTab() {
    const { token } = useAuth();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch('http://localhost:8081/api/favorites', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setFavorites(data.favorites || []);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [token]);

    const removeFavorite = async (propertyId: number) => {
        if (!token) return;
        await fetch(`http://localhost:8081/api/favorites/${propertyId}/toggle`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(prev => prev.filter(f => f.property_id !== propertyId));
    };

    const fmtPrice = (n: number) => {
        if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)} M`;
        if (n >= 1e6) return `Rp ${Math.round(n / 1e6)} Juta`;
        return `Rp ${n.toLocaleString('id-ID')}`;
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>⏳ Memuat favorit...</div>;
    if (favorites.length === 0) {
        return (
            <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>❤️</span>
                <h3>Belum Ada Favorit</h3>
                <p>Klik ikon ❤️ pada properti untuk menambahkan ke favorit.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: 20 }}>❤️ Properti Favorit Saya ({favorites.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {favorites.map(fav => {
                    const p = fav.property;
                    if (!p) return null;
                    const fallbackImages: Record<string, string> = {
                        house: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
                        apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
                        villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
                        commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
                        land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
                        warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
                    };
                    const getImg = () => {
                        if (p.images && p.images.length > 0) {
                            const first = p.images[0];
                            if (first.startsWith('/uploads/')) return `http://localhost:8081${first}`;
                            return first;
                        }
                        return fallbackImages[p.category] || fallbackImages.house;
                    };
                    const fallback = fallbackImages[p.category] || fallbackImages.house;
                    const img = getImg();
                    return (
                        <div key={fav.id} onClick={() => window.open(`/properties/${fav.property_id}`, '_blank')} style={{
                            background: 'var(--bg-card, #1a1f2e)', borderRadius: 12,
                            border: '1px solid rgba(201,168,76,0.1)', overflow: 'hidden',
                            transition: 'transform 0.2s', cursor: 'pointer',
                        }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                            <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: '#0f1219' }}>
                                <img src={img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = fallback; }} />
                                <span style={{
                                    position: 'absolute', top: 10, left: 10, padding: '3px 10px',
                                    borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                                    background: p.type === 'sell' ? 'rgba(16,185,129,0.9)' : 'rgba(59,130,246,0.9)',
                                    color: '#fff',
                                }}>{p.type === 'sell' ? 'Dijual' : 'Disewa'}</span>
                                <button onClick={(e) => { e.stopPropagation(); removeFavorite(fav.property_id); }} style={{
                                    position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)',
                                    border: 'none', borderRadius: '50%', width: 36, height: 36,
                                    cursor: 'pointer', fontSize: '1.1rem', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }} title="Hapus dari favorit">❤️</button>
                            </div>
                            <div style={{ padding: '16px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4, color: '#fff' }}>{p.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>📍 {p.city}</p>
                                <p style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1rem' }}>{fmtPrice(p.price)}</p>
                                {p.bedrooms > 0 && (
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                        <span>🛏 {p.bedrooms}</span>
                                        <span>🚿 {p.bathrooms}</span>
                                        <span>📐 {p.land_area} m²</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function NotificationBell() {
    const { token } = useAuth();
    const [notifs, setNotifs] = useState<{ id: number; title: string; message: string; type: string; is_read: boolean; created_at: string }[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);

    useEffect(() => {
        if (!token) return;
        const API = 'http://localhost:8081';
        const headers = { Authorization: `Bearer ${token}` };
        const fetchNotifs = async () => {
            try {
                const [nRes, cRes] = await Promise.all([
                    fetch(`${API}/api/notifications`, { headers }),
                    fetch(`${API}/api/notifications/unread-count`, { headers }),
                ]);
                if (nRes.ok) { const d = await nRes.json(); setNotifs(d.notifications || []); }
                if (cRes.ok) { const d = await cRes.json(); setUnreadCount(d.count || 0); }
            } catch (e) { console.error(e); }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 15000);
        return () => clearInterval(interval);
    }, [token]);

    const markAllRead = async () => {
        if (!token) return;
        await fetch('http://localhost:8081/api/notifications/read-all', {
            method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(0);
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setShowPanel(!showPanel)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem',
                position: 'relative', padding: '4px 8px',
            }}>
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff',
                        borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>
            {showPanel && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, width: 360, maxHeight: 420,
                    background: '#1a1f2e', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 1000, overflow: 'hidden',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>🔔 Notifikasi</h4>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', fontSize: '0.75rem' }}>Tandai semua dibaca</button>
                        )}
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: 350 }}>
                        {notifs.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                <p style={{ fontSize: '1.5rem', marginBottom: 4 }}>🔕</p>
                                <p style={{ fontSize: '0.85rem' }}>Belum ada notifikasi</p>
                            </div>
                        ) : notifs.map(n => (
                            <div key={n.id} style={{
                                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                background: n.is_read ? 'transparent' : 'rgba(201,168,76,0.05)',
                                cursor: 'default',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: n.is_read ? 400 : 600, color: '#fff', marginBottom: 4 }}>{n.title}</p>
                                    {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', flexShrink: 0, marginTop: 4 }} />}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{n.message}</p>
                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                                    {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function LiveChatBadge() {
    const { totalUnread } = useLiveChat();
    if (totalUnread <= 0) return null;
    return <span className={styles.chatBadge}>{totalUnread}</span>;
}

/* ========== ANALYTICS WIDGET ========== */
function AnalyticsWidget() {
    const [stats, setStats] = useState<{
        live_visitors: number; today_visitors: number; today_page_views: number;
        week_visitors: number; total_page_views: number;
        top_pages: { page_path: string; count: number }[];
        hourly: { hour: number; count: number }[];
    } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('pkwl_token');
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
        const fetchStats = () => {
            fetch(`${API}/api/analytics/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.json())
                .then(d => setStats(d))
                .catch(() => { });
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const maxHourly = Math.max(...stats.hourly.map(h => h.count), 1);

    const pageLabels: Record<string, string> = {
        '/': 'Beranda',
        '/properties': 'Daftar Properti',
        '/about': 'Tentang',
        '/contact': 'Kontak',
        '/dashboard': 'Dashboard',
    };

    return (
        <div style={{ marginTop: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 Analitik Pengunjung
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(16,185,129,0.12)', color: '#10b981',
                    padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#10b981',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    LIVE
                </span>
            </h3>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Aktif Sekarang', value: stats.live_visitors, color: '#10b981', icon: '🟢' },
                    { label: 'Hari Ini', value: stats.today_visitors, color: '#3b82f6', icon: '👤' },
                    { label: 'Page Views', value: stats.today_page_views, color: '#f59e0b', icon: '👁' },
                    { label: 'Minggu Ini', value: stats.week_visitors, color: '#8b5cf6', icon: '📅' },
                ].map((s, i) => (
                    <div key={i} style={{
                        background: `${s.color}10`, border: `1px solid ${s.color}25`,
                        borderRadius: 12, padding: '0.75rem', textAlign: 'center',
                    }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.icon} {s.label}</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Hourly Chart */}
            <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    📈 Pengunjung 24 Jam Terakhir
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, padding: '0 2px' }}>
                    {stats.hourly.map((h, i) => {
                        const pct = maxHourly > 0 ? (h.count / maxHourly) * 100 : 0;
                        const now = new Date().getHours();
                        const isCurrentHour = h.hour === now;
                        return (
                            <div
                                key={i}
                                title={`${String(h.hour).padStart(2, '0')}:00 — ${h.count} pengunjung`}
                                style={{
                                    flex: 1, minWidth: 0,
                                    height: `${Math.max(pct, 3)}%`,
                                    background: isCurrentHour
                                        ? 'linear-gradient(to top, #c9a84c, #e0c068)'
                                        : h.count > 0
                                            ? 'linear-gradient(to top, rgba(59,130,246,0.5), rgba(59,130,246,0.8))'
                                            : 'var(--bg-tertiary)',
                                    borderRadius: '3px 3px 0 0',
                                    transition: 'height 0.3s ease',
                                    cursor: 'pointer',
                                }}
                            />
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>00:00</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>06:00</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>12:00</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>18:00</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>23:00</span>
                </div>
            </div>

            {/* Top Pages */}
            {stats.top_pages && stats.top_pages.length > 0 && (
                <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        🔗 Halaman Terpopuler
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {stats.top_pages.map((p, i) => {
                            const maxCount = stats.top_pages[0]?.count || 1;
                            const pct = (p.count / maxCount) * 100;
                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.4rem 0.6rem', borderRadius: 8,
                                    background: 'var(--bg-tertiary)',
                                }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: 16, textAlign: 'center', fontWeight: 700 }}>{i + 1}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {pageLabels[p.page_path] || p.page_path}
                                        </p>
                                        <div style={{ width: '100%', height: 3, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 3 }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold-primary)', borderRadius: 2, transition: 'width 0.3s' }} />
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: 600, flexShrink: 0 }}>{p.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </div>
    );
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
