import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import './CompanyProfilePage.css';

function CompanyProfilePage() {
    const { getToken } = useAuth();
    const [companyName, setCompanyName] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [addressLine3, setAddressLine3] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState("https://via.placeholder.com/150x50.png?text=Your+Logo");

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                toast.loading('Loading profile...');
                const token = await getToken();
                const response = await axios.get(`${API_URL}/api/profile`, { // FIXED PATH
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.dismiss();
                const profile = response.data;
                if (profile) {
                    setCompanyName(profile.companyName || '');
                    setAddressLine1(profile.addressLine1 || '');
                    setAddressLine2(profile.addressLine2 || '');
                    setAddressLine3(profile.addressLine3 || '');
                    if (profile.logoUrl) {
                        const url = profile.logoUrl.startsWith('/') ? profile.logoUrl : `/${profile.logoUrl}`;
                        setLogoPreview(`${API_URL}${url}`);
                    }
                }
            } catch (error) {
                toast.dismiss();
                toast.error('Could not load company profile.');
            }
        };
        fetchProfile();
    }, [getToken, API_URL]);

    const handleSaveChanges = async () => {
        const formData = new FormData();
        formData.append('companyName', companyName);
        formData.append('addressLine1', addressLine1);
        formData.append('addressLine2', addressLine2);
        formData.append('addressLine3', addressLine3);
        
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        toast.loading('Saving changes...');
        try {
            const token = await getToken();
            const response = await axios.post(`${API_URL}/api/profile/update`, formData, { // FIXED PATH
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            toast.dismiss();
            toast.success('Profile updated successfully!');
            if (response.data.logoUrl) {
                const url = response.data.logoUrl.startsWith('/') ? response.data.logoUrl : `/${response.data.logoUrl}`;
                setLogoPreview(`${API_URL}${url}`);
            }
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to update profile.');
        }
    };

    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div>
                    <Link to="/" className="back-link">← Back to Dashboard</Link>
                    <h1>Company Profile & Branding</h1>
                </div>
            </header>
            <main className="profile-main">
                <div className="profile-form-card">
                    <h2>Your Company Details</h2>
                    <p>This information will appear on all your generated PDF reports.</p>
                    <div className="form-group">
                        <label htmlFor="companyName">Company Name</label>
                        <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="companyAddress1">Address Line 1</label>
                        <input type="text" id="companyAddress1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="companyAddress2">Address Line 2</label>
                        <input type="text" id="companyAddress2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="companyAddress3">Address Line 3 (City & Pincode)</label>
                        <input type="text" id="companyAddress3" value={addressLine3} onChange={(e) => setAddressLine3(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Company Logo</label>
                        <label htmlFor="companyLogo" className="logo-upload-area">
                            <div className="current-logo-preview">
                                <img src={logoPreview} alt="Company Logo Preview" />
                                <span>Click to change logo</span>
                            </div>
                            <input type="file" id="companyLogo" onChange={handleLogoChange} accept="image/*" style={{ display: 'none' }}/>
                        </label>
                    </div>
                    <div className="form-actions">
                        <button onClick={handleSaveChanges} className="save-profile-btn">Save Changes</button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CompanyProfilePage;