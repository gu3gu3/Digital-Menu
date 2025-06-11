import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroSection from '../components/sections/HeroSection'
import ProblemsSection from '../components/sections/ProblemsSection'
import FeaturesSection from '../components/sections/FeaturesSection'
import DemoSection from '../components/sections/DemoSection'
import PricingSection from '../components/sections/PricingSection'
import RegisterSection from '../components/sections/RegisterSection'

const LandingPage = () => {
  return (
    <div className="min-h-screen">
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
  )
}

export default LandingPage 