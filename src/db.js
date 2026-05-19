const DB_NAME = 'PersonalFinanceDB';
const DB_VERSION = 2;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains('transactions')) {
        const store = database.createObjectStore('transactions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }

      if (!database.objectStoreNames.contains('categories')) {
        const store = database.createObjectStore('categories', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function doRequest(storeName, mode, callback) {
  return new Promise(async (resolve, reject) => {
    const database = await openDB();
    const tx = database.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA-u-nu-latn', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Transactions ──

export async function addTransaction(transaction) {
  return doRequest('transactions', 'readwrite', (store) =>
    store.add({ ...transaction, createdAt: new Date().toISOString() })
  );
}

export async function getAllTransactions() {
  return doRequest('transactions', 'readonly', (store) => store.getAll());
}

export async function deleteTransaction(id) {
  return doRequest('transactions', 'readwrite', (store) => store.delete(id));
}

export async function getBalance() {
  const transactions = await getAllTransactions();
  let total = 0;
  for (const t of transactions) {
    total += t.type === 'income' ? t.amount : -t.amount;
  }
  return total;
}

export async function getIncomeExpense() {
  const transactions = await getAllTransactions();
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

// ── Categories ──

export async function addCategory(category) {
  return doRequest('categories', 'readwrite', (store) => store.add(category));
}

export async function getAllCategories() {
  return doRequest('categories', 'readonly', (store) => store.getAll());
}

export async function deleteCategory(id) {
  const categories = await getAllCategories();
  const cat = categories.find((c) => c.id === id);
  if (!cat) return;

  const transactions = await getAllTransactions();
  const inUse = transactions.some((t) => t.category === cat.name);
  if (inUse) {
    throw new Error('لا يمكن حذف تصنيف مستخدم في معاملات موجودة');
  }

  return doRequest('categories', 'readwrite', (store) => store.delete(id));
}

// ── Export / Import ──

export async function exportAllData() {
  const [transactions, categories] = await Promise.all([
    getAllTransactions(),
    getAllCategories(),
  ]);
  return {
    transactions,
    categories,
    exportedAt: new Date().toISOString(),
    version: 1,
  };
}

export async function importAllData(data) {
  const database = await openDB();
  const tx = database.transaction(['transactions', 'categories'], 'readwrite');

  await new Promise((resolve, reject) => {
    const req = tx.objectStore('transactions').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  for (const item of data.transactions || []) {
    await new Promise((resolve, reject) => {
      const req = tx.objectStore('transactions').put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  await new Promise((resolve, reject) => {
    const req = tx.objectStore('categories').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  for (const item of data.categories || []) {
    await new Promise((resolve, reject) => {
      const req = tx.objectStore('categories').put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function seedCategories() {
  const existing = await getAllCategories();
  if (existing.length > 0) return existing;

  const defaults = [
    { name: 'راتب', type: 'income' },
    { name: 'عمل حر', type: 'income' },
    { name: 'استثمارات', type: 'income' },
    { name: 'هدية', type: 'income' },
    { name: 'أخرى (دخل)', type: 'income' },
    { name: 'طعام', type: 'expense' },
    { name: 'مواصلات', type: 'expense' },
    { name: 'إيجار', type: 'expense' },
    { name: 'فواتير', type: 'expense' },
    { name: 'ترفيه', type: 'expense' },
    { name: 'صحة', type: 'expense' },
    { name: 'تسوق', type: 'expense' },
    { name: 'تعليم', type: 'expense' },
    { name: 'أخرى (مصروف)', type: 'expense' },
  ];

  for (const cat of defaults) {
    await addCategory(cat);
  }
  return defaults;
}
