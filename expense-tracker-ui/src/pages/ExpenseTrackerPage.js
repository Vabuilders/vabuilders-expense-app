import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import './ExpenseTrackerPage.css';

const structureTabs = (rawExpenses) => {
    const structured = {
        labour: { title: 'Labour', items: [] },
        cement: { title: 'Cement & Aggregates', items: [] },
        steel: { title: 'Steel', items: [] },
        carpenter: { title: 'Carpenter Work', items: [] },
        electrical: { title: 'Electrical', items: [] },
        plumbing: { title: 'Plumbing', items: [] },
        painting: { title: 'Painting', items: [] },
        advance: { title: 'Advance & Others', sections: { advancesGiven: { title: 'Advances Given (Reminders)', items: [] }, staff: { title: 'Staff Salaries', items: [] }, food: { title: 'Food and Snacks', items: [] }, personal: { title: 'Personal Expenses', items: [] }, misc: { title: 'Other Miscellaneous Expenses', items: [] } } }
    };

    const categoryMap = {
        'Labour': { tab: 'labour' }, 'Cement & Aggregates': { tab: 'cement' }, 'Steel': { tab: 'steel' },
        'Carpenter Work': { tab: 'carpenter' }, 'Electrical': { tab: 'electrical' }, 'Plumbing': { tab: 'plumbing' },
        'Painting': { tab: 'painting' }, 'Advances Given (Reminders)': { tab: 'advance', section: 'advancesGiven' },
        'Staff Salaries': { tab: 'advance', section: 'staff' }, 'Food and Snacks': { tab: 'advance', section: 'food' },
        'Personal Expenses': { tab: 'advance', section: 'personal' }, 'Other Miscellaneous Expenses': { tab: 'advance', section: 'misc' },
    };

    rawExpenses.forEach(exp => {
        const mapping = categoryMap[exp.category];
        if (mapping) {
            const item = { name: exp.itemName, price: exp.price || '', count: exp.count || '', other: exp.other || '' };
            if (mapping.section) {
                structured[mapping.tab].sections[mapping.section].items.push(item);
            } else {
                structured[mapping.tab].items.push(item);
            }
        }
    });

    return structured;
};

const flattenTabs = (tabsData) => {
    const flatExpenses = [];
    Object.values(tabsData).forEach(tab => {
        if (tab.items) {
            tab.items.forEach(item => {
                const { name, ...rest } = item;
                flatExpenses.push({ itemName: name, ...rest, category: tab.title });
            });
        }
        if (tab.sections) {
            Object.values(tab.sections).forEach(section => {
                section.items.forEach(item => {
                    const { name, ...rest } = item;
                    flatExpenses.push({ itemName: name, ...rest, category: section.title });
                });
            });
        }
    });
    return flatExpenses;
};

const calculateRowTotal = (item, isSimplified = false) => {
  const price = parseFloat(item.price) || 0;
  if (isSimplified) { return price; }
  const count = parseFloat(item.count) || 0;
  const other = parseFloat(item.other) || 0;
  return (price * count) + other;
};

