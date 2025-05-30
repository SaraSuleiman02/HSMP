import React from "react";
import UnitCountSeven from "./child/UnitCountSeven";
import UsersChart from "./child/UsersChart";
import TopCustomer from "./child/TopCustomer";
import OverallReport from "./child/OverallReport";
import EarningStaticOne from './child/EarningStaticOne'

const DashBoardLayerTen = () => {
  return (
    <div className='row gy-4'>
      {/* UnitCountSeven */}
      <UnitCountSeven />


      {/* UsersChart */}
      <UsersChart />


      {/* TopProfessional */}
      <TopCustomer />

      {/* OverallReport */}
      <OverallReport />

      {/* EarningStaticOne */}
      <EarningStaticOne />

    
    </div>
  );
};

export default DashBoardLayerTen;
