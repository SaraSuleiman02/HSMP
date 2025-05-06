import React from 'react'
import MasterLayout from '../masterLayout/MasterLayout'
import Breadcrumb from '../components/Breadcrumb'
import ProfessionalLayer from '../components/ProfessionalLayer';

function ProfessionalPage() {
    return (
        <>
            {/* MasterLayout */}
            <MasterLayout>

                {/* Breadcrumb */}
                <Breadcrumb title="Professionals" />

                <ProfessionalLayer />

            </MasterLayout>
        </>
    );
}

export default ProfessionalPage;