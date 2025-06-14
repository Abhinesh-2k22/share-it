const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  familyName: {
    type: String,
    required: true,
    enum: ['mahe', 'pavi', 'jeeva', 'manick', 'guru', 'karthick', 'manju']
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema); 