import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerOrder from './CustomerOrder';

const AppComponent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerOrder />} />
        <Route path="/orders" element={<CustomerOrder />} />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  );
};

export default AppComponent;