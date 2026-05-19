import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import {
  addTransaction,
  getAllTransactions,
  deleteTransaction,
  getBalance,
  getIncomeExpense,
  addCategory,
  deleteCategory,
  getAllCategories,
  seedCategories,
} from './db';
import SummaryCards from './components/SummaryCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CategoryManager from './components/CategoryManager';
import Settings from './components/Settings';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const refreshAll = useCallback(async () => {
    const [txns, b, ie, cats] = await Promise.all([
      getAllTransactions(),
      getBalance(),
      getIncomeExpense(),
      getAllCategories(),
    ]);
    setTransactions(txns);
    setBalance(b);
    setIncome(ie.income);
    setExpense(ie.expense);
    setCategories(cats);
  }, []);

  useEffect(() => {
    (async () => {
      await seedCategories();
      await refreshAll();
    })();
  }, [refreshAll]);

  const handleAddTransaction = async (data) => {
    await addTransaction(data);
    await refreshAll();
    setShowForm(false);
  };

  const handleDeleteTransaction = async (id) => {
    await deleteTransaction(id);
    await refreshAll();
  };

  const handleAddCategory = async (data) => {
    await addCategory(data);
    const cats = await getAllCategories();
    setCategories(cats);
  };

  const handleDeleteCategory = async (id) => {
    await deleteCategory(id);
    const cats = await getAllCategories();
    setCategories(cats);
  };

  return (
    <div className="container">
      <header>
        <h1>مدير مالي شخصي</h1>
      </header>

      <SummaryCards balance={balance} income={income} expense={expense} />

      <div className="main-layout">
        <section className={`add-section ${showForm ? 'mobile-visible' : ''}`}>
          <div className="section-header">
            <h2>إضافة معاملة</h2>
            <button className="btn-sm mobile-close-btn" onClick={() => setShowForm(false)}>
              <FaTimes />
            </button>
          </div>
          <TransactionForm onAdd={handleAddTransaction} categories={categories} />
        </section>

        <section className="list-section">
          <div className="section-header">
            <h2>سجل المعاملات</h2>
          </div>
          <TransactionList
            transactions={transactions}
            categories={categories}
            onDelete={handleDeleteTransaction}
          />
        </section>
      </div>

      <Settings
        onManageCategories={() => setShowCategories(true)}
        onImport={refreshAll}
      />

      <button className="fab" onClick={() => setShowForm(true)} title="إضافة معاملة">
        <FaPlus />
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة معاملة</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <TransactionForm onAdd={handleAddTransaction} categories={categories} />
            </div>
          </div>
        </div>
      )}

      {showCategories && (
        <CategoryManager
          categories={categories}
          onAdd={handleAddCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setShowCategories(false)}
        />
      )}
    </div>
  );
}
