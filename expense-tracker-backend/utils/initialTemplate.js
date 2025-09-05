const initialTabs = {
  labour: { title: 'Labour', items: [ { itemName: 'Mason', price: '', count: '', other: '' }, { itemName: 'Helper', price: '', count: '', other: '' }, { itemName: 'Ladies Helper', price: '', count: '', other: '' }, { itemName: 'Excavation & Backfilling Work', price: '', count: '', other: '' }, { itemName: 'Steel Fitter', price: '', count: '', other: '' }, { itemName: 'Shuttering Carpenter', price: '', count: '', other: '' }, { itemName: 'Electrician', price: '', count: '', other: '' }, { itemName: 'Plumber', price: '', count: '', other: '' }, { itemName: 'Painter', price: '', count: '', other: '' }, { itemName: 'Polish Work', price: '', count: '', other: '' }, { itemName: 'Carpenter', price: '', count: '', other: '' }, { itemName: 'Carpenter Helper', price: '', count: '', other: '' }, { itemName: 'Tile & Granite Work', price: '', count: '', other: '' }, { itemName: 'Steel Welder/Mechanical Work', price: '', count: '', other: '' }, { itemName: 'Cupboard Work', price: '', count: '', other: '' }, { itemName: 'Stainless Steel Work', price: '', count: '', other: '' }, { itemName: 'Glass Work', price: '', count: '', other: '' }, { itemName: 'Fall Ceiling Work', price: '', count: '', other: '' }, ] },
  cement: { title: 'Cement & Aggregates', items: [ { itemName: 'M Sand (Manufactured Sand)', price: '', count: '', other: '' }, { itemName: 'P Sand (Plastering Sand)', price: '', count: '', other: '' }, { itemName: 'R Sand (River Sand)', price: '', count: '', other: '' }, { itemName: 'Bricks', price: '', count: '', other: '' }, { itemName: '3/4 Gravel', price: '', count: '', other: '' }, { itemName: '1/2 Gravel', price: '', count: '', other: '' }, ] },
  steel: { title: 'Steel', items: [ { itemName: '8mm Rebar', price: '', count: '', other: '' }, { itemName: '10mm Rebar', price: '', count: '', other: '' }, { itemName: '12mm Rebar', price: '', count: '', other: '' }, { itemName: '16mm Rebar', price: '', count: '', other: '' }, { itemName: '20mm Rebar', price: '', count: '', other: '' }, { itemName: 'Backfilling Materials', price: '', count: '', other: '' }, ] },
  carpenter: { title: 'Carpenter Work', items: [ { itemName: 'Wooden Planks', price: '', count: '', other: '' }, { itemName: 'Wooden Post', price: '', count: '', other: '' }, { itemName: 'Wooden Frame', price: '', count: '', other: '' }, { itemName: 'Wooden Bedding', price: '', count: '', other: '' }, ] },
  electrical: { title: 'Electrical', items: [ { itemName: 'Pipes', price: '', count: '', other: '' }, { itemName: 'Metal Box', price: '', count: '', other: '' }, { itemName: 'Switches & Socket', price: '', count: '', other: '' }, { itemName: 'Switch Board', price: '', count: '', other: '' }, { itemName: 'Wires', price: '', count: '', other: '' }, { itemName: 'Lights', price: '', count: '', other: '' }, ] },
  plumbing: { title: 'Plumbing', items: [ { itemName: 'Pipes', price: '', count: '', other: '' }, { itemName: 'Tapes', price: '', count: '', other: '' }, { itemName: 'Sanitary Fittings', price: '', count: '', other: '' }, ] },
  painting: { title: 'Painting', items: [ { itemName: 'Putty', price: '', count: '', other: '' }, { itemName: 'Primer', price: '', count: '', other: '' }, { itemName: 'Paint', price: '', count: '', other: '' }, { itemName: 'Polish', price: '', count: '', other: '' }, ] },
  advance: { title: 'Advance & Others', sections: { advancesGiven: { title: 'Advances Given (Reminders)', items: [{ itemName: 'Advance to Plumber', price: '', count: '', other: '' }] }, staff: { title: 'Staff Salaries', items: [{ itemName: 'Ramesh (Supervisor)', price: '', count: '', other: '' }] }, food: { title: 'Food and Snacks', items: [ { itemName: 'Team Tea / Snacks', price: '', count: '', other: '' }, { itemName: 'Drinking Water', price: '', count: '', other: '' } ] }, personal: { title: 'Personal Expenses', items: [ { itemName: 'Food (Self)', price: '', count: '', other: '' }, { itemName: 'Fuel (Self)', price: '', count: '', other: '' }, { itemName: 'Others (Personal)', price: '', count: '', other: '' } ] }, misc: { title: 'Other Miscellaneous Expenses', items: [{ itemName: 'Fuel for Generator', price: '', count: '', other: '' }] } } }
};

// Function to flatten the initial structure into the format stored in the DB
exports.getDefaultTemplate = () => {
    const flatTemplate = [];
    Object.values(initialTabs).forEach(tab => {
        if (tab.items) {
            tab.items.forEach(item => {
                flatTemplate.push({ ...item, category: tab.title });
            });
        }
        if (tab.sections) {
            Object.values(tab.sections).forEach(section => {
                section.items.forEach(item => {
                    flatTemplate.push({ ...item, category: section.title });
                });
            });
        }
    });
    return flatTemplate;
};