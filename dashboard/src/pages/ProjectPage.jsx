import React from 'react'
import MasterLayout from '../masterLayout/MasterLayout'
import Breadcrumb from '../components/Breadcrumb'
import ProjectLayer from '../components/ProjectLayer.jsx'

function ProjectPage() {
    return (
        <>
            {/* MasterLayout */}
            <MasterLayout>

                {/* Breadcrumb */}
                <Breadcrumb title="Projects" />

                <ProjectLayer />

            </MasterLayout>
        </>
    );
}

export default ProjectPage;