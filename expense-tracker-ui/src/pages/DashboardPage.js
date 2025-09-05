import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth, UserButton } from "@clerk/clerk-react";
import './DashboardPage.css';

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [setupMethod, setSetupMethod] = useState('quick');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingBudget, setEditingBudget] = useState('');


  const fetchProjects = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('http://localhost:5000/api/projects/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects from frontend:", error);
      toast.error('Could not fetch projects.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectBudget) {
      return toast.error('Please fill in both project name and budget.');
    }
    try {
      const token = await getToken();
      const newProject = { projectName: newProjectName, totalBudget: newProjectBudget };
      await axios.post('http://localhost:5000/api/projects/add', newProject, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Project Created Successfully!');
      setShowModal(false);
      setNewProjectName('');
      setNewProjectBudget('');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to create project.');
    }
  };

  const handleDeleteClick = (project) => {
    setConfirmMessage(`Delete "${project.projectName}"? This action is permanent.`);
    setDeletingProjectId(project._id); // <-- THIS LINE HAS BEEN CORRECTED
    setOnConfirm(() => async () => {
      try {
        const token = await getToken();
        await axios.delete(`http://localhost:5000/api/projects/${project._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Project deleted.');
        setIsConfirmModalOpen(false);
        setDeletingProjectId(null);
        fetchProjects();
      } catch (error) {
        toast.error('Failed to delete project.');
        setIsConfirmModalOpen(false);
        setDeletingProjectId(null);
      }
    });
    setIsConfirmModalOpen(true);
  };
  
  const handleEditBudgetClick = (e, project) => {
    e.preventDefault();
    setEditingProject(project);
    setEditingBudget(project.totalBudget);
    setIsEditBudgetModalOpen(true);
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget || isNaN(Number(editingBudget))) {
        return toast.error('Please enter a valid budget amount.');
    }
    toast.loading('Updating budget...');
    try {
      const token = await getToken();
      await axios.patch(`http://localhost:5000/api/projects/${editingProject._id}/update-budget`, {
        totalBudget: editingBudget
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.dismiss();
      toast.success('Budget updated successfully!');
      setIsEditBudgetModalOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to update budget.');
    }
  };


  return (
    <div className={`dashboard-container ${deletingProjectId ? 'deleting-active' : ''}`}>
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-actions-container">
          <div className="date-selector-global">
            <label htmlFor="global-date">Select Date:</label>
            <input type="date" id="global-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <button onClick={() => setShowModal(true)} className="create-project-btn">+ Create New Project</button>
          <Link to="/profile" className="settings-link" title="Company Profile Settings">⚙️</Link>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>
      <main className="project-grid">
        {projects.map(project => {
          const remainingBalance = project.ownerPaid - (project.expenses || 0);
          return (
            <div key={project._id} className={`project-card ${deletingProjectId === project._id ? 'card-deleting' : ''}`}>
              <button onClick={() => handleDeleteClick(project)} className="delete-project-btn" title="Delete Project">×</button>
              
              <Link to={`/project/${project._id}`} className="project-card-link">
                <h2 className="project-name">
                    {project.projectName}
                    <button onClick={(e) => handleEditBudgetClick(e, project)} className="edit-budget-btn" title="Edit Budget">✏️</button>
                </h2>
                <div className="project-financials">
                  <div className="financial-item"><span>Total Budget</span><span className="value">₹{project.totalBudget.toLocaleString('en-IN')}</span></div>
                  <div className="financial-item"><span>Owner Paid</span><span className="value info">₹{project.ownerPaid.toLocaleString('en-IN')}</span></div>
                  <div className="financial-item"><span>Total Expenses</span><span className="value danger">₹{(project.expenses || 0).toLocaleString('en-IN')}</span></div>
                  <div className="financial-item total"><span>Balance in Hand</span><span className={`value ${remainingBalance >= 0 ? 'success' : 'danger'}`}>₹{remainingBalance.toLocaleString('en-IN')}</span></div>
                </div>
              </Link>

              <div className="card-actions">
                <Link to={`/project/${project._id}/payments`} className="manage-btn">Manage Payments</Link>
                <Link to={`/project/${project._id}/reports`} className="manage-btn">View Reports</Link>
              </div>
            </div>
          );
        })}
      </main>
      {showModal && (
        <div className="modal-backdrop"><div className="modal-content">
          <h2>Create a New Project</h2>
          <div className="form-group"><label htmlFor="projectName">Project Name</label><input type="text" id="projectName" placeholder="e.g., Beachside Villa" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} /></div>
          <div className="form-group"><label htmlFor="projectBudget">Total Project Budget (₹)</label><input type="number" id="projectBudget" placeholder="e.g., 5000000" value={newProjectBudget} onChange={e => setNewProjectBudget(e.target.value)} /></div>
          <div className="form-group setup-method"><p>Choose your setup method:</p>
            <div className="radio-group"><input type="radio" id="quickStart" name="setup" value="quick" checked={setupMethod === 'quick'} onChange={() => setSetupMethod('quick')}/><label htmlFor="quickStart"><strong>Quick Start Template</strong><small>Start with a pre-filled list of common expense items.</small></label></div>
            <div className="radio-group"><input type="radio" id="manualSetup" name="setup" value="manual" checked={setupMethod === 'manual'} onChange={() => setSetupMethod('manual')}/><label htmlFor="manualSetup"><strong>Manual Setup</strong><small>Start with a completely blank expense sheet.</small></label></div>
          </div>
          <div className="modal-actions"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={handleCreateProject} className="btn-primary">Create Project</button></div>
        </div></div>
      )}
      {isConfirmModalOpen && (
        <div className="modal-backdrop"><div className="modal-content confirmation-modal">
          <h2>Confirm Deletion</h2><p>{confirmMessage}</p>
          <div className="modal-actions"><button onClick={() => { setIsConfirmModalOpen(false); setDeletingProjectId(null); }} className="btn-secondary">No, Cancel</button><button onClick={onConfirm} className="btn-danger">Yes, Delete</button></div>
        </div></div>
      )}

      {isEditBudgetModalOpen && (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Edit Project Budget</h2>
                <p>Project: <strong>{editingProject?.projectName}</strong></p>
                <div className="form-group">
                    <label htmlFor="projectBudgetEdit">New Total Project Budget (₹)</label>
                    <input 
                        type="number" 
                        id="projectBudgetEdit" 
                        value={editingBudget} 
                        onChange={e => setEditingBudget(e.target.value)}
                        placeholder="e.g., 6000000"
                    />
                </div>
                <div className="modal-actions">
                    <button onClick={() => setIsEditBudgetModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button onClick={handleUpdateBudget} className="btn-primary">Update Budget</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}