export default function ExpenseTrackerPage() {
  const { getToken } = useAuth();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('labour');
  const [tabsData, setTabsData] = useState(null);
  const [grandTotal, setGrandTotal] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const [onModalSubmit, setOnModalSubmit] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchSheetForDate = useCallback(async (date) => {
    setTabsData(null);
    try {
        const token = await getToken();
        const response = await axios.get(`http://localhost:5000/api/expenses/template/${projectId}`, { 
            params: { date },
            headers: { Authorization: `Bearer ${token}` } 
        });
        const structuredData = structureTabs(response.data);
        setTabsData(structuredData);
        toast.success(`Sheet loaded for ${new Date(date).toLocaleDateString()}`);
    } catch (error) {
        toast.error("Failed to load expense sheet for this date.");
    }
  }, [projectId, getToken]);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchProjectDetails = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProject(res.data);
        } catch (error) {
            toast.error('Could not fetch project details.');
        }
    };
    
    fetchProjectDetails();
    fetchSheetForDate(selectedDate);
  }, [projectId, selectedDate, fetchSheetForDate, getToken]);

  useEffect(() => {
    if (!tabsData) return;
    let total = 0;
    Object.values(tabsData).forEach(tab => {
      if (tab.items) {
        tab.items.forEach(item => { total += calculateRowTotal(item); });
      }
      if (tab.sections) {
        Object.values(tab.sections).forEach(section => {
            section.items.forEach(item => { total += calculateRowTotal(item, true); });
        });
      }
    });
    setGrandTotal(total);
  }, [tabsData]);

  const handleSaveExpenses = async () => {
    if (!tabsData) return toast.error("No data to save.");
    
    toast.loading("Saving...");
    const flatExpenses = flattenTabs(tabsData);
    const payload = { projectId, date: selectedDate, expenses: flatExpenses };

    try {
        const token = await getToken();
        const res = await axios.post('http://localhost:5000/api/expenses/save', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.dismiss();
        toast.success(res.data);
    } catch (error) {
        toast.dismiss();
        toast.error('Failed to save expenses.');
    }
  };
  
  const handleInputChange = (value, tabKey, itemIndex, field, sectionKey = null) => {
    setTabsData(currentTabsData => {
        const newTabsData = JSON.parse(JSON.stringify(currentTabsData));
        if (sectionKey) {
            newTabsData[tabKey].sections[sectionKey].items[itemIndex][field] = value;
        } else {
            newTabsData[tabKey].items[itemIndex][field] = value;
        }
        return newTabsData;
    });
  };
  
  const handleAddItem = (tabKey, sectionKey = null) => {
    setOnModalSubmit(() => (newItemName) => {
      if (newItemName && newItemName.trim() !== "") {
        const newItem = { name: newItemName, price: '', count: '', other: '' };
        setTabsData(currentTabsData => {
            const newTabsData = JSON.parse(JSON.stringify(currentTabsData));
            if (sectionKey) {
                newTabsData[tabKey].sections[sectionKey].items.push(newItem);
            } else {
                newTabsData[tabKey].items.push(newItem);
            }
            return newTabsData;
        });
        toast.success(`'${newItemName}' added! Save to make it permanent for future dates.`);
      }
      setIsModalOpen(false);
      setModalValue('');
    });
    setIsModalOpen(true);
  };

  const handleRemoveItem = (tabKey, itemIndex, sectionKey = null) => {
    setConfirmMessage('This will remove the item for this day and all future days. Past days will be unaffected. Continue?');
    setOnConfirm(() => () => {
      setTabsData(currentTabsData => {
        const newTabsData = JSON.parse(JSON.stringify(currentTabsData));
        if (sectionKey) {
            newTabsData[tabKey].sections[sectionKey].items.splice(itemIndex, 1);
        } else {
            newTabsData[tabKey].items.splice(itemIndex, 1);
        }
        return newTabsData;
      });
      toast.success('Item removed. Save your changes.');
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // ... The rest of your component (render methods, JSX) remains exactly the same
  const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033C6.91 2.75 6 3.704 6 4.87v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> );

  const renderTableRows = (items, tabKey, sectionKey = null) => items.map((item, index) => (
    <tr key={`${tabKey}-${sectionKey || 'main'}-${item.name}-${index}`}>
      <td>{item.name}</td>
      <td><input type="number" value={item.price} onChange={(e) => handleInputChange(e.target.value, tabKey, index, 'price', sectionKey)} placeholder="0.00" className="cell-input" /></td>
      <td><input type="number" value={item.count} onChange={(e) => handleInputChange(e.target.value, tabKey, index, 'count', sectionKey)} placeholder="0" className="cell-input" /></td>
      <td><input type="text" value={item.other} onChange={(e) => handleInputChange(e.target.value, tabKey, index, 'other', sectionKey)} placeholder="Note or value" className="cell-input" /></td>
      <td className="row-total">₹{calculateRowTotal(item).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td><button onClick={() => handleRemoveItem(tabKey, index, sectionKey)} className="delete-button"><TrashIcon /></button></td>
    </tr>
  ));

  const renderSalaryTable = (sectionKey) => {
    if (!tabsData.advance || !tabsData.advance.sections || !tabsData.advance.sections[sectionKey]) return null;
    const section = tabsData.advance.sections[sectionKey];
    return (
      <div key={sectionKey} className="subsection">
        <h3>{section.title}</h3>
        <table className="expense-table simplified-table">
          <thead><tr><th className="description-column">Item Name</th><th className="narrow-column">Payment (₹)</th><th className="narrow-column">Total (₹)</th><th className="action-column">Action</th></tr></thead>
          <tbody>
            {section.items.map((item, index) => (
              <tr key={`${sectionKey}-${item.name}-${index}`}>
                <td>{item.name}</td>
                <td><input type="number" value={item.price} onChange={(e) => handleInputChange(e.target.value, 'advance', index, 'price', sectionKey)} placeholder="0.00" className="cell-input" /></td>
                <td className="row-total">₹{(parseFloat(item.price) || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td><button onClick={() => handleRemoveItem('advance', index, sectionKey)} className="delete-button"><TrashIcon /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => handleAddItem('advance', sectionKey)} className="add-item-button">+ Add Item</button>
      </div>
    );
  };

  const renderStandardTable = (tabKey) => {
    if (!tabsData[tabKey] || !tabsData[tabKey].items) return <p>Loading table...</p>;
    return (
      <div className="expense-table-container">
        <h2>{tabsData[tabKey].title}</h2>
        <table className="expense-table">
          <thead><tr><th>Item Name</th><th className="narrow-column">Price</th><th className="narrow-column">Count</th><th className="narrow-column">Other</th><th>Total</th><th className="action-column">Action</th></tr></thead>
          <tbody>{renderTableRows(tabsData[tabKey].items, tabKey)}</tbody>
        </table>
        <button onClick={() => handleAddItem(tabKey)} className="add-item-button">+ Add Custom Row</button>
      </div>
    );
  };
  
    const renderAdvanceTable = (tabKey) => {
    if (!tabsData[tabKey] || !tabsData[tabKey].sections) return <p>Loading table...</p>;
    return (
      <div className="expense-table-container">
        <h2>{tabsData[tabKey].title}</h2>
        {Object.keys(tabsData[tabKey].sections).map(sectionKey => renderSalaryTable(sectionKey))}
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-navigation">
            <Link to="/" className="back-link-expenses">&larr; Back to Dashboard</Link>
            <h1>Daily Expense Sheet</h1>
        </div>
        <div className="project-details">
          <span>Project: <strong>{project ? project.projectName : 'Loading...'}</strong></span>
          <div className="date-selector">
            <label htmlFor="expense-date">Date:</label>
            <input type="date" id="expense-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </header>
      <main className="main-content">
        <nav className="tab-navigation">
          {tabsData && Object.keys(tabsData).map(tabKey => (
            <button key={tabKey} className={`tab-link ${activeTab === tabKey ? 'active' : ''}`} onClick={() => setActiveTab(tabKey)}>
              {tabsData[tabKey].title}
            </button>
          ))}
        </nav>
        <div className="tab-content-area">
          {!tabsData ? (<p>Loading Expense Sheet...</p>) : (
            activeTab !== 'advance' ? renderStandardTable(activeTab) : renderAdvanceTable(activeTab)
          )}
        </div>
      </main>
      <footer className="summary-footer">
        <div className="grand-total">
          Grand Total for Today: <span>₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <button className="save-button" onClick={handleSaveExpenses}>Save Today's Expenses</button>
      </footer>
      {isModalOpen && ( <div className="modal-backdrop"><div className="modal-content"><h2>Add New Item</h2><div className="form-group"><label htmlFor="newItemName">Enter the name for the new item:</label><input type="text" id="newItemName" value={modalValue} onChange={(e) => setModalValue(e.target.value)} autoFocus /></div><div className="modal-actions"><button onClick={() => { setIsModalOpen(false); setModalValue(''); }} className="btn-secondary">Cancel</button><button onClick={() => onModalSubmit(modalValue)} className="btn-primary">Add Item</button></div></div></div>)}
      {isConfirmModalOpen && ( <div className="modal-backdrop"><div className="modal-content confirmation-modal"><h2>Confirm Action</h2><p>{confirmMessage}</p><div className="modal-actions"><button onClick={() => setIsConfirmModalOpen(false)} className="btn-secondary">No, Cancel</button><button onClick={onConfirm} className="btn-danger">Yes, Delete</button></div></div></div>)}
    </div>
  );
}