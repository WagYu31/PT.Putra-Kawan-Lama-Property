'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId() {
    if (typeof window === 'undefined') return '';
    let sid = sessionStorage.getItem('pkwl_sid');
    if (!sid) {
        sid = crypto.randomUUID();
        sessionStorage.setItem('pkwl_sid', sid);
    }
    return sid;
}

export default function PageTracker() {
    const pathname = usePathname();

    useEffect(() => {
        const sid = getSessionId();
        if (!sid) return;
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
        fetch(`${API}/api/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sid,
                page_path: pathname,
                referrer: document.referrer || '',
            }),
        }).catch(() => { /* silently fail */ });
    }, [pathname]);

    return null;
}
