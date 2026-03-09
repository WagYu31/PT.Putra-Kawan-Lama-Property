'use client';
import { useEffect, useState, useRef } from 'react';
import styles from './StatsCounter.module.css';

const stats = [
    { value: 500, suffix: '+', label: 'Properti Terdaftar', icon: '🏠' },
    { value: 1200, suffix: '+', label: 'Klien Terlayani', icon: '👥' },
    { value: 15, suffix: '+', label: 'Kota Besar', icon: '📍' },
    { value: 98, suffix: '%', label: 'Kepuasan Klien', icon: '⭐' },
];

function useCountUp(target: number, isVisible: boolean) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!isVisible) return;
        let start = 0;
        const duration = 2000;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [isVisible, target]);
    return count;
}

export default function StatsCounter() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className={styles.stats} ref={ref}>
            <div className={`container ${styles.statsGrid}`}>
                {stats.map((stat, i) => (
                    <StatItem key={i} stat={stat} isVisible={isVisible} delay={i * 100} />
                ))}
            </div>
        </section>
    );
}

function StatItem({ stat, isVisible, delay }: { stat: typeof stats[0]; isVisible: boolean; delay: number }) {
    const count = useCountUp(stat.value, isVisible);
    return (
        <div className={styles.statItem} style={{ animationDelay: `${delay}ms` }}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <span className={styles.statValue}>
                {count.toLocaleString()}{stat.suffix}
            </span>
            <span className={styles.statLabel}>{stat.label}</span>
        </div>
    );
}
