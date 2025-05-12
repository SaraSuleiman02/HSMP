import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import HeroSection from "../components/Landing/HeroSection";
import ServiceSection from "../components/Landing/ServiceSection.jsx";
import HowItWorksSection from "../components/Landing/HowItWorksSection.jsx";
import TestimonialCarousel from "../components/Landing/TestimonialCarousel.jsx";

function LandingPage() {
    return (
        <MasterLayout>
            <HeroSection />
            <ServiceSection />
            <HowItWorksSection />
            <TestimonialCarousel />
        </MasterLayout>
    );
};

export default LandingPage;