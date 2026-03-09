'use client';
import { AuthProvider } from '@/lib/auth';
import { LiveChatProvider } from '@/lib/livechat';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatBot from '@/components/layout/ChatBot';
import { api, formatPrice } from '@/lib/api';
import styles from './detail.module.css';
import { use, useState, useEffect } from 'react';

declare global {
    interface Window {
        snap: any;
    }
}

interface PropertySpec {
    label: string;
    value: string;
    icon: string;
}

interface ArchitectureDesign {
    title: string;
    image: string;
    description: string;
}

const propertyData: Record<string, any> = {
    '1': {
        id: 1, title: 'Rumah Mewah Golf Island PIK 2', type: 'sell', category: 'house',
        price: 12500000000, city: 'Jakarta Utara', province: 'DKI Jakarta',
        address: 'Golf Island Blok A No. 15', bedrooms: 5, bathrooms: 4, garageSize: 2,
        buildArea: 350, landArea: 500, floors: 3, yearBuilt: 2024, certificate: 'SHM',
        lat: -6.1024, lng: 106.7320,
        description: 'Rumah mewah 3 lantai dengan pemandangan lapangan golf di kawasan prestisius Golf Island PIK 2. Dilengkapi dengan smart home system, kolam renang pribadi, dan taman yang luas.',
        facilities: ['Kolam Renang', 'Smart Home', 'Taman', 'CCTV', 'Carport', 'Rooftop'],
        images: [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=600&fit=crop'
        ],
        owner: { name: 'Budi Santoso', phone: '081234567891' },
        specifications: [
            { label: 'Struktur Bangunan', value: 'Beton Bertulang', icon: '🏗️' },
            { label: 'Pondasi', value: 'Bored Pile + Plat', icon: '⛰️' },
            { label: 'Dinding', value: 'Bata Ringan Hebel', icon: '🧱' },
            { label: 'Atap', value: 'Dak Beton + Green Roof', icon: '🏠' },
            { label: 'Lantai', value: 'Marmer Import Italia', icon: '✨' },
            { label: 'Kusen & Jendela', value: 'Aluminium Powder Coating', icon: '🪟' },
            { label: 'Plafon', value: 'Gypsum Board + Drop Ceiling', icon: '💡' },
            { label: 'Sanitari', value: 'TOTO / Kohler Premium', icon: '🚿' },
            { label: 'Listrik', value: '23.000 Watt / 3 Phase', icon: '⚡' },
            { label: 'Air', value: 'PDAM + Ground Tank 5000L', icon: '💧' },
            { label: 'Smart Home', value: 'Bticino MyHome System', icon: '📱' },
            { label: 'Keamanan', value: 'CCTV 16 Ch + Access Card', icon: '🔒' },
            { label: 'AC', value: 'VRV Daikin Multi Split', icon: '❄️' },
            { label: 'Water Heater', value: 'Solar + Electric Backup', icon: '🔥' },
            { label: 'Kolam Renang', value: 'Infinity Pool 8x4m', icon: '🏊' },
            { label: 'Internet', value: 'Fiber Optic Ready', icon: '🌐' },
        ],
        architectureDesigns: [
            {
                title: 'Denah Lantai (Floor Plan)',
                image: '/images/house-floorplan.png',
                description: 'Denah 3 lantai dengan total luas bangunan 350m². Lantai 1: Garasi, ruang tamu, dapur, kolam renang. Lantai 2: 3 kamar tidur, ruang keluarga. Lantai 3: Rooftop garden, ruang kerja.'
            },
            {
                title: '3D Render Eksterior',
                image: '/images/house-3d-render.png',
                description: 'Desain arsitektur modern minimalis dengan fasad kaca lebar, kolam renang infinity, taman tropis, dan carport 2 mobil. Pencahayaan evening memberikan kesan premium dan eksklusif.'
            }
        ]
    },
    '2': {
        id: 2, title: 'Apartemen Luxury Ebony Tower', type: 'rent', category: 'apartment',
        price: 25000000, rentPeriod: 'bulan', city: 'Jakarta Utara', province: 'DKI Jakarta',
        address: 'Ebony Tower Lt. 25 Unit A', bedrooms: 3, bathrooms: 2,
        buildArea: 120, floors: 1, yearBuilt: 2023, certificate: 'PPJB',
        lat: -6.1100, lng: 106.7450,
        description: 'Unit apartemen premium dengan full furnished design interior modern. 180° city view.',
        facilities: ['Infinity Pool', 'Gym', 'Sky Lounge', 'Concierge', 'Parking'],
        images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop'
        ],
        owner: { name: 'Budi Santoso', phone: '081234567891' },
        specifications: [
            { label: 'Struktur Bangunan', value: 'Reinforced Concrete', icon: '🏗️' },
            { label: 'Lantai', value: 'Parquet Kayu Oak', icon: '✨' },
            { label: 'Dinding', value: 'Gypsum + Wallpaper Premium', icon: '🧱' },
            { label: 'Plafon', value: 'Drop Ceiling LED Indirect', icon: '💡' },
            { label: 'Jendela', value: 'Double Glazed Panoramic', icon: '🪟' },
            { label: 'Sanitari', value: 'Grohe + TOTO Washlet', icon: '🚿' },
            { label: 'Listrik', value: '7.700 Watt', icon: '⚡' },
            { label: 'AC', value: 'Cassette Daikin VRV', icon: '❄️' },
            { label: 'Smart Lock', value: 'Samsung Digital Lock', icon: '🔒' },
            { label: 'Kitchen Set', value: 'Full Set Teka Appliances', icon: '🍳' },
            { label: 'Water Heater', value: 'Ariston Instant 30L', icon: '🔥' },
            { label: 'Internet', value: 'Fiber Optic 100 Mbps', icon: '🌐' },
        ],
        architectureDesigns: [
            {
                title: 'Denah Unit Apartemen',
                image: '/images/apartment-floorplan.png',
                description: 'Layout unit 120m² dengan 3 kamar tidur, 2 kamar mandi, living & dining area terbuka, dapur modern, walk-in closet, dan balkon dengan city view.'
            }
        ]
    },
    '3': {
        id: 3, title: 'Villa Resort Bali Style di Sentul', type: 'both', category: 'villa',
        price: 8500000000, city: 'Bogor', province: 'Jawa Barat',
        address: 'Sentul Highland Blok C No. 8', bedrooms: 4, bathrooms: 3, garageSize: 2,
        buildArea: 280, landArea: 600, floors: 2, yearBuilt: 2023, certificate: 'SHM',
        lat: -6.5980, lng: 106.8510,
        description: 'Villa mewah bergaya resort Bali di kawasan Sentul Highland. Dikelilingi pemandangan pegunungan dan udara sejuk. Dilengkapi kolam renang private, gazebo, dan taman tropis yang luas. Cocok untuk hunian atau investasi villa rental.',
        facilities: ['Kolam Renang', 'Gazebo', 'Taman Tropis', 'BBQ Area', 'Outdoor Shower', 'Carport'],
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&h=600&fit=crop'
        ],
        owner: { name: 'Rina Wijaya', phone: '081345678912' },
        specifications: [
            { label: 'Struktur Bangunan', value: 'Beton + Kayu Jati', icon: '🏗️' },
            { label: 'Pondasi', value: 'Cakar Ayam Bertulang', icon: '⛰️' },
            { label: 'Dinding', value: 'Batu Alam + Exposed Brick', icon: '🧱' },
            { label: 'Atap', value: 'Genteng Flat Concrete', icon: '🏠' },
            { label: 'Lantai', value: 'Batu Andesit + Kayu Parquet', icon: '✨' },
            { label: 'Kusen & Jendela', value: 'Kayu Jati Solid', icon: '🪟' },
            { label: 'Sanitari', value: 'TOTO Premium Series', icon: '🚿' },
            { label: 'Listrik', value: '11.000 Watt', icon: '⚡' },
            { label: 'Air', value: 'Sumur Bor + Tank 3000L', icon: '💧' },
            { label: 'Kolam Renang', value: 'Private Pool 10x4m', icon: '🏊' },
            { label: 'AC', value: 'Split Daikin Inverter', icon: '❄️' },
            { label: 'Internet', value: 'Fiber Optic Ready', icon: '🌐' },
        ],
        architectureDesigns: [
            {
                title: 'Denah Villa (Floor Plan)',
                image: '/images/villa-floorplan.png',
                description: 'Denah 2 lantai bergaya resort Bali. Lantai 1: Living room terbuka, dapur, kamar tidur utama, kolam renang, gazebo. Lantai 2: 3 kamar tidur dengan balkon pemandangan gunung.'
            }
        ]
    },
    '4': {
        id: 4, title: 'Ruko Strategis BSD City', type: 'sell', category: 'commercial',
        price: 5200000000, city: 'Tangerang Selatan', province: 'Banten',
        address: 'BSD City Sektor 7 Blok RK No. 12', bathrooms: 3,
        buildArea: 240, landArea: 100, floors: 3, yearBuilt: 2022, certificate: 'SHM',
        lat: -6.3019, lng: 106.6520,
        description: 'Ruko 3 lantai di lokasi strategis BSD City, area komersial ramai. Cocok untuk kantor, klinik, restoran, atau toko retail. Akses mudah ke tol dan transportasi umum.',
        facilities: ['Parkir Luas', 'Loading Dock', 'Lift Barang', 'Pantry', 'Toilet Setiap Lantai', 'CCTV'],
        images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=600&fit=crop'
        ],
        owner: { name: 'Hendra Tan', phone: '081456789023' },
        specifications: [
            { label: 'Struktur Bangunan', value: 'Beton Bertulang', icon: '🏗️' },
            { label: 'Pondasi', value: 'Bored Pile', icon: '⛰️' },
            { label: 'Dinding', value: 'Bata Merah Plester', icon: '🧱' },
            { label: 'Lantai', value: 'Granit 60x60', icon: '✨' },
            { label: 'Facade', value: 'ACP + Kaca Tempered', icon: '🪟' },
            { label: 'Listrik', value: '16.500 Watt / 3 Phase', icon: '⚡' },
            { label: 'Air', value: 'PDAM + Ground Tank', icon: '💧' },
            { label: 'Keamanan', value: 'CCTV + Rolling Door', icon: '🔒' },
            { label: 'AC', value: 'Cassette per Lantai', icon: '❄️' },
            { label: 'Internet', value: 'Fiber Optic Ready', icon: '🌐' },
        ],
        architectureDesigns: []
    },
    '5': {
        id: 5, title: 'Kavling Premium PIK', type: 'sell', category: 'land',
        price: 15000000000, city: 'Jakarta Utara', province: 'DKI Jakarta',
        address: 'Pantai Indah Kapuk 2 Sektor 5',
        landArea: 800, yearBuilt: 2024, certificate: 'SHM',
        bedrooms: 0, bathrooms: 0, buildArea: 0, floors: 0,
        lat: -6.1010, lng: 106.7250,
        description: 'Kavling premium di kawasan Pantai Indah Kapuk 2 dengan lokasi strategis dekat akses tol. Tanah siap bangun dengan kontur rata, cocok untuk rumah mewah atau investasi jangka panjang. Kawasan berkembang pesat.',
        facilities: ['Akses Tol', 'Kawasan Terencana', 'Keamanan 24 Jam', 'Club House Nearby'],
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=900&h=600&fit=crop'
        ],
        owner: { name: 'Budi Santoso', phone: '081234567891' },
        specifications: [
            { label: 'Luas Tanah', value: '800 m²', icon: '📐' },
            { label: 'Lebar Depan', value: '20 meter', icon: '📏' },
            { label: 'Kontur Tanah', value: 'Rata / Datar', icon: '🏔️' },
            { label: 'Sertifikat', value: 'SHM (Hak Milik)', icon: '📋' },
            { label: 'Peruntukan', value: 'Residensial', icon: '🏠' },
            { label: 'Akses Jalan', value: 'Jalan ROW 12m', icon: '🛣️' },
            { label: 'Listrik', value: 'Siap Pasang PLN', icon: '⚡' },
            { label: 'Air', value: 'PDAM Tersedia', icon: '💧' },
        ],
        architectureDesigns: []
    },
    '6': {
        id: 6, title: 'Gudang Modern Cikupa Industrial', type: 'rent', category: 'warehouse',
        price: 75000000, rentPeriod: 'bulan', city: 'Tangerang', province: 'Banten',
        address: 'Kawasan Industri Cikupa Mas Blok G No. 5',
        buildArea: 2000, landArea: 3000, floors: 1, yearBuilt: 2021, certificate: 'HGB',
        lat: -6.2390, lng: 106.4945,
        bedrooms: 0, bathrooms: 2,
        description: 'Gudang modern standar industri di Kawasan Industri Cikupa Mas. Dilengkapi loading dock, tinggi plafon 10m untuk racking system, lantai beton heavy-duty, dan area kantor. Akses kontainer mudah dengan jalan lebar.',
        facilities: ['Loading Dock', 'Kantor', 'Toilet', 'Pos Jaga', 'Area Parkir Truk', 'Listrik Industri'],
        images: [
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&h=600&fit=crop',
            'https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&h=600&fit=crop'
        ],
        owner: { name: 'Hendra Tan', phone: '081456789023' },
        specifications: [
            { label: 'Luas Bangunan', value: '2.000 m²', icon: '🏗️' },
            { label: 'Luas Tanah', value: '3.000 m²', icon: '📐' },
            { label: 'Tinggi Plafon', value: '10 meter', icon: '📏' },
            { label: 'Lantai', value: 'Beton Floor Hardener', icon: '✨' },
            { label: 'Struktur', value: 'Baja WF H-Beam', icon: '⛰️' },
            { label: 'Atap', value: 'Galvalum + Skylight', icon: '🏠' },
            { label: 'Listrik', value: '66.000 Watt / 3 Phase', icon: '⚡' },
            { label: 'Loading Dock', value: '2 Unit (Container)', icon: '🚛' },
            { label: 'Kapasitas Lantai', value: '5 Ton/m²', icon: '⚙️' },
            { label: 'Keamanan', value: 'CCTV + Satpam 24 Jam', icon: '🔒' },
        ],
        architectureDesigns: []
    },
};

