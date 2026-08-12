import { booksData } from "./books.js";
import { coursesData } from "./courses.js";

// Sample students for authentic transactions
const STUDENTS = [
  { name: "أحمد محمود علي", email: "ahmed.mahmoud@gmail.com", country: "مصر" },
  { name: "سارة خالد العتيبي", email: "sara.otbi@yahoo.com", country: "السعودية" },
  { name: "عمر فاروق الشمري", email: "omar.farouk@outlook.com", country: "الكويت" },
  { name: "فاطمة الزهراء حسن", email: "fatima.z@hotmail.com", country: "الإمارات" },
  { name: "عبد الله محمد الدوسري", email: "abdullah.dosari@gmail.com", country: "السعودية" },
  { name: "مريم يوسف الملا", email: "maryam.mulla@gmail.com", country: "قطر" },
  { name: "ياسين طارق القاسم", email: "yassin.qasim@gmail.com", country: "الأردن" },
  { name: "نورهان إبراهيم السيد", email: "nourhan.sayed@gmail.com", country: "مصر" },
  { name: "حمزة صالح الشهري", email: "hamza.shehri@gmail.com", country: "السعودية" },
  { name: "رانية خليل القحطاني", email: "rania.qahtani@yahoo.com", country: "السعودية" }
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "PayPal", "Apple Pay", "Mada"];

/**
 * Generate real deterministic transactions list synced with booksData AND coursesData
 */
