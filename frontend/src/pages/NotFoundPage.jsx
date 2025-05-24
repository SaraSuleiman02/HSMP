import React from 'react';
import MasterLayout from '../masterLayout/MasterLayout';
import NotFoundImg from '../images/404-construction.png';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <MasterLayout>
            <div className="not-found-container">
                <div className="not-found-content">
                    <div className="not-found-image">
                        <img
                            src={NotFoundImg}
                            alt="404 - Page Not Found"
                            className="error-image"
                        />
                    </div>
                    <h2 className="not-found-message">
                        Oops! You are not authorized or the page doesn't exist
                    </h2>
                    <button
                        className="home-button"
                        onClick={handleGoHome}
                    >
                        Go Back Home
                    </button>
                </div>
            </div>
        </MasterLayout>
    );
};

export default NotFoundPage;