const typeLabels: Record<string, string> = { sell: 'DIJUAL', rent: 'DISEWA', both: 'JUAL/SEWA' };

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [currentImage, setCurrentImage] = useState(0);
    const [activeDesign, setActiveDesign] = useState(0);
    const [lightbox, setLightbox] = useState<string | null>(null);

    // Sidebar state
    const [buyStep, setBuyStep] = useState(1); // 1=survey, 2=booking, 3=bayar
    const [surveyDate, setSurveyDate] = useState('');
    const [surveyNote, setSurveyNote] = useState('');
    const [payMethod, setPayMethod] = useState<'cash' | 'installment'>('cash');
    const [installTenor, setInstallTenor] = useState(12);
    const dpPercent = 0.10;
    const calcDP = (price: number) => Math.round(price * dpPercent);
    const calcMonthly = (price: number, months: number) => Math.round((price - calcDP(price)) / months);
    const [rentPeriod, setRentPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
    const [rentStart, setRentStart] = useState('');
    const [rentDuration, setRentDuration] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [surveySuccess, setSurveySuccess] = useState(false);
    const [bookedDates, setBookedDates] = useState<string[]>([]);
    const [property, setProperty] = useState<any>(propertyData[id] || null);
    const [loading, setLoading] = useState(!propertyData[id]);
    const [isFavorited, setIsFavorited] = useState(false);

    // Check if property is favorited
    useEffect(() => {
        const token = localStorage.getItem('pkwl_token');
        if (!token) return;
        fetch(`http://localhost:8081/api/favorites/${id}/check`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).then(d => setIsFavorited(d.is_favorited)).catch(() => { });
    }, [id]);

    // Fetch booked dates for this property
    useEffect(() => {
        api<{ booked_dates: string[] }>(`/api/properties/${id}/booked-dates`)
            .then(data => setBookedDates(data.booked_dates || []))
            .catch(() => { });
    }, [id]);

    const isDateBooked = (dateStr: string) => bookedDates.includes(dateStr);

    /* fallback images per category for API-loaded properties */
    const defaultImages: Record<string, string[]> = {
        house: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=600&fit=crop'],
        apartment: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop'],
        villa: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&h=600&fit=crop'],
        commercial: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=600&fit=crop'],
        land: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=900&h=600&fit=crop'],
        warehouse: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&h=600&fit=crop'],
    };

    useEffect(() => {
        if (propertyData[id]) {
            // Static data: still call API to increment view count (fire-and-forget)
            api<any>(`/api/properties/${id}`).catch(() => { });
            return;
        }
        api<{ property: any }>(`/api/properties/${id}`)
            .then(data => {
                const p = data.property;
                if (!p) { setLoading(false); return; }
                const imgs = (p.images && p.images.length > 0 && !p.images[0].startsWith('/uploads/'))
                    ? p.images : (defaultImages[p.category] || defaultImages.house);
                setProperty({
                    id: p.id, title: p.title, type: p.type, category: p.category,
                    price: p.price, rentPeriod: p.rent_period === 'monthly' ? 'bulan' : p.rent_period || '',
                    city: p.city, province: p.province, address: p.address || '',
                    bedrooms: p.bedrooms || 0, bathrooms: p.bathrooms || 0, garageSize: p.garage_size || 0,
                    buildArea: p.build_area || 0, landArea: p.land_area || 0,
                    floors: p.floors || 0, yearBuilt: p.year_built || 0, certificate: p.certificate || '-',
                    lat: p.lat || -6.2, lng: p.lng || 106.8,
                    description: p.description || '',
                    facilities: p.facilities || [],
                    images: imgs,
                    owner: p.owner ? { name: p.owner.name, phone: p.owner.phone } : { name: 'Admin PKWL', phone: '081234567890' },
                    specifications: [],
                    architectureDesigns: [],
                });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <AuthProvider><LiveChatProvider>
                <Navbar />
                <main style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Memuat properti...</p>
                </main>
                <Footer />
            </LiveChatProvider></AuthProvider>
        );
    }

    if (!property) {
        return (
            <AuthProvider><LiveChatProvider>
                <Navbar />
                <main style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>Properti Tidak Ditemukan</h1>
                        <a href="/properties" className="btn btn-primary">Kembali ke Daftar</a>
                    </div>
                </main>
                <Footer />
            </LiveChatProvider></AuthProvider>
        );
    }

    const specs: PropertySpec[] = property.specifications || [];
    const designs: ArchitectureDesign[] = property.architectureDesigns || [];

    // Rental price calculation
    const getRentPrice = () => {
        const base = property.price;
        switch (rentPeriod) {
            case 'daily': return Math.round(base / 30);
            case 'monthly': return base;
            case 'yearly': return Math.round(base * 12 * 0.9);
        }
    };
    const periodLabel = { daily: 'hari', monthly: 'bulan', yearly: 'tahun' };
    const rentPrice = getRentPrice();
    const rentTotal = rentPrice * rentDuration;

    // Duration options based on period
    const durationOptions = rentPeriod === 'daily'
        ? [1, 3, 7, 14, 30]
        : rentPeriod === 'monthly'
            ? [1, 3, 6, 12, 24]
            : [1, 2, 3, 5];

    // Handle survey submission
    const handleSurvey = async () => {
        if (!surveyDate) { alert('Pilih tanggal survey terlebih dahulu!'); return; }
        const token = typeof window !== 'undefined' ? localStorage.getItem('pkwl_token') : null;
        if (!token) { alert('Silakan login terlebih dahulu untuk menjadwalkan survey.'); return; }
        setIsProcessing(true);
        try {
            await api('/api/surveys', {
                method: 'POST',
                token,
                body: {
                    property_id: Number(property.id),
                    survey_date: surveyDate,
                    message: surveyNote,
                },
            });
            setSurveySuccess(true);
            setBuyStep(2);
            // Refresh booked dates
            setBookedDates(prev => [...prev, surveyDate]);
        } catch (err: any) {
            alert(err.message || 'Gagal menjadwalkan survey');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle Midtrans Snap payment
    const handlePayment = async (amount: number, itemName: string, bookingType: 'purchase' | 'rental') => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('pkwl_token') : null;
        if (!token) { alert('Silakan login terlebih dahulu untuk melakukan pembayaran.'); return; }
        if (!window.snap) {
            alert('Payment gateway sedang dimuat, coba lagi dalam beberapa detik.');
            return;
        }
        setIsProcessing(true);
        try {
            // Step 1: Create booking on backend
            let bookingId: number;
            if (bookingType === 'purchase') {
                const res = await api<any>('/api/bookings/purchase', {
                    method: 'POST', token,
                    body: {
                        property_id: Number(property.id),
                        payment_method: payMethod,
                        tenor: payMethod === 'installment' ? installTenor : 0,
                    },
                });
                bookingId = res.booking?.id || res.id;
            } else {
                const res = await api<any>('/api/bookings/rental', {
                    method: 'POST', token,
                    body: {
                        property_id: Number(property.id),
                        rent_period: rentPeriod,
                        start_date: rentStart,
                        duration: rentDuration,
                    },
                });
                bookingId = res.booking?.id || res.id;
            }

            // Step 2: Get Snap token from backend
            const snapRes = await api<any>('/api/payments/snap', {
                method: 'POST', token,
                body: { booking_id: bookingId },
            });

            // Step 3: Open Midtrans Snap popup
            window.snap.pay(snapRes.snap_token, {
                onSuccess: (result: any) => {
                    setBuyStep(3);
                    setIsProcessing(false);
                },
                onPending: (result: any) => {
                    alert('Pembayaran pending. Silakan selesaikan pembayaran Anda.');
                    setIsProcessing(false);
                },
                onError: (result: any) => {
                    alert('Pembayaran gagal. Silakan coba lagi.');
                    setIsProcessing(false);
                },
                onClose: () => {
                    setIsProcessing(false);
                },
            });
        } catch (err: any) {
            alert(err.message || 'Gagal memproses pembayaran');
            setIsProcessing(false);
        }
    };

    const handleRentalPayment = () => {
        if (!rentStart) { alert('Pilih tanggal mulai sewa!'); return; }
        handlePayment(rentTotal, `Sewa ${property.title} (${rentDuration} ${periodLabel[rentPeriod]})`, 'rental');
    };

    return (
        <AuthProvider><LiveChatProvider>
            <Navbar />
            <main className={styles.page}>
                <div className={styles.gallery}>
                    <div className={styles.mainImage}>
                        <img src={property.images[currentImage]} alt={property.title} />
                        <span className={`${styles.typeBadge} ${styles[property.type]}`}>{typeLabels[property.type]}</span>
                    </div>
                    {property.images.length > 1 && (
                        <div className={styles.thumbs}>
                            {property.images.map((img: string, i: number) => (
                                <button key={i} className={`${styles.thumb} ${i === currentImage ? styles.active : ''}`} onClick={() => setCurrentImage(i)}>
                                    <img src={img} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="container">
                    <div className={styles.detailGrid}>
                        <div className={styles.detailMain}>
                            <div className={styles.priceRow}>
                                <div className={styles.price}>
                                    {formatPrice(property.price)}
                                    {property.rentPeriod && <span>/{property.rentPeriod}</span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <h1 className={styles.title} style={{ flex: 1 }}>{property.title}</h1>
                                <button onClick={async () => {
                                    const token = localStorage.getItem('pkwl_token');
                                    if (!token) { alert('Silakan login terlebih dahulu'); return; }
                                    await fetch(`http://localhost:8081/api/favorites/${id}/toggle`, {
                                        method: 'POST', headers: { Authorization: `Bearer ${token}` },
                                    });
                                    setIsFavorited(!isFavorited);
                                }} style={{
                                    background: 'none', border: '2px solid ' + (isFavorited ? '#ef4444' : 'rgba(255,255,255,0.2)'),
                                    borderRadius: '50%', width: 44, height: 44, cursor: 'pointer',
                                    fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', flexShrink: 0,
                                }} title={isFavorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}>
                                    {isFavorited ? '❤️' : '🤍'}
                                </button>
                            </div>
                            <p className={styles.location}>📍 {property.address}, {property.city}, {property.province}</p>

                            <div className={styles.specsGrid}>
                                {property.bedrooms > 0 && <div className={styles.specItem}><span>🛏</span><div><strong>{property.bedrooms}</strong><p className={styles.specItemLabel}>Kamar Tidur</p></div></div>}
                                {property.bathrooms > 0 && <div className={styles.specItem}><span>🚿</span><div><strong>{property.bathrooms}</strong><p className={styles.specItemLabel}>Kamar Mandi</p></div></div>}
                                {property.buildArea > 0 && <div className={styles.specItem}><span>🏗</span><div><strong>{property.buildArea}m²</strong><p className={styles.specItemLabel}>Luas Bangunan</p></div></div>}
                                {property.landArea > 0 && <div className={styles.specItem}><span>📐</span><div><strong>{property.landArea}m²</strong><p className={styles.specItemLabel}>Luas Tanah</p></div></div>}
                                {property.floors > 0 && <div className={styles.specItem}><span>🏢</span><div><strong>{property.floors}</strong><p className={styles.specItemLabel}>Lantai</p></div></div>}
                                {property.garageSize > 0 && <div className={styles.specItem}><span>🚗</span><div><strong>{property.garageSize}</strong><p className={styles.specItemLabel}>Garasi</p></div></div>}
                            </div>

                            <div className={styles.section}>
                                <h2>Deskripsi</h2>
                                <p>{property.description}</p>
                            </div>

                            <div className={styles.section}>
                                <h2>Fasilitas</h2>
                                <div className={styles.facilityTags}>
                                    {property.facilities.map((f: string, i: number) => <span key={i} className={styles.tag}>{f}</span>)}
                                </div>
                            </div>

                            {/* Spesifikasi Teknis */}
                            {specs.length > 0 && (
                                <div className={styles.section}>
                                    <h2>📋 Spesifikasi Teknis</h2>
                                    <div className={styles.specTable}>
                                        {specs.map((spec, i) => (
                                            <div key={i} className={styles.specRow}>
                                                <div className={styles.specIcon}>{spec.icon}</div>
                                                <div className={styles.specText}>
                                                    <div className={styles.specValue}>{spec.value}</div>
                                                    <div className={styles.specLabel}>{spec.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Desain Arsitektur */}
                            {designs.length > 0 && (
                                <div className={styles.section}>
                                    <h2>🏛️ Desain Arsitektur</h2>
                                    {designs.length > 1 && (
                                        <div className={styles.designTabs}>
                                            {designs.map((d, i) => (
                                                <button
                                                    key={i}
                                                    className={`${styles.designTab} ${i === activeDesign ? styles.activeTab : ''}`}
                                                    onClick={() => setActiveDesign(i)}
                                                >
                                                    {d.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className={styles.designCard}>
                                        <div
                                            className={styles.designImage}
                                            onClick={() => setLightbox(designs[activeDesign].image)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <img src={designs[activeDesign].image} alt={designs[activeDesign].title} />
                                            <div className={styles.zoomOverlay}>
                                                <span>🔍 Klik untuk memperbesar</span>
                                            </div>
                                        </div>
                                        <div className={styles.designInfo}>
                                            <h3>{designs[activeDesign].title}</h3>
                                            <p>{designs[activeDesign].description}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lokasi / Google Maps */}
                            {property.lat && property.lng && (
                                <div className={styles.section}>
                                    <h2>📍 Lokasi</h2>
                                    <div className={styles.mapContainer}>
                                        <iframe
                                            src={`https://maps.google.com/maps?q=${property.lat},${property.lng}&z=15&output=embed`}
                                            width="100%"
                                            height="400"
                                            style={{ border: 0, borderRadius: '12px' }}
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            title={`Lokasi ${property.title}`}
                                        />
                                        <div className={styles.mapInfo}>
                                            <div className={styles.mapAddress}>
                                                <span>📍</span>
                                                <div>
                                                    <strong>{property.address}</strong>
                                                    <p>{property.city}, {property.province}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.mapLink}
                                            >
                                                🗺️ Buka di Google Maps
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.section}>
                                <h2>Detail</h2>
                                <div className={styles.detailList}>
                                    <div><span>Sertifikat</span><strong>{property.certificate}</strong></div>
                                    <div><span>Tahun Dibangun</span><strong>{property.yearBuilt}</strong></div>
                                    <div><span>Kategori</span><strong style={{ textTransform: 'capitalize' }}>{property.category}</strong></div>
                                </div>
                            </div>
                        </div>

                        <aside className={styles.sidebar}>
                            {/* === SELL/BOTH: Survey & Booking === */}
                            {(property.type === 'sell' || property.type === 'both') && (
                                <div className={styles.actionCard}>
                                    <div className={styles.actionHeader}>
                                        <span className={styles.actionIcon}>🏠</span>
                                        <div>
                                            <h3>Beli Properti</h3>
                                            <p className={styles.actionPrice}>{formatPrice(property.price)}</p>
                                        </div>
                                    </div>

                                    {/* Step indicator */}
                                    <div className={styles.steps}>
                                        <div className={`${styles.step} ${buyStep >= 1 ? styles.stepActive : ''}`}>
                                            <span>{buyStep > 1 ? '✓' : '1'}</span> Survey
                                        </div>
                                        <div className={styles.stepLine}></div>
                                        <div className={`${styles.step} ${buyStep >= 2 ? styles.stepActive : ''}`}>
                                            <span>{buyStep > 2 ? '✓' : '2'}</span> Booking
                                        </div>
                                        <div className={styles.stepLine}></div>
                                        <div className={`${styles.step} ${buyStep >= 3 ? styles.stepActive : ''}`}>
                                            <span>3</span> Bayar
                                        </div>
                                    </div>

                                    {/* Step 1: Survey */}
                                    {buyStep === 1 && (
                                        <>
                                            <div className={styles.formGroup}>
                                                <label>📅 Tanggal Survey</label>
                                                <input
                                                    type="date"
                                                    className={styles.formInput}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={surveyDate}
                                                    onChange={(e) => setSurveyDate(e.target.value)}
                                                    style={surveyDate && isDateBooked(surveyDate) ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239,68,68,0.2)' } : {}}
                                                />
                                                {surveyDate && isDateBooked(surveyDate) && (
                                                    <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 6 }}>
                                                        ❌ Tanggal ini sudah di-booking. Silakan pilih tanggal lain.
                                                    </p>
                                                )}
                                                {bookedDates.length > 0 && (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                                                        ⚠️ {bookedDates.length} tanggal sudah terisi untuk properti ini
                                                    </p>
                                                )}
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>📝 Catatan (opsional)</label>
                                                <textarea className={styles.formTextarea} placeholder="Tulis catatan untuk jadwal survey..." rows={3} value={surveyNote} onChange={(e) => setSurveyNote(e.target.value)}></textarea>
                                            </div>
                                            <button className={styles.btnPrimary} onClick={handleSurvey} disabled={isProcessing || (!!surveyDate && isDateBooked(surveyDate))}>
                                                {isProcessing ? '⏳ Memproses...' : '📋 Jadwalkan Survey'}
                                            </button>
                                        </>
                                    )}

                                    {/* Step 2: Booking + Payment Method */}
                                    {buyStep === 2 && (
                                        <>
                                            {surveySuccess && (
                                                <div className={styles.rentalNote} style={{ background: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.3)', marginBottom: 16 }}>
                                                    <p style={{ color: 'rgba(150, 255, 150, 0.9)' }}>✅ Survey dijadwalkan <strong>{surveyDate}</strong>. Lanjut ke booking?</p>
                                                </div>
                                            )}
                                            <p className={styles.formLabel}>Metode Pembayaran</p>
                                            <div className={styles.paymentMethods}>
                                                <button className={`${styles.paymentOption} ${payMethod === 'cash' ? styles.paymentActive : ''}`} onClick={() => setPayMethod('cash')}>
                                                    <span>💵</span>
                                                    <div>
                                                        <strong>Cash</strong>
                                                        <p>Bayar lunas</p>
                                                    </div>
                                                </button>
                                                <button className={`${styles.paymentOption} ${payMethod === 'installment' ? styles.paymentActive : ''}`} onClick={() => setPayMethod('installment')}>
                                                    <span>💳</span>
                                                    <div>
                                                        <strong>Cicilan</strong>
                                                        <p>DP 10% + cicilan bulanan</p>
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Tenor selector */}
                                            {payMethod === 'installment' && (
                                                <div style={{ marginBottom: 16 }}>
                                                    <p className={styles.formLabel} style={{ marginBottom: 8 }}>Pilih Tenor Cicilan</p>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        {[3, 6, 12].map(m => (
                                                            <button key={m} onClick={() => setInstallTenor(m)} style={{
                                                                flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                                                                border: installTenor === m ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                                                                background: installTenor === m ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                                                                color: 'inherit', textAlign: 'center',
                                                            }}>
                                                                <strong>{m}</strong>
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>bulan</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className={styles.priceSummary}>
                                                <div className={styles.priceLineItem}>
                                                    <span>Harga Properti</span>
                                                    <strong>{formatPrice(property.price)}</strong>
                                                </div>
                                                <div className={styles.priceLineItem}>
                                                    <span>Metode</span>
                                                    <strong>{payMethod === 'cash' ? 'Bayar Lunas' : `Cicilan ${installTenor} Bulan`}</strong>
                                                </div>
                                                {payMethod === 'cash' ? (
                                                    <div className={`${styles.priceLineItem} ${styles.priceTotal}`}>
                                                        <span>Total Bayar</span>
                                                        <strong>{formatPrice(property.price)}</strong>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className={styles.priceLineItem}>
                                                            <span>DP (10%)</span>
                                                            <strong style={{ color: '#f59e0b' }}>{formatPrice(calcDP(property.price))}</strong>
                                                        </div>
                                                        <div className={`${styles.priceLineItem} ${styles.priceTotal}`}>
                                                            <span>Cicilan/bulan</span>
                                                            <strong>{formatPrice(calcMonthly(property.price, installTenor))}</strong>
                                                        </div>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6, textAlign: 'right' }}>
                                                            DP {formatPrice(calcDP(property.price))} + {installTenor}x {formatPrice(calcMonthly(property.price, installTenor))}
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            <button className={styles.btnBooking} onClick={() => handlePayment(property.price, property.title, 'purchase')} disabled={isProcessing}>
                                                {isProcessing ? '⏳ Memproses...' : payMethod === 'cash' ? `🔒 Bayar ${formatPrice(property.price)}` : `🔒 Bayar DP ${formatPrice(calcDP(property.price))}`}
                                            </button>
                                            <button className={styles.btnBack} onClick={() => setBuyStep(1)}>
                                                ← Kembali ke Survey
                                            </button>
                                        </>
                                    )}

                                    {/* Step 3: Success */}
                                    {buyStep === 3 && (
                                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                                            <h4 style={{ marginBottom: 8 }}>Booking Berhasil!</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                                Terima kasih! Tim kami akan menghubungi Anda untuk konfirmasi pembayaran.
                                            </p>
                                            <button className={styles.btnPrimary} style={{ marginTop: 16 }} onClick={() => { setBuyStep(1); setSurveySuccess(false); setSurveyDate(''); setSurveyNote(''); }}>
                                                🔄 Mulai Ulang
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* === RENT/BOTH: Rental === */}
                            {(property.type === 'rent' || property.type === 'both') && (
                                <div className={styles.actionCard} style={property.type === 'both' ? { marginTop: 20 } : {}}>
                                    <div className={styles.actionHeader}>
                                        <span className={styles.actionIcon}>🔑</span>
                                        <div>
                                            <h3>Sewa Properti</h3>
                                            <p className={styles.actionPrice}>{formatPrice(property.price)}<span>/bulan</span></p>
                                        </div>
                                    </div>

                                    {/* Period Selection */}
                                    <p className={styles.formLabel}>Periode Sewa</p>
                                    <div className={styles.periodOptions}>
                                        <button className={`${styles.periodOption} ${rentPeriod === 'daily' ? styles.periodActive : ''}`} onClick={() => { setRentPeriod('daily'); setRentDuration(1); }}>
                                            <strong>Harian</strong>
                                            <p>{formatPrice(Math.round(property.price / 30))}/hari</p>
                                        </button>
                                        <button className={`${styles.periodOption} ${rentPeriod === 'monthly' ? styles.periodActive : ''}`} onClick={() => { setRentPeriod('monthly'); setRentDuration(1); }}>
                                            <strong>Bulanan</strong>
                                            <p>{formatPrice(property.price)}/bln</p>
                                        </button>
                                        <button className={`${styles.periodOption} ${rentPeriod === 'yearly' ? styles.periodActive : ''}`} onClick={() => { setRentPeriod('yearly'); setRentDuration(1); }}>
                                            <strong>Tahunan</strong>
                                            <p>{formatPrice(Math.round(property.price * 12 * 0.9))}/thn</p>
                                        </button>
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>📅 Mulai</label>
                                            <input type="date" className={styles.formInput} min={new Date().toISOString().split('T')[0]} value={rentStart} onChange={(e) => setRentStart(e.target.value)} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>⏱️ Durasi</label>
                                            <select className={styles.formInput} value={rentDuration} onChange={(e) => setRentDuration(Number(e.target.value))}>
                                                {durationOptions.map(d => (
                                                    <option key={d} value={d}>{d} {periodLabel[rentPeriod]}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Pricing Summary */}
                                    <div className={styles.priceSummary}>
                                        <div className={styles.priceLineItem}>
                                            <span>Harga per {periodLabel[rentPeriod]}</span>
                                            <strong>{formatPrice(rentPrice)}</strong>
                                        </div>
                                        <div className={styles.priceLineItem}>
                                            <span>Durasi</span>
                                            <strong>{rentDuration} {periodLabel[rentPeriod]}</strong>
                                        </div>
                                        {rentPeriod === 'yearly' && (
                                            <div className={styles.priceLineItem}>
                                                <span>Diskon tahunan</span>
                                                <strong style={{ color: '#4caf50' }}>-10%</strong>
                                            </div>
                                        )}
                                        <div className={`${styles.priceLineItem} ${styles.priceTotal}`}>
                                            <span>Total</span>
                                            <strong>{formatPrice(rentTotal)}</strong>
                                        </div>
                                    </div>

                                    <button className={styles.btnPrimary} onClick={handleRentalPayment} disabled={isProcessing || !rentStart}>
                                        {isProcessing ? '⏳ Memproses...' : `🔑 Sewa ${rentDuration} ${periodLabel[rentPeriod]}`}
                                    </button>

                                    {rentPeriod !== 'daily' && (
                                        <div className={styles.rentalNote}>
                                            <p>⚠️ Untuk sewa <strong>{rentPeriod === 'monthly' ? 'bulanan' : 'tahunan'}</strong>, keterlambatan pembayaran dikenakan denda 2%/hari (maks 20%).</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </main>
            <Footer />
            <ChatBot />

            {/* Lightbox */}
            {lightbox && (
                <div className={styles.lightbox} onClick={() => setLightbox(null)}>
                    <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
                    <img src={lightbox} alt="Design" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </LiveChatProvider></AuthProvider>
    );
}
