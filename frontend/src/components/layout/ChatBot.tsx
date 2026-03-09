'use client';
import { useState, useRef, useEffect } from 'react';
import { useLiveChat } from '@/lib/livechat';
import styles from './ChatBot.module.css';

interface Message {
    id: number;
    text: string;
    sender: 'bot' | 'user';
    timestamp: Date;
    options?: string[];
}

const KNOWLEDGE_BASE: { keywords: string[]; answer: string }[] = [
    {
        keywords: ['harga', 'price', 'berapa', 'biaya', 'kisaran', 'range'],
        answer: 'Harga properti kami bervariasi:\n\n🏠 **Rumah**: Rp 2M - 15M+\n🏢 **Apartemen**: Rp 500jt - 5M (beli) / Rp 5jt - 50jt/bln (sewa)\n🏖️ **Villa**: Rp 3M - 10M+\n🏗️ **Tanah**: Rp 1M - 20M+ (tergantung lokasi)\n🏪 **Ruko**: Rp 2M - 8M\n\nUntuk harga spesifik, silakan cek halaman Properti atau tanyakan lebih detail!',
    },
    {
        keywords: ['lokasi', 'location', 'dimana', 'daerah', 'area', 'kota', 'wilayah'],
        answer: 'Properti kami tersedia di berbagai lokasi strategis:\n\n📍 **Jakarta** - Utara, Selatan, Barat, Timur, Pusat\n📍 **Tangerang & Tangerang Selatan** (BSD, Gading Serpong)\n📍 **Bogor** (Sentul, Puncak)\n📍 **Bekasi & Depok**\n📍 **Bandung**\n📍 **Bali**\n\nLokasi mana yang Anda minati?',
    },
    {
        keywords: ['sewa', 'rent', 'kontrak', 'bulanan', 'tahunan'],
        answer: 'Untuk **sewa properti**, kami menyediakan:\n\n📋 **Periode sewa**: Bulanan atau Tahunan\n💰 **Deposit**: Umumnya 1-3 bulan sewa\n📝 **Kontrak**: Minimal 6 bulan (negosiable)\n✅ **Termasuk**: Maintenance fee (tergantung unit)\n\n**Proses sewa:**\n1. Pilih properti → 2. Survey → 3. Negosiasi → 4. Kontrak → 5. Serah terima\n\nMau lihat properti sewaan? Kunjungi halaman Properti dan filter "Disewa"!',
    },
    {
        keywords: ['jual', 'beli', 'sell', 'buy', 'purchase', 'cicilan', 'kpr'],
        answer: 'Untuk **pembelian properti**:\n\n💳 **Metode pembayaran:**\n• Cash keras\n• Cash bertahap (6-24 bulan)\n• KPR (kami bantu proses)\n\n🏦 **Bank partner KPR**: BCA, Mandiri, BNI, BTN, dll\n📄 **Dokumen**: KTP, NPWP, slip gaji, rekening koran 3 bulan\n\n**Proses beli:**\n1. Pilih properti → 2. Booking fee → 3. Akad → 4. Serah terima kunci\n\nUntuk properti dijual, kunjungi halaman Properti > filter "Dijual"!',
    },
    {
        keywords: ['tipe', 'jenis', 'kategori', 'type', 'macam'],
        answer: 'Kami menyediakan berbagai **tipe properti**:\n\n🏠 **Rumah** - Cluster, townhouse, rumah mewah\n🏢 **Apartemen** - Studio, 1BR, 2BR, 3BR, penthouse\n🏖️ **Villa** - Bali style, modern, resort\n🏗️ **Tanah/Kavling** - Residensial & komersial\n🏪 **Ruko** - 2-4 lantai, strategis\n🏭 **Gudang** - Modern, industrial\n\nKategori mana yang menarik buat Anda?',
    },
    {
        keywords: ['fasilitas', 'facility', 'amenity', 'fitur', 'kolam', 'gym', 'pool'],
        answer: 'Fasilitas premium di properti kami:\n\n🏊 **Swimming Pool** - Infinity & lap pool\n🏋️ **Fitness Center** - Gym modern\n🌳 **Green Park** - Taman & jogging track\n🛡️ **Security 24/7** - CCTV & smart access\n🏫 **Edu Center** - Sekolah terdekat\n🛣️ **Akses Tol** - Dekat jalan tol\n🏥 **Healthcare** - RS & klinik\n🛒 **Mall** - Pusat perbelanjaan\n\nFasilitas bervariasi per properti. Cek detail di halaman masing-masing properti!',
    },
    {
        keywords: ['cara', 'proses', 'prosedur', 'step', 'langkah', 'bagaimana', 'gimana'],
        answer: 'Proses di **PKWL Property** sangat mudah:\n\n**Untuk Pembeli/Penyewa:**\n1. 🔍 Cari properti di website\n2. 📞 Hubungi kami untuk survey\n3. 🏠 Kunjungi & inspeksi properti\n4. 💰 Negosiasi harga\n5. 📝 Tanda tangan kontrak\n6. 🔑 Serah terima\n\n**Untuk Pemilik (listing):**\n1. 📝 Daftar sebagai Owner\n2. 📸 Upload foto & detail properti\n3. ✅ Tim kami verifikasi\n4. 🌐 Properti tampil di website\n\nAda yang bisa dibantu lebih lanjut?',
    },
    {
        keywords: ['dokumen', 'surat', 'sertifikat', 'shm', 'hgb', 'legal'],
        answer: 'Mengenai **dokumen & legalitas**:\n\n📜 **Jenis sertifikat:**\n• **SHM** (Sertifikat Hak Milik) - Paling kuat\n• **HGB** (Hak Guna Bangunan) - 30 tahun, bisa diperpanjang\n• **PPJB** (Perjanjian Pengikatan Jual Beli)\n• **AJB** (Akta Jual Beli)\n\n✅ Semua properti kami sudah **terverifikasi legalitasnya**.\n\nUntuk pertanyaan legal lebih detail, hubungi tim kami!',
    },
    {
        keywords: ['investasi', 'invest', 'roi', 'untung', 'profit', 'return'],
        answer: 'Tips **investasi properti** dari PKWL:\n\n📈 **Keuntungan investasi properti:**\n• Nilai terus naik (avg 10-15%/tahun)\n• Passive income dari sewa\n• Aset riil yang aman\n\n🎯 **Rekomendasi area investasi:**\n• PIK 2 & Golf Island (premium)\n• BSD City (growth area)\n• Sentul (nature living)\n\n💡 **Tips:** Beli sekarang, harga properti hanya akan naik!\n\nMau konsultasi investasi? Hubungi tim kami!',
    },
    {
        keywords: ['kontak', 'contact', 'telepon', 'telp', 'phone'],
        answer: 'Hubungi kami:\n\n📞 **Telepon**: +62 812-3456-7890\n📧 **Email**: info@putrakawanlama.com\n📍 **Kantor**: Jakarta, Indonesia\n🕒 **Jam kerja**: Senin-Sabtu, 08:00-17:00\n\nAtau langsung chat dengan admin di live chat ini! 👇',
    },
    {
        keywords: ['hello', 'halo', 'hai', 'hi', 'hey', 'pagi', 'siang', 'sore', 'malam', 'selamat'],
        answer: 'Halo! 👋 Selamat datang di **PKWL Property**!\n\nSaya adalah asisten virtual yang siap membantu Anda. Silakan tanyakan tentang:\n\n🏠 Tipe & kategori properti\n💰 Harga & pembayaran\n📍 Lokasi properti\n📋 Proses sewa/beli\n📜 Dokumen & legalitas\n📈 Tips investasi\n\nApa yang bisa saya bantu? 😊',
    },
];

