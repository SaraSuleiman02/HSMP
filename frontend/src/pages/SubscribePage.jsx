// src/pages/SubscribePage.jsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import axiosInstance from '../axiosConfig';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe('pk_test_51RSLPrCpt11BQaLBsPqP0C6WrPjL98wL55Hqdak35wvBDN1aW03uYUbNQuyxkT3r8acXyBa6JszHLTj1WywuyhGA00K6zeY32s');

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);

        try {
            const res = await axiosInstance.post('/user/professional-payment', {
                amount: 1410
            });

            const { clientSecret } = res.data;

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            });

            setLoading(false);

            if (result.error) {
                setMessage(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                setMessage('Subscription payment successful!');
                navigate('/feed');
            }
        } catch (error) {
            setLoading(false);
            if (error.response) {
                console.error('Backend returned error:', error.response.data);
                setMessage(error.response.data?.message || 'Payment initiation failed.');
            } else {
                console.error('Unexpected error:', error.message);
                setMessage('Something went wrong.');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="subscribe-form">
            <h2 className="subscribe-title">Professional Subscription</h2>
            <p className="subscribe-subtext">Professional Pays 10 JD as a subscription fee</p>

            <div className="subscribe-card-wrapper">
                <CardElement options={cardStyle} />
            </div>

            <button className="subscribe-button" type="submit" disabled={!stripe || loading}>
                {loading ? 'Processing....' : 'Pay 10 JD'}
            </button>

            {message && <p className="subscribe-message">{message}</p>}
        </form>
    );
};

const SubscribePage = () => {
    return (
        <div className="subscribe-page-wrapper">
            <Elements stripe={stripePromise}>
                <CheckoutForm />
            </Elements>
        </div>
    );
};

export default SubscribePage;

const cardStyle = {
    hidePostalCode: false,
    style: {
        base: {
            fontSize: '18px',
            color: '#32325d',
            fontFamily: 'Arial, sans-serif',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a',
        },
    },
};