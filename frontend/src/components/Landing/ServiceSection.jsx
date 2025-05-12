import React from "react";
import { Icon } from '@iconify/react';

function ServiceSection() {
    return (
        <div className="padding-large d-flex gap-5 justify-content-center flex-wrap" id="services" style={{ marginTop: "-50px"}}>
            <div className="service-card">
                <Icon icon="mdi-light:home" width="24" height="24" />
                <h4>Home Service</h4>
            </div>

            <div className="service-card">
                <Icon icon="mdi:flash-outline" width="24" height="24" />
                <h4>Electricity</h4>
            </div>

            <div className="service-card">
                <Icon icon="mdi:hammer-screwdriver" width="24" height="24" />
                <h4>Handcraft</h4>
            </div>

            <div className="service-card">
                <Icon icon="mdi:flash-outline" width="24" height="24" />
                <h4>Plumber</h4>
            </div>

            <div className="service-card">
                <Icon icon="mdi:account-wrench" width="24" height="24" />
                <h4>Mechanic</h4>
            </div>

            <div className="service-card">
                <Icon icon="mdi:flower" width="24" height="24" />
                <h4>Gardening</h4>
            </div>
        </div>
    );
}

export default ServiceSection;