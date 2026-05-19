import React from 'react';
import { FaArrowUp, FaArrowDown, FaWallet } from 'react-icons/fa';
import { formatCurrency } from '../db';

export default function SummaryCards({ balance, income, expense }) {
  return (
    <div className="summary-cards">
      <div className="card card-balance">
        <FaWallet className="card-icon" />
        <span className="card-label">الرصيد الحالي</span>
        <span className="card-value">{formatCurrency(balance)}</span>
        <span className="card-currency">د.ل</span>
      </div>
      <div className="card card-income">
        <FaArrowUp className="card-icon" />
        <span className="card-label">إجمالي الدخل</span>
        <span className="card-value">{formatCurrency(income)}</span>
        <span className="card-currency">د.ل</span>
      </div>
      <div className="card card-expense">
        <FaArrowDown className="card-icon" />
        <span className="card-label">إجمالي المصروفات</span>
        <span className="card-value">{formatCurrency(expense)}</span>
        <span className="card-currency">د.ل</span>
      </div>
    </div>
  );
}
