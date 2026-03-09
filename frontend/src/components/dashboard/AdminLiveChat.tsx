'use client';
import { useState, useRef, useEffect } from 'react';
import { useLiveChat } from '@/lib/livechat';
import styles from './AdminLiveChat.module.css';

export default function AdminLiveChat() {
    const {
        sessions,
        activeSessionId,
        setActiveSession,
        adminMessages,
        sendAdminMessage,
        closeSession,
        totalUnread,
    } = useLiveChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeSessions = sessions.filter(s => s.status !== 'closed');
    const closedSessions = sessions.filter(s => s.status === 'closed');
    const activeSession = sessions.find(s => s.id === activeSessionId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [adminMessages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeSessionId) return;
        sendAdminMessage(activeSessionId, input.trim(), 'Admin PKWL');
        setInput('');
    };

    const formatTime = (ts: number) =>
        new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div className={styles.liveChatPanel}>
            {/* Session List */}
            <div className={styles.sessionList}>
                <div className={styles.sessionListHeader}>
                    <h3>Live Chat</h3>
                    {totalUnread > 0 && <span className={styles.unreadBadge}>{totalUnread}</span>}
                </div>

                {activeSessions.length === 0 && closedSessions.length === 0 && (
                    <div className={styles.emptyList}>
                        <span>💬</span>
                        <p>Belum ada percakapan masuk</p>
                        <small>Percakapan dari customer akan muncul di sini</small>
                    </div>
                )}

                {activeSessions.length > 0 && (
                    <div className={styles.sessionGroup}>
                        <span className={styles.groupLabel}>Aktif ({activeSessions.length})</span>
                        {activeSessions.map(s => (
                            <button
                                key={s.id}
                                className={`${styles.sessionItem} ${activeSessionId === s.id ? styles.active : ''} ${s.status === 'waiting' ? styles.waiting : ''}`}
                                onClick={() => setActiveSession(s.id)}
                            >
                                <div className={styles.sessionAvatar}>{s.customerName.charAt(0)}</div>
                                <div className={styles.sessionInfo}>
                                    <div className={styles.sessionTop}>
                                        <span className={styles.sessionName}>{s.customerName}</span>
                                        <span className={styles.sessionTime}>{formatTime(s.lastMessageAt)}</span>
                                    </div>
                                    <p className={styles.sessionPreview}>{s.lastMessage}</p>
                                </div>
                                {s.unreadCount > 0 && <span className={styles.sessionUnread}>{s.unreadCount}</span>}
                                {s.status === 'waiting' && <span className={styles.waitingDot}></span>}
                            </button>
                        ))}
                    </div>
                )}

                {closedSessions.length > 0 && (
                    <div className={styles.sessionGroup}>
                        <span className={styles.groupLabel}>Selesai ({closedSessions.length})</span>
                        {closedSessions.slice(0, 5).map(s => (
                            <button
                                key={s.id}
                                className={`${styles.sessionItem} ${styles.closed} ${activeSessionId === s.id ? styles.active : ''}`}
                                onClick={() => setActiveSession(s.id)}
                            >
                                <div className={styles.sessionAvatar}>{s.customerName.charAt(0)}</div>
                                <div className={styles.sessionInfo}>
                                    <div className={styles.sessionTop}>
                                        <span className={styles.sessionName}>{s.customerName}</span>
                                    </div>
                                    <p className={styles.sessionPreview}>{s.lastMessage}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Panel */}
            <div className={styles.chatPanel}>
                {!activeSession ? (
                    <div className={styles.emptyChatPanel}>
                        <div className={styles.emptyChatIcon}>💬</div>
                        <h3>Pilih Percakapan</h3>
                        <p>Pilih percakapan dari daftar di sebelah kiri untuk mulai merespons</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className={styles.chatPanelHeader}>
                            <div className={styles.chatPanelInfo}>
                                <div className={styles.chatAvatar}>{activeSession.customerName.charAt(0)}</div>
                                <div>
                                    <h4>{activeSession.customerName}</h4>
                                    <span>
                                        {activeSession.customerEmail || 'Guest'} · Mulai {formatDate(activeSession.startedAt)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.chatPanelActions}>
                                {activeSession.status !== 'closed' && (
                                    <button
                                        className={styles.closeSessionBtn}
                                        onClick={() => closeSession(activeSession.id)}
                                    >
                                        Tutup Chat
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className={styles.chatPanelMessages}>
                            {activeSession.status === 'waiting' && (
                                <div className={styles.systemMessage}>
                                    <span>⏳ Customer menunggu respons Anda. Kirim pesan untuk terhubung!</span>
                                </div>
                            )}

                            {adminMessages.map(msg => (
                                <div key={msg.id} className={`${styles.msg} ${msg.sender === 'admin' ? styles.msgAdmin : styles.msgCustomer}`}>
                                    <div className={styles.msgBubble}>
                                        {msg.sender === 'customer' && (
                                            <div className={styles.msgSender}>{msg.senderName}</div>
                                        )}
                                        <div className={styles.msgContent}>{msg.text}</div>
                                        <span className={styles.msgTimestamp}>{formatTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            ))}

                            {activeSession.status === 'closed' && (
                                <div className={styles.systemMessage}>
                                    <span>✅ Percakapan ini telah ditutup</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        {activeSession.status !== 'closed' && (
                            <form className={styles.chatPanelInput} onSubmit={handleSend}>
                                <input
                                    type="text"
                                    placeholder="Ketik balasan untuk customer..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    autoComplete="off"
                                />
                                <button type="submit" disabled={!input.trim()}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                    Kirim
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
