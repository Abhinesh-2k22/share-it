const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Family member counts
const FAMILY_MEMBERS = {
  mahe: 3,
  pavi: 3,
  jeeva: 3,
  manick: 4,
  guru: 3,
  karthick: 2,
  manju: 2
};

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new expense
router.post('/', async (req, res) => {
  const expense = new Expense({
    description: req.body.description,
    amount: req.body.amount,
    familyName: req.body.familyName
  });

  try {
    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Calculate settlements
router.get('/settlements', async (req, res) => {
  try {
    const expenses = await Expense.find();
    
    // Calculate total members and total expenses
    const totalMembers = Object.values(FAMILY_MEMBERS).reduce((a, b) => a + b, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const perPersonShare = totalExpenses / totalMembers;

    // Calculate each family's share and what they paid
    const familyBalances = Object.entries(FAMILY_MEMBERS).map(([family, members]) => {
      const familyShare = perPersonShare * members;
      const familyPaid = expenses
        .filter(expense => expense.familyName === family)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        family,
        members,
        share: familyShare,
        paid: familyPaid,
        balance: familyPaid - familyShare
      };
    });

    // Calculate settlements
    const settlements = [];
    const debtors = familyBalances.filter(f => f.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = familyBalances.filter(f => f.balance > 0).sort((a, b) => b.balance - a.balance);

    for (const debtor of debtors) {
      let remainingDebt = Math.abs(debtor.balance);
      
      for (const creditor of creditors) {
        if (remainingDebt <= 0 || creditor.balance <= 0) continue;
        
        const amount = Math.min(remainingDebt, creditor.balance);
        if (amount > 0) {
          settlements.push({
            from: debtor.family,
            to: creditor.family,
            amount: amount.toFixed(2)
          });
          
          remainingDebt -= amount;
          creditor.balance -= amount;
        }
      }
    }

    res.json({
      totalExpenses,
      totalMembers,
      perPersonShare,
      familyBalances,
      settlements
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 