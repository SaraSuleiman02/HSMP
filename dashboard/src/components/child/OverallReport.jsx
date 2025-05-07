import React, { useEffect, useState } from "react";
import useReactApexChart from "../../hook/useReactApexChart";
import ReactApexChart from "react-apexcharts";
import axiosInstance from "../../axiosConfig";

const OverallReport = () => {
  const [professionals, setProfessionals] = useState([]);
  const [homeOwners, setHomeOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const fetchHomeOwner = async () => {
        try {
          const response = await axiosInstance.get('/user');
          const homeownersOnly = response.data.filter(user => user.role === 'homeowner');
          setHomeOwners(homeownersOnly);
        } catch (error) {
          console.error('Error fetching home owners count:', error);
        }
      };

      const fetchProfessional = async () => {
        try {
          const response = await axiosInstance.get('/user');
          const profssionalsOnly = response.data.filter(user => user.role === 'professional');
          setProfessionals(profssionalsOnly);
        } catch (error) {
          console.error('Error fetching professionals count:', error);
        }
      };
      fetchHomeOwner();
      fetchProfessional();
    } catch (error) {
      console.error('Error fetching usres:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const totalUsers = professionals.length + homeOwners.length;

  const userOverviewDonutChartOptionsTwo = {
    chart: {
      type: 'donut',
      height: 270,
    },
    labels: ['Home Owners', 'Professionals'],
    colors: ['#9333EA', '#22C55E'],
    legend: {
      show: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 500,
              color: '#6B7280'
            },
            value: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              formatter: function (val) {
                return Number(val).toFixed(1) + '%';
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 500,
              color: '#6B7280',
              formatter: function (w) {
                return totalUsers;
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return Number(val).toFixed(1) + '%';
        }
      }
    }
  };

  const userOverviewDonutChartSeriesTwo = totalUsers > 0 ? [
    (professionals.length / totalUsers) * 100,
    (homeOwners.length / totalUsers) * 100
  ] : [0, 0, 0];

  return (
    <div className='col-xxl-4 col-md-6'>
      <div className='card h-100'>
        <div className='card-header'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <h6 className='mb-2 fw-bold text-lg'>Users Distribution</h6>
          </div>
        </div>
        <div className='card-body p-24'>
          <div className='mt-32'>
            <div
              id='userOverviewDonutChart'
              className='mx-auto apexcharts-tooltip-z-none'
            >
              <ReactApexChart
                options={userOverviewDonutChartOptionsTwo}
                series={userOverviewDonutChartSeriesTwo}
                type='donut'
                height={270}
              />
            </div>
          </div>
          <div className='d-flex flex-wrap gap-20 justify-content-center mt-48'>
            <div className='d-flex align-items-center gap-8'>
              <span className='w-16-px h-16-px radius-2 bg-lilac-600' />
              <span className='text-secondary-light'>Home Owners: {homeOwners.length}</span>
            </div>
            <div className='d-flex align-items-center gap-8'>
              <span className='w-16-px h-16-px radius-2 bg-success-600' />
              <span className='text-secondary-light'>Professionals: {professionals.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallReport;
