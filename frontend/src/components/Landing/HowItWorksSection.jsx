import React from "react";
import { Icon } from '@iconify/react';
import familyImage from '../../images/family.png';

function HowItWorksSection() {
    return (
        <>
            <div className="padding-meduim" id="how-it-works" style={{ marginBottom: "70px" }}>
                <h3 style={{ marginBottom: "20px", marginLeft:"60px"
                 }}>How It works</h3>
                <div className="d-flex gap-5 justify-content-center flex-wrap">
                    <div className="how-it-works-card">
                        <div className="how-it-works-card-icon">
                            <Icon icon="mdi:pencil" width="30" height="30" />
                        </div>
                        <h4>Write a Post</h4>
                        <p>Simply write a post with your location, a description, category, your budget and deadline!</p>
                    </div>

                    <div className="how-it-works-card">
                        <div className="how-it-works-card-icon">
                            <Icon icon="mdi:map-marker-radius-outline" width="30" height="30" />
                        </div>
                        <h4>Browse Local Experts</h4>
                        <p>Explore deatiled profiles, read customer reviews, and compare trusted professionals near you.</p>
                    </div>

                    <div className="how-it-works-card">
                        <div className="how-it-works-card-icon">
                            <Icon icon="mdi:account-plus" width="30" height="30" />
                        </div>
                        <h4>Hire Your Service</h4>
                        <p>Choose the professional who bid on your post and whose work you prefer.</p>
                    </div>

                    <div className="how-it-works-card">
                        <div className="how-it-works-card-icon">
                            <Icon icon="mdi:like-outline" width="30" height="30" />
                        </div>
                        <h4>Enjoy Your Day</h4>
                        <p>Sit back and relax while a qualified expert arrives to complete the job efficiently</p>
                    </div>
                </div>
            </div>

            <div className="padding-medium bg-gradient mx-5 mt-1 rounded-3 d-flex justify-content-between align-items-center">
                <div className="jordan-section d-flex flex-column flex-grow-1 px-3">
                    <h3>Jordan’s first home services platform</h3>
                    <p>where trust and reliability bring homeowners and professionals together.</p>
                    <a href="/login" className="button cta-button align-self-start mt-2">Get Started</a>
                </div>

                <div className="jordan-image-container">
                    <div className="jordan-image-underlay"></div>
                    <img src={familyImage} alt="Happy Family" className="jordan-main-image" />
                </div>
            </div>
        </>
    );
}

export default HowItWorksSection;