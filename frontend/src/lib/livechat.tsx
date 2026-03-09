'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'customer' | 'admin';
    senderName: string;
    timestamp: number;
    sessionId: string;
}

export interface ChatSession {
    id: string;
    customerName: string;
    customerEmail: string;
    startedAt: number;
    lastMessage: string;
    lastMessageAt: number;
    unreadCount: number;
    status: 'waiting' | 'active' | 'closed';
}

interface LiveChatContextType {
    // Customer side
    startLiveChat: (name: string, email: string) => string;
    sendCustomerMessage: (sessionId: string, text: string) => void;
    customerMessages: ChatMessage[];
    isConnectedToAdmin: boolean;
    waitingForAdmin: boolean;
    // Admin side
    sessions: ChatSession[];
    activeSessionId: string | null;
    setActiveSession: (id: string) => void;
    adminMessages: ChatMessage[];
    sendAdminMessage: (sessionId: string, text: string, adminName: string) => void;
    closeSession: (sessionId: string) => void;
    totalUnread: number;
}

const LiveChatContext = createContext<LiveChatContextType | null>(null);

export function useLiveChat() {
    const ctx = useContext(LiveChatContext);
    if (!ctx) throw new Error('useLiveChat must be used within LiveChatProvider');
    return ctx;
}

