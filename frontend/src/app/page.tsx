'use client';
import { AuthProvider } from '@/lib/auth';
import { LiveChatProvider } from '@/lib/livechat';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatBot from '@/components/layout/ChatBot';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import FacilitiesGrid from '@/components/home/FacilitiesGrid';
import StatsCounter from '@/components/home/StatsCounter';
import CTASection from '@/components/home/CTASection';

export default function Home() {
  return (
    <AuthProvider>
      <LiveChatProvider>
        <Navbar />
        <main>
          <HeroSection />
          <StatsCounter />
          <FeaturedProperties />
          <FacilitiesGrid />
          <CTASection />
        </main>
        <Footer />
        <ChatBot />
      </LiveChatProvider>
    </AuthProvider>
  );
}


