import React, { useState } from 'react';
import { FaTimes, FaPlus, FaTrash, FaFolder, FaMoneyBillWave, FaShoppingCart } from 'react-icons/fa';

export default function CategoryManager({ categories, onAdd, onDelete, onClose }) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('expense');
  const [error, setError] = useState('');

  const incomeCats = categories.filter((c) => c.type === 'income');
  const expenseCats = categories.filter((c) => c.type === 'expense');

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const exists = categories.some((c) => c.name === name && c.type === newType);
    if (exists) {
      setError('هذا التصنيف موجود مسبقاً');
      return;
    }
    try {
      await onAdd({ name, type: newType });
      setNewName('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDelete(id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaFolder /> إدارة التصنيفات</h3>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body">
          {error && <div className="error-msg">{error}</div>}

          <div className="add-category-form">
            <h4>إضافة تصنيف جديد</h4>
            <div className="form-row">
              <input
                type="text"
                placeholder="اسم التصنيف"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(''); }}
              />
              <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="income">دخل</option>
                <option value="expense">مصروف</option>
              </select>
              <button className="btn-sm btn-primary-sm" onClick={handleAdd}>
                <FaPlus /> إضافة
              </button>
            </div>
          </div>

          <div className="category-groups">
            <div className="category-group">
              <h4><FaMoneyBillWave className="icon-income" /> تصنيفات الدخل</h4>
              {incomeCats.length === 0 ? (
                <p className="empty-cats">لا توجد تصنيفات</p>
              ) : (
                <div className="category-chips">
                  {incomeCats.map((c) => (
                    <span className="chip chip-income" key={c.id}>
                      {c.name}
                      <button onClick={() => handleDelete(c.id)}><FaTrash /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="category-group">
              <h4><FaShoppingCart className="icon-expense" /> تصنيفات المصروفات</h4>
              {expenseCats.length === 0 ? (
                <p className="empty-cats">لا توجد تصنيفات</p>
              ) : (
                <div className="category-chips">
                  {expenseCats.map((c) => (
                    <span className="chip chip-expense" key={c.id}>
                      {c.name}
                      <button onClick={() => handleDelete(c.id)}><FaTrash /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
