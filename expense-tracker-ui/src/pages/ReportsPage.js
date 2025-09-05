import React, { useRef, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import PDFPreview from '../components/PDFPreview';
import { generatePDF } from '../utils/pdfGenerator';
import './ReportsPage.css';

function ReportsPage() {
  const { getToken } = useAuth();
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [companyProfile, setCompanyProfile] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [paymentsInPeriod, setPaymentsInPeriod] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pdfPreviewRef = useRef();

  const setDefaultDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  useEffect(() => {
    setDefaultDates();
    (async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [projectRes, profileRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/projects/${projectId}`, { headers }),
          axios.get('http://localhost:5000/api/profile', { headers }),
        ]);
        setProject(projectRes.data || {});
        setCompanyProfile(profileRes.data || {});
      } catch (e) {
        toast.error('Failed to load initial page data.');
        console.error(e);
      }
    })();
  }, [projectId, getToken]);
  
  useEffect(() => {
    if (projectId && startDate && endDate) {
      setIsLoading(true);

      const fetchDataForRange = async () => {
          try {
              const token = await getToken();
              const headers = { Authorization: `Bearer ${token}` };
              const params = { startDate, endDate };
              
              const expensesPromise = axios.get(`http://localhost:5000/api/projects/${projectId}/expenses`, { params, headers });
              const paymentsPromise = axios.get(`http://localhost:5000/api/payments/range/${projectId}`, { params, headers });
              
              const [expensesRes, paymentsRes] = await Promise.all([expensesPromise, paymentsPromise]);
              
              setExpenses(expensesRes.data || []);
              setPaymentsInPeriod(paymentsRes.data.total || 0);
          } catch (e) {
              toast.error('Failed to fetch report data for the date range.');
              console.error(e);
          } finally {
              setIsLoading(false);
          }
      };

      fetchDataForRange();
    }
  }, [projectId, startDate, endDate, getToken]);

  const handleDownload = () => {
    if (pdfPreviewRef.current) {
      const fileName = `Expense_Report_${project?.projectName || projectId}_${startDate}_to_${endDate}`;
      generatePDF(pdfPreviewRef.current, fileName);
    }
  };

  const expensesInPeriod = expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  const netFlowInPeriod = paymentsInPeriod - expensesInPeriod;
  const dateRange = { start: startDate, end: endDate };

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div>
          <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
          <h1>{project.projectName ? `Report for ${project.projectName}` : 'Loading...'}</h1>
        </div>
      </header>

      <main className="reports-main">
        <div className="report-options">
          <h2>Report Options</h2>
          <div className="date-range-picker">
            <div className="form-group">
              <label htmlFor="start-date">Start Date</label>
              <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="end-date">End Date</label>
              <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <button onClick={handleDownload} className="generate-btn">Download PDF Report</button>
        </div>

        <div className="pdf-preview-container">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading report data...</div>
          ) : (
            <div ref={pdfPreviewRef}>
              <PDFPreview
                project={project}
                profile={companyProfile}
                expenses={expenses}
                expensesInPeriod={expensesInPeriod}
                netFlowInPeriod={netFlowInPeriod}
                dateRange={dateRange}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReportsPage;