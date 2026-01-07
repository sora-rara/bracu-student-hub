// src/components/career/admin/AdminScholarshipRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScholarshipManage from './ScholarshipManage';
import CreateScholarship from './CreateScholarship';
import EditScholarship from './EditScholarship';
import ScholarshipApplications from './ScholarshipApplications';
import ScholarshipApplicationDetail from './ScholarshipApplicationDetail';

const AdminScholarshipRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ScholarshipManage />} />
      <Route path="/create" element={<CreateScholarship />} />
      <Route path="/edit/:id" element={<EditScholarship />} />
      <Route path="/applications/:id" element={<ScholarshipApplications />} />
      <Route path="/applications/:scholarshipId/:applicationId" element={<ScholarshipApplicationDetail />} />
      <Route path="*" element={<Navigate to="/admin/career/scholarships" replace />} />
    </Routes>
  );
};

export default AdminScholarshipRoutes;