const QUICK_OPTIONS = [
    'Harga properti?',
    'Lokasi tersedia?',
    'Cara sewa/beli?',
    'Tipe properti?',
    '👤 Chat dengan Admin',
];

function getBotResponse(input: string): { text: string; cannotAnswer: boolean } {
    const lower = input.toLowerCase().trim();

    for (const kb of KNOWLEDGE_BASE) {
        for (const keyword of kb.keywords) {
            if (lower.includes(keyword)) {
                return { text: kb.answer, cannotAnswer: false };
            }
        }
    }

    return {
        text: 'Maaf, saya belum bisa menjawab pertanyaan tersebut. 😅\n\nBeberapa topik yang bisa saya bantu:\n• Harga & tipe properti\n• Lokasi tersedia\n• Proses sewa/beli\n• Fasilitas & dokumen\n• Investasi properti\n\nAtau Anda bisa **chat langsung dengan admin** kami untuk bantuan lebih lanjut!',
        cannotAnswer: true,
    };
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'bot' | 'livechat'>('bot');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: 'Halo! 👋 Saya **PKWL Bot**, asisten virtual Anda.\n\nSaya bisa membantu menjawab pertanyaan tentang properti. Silakan ketik pertanyaan atau pilih topik di bawah!',
            sender: 'bot',
            timestamp: new Date(),
            options: QUICK_OPTIONS,
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [showNameForm, setShowNameForm] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        startLiveChat,
        sendCustomerMessage,
        customerMessages,
        isConnectedToAdmin,
        waitingForAdmin,
    } = useLiveChat();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, customerMessages]);

    // BOT mode: send message
    const sendBotMessage = (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: messages.length + 1,
            text: text.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const response = getBotResponse(text);
            const botMsg: Message = {
                id: messages.length + 2,
                text: response.text,
                sender: 'bot',
                timestamp: new Date(),
                options: response.cannotAnswer ? ['👤 Chat dengan Admin', ...QUICK_OPTIONS.slice(0, 3)] : undefined,
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 800 + Math.random() * 700);
    };

    // Start live chat session
    const handleStartLiveChat = () => {
        if (!guestName.trim()) return;
        const sessionId = startLiveChat(guestName, guestEmail);
        setLiveSessionId(sessionId);
        setMode('livechat');
        setShowNameForm(false);
    };

    // LIVE CHAT: send message
    const sendLiveChatMessage = () => {
        if (!input.trim() || !liveSessionId) return;
        sendCustomerMessage(liveSessionId, input.trim());
        setInput('');
    };

    const handleOptionClick = (option: string) => {
        if (option === '👤 Chat dengan Admin') {
            setShowNameForm(true);
            return;
        }
        sendBotMessage(option);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'livechat') {
            sendLiveChatMessage();
        } else {
            sendBotMessage(input);
        }
    };

    const handleBackToBot = () => {
        setMode('bot');
        setLiveSessionId(null);
        setShowNameForm(false);
    };

    const formatMessage = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                className={`${styles.toggleBtn} ${isOpen ? styles.hidden : ''}`}
                onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 300); }}
                aria-label="Buka Live Chat"
            >
                <div className={styles.toggleInner}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                    </svg>
                </div>
                <span className={styles.toggleLabel}>Chat</span>
                <span className={styles.pulse}></span>
            </button>

            {/* Chat Window */}
            <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
                {/* Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerInfo}>
                        {mode === 'livechat' && (
                            <button className={styles.backBtn} onClick={handleBackToBot}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        <div className={styles.botAvatar}>
                            {mode === 'bot' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                    <circle cx="12" cy="5" r="4" />
                                    <path d="M9 15h.01M15 15h.01" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h4>{mode === 'bot' ? 'PKWL Bot' : 'Live Chat Admin'}</h4>
                            <span className={styles.status}>
                                <span className={`${styles.statusDot} ${mode === 'livechat' && waitingForAdmin ? styles.waiting : ''}`}></span>
                                {mode === 'bot' ? 'Online' : waitingForAdmin ? 'Menunggu admin...' : isConnectedToAdmin ? 'Admin terhubung' : 'Online'}
                            </span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Tutup chat">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Name Form (before live chat) */}
                {showNameForm && mode === 'bot' && (
                    <div className={styles.nameForm}>
                        <div className={styles.nameFormInner}>
                            <div className={styles.nameFormIcon}>👤</div>
                            <h3>Chat dengan Admin</h3>
                            <p>Masukkan nama Anda untuk memulai percakapan dengan tim kami</p>
                            <div className={styles.nameFormFields}>
                                <input
                                    type="text"
                                    placeholder="Nama Anda *"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email (opsional)"
                                    value={guestEmail}
                                    onChange={e => setGuestEmail(e.target.value)}
                                />
                                <button
                                    onClick={handleStartLiveChat}
                                    disabled={!guestName.trim()}
                                    className={styles.startChatBtn}
                                >
                                    Mulai Chat
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                </button>
                            </div>
                            <button className={styles.cancelBtn} onClick={() => setShowNameForm(false)}>
                                Kembali ke Bot
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                {!showNameForm && (
                    <>
                        <div className={styles.chatMessages}>
                            {mode === 'bot' ? (
                                <>
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                                            {msg.sender === 'bot' && <div className={styles.msgAvatar}>🤖</div>}
                                            <div className={styles.msgBubble}>
                                                <div className={styles.msgText} dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                                                <span className={styles.msgTime}>
                                                    {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {msg.options && (
                                                <div className={styles.options}>
                                                    {msg.options.map((opt, i) => (
                                                        <button
                                                            key={i}
                                                            className={`${styles.optionBtn} ${opt.includes('Admin') ? styles.adminOption : ''}`}
                                                            onClick={() => handleOptionClick(opt)}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className={`${styles.message} ${styles.bot}`}>
                                            <div className={styles.msgAvatar}>🤖</div>
                                            <div className={styles.typing}><span></span><span></span><span></span></div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Live chat mode */}
                                    <div className={styles.liveChatBanner}>
                                        <span>🔴</span>
                                        <p>Anda terhubung ke <strong>Live Chat</strong>. {waitingForAdmin ? 'Menunggu admin bergabung...' : 'Admin siap membantu!'}</p>
                                    </div>

                                    {customerMessages.map(msg => (
                                        <div key={msg.id} className={`${styles.message} ${msg.sender === 'customer' ? styles.user : styles.bot}`}>
                                            {msg.sender === 'admin' && <div className={styles.msgAvatar}>👨‍💼</div>}
                                            <div className={styles.msgBubble}>
                                                {msg.sender === 'admin' && <div className={styles.senderName}>{msg.senderName}</div>}
                                                <div className={styles.msgText}>{msg.text}</div>
                                                <span className={styles.msgTime}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {waitingForAdmin && customerMessages.length > 0 && (
                                        <div className={`${styles.message} ${styles.bot}`}>
                                            <div className={styles.msgAvatar}>⏳</div>
                                            <div className={styles.waitingBubble}>
                                                <div className={styles.typing}><span></span><span></span><span></span></div>
                                                <p>Menunggu admin merespons...</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form className={styles.chatInput} onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={mode === 'bot' ? 'Ketik pertanyaan Anda...' : 'Ketik pesan ke admin...'}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                autoComplete="off"
                            />
                            <button type="submit" disabled={!input.trim()} aria-label="Kirim">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </form>
                    </>
                )}
            </div>
        </>
    );
}
