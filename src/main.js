import {
  addTransaction,
  getAllTransactions,
  deleteTransaction,
  getBalance,
  getIncomeExpense,
  getAllCategories,
  seedCategories,
} from './db.js';

const form = document.getElementById('transactionForm');
const typeInput = document.getElementById('typeInput');
const incomeBtn = document.getElementById('incomeBtn');
const expenseBtn = document.getElementById('expenseBtn');
const categoryInput = document.getElementById('categoryInput');
const amountInput = document.getElementById('amountInput');
const dateInput = document.getElementById('dateInput');
const noteInput = document.getElementById('noteInput');
const transactionsList = document.getElementById('transactionsList');
const balanceDisplay = document.getElementById('balanceDisplay');
const incomeDisplay = document.getElementById('incomeDisplay');
const expenseDisplay = document.getElementById('expenseDisplay');
const filterType = document.getElementById('filterType');
const filterDate = document.getElementById('filterDate');
const clearFilterBtn = document.getElementById('clearFilterBtn');

function formatCurrency(amount) {
  return Number(amount).toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

incomeBtn.addEventListener('click', () => setType('income'));
expenseBtn.addEventListener('click', () => setType('expense'));

function setType(type) {
  typeInput.value = type;
  incomeBtn.classList.toggle('active', type === 'income');
  expenseBtn.classList.toggle('active', type === 'expense');
  loadCategories();
}

async function loadCategories() {
  const type = typeInput.value;
  const categories = await getAllCategories();
  const filtered = categories.filter((c) => c.type === type);
  categoryInput.innerHTML = filtered
    .map((c) => `<option value="${c.name}">${c.icon} ${c.name}</option>`)
    .join('');
}

async function renderTransactions() {
  const transactions = await getAllTransactions();
  const typeFilter = filterType.value;
  const dateFilter = filterDate.value;

  let filtered = transactions;
  if (typeFilter !== 'all') {
    filtered = filtered.filter((t) => t.type === typeFilter);
  }
  if (dateFilter) {
    filtered = filtered.filter((t) => t.date === dateFilter);
  }

  filtered.sort((a, b) => b.id - a.id);

  if (filtered.length === 0) {
    transactionsList.innerHTML = '<div class="empty-state">لا توجد معاملات حتى الآن</div>';
    return;
  }

  transactionsList.innerHTML = filtered
    .map(
      (t) => `
    <div class="transaction-item">
      <div class="transaction-info">
        <span class="transaction-category">${t.category}</span>
        ${t.note ? `<span class="transaction-note">${t.note}</span>` : ''}
        <span class="transaction-date">${formatDate(t.date)}</span>
      </div>
      <div class="transaction-amount">
        <span class="amount-${t.type === 'income' ? 'income' : 'expense'}">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
        </span>
        <button class="delete-btn" data-id="${t.id}" title="حذف">✕</button>
      </div>
    </div>
  `
    )
    .join('');

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      await deleteTransaction(id);
      await refreshAll();
    });
  });
}

async function updateSummary() {
  const balance = await getBalance();
  const { income, expense } = await getIncomeExpense();
  balanceDisplay.textContent = formatCurrency(balance);
  incomeDisplay.textContent = formatCurrency(income);
  expenseDisplay.textContent = formatCurrency(expense);
}

async function refreshAll() {
  await updateSummary();
  await renderTransactions();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const transaction = {
    type: typeInput.value,
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    note: noteInput.value.trim() || '',
  };

  if (!transaction.amount || transaction.amount <= 0) {
    alert('يرجى إدخال مبلغ صحيح');
    return;
  }

  await addTransaction(transaction);
  form.reset();
  dateInput.value = todayStr();
  setType('income');
  await refreshAll();
});

filterType.addEventListener('change', renderTransactions);
filterDate.addEventListener('change', renderTransactions);
clearFilterBtn.addEventListener('click', () => {
  filterType.value = 'all';
  filterDate.value = '';
  renderTransactions();
});

async function init() {
  await seedCategories();
  dateInput.value = todayStr();
  await loadCategories();
  await refreshAll();
}

init();
