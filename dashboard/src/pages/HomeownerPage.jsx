import React from 'react'
import MasterLayout from '../masterLayout/MasterLayout'
import Breadcrumb from '../components/Breadcrumb'
import HomeownerLayer from '../components/HomeownerLayer'

function HomeownerPage() {
    return (
        <>
            {/* MasterLayout */}
            <MasterLayout>

                {/* Breadcrumb */}
                <Breadcrumb title="Home Owners" />

                <HomeownerLayer />

            </MasterLayout>
        </>
    );
}

export default HomeownerPage;