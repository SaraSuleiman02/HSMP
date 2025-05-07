import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosConfig';

const UnitCountSeven = () => {
    const [homeOwner, setHomeOwnerCount] = useState(0);
    const [professional, setProfessionalCount] = useState(0);
    const [project, setProjectCount] = useState(0);
    const [review, setReviewCount] = useState(0);
    const [loading, setLoading] = useState(false);
    

    useEffect(() => {
        const fetchHomeOwner = async () => {
            try {
                const response = await axiosInstance.get('/user');
                const homeownersOnly = response.data.filter(user => user.role === 'homeowner');
                setHomeOwnerCount(homeownersOnly.length);
            } catch (error) {
                console.error('Error fetching home owners count:', error);
            }
        };

        const fetchProfessional = async () => {
            try {
                const response = await axiosInstance.get('/user');
                const profssionalsOnly = response.data.filter(user => user.role === 'professional');
                setProfessionalCount(profssionalsOnly.length);
            } catch (error) {
                console.error('Error fetching professionals count:', error);
            }
        };

        const fetchProject = async () => {
            try {
                const response = await axiosInstance.get('/project');
                setProjectCount(response.data.length);
            } catch (error) {
                console.error('Error fetching professionals count:', error);
            }
        };

        const fetchReview = async () => {
            try {
                const response = await axiosInstance.get('/review');
                setReviewCount(response.data.length);
            } catch (error) {
                console.error('Error fetching reviews count:', error);
            }
        };

        fetchHomeOwner();
        fetchProfessional();
        fetchProject();
        fetchReview();
    }, []);

    return (
        <>
            <div className='col-12'>
                <div className='card radius-12'>
                    <div className='card-body p-16'>
                        <div className='row gy-4'>
                            <div className='col-xxl-3 col-xl-4 col-sm-6'>
                                <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-1 left-line line-bg-primary position-relative overflow-hidden'>
                                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                                        <div>
                                            <span className='mb-2 fw-medium text-secondary-light text-md'>
                                                Home Owners
                                            </span>
                                            <h6 className='fw-semibold mb-1'>
                                                {loading ? (
                                                    <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
                                                ) : (
                                                    homeOwner
                                                )}
                                            </h6>
                                        </div>
                                        <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-primary-100 text-primary-600'>
                                            <i className='ri-user-settings-line' />
                                        </span>
                                    </div>
                                    <p className='text-sm mb-0'>
                                        Total Home Owners{" "}
                                    </p>
                                </div>
                            </div>
                            <div className='col-xxl-3 col-xl-4 col-sm-6'>
                                <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-2 left-line line-bg-lilac position-relative overflow-hidden'>
                                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                                        <div>
                                            <span className='mb-2 fw-medium text-secondary-light text-md'>
                                                Professionals
                                            </span>
                                            <h6 className='fw-semibold mb-1'>
                                                {loading ? (
                                                    <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
                                                ) : (
                                                    professional
                                                )}
                                            </h6>
                                        </div>
                                        <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-lilac-200 text-lilac-600'>
                                            <i className='ri-brush-fill' />
                                        </span>
                                    </div>
                                    <p className='text-sm mb-0'>
                                        Total Professionals{" "}
                                    </p>
                                </div>
                            </div>
                            <div className='col-xxl-3 col-xl-4 col-sm-6'>
                                <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-3 left-line line-bg-success position-relative overflow-hidden'>
                                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                                        <div>
                                            <span className='mb-2 fw-medium text-secondary-light text-md'>
                                                Projects
                                            </span>
                                            <h6 className='fw-semibold mb-1'>
                                                {loading ? (
                                                    <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
                                                ) : (
                                                    project
                                                )}
                                            </h6>
                                        </div>
                                        <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-success-200 text-success-600'>
                                            <i className='ri-tools-fill' />
                                        </span>
                                    </div>
                                    <p className='text-sm mb-0'>
                                        Total Projects{" "}
                                    </p>
                                </div>
                            </div>
                            <div className='col-xxl-3 col-xl-4 col-sm-6'>
                                <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-4 left-line line-bg-warning position-relative overflow-hidden'>
                                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                                        <div>
                                            <span className='mb-2 fw-medium text-secondary-light text-md'>
                                                Reviews
                                            </span>
                                            <h6 className='fw-semibold mb-1'>
                                                {loading ? (
                                                    <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
                                                ) : (
                                                    review
                                                )}
                                            </h6>
                                        </div>
                                        <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-warning-focus text-warning-600'>
                                            <i className='ri-error-warning-fill' />
                                        </span>
                                    </div>
                                    <p className='text-sm mb-0'>
                                        Total Reviews{" "}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UnitCountSeven;
