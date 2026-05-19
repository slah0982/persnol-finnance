import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaShoppingCart, FaTags } from 'react-icons/fa';
import { todayStr, getAllCategories } from '../db';

export default function TransactionForm({ onSubmit, categories, editTransaction, onCancel }) {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const isEditing = !!editTransaction;

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategory(editTransaction.category);
      setDate(editTransaction.date);
      setNote(editTransaction.note || '');
      setTagsInput((editTransaction.tags || []).join(', '));
    } else {
      setType('income');
      setAmount('');
      setCategory('');
      setDate(todayStr());
      setNote('');
      setTagsInput('');
    }
  }, [editTransaction]);

  const filtered = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.find((c) => c.name === category)) {
      setCategory(filtered[0].name);
    }
  }, [type, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ type, amount: num, category, date, note: note.trim(), tags });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>النوع</label>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            <FaMoneyBillWave /> دخل
          </button>
          <button
            type="button"
            className={`toggle-btn ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            <FaShoppingCart /> مصروف
          </button>
        </div>
      </div>
      <div className="form-group">
        <label>المبلغ</label>
        <input
          type="number"
          placeholder="أدخل المبلغ"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>التصنيف</label>
        <select required value={category} onChange={(e) => setCategory(e.target.value)}>
          {filtered.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>التاريخ</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>الوسوم <FaTags className="icon-muted" /></label>
        <input
          type="text"
          placeholder="وسم1, وسم2, وسم3"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>ملاحظة (اختياري)</label>
        <input
          type="text"
          placeholder="وصف المعاملة"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {isEditing ? 'تحديث' : 'إضافة'}
        </button>
        {isEditing && onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}
