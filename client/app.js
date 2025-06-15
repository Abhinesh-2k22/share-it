const API_URL = 'https://share-it-backend.onrender.com/api';

// Initialize Chart
let expenseChart;
const ctx = document.getElementById('expenseChart').getContext('2d');
expenseChart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#FF6384'
            ]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    }
});

// Load all data
async function loadData() {
    await Promise.all([
        loadExpenses(),
        loadSettlements()
    ]);
}

// Load expenses
async function loadExpenses() {
    try {
        const response = await fetch(`${API_URL}/expenses`);
        const expenses = await response.json();
        
        // Update expense history table
        const historyHtml = expenses.map(expense => `
            <tr>
                <td>${new Date(expense.date).toLocaleString()}</td>
                <td>${expense.description}</td>
                <td>₹${expense.amount.toFixed(2)}</td>
                <td>${expense.familyName}</td>
            </tr>
        `).join('');
        document.getElementById('expenseHistory').innerHTML = historyHtml;

        // Update chart
        const familyTotals = {};
        expenses.forEach(expense => {
            familyTotals[expense.familyName] = (familyTotals[expense.familyName] || 0) + expense.amount;
        });

        expenseChart.data.labels = Object.keys(familyTotals);
        expenseChart.data.datasets[0].data = Object.values(familyTotals);
        expenseChart.update();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Load settlements
async function loadSettlements() {
    try {
        const response = await fetch(`${API_URL}/expenses/settlements`);
        const data = await response.json();
        
        let settlementsHtml = `
            <div class="mb-3">
                <h4 style="font-size: 1.1rem;">Summary</h4>
                <p class="mb-1">Total Expenses: ₹${data.totalExpenses.toFixed(2)}</p>
                <p class="mb-1">Total Members: ${data.totalMembers}</p>
                <p class="mb-1">Per Person Share: ₹${data.perPersonShare.toFixed(2)}</p>
            </div>
            <div class="mb-3">
                <h4 style="font-size: 1.1rem;">Family Balances</h4>
                <ul class="list-group">
                    ${data.familyBalances.map(balance => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${balance.family} (${balance.members} members)
                            <span class="badge ${balance.balance >= 0 ? 'bg-success' : 'bg-danger'} rounded-pill">
                                ₹${balance.balance.toFixed(2)}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div>
                <h4 style="font-size: 1.1rem;">Required Settlements</h4>
                <ul class="list-group">
                    ${data.settlements.map(settlement => `
                        <li class="list-group-item">
                            ${settlement.from} should pay ₹${settlement.amount} to ${settlement.to}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        document.getElementById('settlements').innerHTML = settlementsHtml;
    } catch (error) {
        console.error('Error loading settlements:', error);
    }
}

// Add new expense
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = document.querySelector('#expenseForm button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Adding...
    `;
    
    const expense = {
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        familyName: document.getElementById('familyName').value
    };

    try {
        const response = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expense)
        });

        if (response.ok) {
            document.getElementById('expenseForm').reset();
            await loadData();
        } else {
            console.error('Error adding expense');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
    } finally {
        // Re-enable button and restore original text
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});

// Initial load
loadData(); 