function generateTransactionsFromProducts() {
  const transactions = [];
  let txIndex = 1001;
  let invIndex = 8001;

  const today = new Date();

  // 1. Generate realistic purchase transactions for Paid Books
  const paidBooks = booksData.filter(b => b.status === "published" && !b.isFree && b.price > 0);
  paidBooks.forEach(book => {
    const count = Math.min(book.purchases || 10, 15);
    for (let i = 0; i < count; i++) {
      const student = STUDENTS[(txIndex + i) % STUDENTS.length];
      const method = PAYMENT_METHODS[(txIndex + i) % PAYMENT_METHODS.length];
      const daysAgo = (i * 3 + (txIndex % 5));
      const txDate = new Date(today);
      txDate.setDate(today.getDate() - daysAgo);

      const price = book.discountPrice && book.discountPrice > 0 ? book.discountPrice : book.price;
      const discount = book.discountPrice && book.discountPrice > 0 ? (book.price - book.discountPrice) : 0;
      const platformFee = Math.round(price * 0.10 * 100) / 100;
      const tax = Math.round(price * 0.05 * 100) / 100;
      const netRevenue = Math.round((price - platformFee - tax) * 100) / 100;

      let status = "Completed";
      if (i === 1 && daysAgo < 3) status = "Pending";
      if (i === 4 && daysAgo < 10) status = "Failed";

      transactions.push({
        id: `TXN-${txIndex++}`,
        invoiceNo: `INV-${new Date().getFullYear()}-${invIndex++}`,
        date: txDate.toISOString(),
        studentName: student.name,
        studentEmail: student.email,
        bookId: book.id,
        bookName: book.title,
        bookImage: book.image,
        productType: "Book",
        productCategory: book.category || "عام",
        paymentMethod: method,
        country: student.country,
        currency: book.currency || "USD",
        price: book.price,
        discount: discount,
        platformFee: platformFee,
        tax: tax,
        netRevenue: netRevenue,
        status: status,
        notes: `عملية شراء ناجحة لكتاب ${book.title} عبر بوابة الدفع ${method}.`
      });
    }
  });

  // 2. Generate realistic purchase transactions for Paid Courses
  const paidCourses = coursesData.filter(c => c.price > 0);
  paidCourses.forEach(course => {
    const count = Math.min(Math.floor((course.students || 100) / 80) + 5, 12);
    for (let i = 0; i < count; i++) {
      const student = STUDENTS[(txIndex + i) % STUDENTS.length];
      const method = PAYMENT_METHODS[(txIndex + i) % PAYMENT_METHODS.length];
      const daysAgo = (i * 4 + (txIndex % 7));
      const txDate = new Date(today);
      txDate.setDate(today.getDate() - daysAgo);

      const price = course.price;
      const discount = 0;
      const platformFee = Math.round(price * 0.10 * 100) / 100;
      const tax = Math.round(price * 0.05 * 100) / 100;
      const netRevenue = Math.round((price - platformFee - tax) * 100) / 100;

      let status = "Completed";
      if (i === 2 && daysAgo < 5) status = "Pending";

      transactions.push({
        id: `TXN-${txIndex++}`,
        invoiceNo: `INV-${new Date().getFullYear()}-${invIndex++}`,
        date: txDate.toISOString(),
        studentName: student.name,
        studentEmail: student.email,
        bookId: course.id,
        bookName: course.title,
        bookImage: course.image,
        productType: "Course",
        productCategory: course.category || "برمجة",
        paymentMethod: method,
        country: student.country,
        currency: "USD",
        price: price,
        discount: discount,
        platformFee: platformFee,
        tax: tax,
        netRevenue: netRevenue,
        status: status,
        notes: `عملية تسجيل ودفع دورة تعليمية: ${course.title} عبر ${method}.`
      });
    }
  });

  // 3. Add Refund transactions
  const refundBook = paidBooks[0];
  if (refundBook) {
    transactions.push({
      id: `TXN-${txIndex++}`,
      invoiceNo: `INV-${new Date().getFullYear()}-${invIndex++}`,
      date: new Date(today.getTime() - 2 * 86400000).toISOString(),
      studentName: "خالد بن سلمان",
      studentEmail: "khaled.s@gmail.com",
      bookId: refundBook.id,
      bookName: refundBook.title,
      bookImage: refundBook.image,
      productType: "Book",
      productCategory: refundBook.category || "عام",
      type: "Refund",
      paymentMethod: "Visa",
      country: "السعودية",
      currency: "USD",
      price: refundBook.price,
      discount: 0,
      platformFee: 0,
      tax: 0,
      netRevenue: -refundBook.price,
      status: "Refunded",
      notes: "تم قبول طلب استرداد المبلغ للطالب بناءً على سياسة الضمان 14 يوماً."
    });
  }

  const refundCourse = paidCourses[0];
  if (refundCourse) {
    transactions.push({
      id: `TXN-${txIndex++}`,
      invoiceNo: `INV-${new Date().getFullYear()}-${invIndex++}`,
      date: new Date(today.getTime() - 4 * 86400000).toISOString(),
      studentName: "منى عبد العزيز",
      studentEmail: "mona.abdul@gmail.com",
      bookId: refundCourse.id,
      bookName: refundCourse.title,
      bookImage: refundCourse.image,
      productType: "Course",
      productCategory: refundCourse.category || "برمجة",
      type: "Refund",
      paymentMethod: "Mastercard",
      country: "الإمارات",
      currency: "USD",
      price: refundCourse.price,
      discount: 0,
      platformFee: 0,
      tax: 0,
      netRevenue: -refundCourse.price,
      status: "Refunded",
      notes: "طلب استرداد رسوم الدورة ضمن مهلة الـ 7 أيام."
    });
  }

  // 4. Add Withdrawals, Bonuses, Cancellations
  transactions.push({
    id: `TXN-${txIndex++}`,
    invoiceNo: `WITHDRAW-${invIndex++}`,
    date: new Date(today.getTime() - 15 * 86400000).toISOString(),
    studentName: "-",
    studentEmail: "-",
    bookId: null,
    bookName: "سحب أرباح إلى الحساب البنكي الرئيسي",
    bookImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100",
    productType: "System",
    productCategory: "سحب",
    type: "Withdrawal",
    paymentMethod: "Bank Transfer",
    country: "مصر",
    currency: "USD",
    price: 5000,
    discount: 0,
    platformFee: 0,
    tax: 0,
    netRevenue: -5000,
    status: "Completed",
    notes: "تم تحويل المبلغ بنجاح إلى حساب الـ IBAN الخاص بالمعلم."
  });

  transactions.push({
    id: `TXN-${txIndex++}`,
    invoiceNo: `WITHDRAW-${invIndex++}`,
    date: new Date(today.getTime() - 1 * 86400000).toISOString(),
    studentName: "-",
    studentEmail: "-",
    bookId: null,
    bookName: "طلب سحب أرباح جديد",
    bookImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100",
    productType: "System",
    productCategory: "سحب",
    type: "Withdrawal",
    paymentMethod: "PayPal",
    country: "السعودية",
    currency: "USD",
    price: 1500,
    discount: 0,
    platformFee: 0,
    tax: 0,
    netRevenue: -1500,
    status: "Pending",
    notes: "طلب سحب قيد المراجعة والتحقق بواسطة قسم المالية."
  });

  transactions.push({
    id: `TXN-${txIndex++}`,
    invoiceNo: `WITHDRAW-${invIndex++}`,
    date: new Date(today.getTime() - 40 * 86400000).toISOString(),
    studentName: "-",
    studentEmail: "-",
    bookId: null,
    bookName: "طلب سحب ملغى",
    bookImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100",
    productType: "System",
    productCategory: "سحب",
    type: "Withdrawal Cancelled",
    paymentMethod: "Bank Transfer",
    country: "السعودية",
    currency: "USD",
    price: 800,
    discount: 0,
    platformFee: 0,
    tax: 0,
    netRevenue: 0,
    status: "Cancelled",
    notes: "تم إلغاء طلب السحب بطلب من المعلم وتم إعادة المبلغ لرصيد الحساب."
  });

  transactions.push({
    id: `TXN-${txIndex++}`,
    invoiceNo: `BONUS-${invIndex++}`,
    date: new Date(today.getTime() - 10 * 86400000).toISOString(),
    studentName: "-",
    studentEmail: "-",
    bookId: null,
    bookName: "مكافأة المعلم الأكثر مبيعاً لهذا الشهر",
    bookImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=100",
    productType: "System",
    productCategory: "حافز",
    type: "Bonus",
    paymentMethod: "Platform Wallet",
    country: "الإمارات",
    currency: "USD",
    price: 250,
    discount: 0,
    platformFee: 0,
    tax: 0,
    netRevenue: 250,
    status: "Completed",
    notes: "حافز تشجيعي لتحقيق أعلى نسبة رضا قراء ومبيعات كتب ودورات."
  });

  // Sort by date descending
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export const transactionsData = generateTransactionsFromProducts();

