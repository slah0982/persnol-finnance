import React, { useState, useEffect, useCallback } from 'react';
import { FaShoppingCart, FaTrash, FaPlus, FaDollarSign, FaBullseye } from 'react-icons/fa';
import { getAllWishlistItems, addWishlistItem, deleteWishlistItem, formatCurrency } from '../db';

export default function Wishlist({ refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const load = useCallback(async () => {
    const data = await getAllWishlistItems();
    setItems(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    const amt = parseFloat(price);
    if (!trimmed || isNaN(amt) || amt <= 0) return;
    await addWishlistItem({ name: trimmed, expectedPrice: amt });
    setName('');
    setPrice('');
    await load();
  };

  const handleDelete = async (id) => {
    await deleteWishlistItem(id);
    await load();
  };

  return (
    <div className="wishlist-section">
      <div className="section-header">
        <h2><FaShoppingCart /> ما أريد شراءه</h2>
      </div>

      <form className="wishlist-form" onSubmit={handleAdd}>
        <div className="wishlist-form-row">
          <input
            type="text"
            placeholder="اسم المنتج"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="wishlist-price-input">
            <FaDollarSign className="wishlist-input-icon" />
            <input
              type="text"
              inputMode="decimal"
              placeholder="السعر المتوقع"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary-sm">
            <FaPlus />
          </button>
        </div>
      </form>

      <div className="wishlist-list">
        {items.length === 0 && (
          <div className="empty-state">لا توجد عناصر في قائمة الرغبات</div>
        )}
        {items.map((item) => (
          <div className="wishlist-item" key={item.id}>
            <FaBullseye className="wishlist-item-icon" />
            <div className="wishlist-item-info">
              <span className="wishlist-item-name">{item.name}</span>
              <span className="wishlist-item-price">{formatCurrency(item.expectedPrice)}</span>
            </div>
            <button className="wishlist-delete-btn" onClick={() => handleDelete(item.id)}>
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
