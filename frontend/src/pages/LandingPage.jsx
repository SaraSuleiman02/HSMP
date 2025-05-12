import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import HeroSection from "../components/Landing/HeroSection";
import ServiceSection from "../components/Landing/ServiceSection.jsx";
import HowItWorksSection from "../components/Landing/HowItWorksSection.jsx";

function LandingPage() {
    return (
        <MasterLayout>
            <HeroSection />
            <ServiceSection />
            <HowItWorksSection />
        </MasterLayout>
    );
};

export default LandingPage;