import React, { useRef, useState } from 'react';
import { FaCog, FaDownload, FaUpload, FaFolder, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { exportAllData, importAllData } from '../db';

export default function Settings({ onManageCategories, onImport }) {
  const fileRef = useRef(null);
  const [message, setMessage] = useState(null);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg('تم تصدير النسخة الاحتياطية بنجاح', 'success');
    } catch {
      showMsg('فشل التصدير', 'error');
    }
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.transactions || !data.categories) {
        showMsg('الملف غير صالح - بيانات غير مكتملة', 'error');
        return;
      }

      await importAllData(data);
      showMsg('تم استيراد البيانات بنجاح', 'success');
      onImport();
    } catch (err) {
      showMsg('فشل الاستيراد: ' + err.message, 'error');
    }

    e.target.value = '';
  };

  return (
    <section className="settings-section">
      <div className="section-header">
        <h2><FaCog /> الإعدادات</h2>
      </div>

      {message && (
        <div className={`settings-msg ${message.type}`}>
          {message.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          {message.text}
        </div>
      )}

      <div className="settings-actions">
        <button className="settings-btn" onClick={onManageCategories}>
          <FaFolder className="settings-btn-icon" />
          <span className="settings-btn-text">إدارة التصنيفات</span>
        </button>

        <button className="settings-btn" onClick={handleExport}>
          <FaDownload className="settings-btn-icon" />
          <span className="settings-btn-text">تصدير نسخة احتياطية</span>
        </button>

        <button className="settings-btn" onClick={handleImportClick}>
          <FaUpload className="settings-btn-icon" />
          <span className="settings-btn-text">استيراد نسخة احتياطية</span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}
