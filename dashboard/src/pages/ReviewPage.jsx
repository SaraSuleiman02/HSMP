import React from 'react'
import MasterLayout from '../masterLayout/MasterLayout'
import Breadcrumb from '../components/Breadcrumb'
import ReviewLayer from '../components/ReviewLayer.jsx'

function ReviewPage() {
    return (
        <>
            {/* MasterLayout */}
            <MasterLayout>

                {/* Breadcrumb */}
                <Breadcrumb title="Reviews" />

                <ReviewLayer />

            </MasterLayout>
        </>
    );
}

export default ReviewPage;