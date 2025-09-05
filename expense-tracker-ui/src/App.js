import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn } from '@clerk/clerk-react';

import DashboardPage from './pages/DashboardPage';
import ExpenseTrackerPage from './pages/ExpenseTrackerPage';
import PaymentsPage from './pages/PaymentsPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <>
      <SignedIn>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/project/:projectId" element={<ExpenseTrackerPage />} />
          <Route path="/project/:projectId/payments" element={<PaymentsPage />} />
          <Route path="/project/:projectId/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<CompanyProfilePage />} />
        </Routes>
      </SignedIn>
      <SignedOut>
        {/* THIS WRAPPER IS THE FIX - IT CENTERS THE CONTENT */}
        <div className="clerk-container"> 
          <Routes>
            <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
            <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
            <Route path="*" element={<RedirectToSignIn />} />
          </Routes>
        </div>
      </SignedOut>
    </>
  );
}

export default App;