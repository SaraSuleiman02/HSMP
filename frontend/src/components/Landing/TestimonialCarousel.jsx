import React from "react";
import { Carousel } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const testimonials = [
    {
        quote: "I booked a deep cleaning session through HSMP and was blown away by the professionalism. It felt like a hotel-level service, right at home!",
        name: "Layla Odeh",
        role: "Homeowner, Irbid",
    },
    {
        quote: "HSMP has completely transformed how I find work. I no longer chase clients — they come to me through the platform. It’s easy, fair, and secure.",
        name: "Ahmad Nasser",
        role: "Electrician, Amman",
    },
    {
        quote: "I found a skilled plumber through HSMP who arrived quickly and fixed everything perfectly. The whole process was smooth, reliable, and stress-free.",
        name: "Rania Al-Majali",
        role: "Homeowner, Amman",
    },
];

const TestimonialCarousel = () => {
    return (
        <div className="padding-medium" data-aos="fade-down"
            data-aos-easing="linear"
            data-aos-duration="1400">
            <h3 className="text-center mb-4 text-black">What Our Users Say</h3>
            <div className="position-relative">
                <Carousel
                    interval={6000}
                    pause={false}
                    indicators={false}
                    controls={true}
                    className="testimonial-carousel"
                >
                    {testimonials.map((testimonial, idx) => (
                        <Carousel.Item key={idx}>
                            <div className="card shadow p-4 border-0 mx-auto">
                                <div className="d-flex flex-column justify-content-around align-items-center text-center text-black testimonial-card">
                                    <blockquote className="mb-4">
                                        <p className="mb-0">{testimonial.quote}</p>
                                    </blockquote>
                                    <div>
                                        <h5 className="mb-0">{testimonial.name}</h5>
                                        <small className="text-muted">{testimonial.role}</small>
                                    </div>
                                </div>
                            </div>
                        </Carousel.Item>
                    ))}
                </Carousel>
                <div className="carousel-indicators custom-indicators justify-content-center mt-4">
                    {testimonials.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            data-bs-target=".testimonial-carousel"
                            data-bs-slide-to={idx}
                            className={idx === 0 ? "active" : ""}
                            aria-current={idx === 0 ? "true" : undefined}
                            aria-label={`Slide ${idx + 1}`}
                        ></button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestimonialCarousel;