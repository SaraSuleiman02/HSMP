import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Icon } from '@iconify/react/dist/iconify.js';
import axiosInstance from '../../axiosConfig';

const EarningStaticOne = () => {
    const [paidProfessionalsCount, setPaidProfessionalsCount] = useState(0);
    const [chartSeries, setChartSeries] = useState([
        {
            name: "Subscription",
            data: [], // Initialize with empty data
        },
    ]);

    // Define chart options
    const barChartOptionsTwo = {
        chart: {
            type: "bar",
            height: 310,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: "23%",
                endingShape: "rounded",
            },
        },
        dataLabels: {
            enabled: false,
        },
        fill: {
            type: "gradient",
            colors: ["#487FFF"], // Set the starting color (top color) here
            gradient: {
                shade: "light", // Gradient shading type
                type: "vertical", // Gradient direction (vertical)
                shadeIntensity: 0.5, // Intensity of the gradient shading
                gradientToColors: ["#487FFF"], // Bottom gradient color (with transparency)
                inverseColors: false, // Do not invert colors
                opacityFrom: 1, // Starting opacity
                opacityTo: 1, // Ending opacity
                stops: [0, 100],
            },
        },
        grid: {
            show: true,
            borderColor: "#D1D5DB",
            strokeDashArray: 4, // Use a number for dashed style
            position: "back",
        },
        xaxis: {
            type: "category",
            categories: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ],
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    // Ensure value is treated as a number
                    const numericValue = Number(value);
                    if (isNaN(numericValue)) {
                        return "0 JD"; // Handle cases where value might not be a number
                    }
                    // Display the full JD amount
                    return numericValue.toFixed(0) + " JD";
                },
            },
            // set Y-axis ticks to increment by 10
            tickAmount: undefined,
            min: 0,
        },
        tooltip: {
            y: {
                formatter: function (value) {
                     // Ensure value is treated as a number
                    const numericValue = Number(value);
                    if (isNaN(numericValue)) {
                        return "0 JD"; // Handle cases where value might not be a number
                    }
                    // Display the full JD amount in the tooltip
                    return numericValue.toFixed(0) + " JD";
                },
            },
        },
    };

    useEffect(() => {
        const fetchProfessional = async () => {
            try {
                const response = await axiosInstance.get('/user');
                // Filter for professionals who have paid
                const paidProfessionals = response.data.filter(user => user.role === 'professional' && user.professionalPaid === true);
                setPaidProfessionalsCount(paidProfessionals.length); // Store the count for profit display

                // Aggregate earnings by month
                const monthlyEarnings = {
                    Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
                    Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
                };
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                paidProfessionals.forEach(prof => {
                    if (prof.createdAt) {
                        try {
                            // Ensure the date is parsed correctly
                            const date = new Date(prof.createdAt);
                            // Check if the date is valid before proceeding
                            if (isNaN(date.getTime())) {
                                console.error('Invalid date format for professional:', prof._id, prof.createdAt);
                                return; // Skip this professional if date is invalid
                            }
                            const monthIndex = date.getMonth(); // 0 = Jan, 1 = Feb, etc.
                            const monthName = monthNames[monthIndex];
                            if (monthName) {
                                // Each paid professional contributes 10 JD
                                monthlyEarnings[monthName] += 10;
                            }
                        } catch (dateError) {
                            console.error('Error parsing date for professional:', prof._id, prof.createdAt, dateError);
                        }
                    }
                });

                // Format data for ApexCharts
                const chartData = monthNames.map(month => ({
                    x: month,
                    y: monthlyEarnings[month],
                }));

                // Update chart series state
                setChartSeries([
                    {
                        name: "Subscription",
                        data: chartData,
                    },
                ]);

            } catch (error) {
                console.error('Error fetching or processing professionals data:', error);
            }
        };
        fetchProfessional();
    }, []); // Empty dependency array ensures this runs once on mount

    // Calculate max Y value for dynamic tickAmount setting
    const maxYValue = chartSeries[0].data.reduce((max, item) => Math.max(max, item.y), 0);
    const calculatedTickAmount = maxYValue > 0 ? Math.max(2, Math.ceil(maxYValue / 10)) : 5; // Default to 5 ticks if no data

    // Create final options object including dynamic tickAmount
    const finalChartOptions = {
        ...barChartOptionsTwo,
        yaxis: {
            ...barChartOptionsTwo.yaxis,
            tickAmount: calculatedTickAmount,
            max: Math.ceil(maxYValue / 10) * 10
        }
    };


    return (
        <div className="col-xxl-8">
            <div className="card h-100 radius-8 border-0">
                <div className="card-body p-24">
                    <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
                        <div>
                            <h6 className="mb-2 fw-bold text-lg">Earning Statistic</h6>
                            <span className="text-sm fw-medium text-secondary-light">
                                Yearly earning overview
                            </span>
                        </div>
                    </div>
                    <div className="mt-20 d-flex justify-content-center flex-wrap gap-3">
                        <div className="d-inline-flex align-items-center gap-2 p-2 radius-8 border pe-36 br-hover-primary group-item">
                            <span className="bg-neutral-100 w-44-px h-44-px text-xxl radius-8 d-flex justify-content-center align-items-center text-secondary-light group-hover:bg-primary-600 group-hover:text-white">
                                <Icon icon="ph:arrow-fat-up-fill" className="icon" />
                            </span>
                            <div>
                                <span className="text-secondary-light text-sm fw-medium">
                                    Total Profit
                                </span>
                                {/* Use the stored count of paid professionals for total profit */}
                                <h6 className="text-md fw-semibold mb-0">
                                    {paidProfessionalsCount * 10} JD
                                </h6>
                            </div>
                        </div>
                    </div>
                    <div id="barChart" >
                        <ReactApexChart options={finalChartOptions} series={chartSeries} type="bar" height={310} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningStaticOne;

