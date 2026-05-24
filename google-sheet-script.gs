/**
 * Google Apps Script — رابط بين التطبيق و Google Sheets
 * 
 * طريقة الاستخدام:
 * 1. افتح Google Sheet جديد أو موجود
 * 2. اذهب إلى Extensions → Apps Script
 * 3. الصق هذا الكود بالكامل واحفظه (Ctrl+S)
 * 4. انشر: Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. انسخ الرابط (URL) وألصقه في التطبيق (الإعدادات ← Web App URL)
 * 
 * لاستيراد البيانات من الشيت:
 * - فعّل Google Sheets API في Google Cloud Console
 * - أنشئ API Key
 * - شارك الشيت: Anyone with link can view
 * - Spreadsheet ID: من رابط الشيت (الحرف بين /d/ و /edit)
 *   مثال: https://docs.google.com/spreadsheets/d/abc123/edit → abc123
 */

// ── استيراد البيانات من التطبيق إلى الشيت ──
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    var raw = null;

    // البيانات تأتي من form POST → e.parameter.payload
    if (e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    }
    // أو من raw JSON body
    else if (e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }

    if (!raw) throw new Error('لم يتم استلام بيانات (payload مفقود)');
    if (typeof raw === 'string') {
      // فك الترميز إذا كان URL-encoded
      if (raw.indexOf('%') !== -1) {
        raw = decodeURIComponent(raw);
      }
    }
    const data = JSON.parse(raw);

    // Sheet المعاملات
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

    // Sheet التصنيفات
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

    // Sheet قائمة الرغبات
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
}

// ── تصدير البيانات من الشيت إلى التطبيق ──
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();

    function sheetToJson(sheetName) {
      const s = sheet.getSheetByName(sheetName);
      if (!s) return [];
      const rows = s.getDataRange().getValues();
      if (rows.length < 2) return [];
      const headers = rows[0];
      const result = [];
      for (var i = 1; i < rows.length; i++) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = rows[i][j];
        }
        result.push(obj);
      }
      return result;
    }

    const data = {
      transactions: sheetToJson('Transactions'),
      categories: sheetToJson('Categories'),
      wishlist: sheetToJson('Wishlist'),
      exportedAt: new Date().toISOString(),
      version: 2,
    };

    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