const CHANNEL_NAME = 'pkwl-live-chat';
const STORAGE_SESSIONS_KEY = 'pkwl-chat-sessions';
const STORAGE_MESSAGES_KEY = 'pkwl-chat-messages';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage(key: string, data: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

export function LiveChatProvider({ children }: { children: React.ReactNode }) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
    const [activeSessionId, setActiveSession] = useState<string | null>(null);
    const [customerSessionId, setCustomerSessionId] = useState<string | null>(null);
    const [isConnectedToAdmin, setIsConnectedToAdmin] = useState(false);
    const [waitingForAdmin, setWaitingForAdmin] = useState(false);
    const channelRef = useRef<BroadcastChannel | null>(null);

    // Initialize from localStorage and BroadcastChannel
    useEffect(() => {
        setSessions(loadFromStorage(STORAGE_SESSIONS_KEY, []));
        setAllMessages(loadFromStorage(STORAGE_MESSAGES_KEY, []));

        try {
            channelRef.current = new BroadcastChannel(CHANNEL_NAME);
            channelRef.current.onmessage = (event) => {
                const { type, payload } = event.data;

                if (type === 'NEW_SESSION') {
                    setSessions(prev => {
                        const updated = [...prev.filter(s => s.id !== payload.id), payload];
                        saveToStorage(STORAGE_SESSIONS_KEY, updated);
                        return updated;
                    });
                }

                if (type === 'NEW_MESSAGE') {
                    setAllMessages(prev => {
                        const updated = [...prev, payload];
                        saveToStorage(STORAGE_MESSAGES_KEY, updated);
                        return updated;
                    });

                    // Update session's last message
                    setSessions(prev => {
                        const updated = prev.map(s =>
                            s.id === payload.sessionId
                                ? {
                                    ...s,
                                    lastMessage: payload.text,
                                    lastMessageAt: payload.timestamp,
                                    unreadCount: s.unreadCount + 1,
                                    status: 'active' as const,
                                }
                                : s
                        );
                        saveToStorage(STORAGE_SESSIONS_KEY, updated);
                        return updated;
                    });

                    // If admin responds to customer's session
                    if (payload.sender === 'admin' && payload.sessionId === customerSessionId) {
                        setIsConnectedToAdmin(true);
                        setWaitingForAdmin(false);
                    }
                }

                if (type === 'SESSION_CLOSED') {
                    setSessions(prev => {
                        const updated = prev.map(s =>
                            s.id === payload.sessionId ? { ...s, status: 'closed' as const } : s
                        );
                        saveToStorage(STORAGE_SESSIONS_KEY, updated);
                        return updated;
                    });
                }
            };
        } catch {
            // BroadcastChannel not supported, fallback to storage polling
        }

        return () => channelRef.current?.close();
    }, [customerSessionId]);

    // Storage event listener for cross-tab (fallback if BroadcastChannel not available)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_SESSIONS_KEY && e.newValue) {
                setSessions(JSON.parse(e.newValue));
            }
            if (e.key === STORAGE_MESSAGES_KEY && e.newValue) {
                setAllMessages(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const broadcast = useCallback((type: string, payload: unknown) => {
        channelRef.current?.postMessage({ type, payload });
    }, []);

    // Customer: start a live chat session
    const startLiveChat = useCallback((name: string, email: string): string => {
        const id = generateId();
        const session: ChatSession = {
            id,
            customerName: name || 'Pengunjung',
            customerEmail: email || '',
            startedAt: Date.now(),
            lastMessage: 'Memulai percakapan...',
            lastMessageAt: Date.now(),
            unreadCount: 1,
            status: 'waiting',
        };

        setSessions(prev => {
            const updated = [...prev, session];
            saveToStorage(STORAGE_SESSIONS_KEY, updated);
            return updated;
        });

        setCustomerSessionId(id);
        setWaitingForAdmin(true);
        setIsConnectedToAdmin(false);

        broadcast('NEW_SESSION', session);

        // Auto greeting message
        const greeting: ChatMessage = {
            id: generateId(),
            text: `Halo, saya ${name || 'Pengunjung'}. Saya butuh bantuan lebih lanjut.`,
            sender: 'customer',
            senderName: name || 'Pengunjung',
            timestamp: Date.now(),
            sessionId: id,
        };

        setAllMessages(prev => {
            const updated = [...prev, greeting];
            saveToStorage(STORAGE_MESSAGES_KEY, updated);
            return updated;
        });

        broadcast('NEW_MESSAGE', greeting);

        return id;
    }, [broadcast]);

    // Customer: send a message
    const sendCustomerMessage = useCallback((sessionId: string, text: string) => {
        const msg: ChatMessage = {
            id: generateId(),
            text,
            sender: 'customer',
            senderName: 'Pengunjung',
            timestamp: Date.now(),
            sessionId,
        };

        setAllMessages(prev => {
            const updated = [...prev, msg];
            saveToStorage(STORAGE_MESSAGES_KEY, updated);
            return updated;
        });

        setSessions(prev => {
            const updated = prev.map(s =>
                s.id === sessionId ? { ...s, lastMessage: text, lastMessageAt: Date.now() } : s
            );
            saveToStorage(STORAGE_SESSIONS_KEY, updated);
            return updated;
        });

        broadcast('NEW_MESSAGE', msg);
    }, [broadcast]);

    // Admin: send a message
    const sendAdminMessage = useCallback((sessionId: string, text: string, adminName: string) => {
        const msg: ChatMessage = {
            id: generateId(),
            text,
            sender: 'admin',
            senderName: adminName,
            timestamp: Date.now(),
            sessionId,
        };

        setAllMessages(prev => {
            const updated = [...prev, msg];
            saveToStorage(STORAGE_MESSAGES_KEY, updated);
            return updated;
        });

        setSessions(prev => {
            const updated = prev.map(s =>
                s.id === sessionId
                    ? { ...s, lastMessage: text, lastMessageAt: Date.now(), status: 'active' as const, unreadCount: 0 }
                    : s
            );
            saveToStorage(STORAGE_SESSIONS_KEY, updated);
            return updated;
        });

        broadcast('NEW_MESSAGE', msg);
    }, [broadcast]);

    // Admin: close a session
    const closeSession = useCallback((sessionId: string) => {
        setSessions(prev => {
            const updated = prev.map(s =>
                s.id === sessionId ? { ...s, status: 'closed' as const } : s
            );
            saveToStorage(STORAGE_SESSIONS_KEY, updated);
            return updated;
        });
        broadcast('SESSION_CLOSED', { sessionId });
    }, [broadcast]);

    // Filter messages for views
    const customerMessages = allMessages.filter(m => m.sessionId === customerSessionId);
    const adminMessages = allMessages.filter(m => m.sessionId === activeSessionId);
    const totalUnread = sessions.reduce((sum, s) => sum + (s.status !== 'closed' ? s.unreadCount : 0), 0);

    return (
        <LiveChatContext.Provider
            value={{
                startLiveChat,
                sendCustomerMessage,
                customerMessages,
                isConnectedToAdmin,
                waitingForAdmin,
                sessions,
                activeSessionId,
                setActiveSession,
                adminMessages,
                sendAdminMessage,
                closeSession,
                totalUnread,
            }}
        >
            {children}
        </LiveChatContext.Provider>
    );
}
