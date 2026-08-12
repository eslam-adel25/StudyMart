import QRCode from "qrcode";
import html2pdf from "html2pdf.js";
import { transactionsData } from "../data/transactions.js";
import { showCustomAlert } from "../utils/helpers.js";

/**
 * Generate Base64 Data URL for QR Code containing Invoice verification metadata
 */
export async function generateInvoiceQRCode(invoiceNo, txId, amount, verificationUrl) {
  const payload = `InvoiceNo: ${invoiceNo}\nTxID: ${txId}\nTotal: $${amount}\nVerify: ${verificationUrl || `https://studymart.com/verify/${invoiceNo}`}`;
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      margin: 1,
      width: 130,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
    return dataUrl;
  } catch (err) {
    console.error("QR Code Generation Error:", err);
    // Fallback simple SVG QR placeholder if needed
    return "";
  }
}

/**
 * Get Arabic translation for transaction status
 */
function getStatusBadgeData(status) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "completed":
    case "paid":
      return { label: "مدفوعة / مكتملة", bg: "#dcfce7", color: "#15803d", border: "#86efac", icon: "✓" };
    case "pending":
      return { label: "معلقة (قيد المعالجة)", bg: "#fef3c7", color: "#b45309", border: "#fde68a", icon: "⏳" };
    case "refunded":
      return { label: "مستردة (Refunded)", bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe", icon: "↩" };
    case "cancelled":
      return { label: "ملغاة (Cancelled)", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", icon: "✕" };
    case "failed":
      return { label: "فاشلة (Failed)", bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5", icon: "⚠️" };
    default:
      return { label: status || "غير معروف", bg: "#f1f5f9", color: "#334155", border: "#cbd5e1", icon: "ℹ" };
  }
}

/**
 * Generate complete professional Invoice HTML structure conforming to Stripe/PayPal/Udemy standards
 */
export async function buildInvoiceHTMLString(tx) {
  if (!tx) return "";

  const invoiceNo = tx.invoiceNo || `INV-${tx.id}`;
  const txId = tx.id;
  const qrCodeUrl = await generateInvoiceQRCode(
    invoiceNo,
    txId,
    tx.total || Math.max(0, (tx.price || 0) - (tx.discount || 0)),
    `https://studymart.com/verify/${invoiceNo}`
  );
  const statusBadge = getStatusBadgeData(tx.status);

  const issueDate = tx.date
    ? new Date(tx.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const paymentDate = tx.date
    ? new Date(tx.date).toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const genTime = new Date().toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // Buyer & Seller details
  const buyerName = tx.studentName || tx.buyerName || "أحمد محمود علي";
  const buyerEmail = tx.studentEmail || tx.buyerEmail || "student@studymart.com";
  const buyerPhone = tx.studentPhone || tx.buyerPhone || "+966 50 123 4567";
  const buyerCountry = tx.country || tx.buyerCountry || "السعودية";
  const buyerCity = tx.studentCity || tx.buyerCity || "الرياض";
  const buyerAddress = tx.billingAddress || tx.buyerAddress || "شارع العليا العام - المجمع المالي";
  const buyerAccountId = tx.accountID || tx.buyerAccountId || `STD-${Math.abs(String(txId).replace(/\D/g, '') || '9012')}`;

  const teacherName = tx.teacherName || tx.sellerName || "د. محمد أحمد العتيبي";
  const teacherEmail = tx.teacherEmail || tx.sellerEmail || "teacher@studymart.com";
  const teacherId = tx.teacherId || tx.sellerId || "TCH-2024-88";

  // Items processing for single or multiple items
  const itemsArray = (tx.items && tx.items.length > 0)
    ? tx.items
    : [{
        id: tx.id,
        title: tx.bookName || tx.productName || "عنوان الدورة أو الكتاب",
        productType: tx.productType || "Course",
        productCategory: tx.productCategory || "عام",
        price: tx.price || 0,
        discount: tx.discount || 0,
        tax: tx.tax || Math.round((tx.price || 0) * 0.05 * 100) / 100,
        finalPrice: tx.total || Math.max(0, (tx.price || 0) - (tx.discount || 0)),
        image: tx.bookImage || "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300",
        instructor: teacherName
      }];

  let totalOriginalPrice = 0;
  let totalDiscountAmt = 0;
  let totalTaxVal = 0;
  let totalFinalPaid = 0;

  itemsArray.forEach(item => {
    const q = item.qty || item.quantity || 1;
    const orig = item.price || item.originalPrice || 0;
    const disc = item.discount || 0;
    const tax = item.tax || 0;
    const fin = item.finalPrice || Math.max(0, orig - disc);

    totalOriginalPrice += orig * q;
    totalDiscountAmt += disc * q;
    totalTaxVal += tax * q;
    totalFinalPaid += fin * q;
  });

  if (tx.price) totalOriginalPrice = tx.price;
  if (tx.discount) totalDiscountAmt = tx.discount;
  if (tx.tax) totalTaxVal = tx.tax;
  if (tx.total) totalFinalPaid = tx.total;

  const originalPriceStr = totalOriginalPrice.toFixed(2);
  const discountAmtStr = totalDiscountAmt.toFixed(2);
  const taxValStr = totalTaxVal.toFixed(2);
  const paidTotalStr = totalFinalPaid.toFixed(2);

  const platformFeeVal = tx.platformFee !== undefined ? tx.platformFee : Math.round(totalOriginalPrice * 0.10 * 100) / 100;
  const platformFeeStr = platformFeeVal.toFixed(2);

  const netRevenueVal = tx.netRevenue !== undefined ? tx.netRevenue : Math.max(0, totalFinalPaid - platformFeeVal - totalTaxVal);
  const netRevenueStr = netRevenueVal.toFixed(2);

  // Render Table Rows
  const tableRowsHTML = itemsArray.map((item, idx) => {
    const itemTitle = item.title || item.bookName || item.name || "منتج رقمي";
    const isCourseItem = item.productType === "Course" || item.type === "course";
    const isBookItem = item.productType === "Book" || item.type === "book";
    const typeLabel = isCourseItem ? "🎓 دورة تدريبية" : (isBookItem ? "📚 كتاب رقمي" : (item.productType || "منتج رقمي"));
    const itemQty = item.qty || item.quantity || 1;
    const itemOrig = (item.price || item.originalPrice || 0).toFixed(2);
    const itemDisc = (item.discount || 0).toFixed(2);
    const itemTax = (item.tax || 0).toFixed(2);
    const itemTotal = (item.finalPrice || Math.max(0, (item.price || item.originalPrice || 0) - (item.discount || 0))).toFixed(2);

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 14px 12px; font-weight: 700; color: #64748b;">${idx + 1}</td>
        <td style="padding: 14px 12px; font-weight: 800; color: #0f172a;">${itemTitle}</td>
        <td style="padding: 14px 12px; color: #475569;">${typeLabel}</td>
        <td style="padding: 14px 12px; text-align: center; font-weight: 700;">${itemQty}</td>
        <td style="padding: 14px 12px; font-weight: 700;">$${itemOrig}</td>
        <td style="padding: 14px 12px; color: #dc2626; font-weight: 700;">-$${itemDisc}</td>
        <td style="padding: 14px 12px; color: #64748b;">$${itemTax}</td>
        <td style="padding: 14px 12px; text-align: left; font-weight: 900; color: #059669; font-size: 14px;">$${itemTotal}</td>
      </tr>
    `;
  }).join('');

  // Render Item Details Card Header
  const itemDetailsCardHTML = itemsArray.length === 1 ? `
    <div style="display: flex; gap: 18px; align-items: center;">
      <img src="${itemsArray[0].image || itemsArray[0].bookImage || tx.bookImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300'}" alt="Cover" style="width: 70px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);" />
      <div style="flex: 1;">
        <div style="display: inline-block; background: #f3e8ff; color: #6d28d9; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px; margin-bottom: 6px;">
          ${(itemsArray[0].productType === 'Course' || itemsArray[0].type === 'course') ? '🎓 دورة تدريبية' : '📚 كتاب رقمي'}
        </div>
        <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 800; color: #0f172a;">${itemsArray[0].title || itemsArray[0].bookName || tx.bookName || 'عنوان المنتج الرقمي'}</h3>
        <div style="font-size: 12px; color: #64748b; display: flex; gap: 16px; flex-wrap: wrap;">
          <span>التصنيف: <b>${itemsArray[0].productCategory || itemsArray[0].category || tx.productCategory || 'عام'}</b></span>
          <span>اللغة: <b>العربية (Arabic)</b></span>
          <span>المحاضر / المؤلف: <b>${itemsArray[0].instructor || teacherName}</b></span>
        </div>
      </div>
    </div>
  ` : `
    <div style="display: flex; gap: 18px; align-items: center;">
      <div style="display: flex; position: relative; width: 90px; height: 85px; align-items: center; justify-content: flex-start;">
        ${itemsArray.slice(0, 3).map((it, idx) => `
          <img src="${it.image || it.bookImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300'}" style="position: absolute; right: ${idx * 16}px; top: ${idx * 4}px; width: 55px; height: 72px; object-fit: cover; border-radius: 6px; border: 1.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.12); z-index: ${3 - idx};" />
        `).join('')}
      </div>
      <div style="flex: 1; padding-right: 10px;">
        <div style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px; margin-bottom: 6px;">
          📦 سلة مشتريات متعددة (${itemsArray.length} عناصر)
        </div>
        <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 800; color: #0f172a;">طلب شراء متكامل (${itemsArray.length} منتجات ورقمية)</h3>
        <div style="font-size: 12px; color: #64748b; display: flex; gap: 16px; flex-wrap: wrap;">
          <span>عدد العناصر: <b>${itemsArray.length} عناصر</b></span>
          <span>منصة التعلم: <b>StudyMart Technologies Ltd.</b></span>
          <span>نوع الطلب: <b>دورات تعليمية وكتب إلكترونية</b></span>
        </div>
      </div>
    </div>
  `;

  return `
    <div id="invoicePrintArea" class="invoice-a4-document" dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, system-ui; background: #ffffff; color: #0f172a; padding: 36px 40px; max-width: 850px; margin: 0 auto; box-sizing: border-box; position: relative;">
      
      <!-- TOP ACCENT BAR -->
      <div style="height: 6px; background: linear-gradient(90deg, #6d28d9 0%, #2563eb 50%, #10b981 100%); margin-bottom: 24px; border-radius: 3px;"></div>

      <!-- INVOICE HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
        <div>
          <!-- BRAND LOGO -->
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #6d28d9, #4c1d95); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 22px; font-weight: 900; box-shadow: 0 4px 10px rgba(109,40,217,0.25);">
              S
            </div>
            <div>
              <span style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Study<span style="color: #6d28d9;">Mart</span></span>
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">منصة التعلم الرقمي والكتب الإلكترونية الشاملة</div>
            </div>
          </div>
        </div>

        <!-- INVOICE METADATA & STATUS -->
        <div style="text-align: left;" dir="ltr">
          <div style="margin-bottom: 6px;">
            <span style="display: inline-flex; align-items: center; gap: 6px; background: ${statusBadge.bg}; color: ${statusBadge.color}; border: 1px solid ${statusBadge.border}; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 800;">
              <span>${statusBadge.icon}</span> ${statusBadge.label}
            </span>
          </div>
          <h2 style="margin: 6px 0 2px 0; font-size: 20px; font-weight: 900; color: #0f172a;">INVOICE</h2>
          <div style="font-size: 13px; color: #475569; font-weight: 700;"># ${invoiceNo}</div>
        </div>
      </div>

      <!-- SECONDARY HEADER & QR CODE ROW -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 24px; margin-bottom: 28px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; flex: 1;">
          <div>
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">رقم المعاملة (TxID)</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${txId}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">تاريخ الإصدار</div>
            <div style="font-size: 13px; font-weight: 700; color: #334155;">${issueDate}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">توقيت الدفع</div>
            <div style="font-size: 13px; font-weight: 700; color: #334155;">${paymentDate}</div>
          </div>
        </div>

        <!-- QR CODE -->
        ${qrCodeUrl ? `
          <div style="text-align: center; border-right: 1px dashed #cbd5e1; padding-right: 20px; margin-right: 10px;">
            <img src="${qrCodeUrl}" alt="QR Verification" style="width: 75px; height: 75px; border-radius: 6px; border: 1px solid #cbd5e1; display: block;" />
            <span style="font-size: 9px; color: #64748b; font-weight: 700; display: block; margin-top: 2px;">رمز التحقق الرقمي</span>
          </div>
        ` : ''}
      </div>

      <!-- BUYER & SELLER INFORMATION CARDS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;">
        <!-- BUYER INFO -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="font-size: 12px; font-weight: 800; color: #6d28d9; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>👤</span> بيانات المشتري (Buyer Information)
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${buyerName}</div>
          <div style="font-size: 13px; color: #2563eb; font-weight: 600; margin-bottom: 8px;">${buyerEmail}</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.6;">
            <div><b>الهاتف:</b> ${buyerPhone}</div>
            <div><b>الدولة والمدينة:</b> ${buyerCountry} - ${buyerCity}</div>
            <div><b>العنوان المسجل:</b> ${buyerAddress}</div>
            <div><b>معرف الحساب:</b> ${buyerAccountId}</div>
          </div>
        </div>

        <!-- SELLER INFO -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>🏫</span> بيانات البائع والمنصة (Seller Details)
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${teacherName}</div>
          <div style="font-size: 13px; color: #059669; font-weight: 600; margin-bottom: 8px;">${teacherEmail}</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.6;">
            <div><b>رقم المدرس / المعرف:</b> ${teacherId}</div>
            <div><b>اسم المنصة:</b> StudyMart Technologies Ltd.</div>
            <div><b>دعم العملاء:</b> support@studymart.com</div>
            <div><b>الموقع الإلكتروني:</b> https://studymart.com</div>
          </div>
        </div>
      </div>

      <!-- PURCHASE & ITEM DETAILS -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 28px;">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
          📦 تفاصيل المنتج موضوع الشراء
        </div>
        ${itemDetailsCardHTML}
      </div>

      <!-- ORDER ITEMS TABLE -->
      <div style="margin-bottom: 28px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: right;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 800;">
              <th style="padding: 12px; width: 40px;">#</th>
              <th style="padding: 12px;">البند / المنتج</th>
              <th style="padding: 12px;">النوع</th>
              <th style="padding: 12px; text-align: center;">الكمية</th>
              <th style="padding: 12px;">السعر الأساسي</th>
              <th style="padding: 12px;">الخصم</th>
              <th style="padding: 12px;">الضريبة</th>
              <th style="padding: 12px; text-align: left;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
      </div>

      <!-- PAYMENT METHOD & FINANCIAL BREAKDOWN GRID -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; align-items: flex-start;">
        <!-- PAYMENT GATEWAY DETAILS -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            💳 تفاصيل وسيلة وتدفق الدفع
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">وسيلة الدفع:</span>
              <span style="font-weight: 800; color: #0f172a;">${tx.paymentMethod || 'Visa Card'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">نوع البطاقة:</span>
              <span style="font-weight: 700;">${tx.paymentMethod || 'Visa / Mastercard'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">العملة الأساسية:</span>
              <span style="font-weight: 700;">USD ($)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">سعر الصرف المطبق:</span>
              <span style="font-weight: 700;">1 USD = 3.75 SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">بوابة الدفع الإلكتروني:</span>
              <span style="font-weight: 700; color: #2563eb;">Stripe Secure Gateway</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">الرقم المرجعي للبوابة:</span>
              <span style="font-weight: 700;">REF-${Math.floor(10000000 + Math.random() * 90000000)}</span>
            </div>
          </div>
        </div>

        <!-- FINANCIAL SUMMARY BREAKDOWN -->
        <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
            💵 الجدول المالي الحسابي
          </div>
          <div style="font-size: 13px; color: #334155; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">السعر الأصلي (Subtotal):</span>
              <span style="font-weight: 700;">$${originalPriceStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #dc2626;">الخصم المطبق (Discount):</span>
              <span style="font-weight: 700; color: #dc2626;">-$${discountAmtStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">كوبون التخفيض (Coupon):</span>
              <span style="font-weight: 700; color: #059669;">${tx.couponCode ? tx.couponCode + ' (فعال)' : (totalDiscountAmt > 0 ? 'STUDY15 (-15%)' : '—')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <span style="color: #64748b;">عمولة المنصة (Platform Fee - 10%):</span>
              <span style="font-weight: 700; color: #64748b;">-$${platformFeeStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">الضريبة المضافة (VAT - 5%):</span>
              <span style="font-weight: 700; color: #64748b;">-$${taxValStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6d28d9; font-weight: 700;">صافي المعاملة (Net Amount):</span>
              <span style="font-weight: 800; color: #6d28d9;">$${netRevenueStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 10px; margin-top: 6px; border-top: 2px solid #0f172a; font-size: 16px;">
              <span style="font-weight: 900; color: #0f172a;">المبلغ الإجمالي النهائي (Total Paid):</span>
              <span style="font-weight: 900; color: #059669; font-size: 18px;">$${paidTotalStr}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER & LEGAL DISCLAIMER -->
      <div style="border-top: 2px solid #f1f5f9; padding-top: 18px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.7;">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          🎉 شكراً لتسوقك وتعلمك عبر منصة StudyMart!
        </div>
        <div>هذه الفاتورة مستند مالي مديوني معتمد ومولد آلياً بواسطة نظام StudyMart للدفوعات ولا تتطلب توقيعاً يدوياً.</div>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 8px; font-weight: 700; color: #475569;">
          <span>الدعم الفني: support@studymart.com</span>
          <span>الموقع: https://studymart.com</span>
          <span>سياسة الخصوصية والشروط</span>
        </div>
        <div style="margin-top: 8px; color: #94a3b8; font-size: 10px; display: flex; justify-content: space-between;">
          <span>تاريخ توليد الفاتورة: ${genTime}</span>
          <span>StudyMart Invoice Engine v2.4</span>
          <span>صفحة 1 من 1</span>
        </div>
      </div>

    </div>
  `;
}

/**
 * Open interactive Print/Download Invoice modal dialog
 */
export async function openInvoiceModal(txOrId) {
  let tx = null;
  if (typeof txOrId === "object" && txOrId !== null) {
    tx = txOrId;
  } else if (typeof txOrId === "string" || typeof txOrId === "number") {
    tx = transactionsData.find(t => t.id === String(txOrId) || t.id === `TXN-${txOrId}` || t.invoiceNo === String(txOrId));
    if (!tx && String(txOrId).includes("ORD-")) {
      tx = {
        id: `TXN-${Math.abs(String(txOrId).replace(/\D/g, '') || '20241548')}`,
        invoiceNo: String(txOrId).replace('#', ''),
        status: 'Completed',
        date: new Date().toISOString(),
        studentName: window.appState?.userData?.name || 'إسلام عادل',
        studentEmail: window.appState?.userData?.email || 'student@gmail.com',
        studentPhone: '+966 50 123 4567',
        country: 'السعودية',
        studentCity: 'الرياض',
        billingAddress: 'شارع العليا العام - المجمع المالي',
        accountID: 'STD-9012',
        teacherName: 'د. محمد أحمد العتيبي',
        teacherEmail: 'teacher@studymart.com',
        teacherId: 'TCH-2024-88',
        paymentMethod: 'بطاقة ائتمانية (Visa / MasterCard)',
        price: 150.00,
        discount: 20.00,
        tax: 19.50,
        platformFee: 15.00,
        netRevenue: 115.00,
        total: 149.50,
        items: [
          {
            id: 1,
            title: 'دورة البرمجة بلغة جافاسكريبت الحديثة',
            productType: 'Course',
            productCategory: 'تطوير البرمجيات',
            price: 150.00,
            discount: 20.00,
            tax: 19.50,
            finalPrice: 130.00,
            image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300',
            instructor: 'د. محمد أحمد العتيبي'
          }
        ]
      };
    }
  }

  if (!tx) {
    showCustomAlert("عذراً، المعاملة المالية غير موجودة.");
    return;
  }

  // Save current scroll position & body styles
  const originalOverflow = document.body.style.overflow;
  const originalOverscroll = document.body.style.overscrollBehavior;
  const scrollY = window.scrollY;

  // Clean close function to restore background scroll state
  const closeModal = () => {
    const existingModal = document.getElementById("invoiceModalContainer");
    if (existingModal) existingModal.remove();
    document.body.style.overflow = originalOverflow;
    document.body.style.overscrollBehavior = originalOverscroll;
    window.scrollTo(0, scrollY);
    document.removeEventListener("keydown", handleKeyDown);
  };

  // Remove existing modal if open
  const existingModal = document.getElementById("invoiceModalContainer");
  if (existingModal) existingModal.remove();

  // Lock background body scroll
  document.body.style.overflow = "hidden";
  document.body.style.overscrollBehavior = "none";

  const invoiceHTML = await buildInvoiceHTMLString(tx);

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "invoiceModalContainer";
  modalOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px);
    z-index: 99999; display: flex; justify-content: center; align-items: center;
    padding: 20px; box-sizing: border-box; overscroll-behavior: contain;
  `;

  modalOverlay.innerHTML = `
    <div id="invoiceModalBox" style="width: 100%; max-width: 890px; height: calc(100vh - 40px); display: flex; flex-direction: column; gap: 12px; box-sizing: border-box;">
      
      <!-- FIXED HEADER WITH ACTION BUTTONS -->
      <div style="width: 100%; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); color: #ffffff; flex-shrink: 0; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">📄</span>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #ffffff;">معاينة وسحب الفاتورة الرسمية #${tx.invoiceNo || tx.id}</h3>
            <span style="font-size: 12px; color: #94a3b8;">جاهزة للطباعة والتنزيل بصيغة PDF المعتمدة</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="btnDoPrint" type="button" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            🖨️ طباعة الفاتورة
          </button>
          <button id="btnDoDownload" type="button" style="background: linear-gradient(135deg, #059669, #047857); color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            💾 تحميل PDF
          </button>
          <button id="btnCloseInvoice" type="button" style="background: #334155; color: #f8fafc; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">
            ✖ إغلاق
          </button>
        </div>
      </div>

      <!-- SCROLLABLE INVOICE CONTENT AREA -->
      <div id="invoiceScrollContainer" tabindex="0" style="width: 100%; flex: 1; min-height: 0; background: #ffffff; border-radius: 16px; overflow-y: auto; overscroll-behavior: contain; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid #e2e8f0; outline: none; box-sizing: border-box;">
        ${invoiceHTML}
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Stop scroll events from propagating to background page
  modalOverlay.addEventListener("wheel", (e) => {
    e.stopPropagation();
  }, { passive: false });

  modalOverlay.addEventListener("touchmove", (e) => {
    e.stopPropagation();
  }, { passive: false });

  // Backdrop click to close
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // Focus scroll container for keyboard navigation
  const scrollContainer = document.getElementById("invoiceScrollContainer");
  if (scrollContainer) {
    scrollContainer.focus();
  }

  // Attach button listeners
  document.getElementById("btnDoPrint")?.addEventListener("click", () => {
    printInvoiceDocument(tx);
  });

  document.getElementById("btnDoDownload")?.addEventListener("click", () => {
    downloadInvoicePDFDocument(tx);
  });

  document.getElementById("btnCloseInvoice")?.addEventListener("click", () => {
    closeModal();
  });
}

/**
 * Execute real print dialog
 */
export async function printInvoiceDocument(tx) {
  try {
    const invoiceHTML = await buildInvoiceHTMLString(tx);
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      // Fallback to in-page window.print()
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة رقم ${tx.invoiceNo || tx.id} - StudyMart</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { margin: 0; padding: 0; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${invoiceHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error("Print Error:", err);
    showCustomAlert("حدث خطأ أثناء إعداد الطباعة. يرجى المحاولة مرة أخرى.");
  }
}

/**
 * Execute real PDF download using html2pdf.js
 */
export async function downloadInvoicePDFDocument(tx) {
  try {
    const invoiceHTML = await buildInvoiceHTMLString(tx);
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "800px";
    tempDiv.innerHTML = invoiceHTML;
    document.body.appendChild(tempDiv);

    const invoiceElem = tempDiv.querySelector("#invoicePrintArea") || tempDiv;

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `invoice-${tx.invoiceNo || tx.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(invoiceElem).set(opt).save();

    document.body.removeChild(tempDiv);
    showCustomAlert(`تم تنزيل الفاتورة (${tx.invoiceNo || tx.id}) بنجاح!`);
  } catch (err) {
    console.error("PDF Download Error:", err);
    showCustomAlert("حدث خطأ أثناء إنشاء ملف PDF. جاري تحويلك للطباعة المباشرة...");
    printInvoiceDocument(tx);
  }
}

/* ==========================================================================
   EXPORT TRANSACTIONS PDF REPORT ENGINE
   ========================================================================== */

/**
 * Generate full multi-page landscape PDF Report for Filtered Transactions
 */
export async function exportTransactionsPDFReport(filteredList, filterSummary, teacherName = "د. محمد أحمد العتيبي") {
  // Empty result check
  if (!filteredList || filteredList.length === 0) {
    showCustomAlert("لا توجد معاملات للتصدير.");
    return;
  }

  try {
    // Calculate Summary Metrics
    const totalOrders = filteredList.length;
    const completedOrders = filteredList.filter(t => t.status === "Completed").length;
    const pendingOrders = filteredList.filter(t => t.status === "Pending").length;
    const cancelledOrders = filteredList.filter(t => t.status === "Cancelled").length;
    const refundCount = filteredList.filter(t => t.type === "Refund" || t.status === "Refunded").length;

    const coursesSold = filteredList.filter(t => t.productType === "Course" && t.type === "Purchase").length;
    const booksSold = filteredList.filter(t => (t.productType === "Book" || !t.productType) && t.type === "Purchase").length;

    const grossRevenue = filteredList.filter(t => t.type === "Purchase" && t.status === "Completed").reduce((sum, t) => sum + (t.price || 0), 0);
    const discountTotal = filteredList.reduce((sum, t) => sum + (t.discount || 0), 0);
    const taxTotal = filteredList.reduce((sum, t) => sum + (t.tax || 0), 0);
    const platformRevenue = filteredList.reduce((sum, t) => sum + (t.platformFee || 0), 0);
    const teacherRevenue = filteredList.filter(t => t.status === "Completed").reduce((sum, t) => sum + (t.netRevenue || 0), 0);

    const reportDate = new Date().toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "medium" });

    // Build Landscape Report HTML String
    const reportHTML = `
      <div id="transactionsReportPrintArea" dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, system-ui; background: #ffffff; color: #0f172a; padding: 24px; width: 1080px; margin: 0 auto; box-sizing: border-box;">
        
        <!-- COVER HEADER BANNER -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 24px 32px; color: #ffffff; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #6d28d9, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #ffffff;">S</div>
              <div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">StudyMart Educational Technologies</h1>
                <p style="margin: 2px 0 0 0; font-size: 13px; color: #94a3b8;">تقرير المعاملات والعمليات المالية الشامل - Transaction Financial Report</p>
              </div>
            </div>

            <div style="text-align: left;" dir="ltr">
              <span style="background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 12px;">OFFICIAL REPORT</span>
              <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">تاريخ التوليد: ${reportDate}</div>
            </div>
          </div>

          <!-- METADATA SUB-GRID -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; font-size: 13px;">
            <div>
              <span style="color: #94a3b8;">اسم المعلم / المحاضر:</span>
              <div style="font-weight: 800; color: #f8fafc;">${teacherName}</div>
            </div>
            <div>
              <span style="color: #94a3b8;">الفلاتر المطبقة:</span>
              <div style="font-weight: 700; color: #38bdf8;">${filterSummary || 'الكل (جميع المعاملات)'}</div>
            </div>
            <div>
              <span style="color: #94a3b8;">إجمالي المعاملات بالمستند:</span>
              <div style="font-weight: 800; color: #4ade80;">${totalOrders} عملية تداول مالي</div>
            </div>
          </div>
        </div>

        <!-- EXECUTIVE SUMMARY STATS GRID -->
        <div style="margin-bottom: 28px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #0f172a;">📊 ملخص الإحصائيات المالية المجمع (Executive Summary)</h3>
          
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 700;">إجمالي الطلبات</div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 2px;">${totalOrders}</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 700;">مبيعات الدورات</div>
              <div style="font-size: 18px; font-weight: 900; color: #6d28d9; margin-top: 2px;">${coursesSold}</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 700;">مبيعات الكتب</div>
              <div style="font-size: 18px; font-weight: 900; color: #059669; margin-top: 2px;">${booksSold}</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 700;">إجمالي المبيعات</div>
              <div style="font-size: 18px; font-weight: 900; color: #2563eb; margin-top: 2px;">$${grossRevenue.toFixed(2)}</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 700;">عمولة المنصة</div>
              <div style="font-size: 18px; font-weight: 900; color: #475569; margin-top: 2px;">$${platformRevenue.toFixed(2)}</div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #166534; font-weight: 800;">صافي أرباح المدرس</div>
              <div style="font-size: 18px; font-weight: 900; color: #15803d; margin-top: 2px;">$${teacherRevenue.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <!-- TRANSACTIONS LANDSCAPE TABLE -->
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: right;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff; font-weight: 800;">
                <th style="padding: 10px 8px;">رقم الفاتورة</th>
                <th style="padding: 10px 8px;">TxID</th>
                <th style="padding: 10px 8px;">اسم العميل</th>
                <th style="padding: 10px 8px;">البريد الإلكتروني</th>
                <th style="padding: 10px 8px;">اسم المنتج</th>
                <th style="padding: 10px 8px;">النوع</th>
                <th style="padding: 10px 8px;">طريقة الدفع</th>
                <th style="padding: 10px 8px;">الحالة</th>
                <th style="padding: 10px 8px;">التاريخ</th>
                <th style="padding: 10px 8px;">السعر</th>
                <th style="padding: 10px 8px;">الخصم</th>
                <th style="padding: 10px 8px;">الضريبة</th>
                <th style="padding: 10px 8px;">العمولة</th>
                <th style="padding: 10px 8px; text-align: left;">صافي الربح</th>
              </tr>
            </thead>
            <tbody>
              ${filteredList.map((t, idx) => {
                const badge = getStatusBadgeData(t.status);
                const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
                return `
                  <tr style="background: ${bg}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: 800; color: #0f172a;">${t.invoiceNo}</td>
                    <td style="padding: 8px; font-weight: 700; color: #64748b;">${t.id}</td>
                    <td style="padding: 8px; font-weight: 700; color: #0f172a;">${t.studentName || '—'}</td>
                    <td style="padding: 8px; color: #2563eb;">${t.studentEmail || '—'}</td>
                    <td style="padding: 8px; font-weight: 700; color: #0f172a; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.bookName || '—'}</td>
                    <td style="padding: 8px;">${t.productType === 'Course' ? '🎓 دورة' : '📚 كتاب'}</td>
                    <td style="padding: 8px; font-weight: 600;">${t.paymentMethod}</td>
                    <td style="padding: 8px;">
                      <span style="background: ${badge.bg}; color: ${badge.color}; padding: 2px 6px; border-radius: 6px; font-size: 9px; font-weight: 800;">
                        ${badge.label}
                      </span>
                    </td>
                    <td style="padding: 8px; color: #475569;">${t.date ? t.date.split('T')[0] : ''}</td>
                    <td style="padding: 8px; font-weight: 700;">$${t.price || 0}</td>
                    <td style="padding: 8px; color: #dc2626;">-$${t.discount || 0}</td>
                    <td style="padding: 8px; color: #64748b;">$${t.tax || 0}</td>
                    <td style="padding: 8px; color: #64748b;">-$${t.platformFee || 0}</td>
                    <td style="padding: 8px; text-align: left; font-weight: 900; color: #15803d;">$${t.netRevenue || 0}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- FOOTER SUMMARY -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b;">
          <div>تم توليد هذا التقرير تلقائياً من نظام StudyMart للأبحاث والتقارير المالية.</div>
          <div style="font-weight: 800; color: #0f172a;">إجمالي الأرباح المستحقة بالتقرير: <span style="color: #15803d; font-size: 13px;">$${teacherRevenue.toFixed(2)}</span></div>
        </div>

      </div>
    `;

    // Render into temp container
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "1100px";
    tempDiv.innerHTML = reportHTML;
    document.body.appendChild(tempDiv);

    const reportElem = tempDiv.querySelector("#transactionsReportPrintArea") || tempDiv;

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `transactions_report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    await html2pdf().from(reportElem).set(opt).save();

    document.body.removeChild(tempDiv);
    showCustomAlert("تم تصدير تقرير المعاملات إلى ملف PDF بنجاح!");
  } catch (err) {
    console.error("Export Transactions PDF Error:", err);
    showCustomAlert("حدث خطأ أثناء تصدير التقرير إلى PDF. يرجى المحاولة مرة أخرى.");
  }
}

// Global binding
window.generateInvoiceQRCode = generateInvoiceQRCode;
window.buildInvoiceHTMLString = buildInvoiceHTMLString;
window.openInvoiceModal = openInvoiceModal;
window.printInvoiceDocument = printInvoiceDocument;
window.downloadInvoicePDFDocument = downloadInvoicePDFDocument;
window.exportTransactionsPDFReport = exportTransactionsPDFReport;
