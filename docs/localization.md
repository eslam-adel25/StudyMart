# StudyMart — Localization & Internationalization (i18n)

This document describes the internationalization architecture, language configuration, and RTL formatting rules applied across StudyMart.

---

## 1. Primary Language Configuration

StudyMart is natively built in **Arabic (`ar`)** as the primary interface language.

### Primary HTML Document Configuration (`index.html`):
```html
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StudyMart — منصة الدورات والكتب</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />
  </head>
</html>
```

---

## 2. Arabic Domain Terminology Matrix

To maintain linguistic consistency across all user roles and management modules, StudyMart enforces standardized Arabic terminology:

| English Architectural Concept | Official Arabic Interface Term | Usage Context |
|---|---|---|
| Platform Owner | مالك المنصة | Platform Administrator role |
| Platform Management | إدارة المنصة | Platform Owner sidebar menu title |
| Homepage Management | إدارة الصفحة الرئيسية | Owner landing page editor |
| Student Management | إدارة الطلاب | Owner student accounts table |
| Teacher Management | إدارة المعلمين | Owner instructor accounts table |
| Block Account | حظر الحساب | Action to restrict student access |
| Suspend Account | إيقاف الحساب | Action to restrict teacher access |
| Course Builder | إنشاء دورة جديدة | Teacher course creation wizard |
| Digital Book Builder | إضافة كتاب جديد | Teacher book publishing wizard |
| Question Bank | بنك الأسئلة | Reusable quiz question bank |
| Payout Requests | طلبات السحب | Teacher wallet withdrawal requests |
| Commission (10%) | عمولة المنصة (10%) | Net platform revenue calculation |

---

## 3. Date, Currency & Number Formatting

### Currency Formatting:
- Prices across courses, books, wallet balances, and receipts are formatted in **Egyptian Pounds (ج.م / EGP)**:
```javascript
export function formatCurrency(amount) {
  return `${Number(amount).toLocaleString("ar-EG")} ج.م`;
}
```

### Date Formatting:
- Timestamps and order dates are formatted using standard Arabic locale strings (`ar-EG`):
```javascript
export function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('ar-EG', options);
}
```
