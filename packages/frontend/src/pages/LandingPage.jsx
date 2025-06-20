import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import DemoSection from '../components/sections/DemoSection';
import ProblemsSection from '../components/sections/ProblemsSection';
import PricingSection from '../components/sections/PricingSection';
import RegisterSection from '../components/sections/RegisterSection';

const LandingPage = () => {
  useEffect(() => {
    const originalTitle = 'menuView.app | La Revolución de los Menús QR';
    const comeBackTitle = '¡Hey, vuelve! 👀 Tu menú te espera...';

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = comeBackTitle;
      } else {
        document.title = originalTitle;
      }
    };

    document.title = originalTitle;
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = originalTitle; // Reset title on component unmount
    };
  }, []);

  return (
    <div className="bg-white">
      <Header />
      <main>
        <HeroSection />
        <ProblemsSection />
        <FeaturesSection />
        <DemoSection />
        <PricingSection />
        <RegisterSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage; 