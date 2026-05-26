import React, { useRef, useState, useEffect } from 'react';
import { FaCog, FaDownload, FaUpload, FaFolder, FaCheck, FaExclamationCircle, FaGoogle, FaLink, FaSave, FaKey, FaTable, FaChevronDown, FaChevronUp, FaFileExport, FaFileImport, FaQuestionCircle, FaTimes, FaCopy } from 'react-icons/fa';
import { exportAllData, importAllData } from '../db';

const KEYS = {
  webAppUrl: 'google_sheets_webapp_url',
  sheetId: 'google_sheets_sheet_id',
  apiKey: 'google_sheets_api_key',
};

export default function Settings({ onManageCategories, onImport }) {
  const fileRef = useRef(null);
  const sheetKeysFileRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [webAppUrl, setWebAppUrl] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpCodeRef = useRef(null);

  useEffect(() => {
    setWebAppUrl(localStorage.getItem(KEYS.webAppUrl) || '');
    setSheetId(localStorage.getItem(KEYS.sheetId) || '');
    setApiKey(localStorage.getItem(KEYS.apiKey) || '');
  }, []);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const save = (key, val) => {
    if (val.trim()) localStorage.setItem(key, val.trim());
    else localStorage.removeItem(key);
    showMsg('تم الحفظ', 'success');
  };

  // ── Sheet keys export/import ──

  const handleExportSheetKeys = () => {
    const data = {
      webAppUrl: localStorage.getItem(KEYS.webAppUrl) || '',
      sheetId: localStorage.getItem(KEYS.sheetId) || '',
      apiKey: localStorage.getItem(KEYS.apiKey) || '',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-sheets-keys.json';
    a.click();
    URL.revokeObjectURL(url);
    showMsg('تم تصدير مفاتيح Google Sheets', 'success');
  };

  const handleImportSheetKeys = () => sheetKeysFileRef.current?.click();

  const handleSheetKeysFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.webAppUrl && !data.sheetId && !data.apiKey) {
        showMsg('ملف غير صالح', 'error');
        return;
      }
      if (data.webAppUrl) { localStorage.setItem(KEYS.webAppUrl, data.webAppUrl); setWebAppUrl(data.webAppUrl); }
      if (data.sheetId) { localStorage.setItem(KEYS.sheetId, data.sheetId); setSheetId(data.sheetId); }
      if (data.apiKey) { localStorage.setItem(KEYS.apiKey, data.apiKey); setApiKey(data.apiKey); }
      showMsg('تم استيراد مفاتيح Google Sheets', 'success');
    } catch (err) { showMsg('فشل الاستيراد: ' + err.message, 'error'); }
    e.target.value = '';
  };

  // ── JSON file ──

  const handleExportJSON = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg('تم تصدير النسخة الاحتياطية', 'success');
    } catch {
      showMsg('فشل التصدير', 'error');
    }
  };

  const handleImportJSON = () => fileRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.transactions || !data.categories) { showMsg('ملف غير صالح', 'error'); return; }
      await importAllData(data);
      showMsg('تم استيراد البيانات', 'success');
      onImport();
    } catch (err) { showMsg('فشل الاستيراد: ' + err.message, 'error'); }
    e.target.value = '';
  };

  // ── Google Sheets Export (form POST → يحافظ على البيانات أثناء redirect) ──

  const handleExportToSheet = async () => {
    const url = webAppUrl.trim();
    if (!url) { showMsg('الرجاء إدخال رابط Web App URL', 'error'); return; }

    try {
      const data = await exportAllData();
      const payload = JSON.stringify(data);

      // نافذة صغيرة تعرض الرد من Google Apps Script
      const popup = window.open('', 'gsheets-sync', 'width=500,height=300,left=300,top=200');
      if (!popup) {
        showMsg('الرجاء السماح للنوافذ المنبثقة (popups)', 'error');
        return;
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;  // بدون ? — Google يحافظ على POST body
      form.target = 'gsheets-sync';
      form.enctype = 'application/x-www-form-urlencoded';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = payload;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      showMsg('تم الإرسال — النتيجة في النافذة الجديدة', 'success');
    } catch (err) {
      showMsg('فشل الإرسال: ' + err.message, 'error');
    }
  };

  // ── Google Sheets Import (GET via Sheets API v4) ──

  const handleImportFromSheet = async () => {
    const sid = sheetId.trim();
    const key = apiKey.trim();
    if (!sid || !key) { showMsg('أدخل Spreadsheet ID و API Key', 'error'); return; }

    try {
      // First, get sheet metadata to find existing sheet names
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sid}?key=${key}`
      ).then((r) => r.json());

      if (metaRes.error) {
        throw new Error(metaRes.error.message + ' — تأكد من مشاركة الشيت (Anyone with link)');
      }

      const sheetNames = (metaRes.sheets || []).map((s) => s.properties.title);
      const txSheet = sheetNames.find((n) => /transactions/i.test(n));
      const catSheet = sheetNames.find((n) => /categories/i.test(n));

      function parseNum(val) {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          val = val.trim();
          if (val === '') return '';
          const normalized = val.replace(/\./g, '').replace(',', '.');
          const num = parseFloat(normalized);
          if (!isNaN(num)) return num;
        }
        return val;
      }

      function serialToDateStr(serial) {
        const epoch = new Date(1899, 11, 30);
        const d = new Date(epoch.getTime() + serial * 86400000);
        return d.toISOString().split('T')[0];
      }

      function parseDateStr(val) {
        if (typeof val === 'number') return serialToDateStr(val);
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
          const d = new Date(trimmed);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          const parts = trimmed.split(/[/\-.]/);
          if (parts.length === 3) {
            const [a, b, c] = parts.map(Number);
            if (a > 31) return `${a}-${String(b).padStart(2, '0')}-${String(c).padStart(2, '0')}`;
            if (c > 31) return `${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
          }
        }
        return val;
      }

      function toObjects(data) {
        if (!data || !data.values || data.values.length < 2) return [];
        const headers = data.values[0];
        return data.values.slice(1).map((row) => {
          const obj = {};
          headers.forEach((h, i) => {
            let val = row[i] ?? '';
            if (h === 'tags' && typeof val === 'string' && val) {
              val = val.split(',').map((t) => t.trim()).filter(Boolean);
            } else if (h === 'amount' || h === 'id') {
              val = parseNum(val);
            } else if (h === 'date') {
              val = parseDateStr(val);
            }
            obj[h] = val;
          });
          return obj;
        });
      }

      const apiBase = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values`;
      const apiKeyParam = `key=${key}`;
      const apiOptions = `valueRenderOption=UNFORMATTED_VALUE`;

      let transactions = [];
      let categories = [];

      if (txSheet) {
        const txRes = await fetch(
          `${apiBase}/${encodeURIComponent(txSheet)}?${apiOptions}&${apiKeyParam}`
        ).then((r) => r.json());
        if (!txRes.error) transactions = toObjects(txRes);
      }

      if (catSheet) {
        const catRes = await fetch(
          `${apiBase}/${encodeURIComponent(catSheet)}?${apiOptions}&${apiKeyParam}`
        ).then((r) => r.json());
        if (!catRes.error) categories = toObjects(catRes);
      }

      if (transactions.length === 0 && categories.length === 0) {
        showMsg('لا توجد بيانات في الشيت — أرسل البيانات أولاً', 'error');
        return;
      }

      await importAllData({ transactions, categories, version: 1 });
      showMsg('تم استيراد البيانات من Google Sheets', 'success');
      onImport();
    } catch (err) {
      showMsg('فشل الاستيراد: ' + err.message, 'error');
    }
  };

  return (
    <section className="settings-section">
      <div className="section-header toggle-header" onClick={() => setSettingsOpen((o) => !o)}>
        <h2><FaCog /> الإعدادات</h2>
        <span className="toggle-arrow">{settingsOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
      </div>

      {settingsOpen && <>
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
          <button className="settings-btn" onClick={handleExportJSON}>
            <FaDownload className="settings-btn-icon" />
            <span className="settings-btn-text">تصدير JSON</span>
          </button>
          <button className="settings-btn" onClick={handleImportJSON}>
            <FaUpload className="settings-btn-icon" />
            <span className="settings-btn-text">استيراد JSON</span>
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        <hr className="settings-divider" />

        <div className="sheet-section">
          <div className="toggle-header" onClick={() => setSheetOpen((o) => !o)}>
            <h3><FaGoogle /> ربط Google Sheets</h3>
            <div className="toggle-header-left">
              <button className="btn-help" onClick={(e) => { e.stopPropagation(); setHelpOpen(true); }} title="كيفية الربط">
                <FaQuestionCircle />
              </button>
              <span className="toggle-arrow">{sheetOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
            </div>
          </div>

          {sheetOpen && <>
            <p className="sheet-info">
              <strong>للإرسال:</strong> استخدم Google Apps Script (<code>google-sheet-script.gs</code>).<br />
              <strong>للاستيراد:</strong> استخدم Google Sheets API v4 — فعّل Sheets API في Google Cloud وأنشئ API Key.
            </p>

            <div className="sheet-fields">
              <div className="sheet-field-row">
                <FaLink className="sheet-f-icon" />
                <input type="url" placeholder="Web App URL" value={webAppUrl} onChange={(e) => setWebAppUrl(e.target.value)} />
                <button className="btn-sm" onClick={() => save(KEYS.webAppUrl, webAppUrl)}><FaSave /></button>
              </div>
              <div className="sheet-field-row">
                <FaTable className="sheet-f-icon" />
                <input type="text" placeholder="Spreadsheet ID" value={sheetId} onChange={(e) => setSheetId(e.target.value)} />
                <button className="btn-sm" onClick={() => save(KEYS.sheetId, sheetId)}><FaSave /></button>
              </div>
              <div className="sheet-field-row">
                <FaKey className="sheet-f-icon" />
                <input type="text" placeholder="Google Sheets API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                <button className="btn-sm" onClick={() => save(KEYS.apiKey, apiKey)}><FaSave /></button>
              </div>
            </div>

            <div className="sheet-buttons">
              <button className="settings-btn sheet-btn" onClick={handleExportToSheet}>
                <FaUpload className="settings-btn-icon" />
                <span className="settings-btn-text">إرسال إلى Sheets</span>
              </button>
              <button className="settings-btn sheet-btn" onClick={handleImportFromSheet}>
                <FaDownload className="settings-btn-icon" />
                <span className="settings-btn-text">استيراد من Sheets</span>
              </button>
            </div>

            <div className="sheet-keys-actions">
              <button className="settings-btn sheet-btn" onClick={handleExportSheetKeys}>
                <FaFileExport className="settings-btn-icon" />
                <span className="settings-btn-text">تصدير مفاتيح Sheets</span>
              </button>
              <button className="settings-btn sheet-btn" onClick={handleImportSheetKeys}>
                <FaFileImport className="settings-btn-icon" />
                <span className="settings-btn-text">استيراد مفاتيح Sheets</span>
              </button>
              <input ref={sheetKeysFileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleSheetKeysFileChange} />
            </div>
          </>}
        </div>
      </>}

      {helpOpen && (
        <div className="modal-overlay" onClick={() => setHelpOpen(false)}>
          <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaGoogle /> كيفية ربط Google Sheets</h3>
              <button className="modal-close" onClick={() => setHelpOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body help-body">

              <h4>الخطوة 1: إنشاء Google Sheet</h4>
              <ol>
                <li> افتح <a href="https://sheets.new" target="_blank" rel="noopener noreferrer">sheets.new</a> لإنشاء جدول جديد</li>
                <li> لا تحتاج لإضافة أي أعمدة — التطبيق سينشئها تلقائياً</li>
              </ol>

              <h4>الخطوة 2: إنشاء Google Apps Script</h4>
              <ol>
                <li> من القائمة: <strong>Extensions → Apps Script</strong></li>
                <li> احذف الكود الافتراضي والصق الكود التالي:</li>
              </ol>
              <div className="help-code-block">
                <button className="btn-sm help-copy-btn" onClick={() => { navigator.clipboard.writeText(helpCodeRef.current?.textContent || ''); }}>
                  <FaCopy /> نسخ الكود
                </button>
                <pre ref={helpCodeRef}>{`/**
 * Google Apps Script — ربط التطبيق بالشيت
 * انسخ هذا الكود بالكامل في مشروع Apps Script
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    var raw = null;

    if (e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    } else if (e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }

    if (!raw) throw new Error('لم يتم استلام بيانات (payload مفقود)');
    if (typeof raw === 'string' && raw.indexOf('%') !== -1) {
      raw = decodeURIComponent(raw);
    }
    const data = JSON.parse(raw);

    // Transactions sheet
    let txSheet = sheet.getSheetByName('Transactions');
    if (!txSheet) {
      txSheet = sheet.insertSheet('Transactions');
    } else {
      txSheet.clear();
    }
    const transactions = data.transactions || [];
    if (transactions.length > 0) {
      const txHeaders = Object.keys(transactions[0]);
      txSheet.appendRow(txHeaders);
      transactions.forEach(function (row) {
        txSheet.appendRow(txHeaders.map(function (h) { return row[h] || ''; }));
      });
    }

    // Categories sheet
    let catSheet = sheet.getSheetByName('Categories');
    if (!catSheet) {
      catSheet = sheet.insertSheet('Categories');
    } else {
      catSheet.clear();
    }
    const categories = data.categories || [];
    if (categories.length > 0) {
      const catHeaders = Object.keys(categories[0]);
      catSheet.appendRow(catHeaders);
      categories.forEach(function (row) {
        catSheet.appendRow(catHeaders.map(function (h) { return row[h] || ''; }));
      });
    }

    // Wishlist sheet
    let wishSheet = sheet.getSheetByName('Wishlist');
    if (!wishSheet) {
      wishSheet = sheet.insertSheet('Wishlist');
    } else {
      wishSheet.clear();
    }
    const wishlist = data.wishlist || [];
    if (wishlist.length > 0) {
      const wishHeaders = Object.keys(wishlist[0]);
      wishSheet.appendRow(wishHeaders);
      wishlist.forEach(function (row) {
        wishSheet.appendRow(wishHeaders.map(function (h) { return row[h] || ''; }));
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
              </div>

              <h4>الخطوة 3: نشر التطبيق (Deploy)</h4>
              <ol>
                <li> اضغط <strong>Deploy → New deployment</strong></li>
                <li> اختر <strong>Web app</strong> كنوع</li>
                <li> <strong>Execute as:</strong> Me</li>
                <li> <strong>Who has access:</strong> Anyone</li>
                <li> اضغط <strong>Deploy</strong></li>
                <li> <strong>انسخ رابط Web App URL</strong> (مثل: <code>https://script.google.com/macros/s/abc123/exec</code>)</li>
              </ol>

              <h4>الخطوة 4: تفعيل Google Sheets API</h4>
              <ol>
                <li> اذهب إلى <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                <li> أنشئ مشروع جديد أو اختر مشروعاً موجوداً</li>
                <li> اذهب إلى <strong>APIs & Services → Library</strong></li>
                <li> ابحث عن <strong>Google Sheets API</strong> وافعّله</li>
                <li> اذهب إلى <strong>APIs & Services → Credentials</strong></li>
                <li> اضغط <strong>Create Credentials → API Key</strong></li>
                <li> انسخ الـ API Key</li>
              </ol>

              <h4>الخطوة 5: مشاركة الشيت</h4>
              <ol>
                <li> ارجع إلى الشيت</li>
                <li> اضغط <strong>Share</strong> في الزاوية اليمنى العليا</li>
                <li> غيّر إلى <strong>Anyone with the link → Viewer</strong></li>
                <li> انسخ <strong>Spreadsheet ID</strong> من رابط الشيت:</li>
              </ol>
              <p className="help-note">
                رابط الشيت: <code>https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit</code>
              </p>

              <h4>الخطوة 6: إدخال البيانات في التطبيق</h4>
              <ol>
                <li> <strong>Web App URL</strong> — الرابط من الخطوة 3</li>
                <li> <strong>Spreadsheet ID</strong> — من الخطوة 5</li>
                <li> <strong>Google Sheets API Key</strong> — من الخطوة 4</li>
                <li> اضغط <FaSave /> بجانب كل حقل لحفظه</li>
              </ol>

              <hr className="help-divider" />

              <h4>ملاحظات مهمة</h4>
              <ul>
                <li> إذا أعدت نشر الـ Script بعد تحديث الكود، استخدم <strong>Manage → New version → Deploy</strong> — رابط Web App URL لا يتغير</li>
                <li> في أول استخدام للـ Web App، سيطلب منك إذن — وافق لأنك أنت من أنشأه</li>
                <li> الـ API Key ليس له صلاحية تعديل — فقط لقراءة البيانات من الشيت (للاستيراد)</li>
                <li> الإرسال إلى الشيت يتم عبر الـ Web App (POST) — لا يحتاج API Key</li>
              </ul>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}
