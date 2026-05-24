import React, { useState, useMemo } from 'react';
import { FaTrash, FaPen, FaFilter, FaUndo, FaSearch, FaTags } from 'react-icons/fa';
import { formatCurrency, formatDate } from '../db';

export default function TransactionList({ transactions, categories, onDelete, onEdit }) {
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchNote, setSearchNote] = useState('');

  const allTags = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => set.add(tag));
      }
    });
    return [...set].sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    let result = transactions;

    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory);
    }
    if (filterTag !== 'all') {
      result = result.filter(
        (t) => t.tags && Array.isArray(t.tags) && t.tags.includes(filterTag)
      );
    }
    if (dateFrom) {
      result = result.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((t) => t.date <= dateTo);
    }
    if (searchNote.trim()) {
      const q = searchNote.trim().toLowerCase();
      result = result.filter((t) => (t.note || '').toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => b.id - a.id);
  }, [transactions, filterType, filterCategory, filterTag, dateFrom, dateTo, searchNote]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterTag('all');
    setDateFrom('');
    setDateTo('');
    setSearchNote('');
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    filterCategory !== 'all' ||
    filterTag !== 'all' ||
    dateFrom ||
    dateTo ||
    searchNote.trim();

  return (
    <>
      <div className="filter-bar">
        <div className="filter-row">
          <span className="filter-icon"><FaFilter /></span>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">النوع: الكل</option>
            <option value="income">دخل</option>
            <option value="expense">مصروف</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">التصنيف: الكل</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {allTags.length > 0 && (
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
              <option value="all">الوسم: الكل</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
        <div className="filter-row">
          <div className="date-range">
            <span className="date-label">من</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="date-label">إلى</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="بحث في الملاحظات..."
              value={searchNote}
              onChange={(e) => setSearchNote(e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <button className="btn-sm" onClick={clearFilters}>
              <FaUndo /> مسح الكل
            </button>
          )}
        </div>
      </div>

      <div className="transactions-list">
        {filtered.length === 0 ? (
          <div className="empty-state">لا توجد معاملات</div>
        ) : (
          filtered.map((t) => (
            <div className="transaction-item" key={t.id}>
              <div className="transaction-info">
                <span className="transaction-category">{t.category}</span>
                {t.note && <span className="transaction-note">{t.note}</span>}
                {(() => {
                  const tags = Array.isArray(t.tags) ? t.tags : [];
                  if (tags.length === 0) return null;
                  return (
                    <span className="transaction-tags">
                      <FaTags className="tag-icon" />
                      {tags.map((tag) => (
                        <span className="tag-chip" key={tag}>{tag}</span>
                      ))}
                    </span>
                  );
                })()}
                <span className="transaction-date">{formatDate(t.date)}</span>
              </div>
              <div className="transaction-amount">
                <span className={`amount-${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </span>
                <button
                  className="edit-btn"
                  onClick={() => onEdit(t)}
                  title="تعديل"
                >
                  <FaPen />
                </button>
                <button
                  className="delete-btn"
                  onClick={() => onDelete(t.id)}
                  title="حذف"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="list-total">
        <span className="total-label">المجموع:</span>
        <span className="total-income">دخل: {formatCurrency(totals.income)}</span>
        <span className="total-expense">مصروف: {formatCurrency(totals.expense)}</span>
        <span className="total-net">
          صافي:
          <span className={totals.net >= 0 ? 'amount-income' : 'amount-expense'}>
            {' '}{totals.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totals.net))}
          </span>
        </span>
      </div>
    </>
  );
}
