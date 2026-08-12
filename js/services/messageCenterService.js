// Message Center Service - Teacher LMS Module
import {
  getConversations,
  saveConversations,
  getQuickReplies,
  addQuickReply,
  deleteQuickReply,
  getMessageStats
} from "../data/messagesData.js";

import { hideAllMainSections } from "./layoutService.js";
import { showCustomAlert, loadLocalStorage } from "../utils/helpers.js";
import { coursesData } from "../data/courses.js";
import { generateDefaultCurriculum } from "./courseService.js";

// Service State
let currentConversations = [];
let selectedConversationId = null;
let searchQuery = "";
let currentFilter = "all"; // all, unread, pending, resolved, pinned, archived
let currentItemFilter = "all"; // all, Course, Book
let queuedAttachments = [];
let activeMobileTab = "list"; // list, chat, info
let isStudentInfoVisible = false; // Hidden by default

/**
 * Open the Message Center Full Page
 * @param {string|null} convId Optional conversation ID to directly open
 * @param {string|null} targetMsgId Optional message ID to scroll to & highlight
 */
export function openMessageCenterPage(convId = null, targetMsgId = null) {
  hideAllMainSections();

  const page = document.getElementById("messageCenterPage");
  if (page) {
    page.classList.remove("hidden");
  }

  window.scrollTo(0, 0);

  currentConversations = getConversations();

  if (convId) {
    let conv = currentConversations.find((c) => c.id === convId);
    if (!conv) {
      // Auto create or fallback so clicking notification always works
      selectedConversationId = convId;
    } else {
      selectedConversationId = conv.id;
    }
    activeMobileTab = "chat";
  } else {
    if (!selectedConversationId && currentConversations.length > 0) {
      selectedConversationId = currentConversations[0].id;
    }
    if (window.innerWidth < 992) {
      activeMobileTab = "list";
    }
  }

  // Update URL hash cleanly
  const targetHash = selectedConversationId
    ? `#teacher/messages/${selectedConversationId}${targetMsgId ? '/' + targetMsgId : ''}`
    : `#teacher/messages`;
  if (window.location.hash !== targetHash) {
    window.history.replaceState(null, "", targetHash);
  }

  // Mark selected conversation as read
  markAsRead(selectedConversationId);

  renderMessageCenter(targetMsgId);
}

function markAsRead(convId) {
  if (!convId) return;
  const conv = currentConversations.find((c) => c.id === convId);
  if (conv && conv.unreadCount > 0) {
    conv.unreadCount = 0;
    saveConversations(currentConversations);
  }
}

/**
 * Main Render Function for Message Center
 */
export function renderMessageCenter(targetMsgId = null) {
  const container = document.getElementById("messageCenterContent");
  if (!container) return;

  // Capture search input state & scroll positions before DOM re-render
  const searchInputEl = document.getElementById("mcSearchInput");
  const wasSearchFocused = document.activeElement === searchInputEl;
  const selectionStart = searchInputEl ? searchInputEl.selectionStart : null;
  const selectionEnd = searchInputEl ? searchInputEl.selectionEnd : null;

  const winScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const oldRightPanel = container.querySelector(".mc-right-panel");
  const rightPanelScrollTop = oldRightPanel ? oldRightPanel.scrollTop : 0;
  const oldListBody = container.querySelector(".mc-list-body");
  const listBodyScrollTop = oldListBody ? oldListBody.scrollTop : 0;

  currentConversations = getConversations();
  const stats = getMessageStats(currentConversations);

  // Filter conversations
  const filteredConvs = filterConversationsList();

  // Find active conversation
  let activeConv = currentConversations.find((c) => c.id === selectedConversationId);
  if (!activeConv && filteredConvs.length > 0) {
    activeConv = filteredConvs[0];
    selectedConversationId = activeConv.id;
  }

  const quickRepliesList = getQuickReplies();

  container.innerHTML = `
    <div class="mc-container">
      <!-- HEADER ROW -->
      <div class="mc-header">
        <div class="mc-title-group">
          <h1>💬 مركز الرسائل والتواصل <span style="font-size: 14px; background: #6366f1; color: #fff; padding: 3px 10px; border-radius: 20px; font-weight: 700;">مباشر</span></h1>
          <div class="mc-breadcrumb">
            <span>لوحة التحكم</span>
            <span class="sep">‹</span>
            <span>الطلاب</span>
            <span class="sep">‹</span>
            <span style="color: #6366f1; font-weight: 700;">مركز الرسائل</span>
          </div>
        </div>
      </div>

      <!-- 3-COLUMN LAYOUT -->
      <div class="mc-layout ${!isStudentInfoVisible ? 'student-info-hidden' : ''}">
        <!-- COLUMN 1: CONVERSATION LIST -->
        <div class="mc-col-left ${activeMobileTab !== 'list' ? 'mobile-hidden' : ''}">
          <div class="mc-list-header">
            <div class="mc-search-box">
              <span class="mc-search-icon">🔍</span>
              <input id="mcSearchInput" type="text" placeholder="بحث بالاسم، الإيميل، الكورس..." value="${searchQuery}" oninput="window.handleMCFilterSearch(this.value)" />
            </div>

            <!-- FILTER CHIPS -->
            <div class="mc-filter-tabs">
              <button type="button" class="mc-filter-tab ${currentFilter === 'all' ? 'active' : ''}" onclick="window.handleMCFilterStatus('all')">الكل</button>
              <button type="button" class="mc-filter-tab ${currentFilter === 'unread' ? 'active' : ''}" onclick="window.handleMCFilterStatus('unread')">غير مقروءة</button>
              <button type="button" class="mc-filter-tab ${currentFilter === 'archived' ? 'active' : ''}" onclick="window.handleMCFilterStatus('archived')">📦 المؤرشفة</button>
            </div>

            <!-- SUB FILTERS DROPDOWN -->
            <div class="mc-filter-dropdowns">
              <select onchange="window.handleMCItemFilter(this.value)">
                <option value="all" ${currentItemFilter === 'all' ? 'selected' : ''}>كافة المحتوى (دورة/كتاب/واجب/اختبار)</option>
                <option value="Course" ${currentItemFilter === 'Course' ? 'selected' : ''}>🎓 الكورسات والدورات</option>
                <option value="Book" ${currentItemFilter === 'Book' ? 'selected' : ''}>📚 الكتب والملفات</option>
                <option value="Assignment" ${currentItemFilter === 'Assignment' ? 'selected' : ''}>📝 الواجبات والمشاريع</option>
                <option value="Quiz" ${currentItemFilter === 'Quiz' ? 'selected' : ''}>✍️ الاختبارات والتقييمات</option>
              </select>
            </div>
          </div>

          <!-- LIST BODY -->
          <div class="mc-list-body">
            ${
              filteredConvs.length === 0
                ? `<div style="text-align: center; padding: 40px 10px; color: #94a3b8; font-size: 13px;">
                    لا توجد محادثات تطابق الفلتر المحدد
                   </div>`
                : filteredConvs.map((conv) => renderConversationCard(conv)).join("")
            }
          </div>
        </div>

        <!-- COLUMN 2: ACTIVE CONVERSATION WINDOW -->
        <div class="mc-col-center ${activeMobileTab !== 'chat' ? 'mobile-hidden' : ''}">
          ${activeConv ? renderChatWindow(activeConv) : renderEmptyChatState()}
        </div>

        <!-- COLUMN 3: STUDENT DETAILS & CONTEXT -->
        <div class="mc-col-right ${!isStudentInfoVisible ? 'hidden-panel' : ''} ${activeMobileTab !== 'info' ? 'mobile-hidden' : ''}">
          ${activeConv ? renderRightSidebar(activeConv, quickRepliesList) : `<div style="padding: 20px; text-align: center; color: #94a3b8;">يرجى اختيار محادثة لعرض التفاصيل</div>`}
        </div>
      </div>
    </div>
  `;

  // Restore scroll positions
  if (winScrollY > 0) {
    window.scrollTo({ top: winScrollY, behavior: "instant" });
  }
  const newRightPanel = container.querySelector(".mc-right-panel");
  if (newRightPanel && rightPanelScrollTop > 0) {
    newRightPanel.scrollTop = rightPanelScrollTop;
  }
  const newListBody = container.querySelector(".mc-list-body");
  if (newListBody && listBodyScrollTop > 0) {
    newListBody.scrollTop = listBodyScrollTop;
  }

  requestAnimationFrame(() => {
    if (winScrollY > 0) window.scrollTo({ top: winScrollY, behavior: "instant" });
    const panel = container.querySelector(".mc-right-panel");
    if (panel && rightPanelScrollTop > 0) {
      panel.scrollTop = rightPanelScrollTop;
    }
  });

  // Restore search input focus if active prior to render
  if (wasSearchFocused) {
    const newSearchInput = document.getElementById("mcSearchInput");
    if (newSearchInput) {
      newSearchInput.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        try {
          newSearchInput.setSelectionRange(selectionStart, selectionEnd);
        } catch (e) {}
      }
    }
  }

  // Scroll or Highlight Target Message
  if (targetMsgId) {
    setTimeout(() => {
      const msgEl = document.getElementById(`msg-bubble-${targetMsgId}`);
      if (msgEl) {
        msgEl.scrollIntoView({ behavior: "smooth", block: "center" });
        msgEl.classList.add("msg-bubble-highlighted");
        setTimeout(() => {
          msgEl.classList.remove("msg-bubble-highlighted");
        }, 3500);
      } else {
        const chatBox = document.getElementById("mcChatMessagesStream");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      }
    }, 100);
  } else {
    setTimeout(() => {
      const chatBox = document.getElementById("mcChatMessagesStream");
      if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
  }
}

/**
 * Helper to get item badge text
 */
function getItemBadgeText(conv) {
  switch (conv.itemType) {
    case "Course":
      return `🎓 دورة: ${conv.itemTitle}`;
    case "Book":
      return `📚 كتاب: ${conv.itemTitle}`;
    case "Assignment":
      return `📝 واجب: ${conv.assignmentTitle || conv.itemTitle}`;
    case "Quiz":
      return `✍️ اختبار: ${conv.quizTitle || conv.itemTitle}`;
    default:
      return `💬 ${conv.itemTitle || 'موضوع عام'}`;
  }
}

/**
 * Helper to get open button text
 */
function getOpenButtonText(itemType) {
  switch (itemType) {
    case "Course":
      return "🎓 فتح الدرس / الكورس";
    case "Book":
      return "📖 فتح الكتاب";
    case "Assignment":
      return "📝 فتح الواجب";
    case "Quiz":
      return "✍️ فتح الاختبار";
    default:
      return "🔗 فتح المحتوى المرتبط";
  }
}

/**
 * Render individual conversation card for Left Column
 */
function renderConversationCard(conv) {
  const isActive = conv.id === selectedConversationId;
  const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
  const timeFormatted = lastMsg ? formatTimeShort(lastMsg.timestamp) : "";

  return `
    <div class="mc-conv-card ${isActive ? 'active' : ''}" onclick="window.selectConversation('${conv.id}')">
      <div class="mc-avatar-wrap" onclick="window.openStudentProfileFromCard(event, '${conv.id}')" style="cursor: pointer;" title="انقر لعرض ملف الطالب">
        <img src="${conv.studentAvatar}" alt="${conv.studentName}" class="mc-avatar" />
        <span class="mc-status-dot ${conv.isOnline ? 'online' : 'offline'}"></span>
      </div>

      <div class="mc-conv-info">
        <div class="mc-conv-top">
          <span class="mc-student-name">${conv.studentName}</span>
          <span class="mc-time">${timeFormatted}</span>
        </div>

        <span class="mc-conv-item-badge">
          ${getItemBadgeText(conv)}
        </span>

        <span class="mc-last-msg">
          ${lastMsg ? (lastMsg.sender === 'teacher' ? 'أنت: ' : '') + escapeHTML(lastMsg.text || 'مرفق ملف') : 'لا توجد رسائل'}
        </span>

        <div class="mc-conv-meta">
          <div class="mc-tag-chips">
            ${(conv.labels || []).slice(0, 2).map((l) => `<span class="mc-tag-chip">${l}</span>`).join("")}
          </div>

          <div class="mc-icon-pins">
            ${conv.isPinned ? '📌' : ''}
            ${conv.isStarred ? '⭐' : ''}
            ${conv.isMuted ? '🔇' : ''}
            ${conv.unreadCount > 0 ? `<span class="mc-badge-unread">${conv.unreadCount}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Chat Window (Center Column)
 */
function renderChatWindow(conv) {
  return `
    <!-- CHAT HEADER -->
    <div class="mc-chat-header">
      <div class="mc-chat-student-info">
        <button type="button" class="mc-chat-back-btn" onclick="window.switchMobileTab('list')" title="العودة لمحادثات الطلاب" aria-label="العودة لمحادثات الطلاب">
          ➔
        </button>

        <div class="mc-avatar-wrap" onclick="window.toggleStudentInfoPanel(event)" style="cursor: pointer;" title="انقر لعرض/إخفاء ملف الطالب">
          <img src="${conv.studentAvatar}" alt="${conv.studentName}" class="mc-avatar" />
          <span class="mc-status-dot ${conv.isOnline ? 'online' : 'offline'}"></span>
        </div>

        <div onclick="window.toggleStudentInfoPanel(event)" style="cursor: pointer;" title="انقر لعرض/إخفاء ملف الطالب">
          <div class="mc-chat-title">
            <span>${conv.studentName}</span>
            <span class="mc-profile-badge">
              ℹ️ الملف
            </span>
          </div>
          <div class="mc-chat-subtitle">
            ${conv.isOnline ? '<span class="mc-online-indicator">● متصل الآن</span>' : 'نشط: ' + conv.lastSeen}
            • ${conv.country}
          </div>
        </div>
      </div>

      <div class="mc-chat-actions">
        <!-- ITEM LINK -->
        <button type="button" class="mc-btn mc-btn-outline mc-item-link-btn" onclick="window.openRelatedItem('${conv.itemType}', '${conv.itemId}', '${conv.id}')">
          ${getOpenButtonText(conv.itemType)}
        </button>

        <!-- THREE-DOT OVERFLOW MENU -->
        <div style="position: relative; display: inline-block;">
          <button type="button" class="mc-icon-btn mc-overflow-menu-btn" id="mcHeaderMenuBtn" onclick="window.toggleHeaderMenu(event)" title="خيارات المحادثة" aria-label="خيارات المحادثة">
            ⋮
          </button>

          <!-- OVERFLOW DROPDOWN MENU -->
          <div id="mcHeaderMenuDropdown" class="mc-header-dropdown hidden">
            <button type="button" class="mc-dropdown-item ${conv.isPinned ? 'active' : ''}" onclick="window.togglePin('${conv.id}'); window.closeHeaderMenu();">
              ${conv.isPinned ? '📌 إلغاء التثبيت' : '📌 تثبيت المحادثة'}
            </button>
            <button type="button" class="mc-dropdown-item ${conv.isStarred ? 'active' : ''}" onclick="window.toggleStar('${conv.id}'); window.closeHeaderMenu();">
              ${conv.isStarred ? '⭐ إلغاء التفضيل' : '⭐ إضافة للمفضلة'}
            </button>
            <button type="button" class="mc-dropdown-item ${conv.isMuted ? 'active' : ''}" onclick="window.toggleMute('${conv.id}'); window.closeHeaderMenu();">
              ${conv.isMuted ? '🔊 إلغاء الكتم' : '🔇 كتم الإشعارات'}
            </button>
            <div class="mc-dropdown-divider"></div>
            <button type="button" class="mc-dropdown-item danger" onclick="window.deleteConv('${conv.id}'); window.closeHeaderMenu();">
              🗑️ حذف المحادثة
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MESSAGES STREAM -->
    <div class="mc-chat-messages" id="mcChatMessagesStream">
      <div class="mc-date-separator">
        <span>بداية السجل الموثق للرسائل</span>
      </div>

      ${(conv.messages || []).map((msg) => renderMessageBubble(msg, conv)).join("")}
    </div>

    <!-- COMPOSER AREA -->
    <div class="mc-composer-area" ondragover="event.preventDefault()" ondrop="window.handleDropFile(event)">
      <!-- QUEUED ATTACHMENTS TRAY -->
      ${
        queuedAttachments.length > 0
          ? `<div class="mc-attachments-previews">
              ${queuedAttachments
                .map(
                  (att, idx) => `
                <span class="mc-attachment-preview-chip">
                  📎 ${escapeHTML(att.name)} (${att.size})
                  <span class="remove-btn" onclick="window.removeQueuedAtt(${idx})">✕</span>
                </span>
              `
                )
                .join("")}
            </div>`
          : ""
      }

      <!-- TOOLBAR -->
      <div class="mc-composer-toolbar">
        <div class="mc-toolbar-tools">
          <label class="mc-icon-btn" title="إرفاق ملفات أو صور (PDF, Word, Excel, ZIP)" style="cursor: pointer;">
            📎
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt,.csv" style="display: none;" onchange="window.handleFileInput(this.files)" />
          </label>

          <button type="button" class="mc-icon-btn" onclick="window.insertCodeSnippet()" title="إضافة كود برمجي">
            💻
          </button>

          <button type="button" class="mc-icon-btn" onclick="window.toggleEmojiMenu()" title="إضافة رمز تعبيري">
            😊
          </button>

          <div style="position: relative; display: inline-block;">
            <button type="button" class="mc-btn mc-btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="window.toggleQuickReplyDropdown()">
              ⚡ ردود سريعة ▾
            </button>
            <div id="mcQuickReplyDropdown" class="mc-quick-reply-btn-dropdown hidden" style="position: absolute; bottom: 36px; right: 0; background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 260px; z-index: 100; padding: 8px;">
              ${getQuickReplies()
                .map(
                  (qr) => `<div style="padding: 8px; font-size: 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9;" onclick="window.useQuickReplyText('${escapeHTML(qr)}')">${escapeHTML(qr)}</div>`
                )
                .join("")}
            </div>
          </div>
        </div>

        <span class="mc-composer-hint" style="font-size: 11px; color: #94a3b8;">Enter للارسال • Shift+Enter للسطر الجديد</span>
      </div>

      <!-- TEXTAREA & SEND BUTTON -->
      <div class="mc-composer-input-wrapper">
        <textarea
          id="mcComposerTextarea"
          class="mc-composer-textarea"
          placeholder="اكتب ردك للطالب هنا..."
          onkeydown="window.handleComposerKeyDown(event)"
        ></textarea>
        <button type="button" class="mc-send-btn" onclick="window.sendMessageNow()">
          إرسال 🚀
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Individual Message Bubble
 */
function renderMessageBubble(msg, conv) {
  const isTeacher = msg.sender === "teacher";
  const avatar = isTeacher
    ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop"
    : conv.studentAvatar;

  return `
    <div class="mc-msg-row ${isTeacher ? 'teacher' : 'student'}" id="msg-bubble-${msg.id}">
      <img src="${avatar}" alt="Avatar" class="mc-msg-avatar" />
      <div class="mc-msg-bubble">
        <div>${formatMessageText(msg.text)}</div>

        ${(msg.attachments || []).map((att) => renderAttachmentInMessage(att)).join("")}

        <div class="mc-msg-meta">
          <span>${formatTimeShort(msg.timestamp)}</span>
          ${isTeacher ? `<span>${msg.status === 'seen' ? '✓✓' : '✓'}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Attachment preview inside a bubble
 */
function renderAttachmentInMessage(att) {
  if (att.type === "image") {
    return `
      <div class="mc-attachment-wrapper">
        <img src="${att.url}" alt="${att.name}" class="mc-image-preview-attachment" onclick="window.openImageModal('${att.url}')" />
        <div class="mc-attachment-caption">🖼️ ${escapeHTML(att.name)} (${att.size})</div>
      </div>
    `;
  }

  if (att.type === "code" && att.codeSnippet) {
    return `
      <div class="mc-code-block">
        <pre><code>${escapeHTML(att.codeSnippet)}</code></pre>
      </div>
    `;
  }

  if (att.type === "audio") {
    return `
      <div class="mc-audio-wrapper">
        <div class="mc-attachment-caption">🎙️ ${escapeHTML(att.name)} (${att.duration || ''})</div>
        <audio controls src="${att.url}" class="mc-audio-player"></audio>
      </div>
    `;
  }

  const ext = (att.name || "").split('.').pop().toLowerCase();
  let fileIcon = "📄";
  if (["pdf"].includes(ext)) fileIcon = "📕";
  else if (["doc", "docx"].includes(ext)) fileIcon = "📝";
  else if (["xls", "xlsx", "csv"].includes(ext)) fileIcon = "📊";
  else if (["zip", "rar", "7z"].includes(ext)) fileIcon = "📦";

  return `
    <a href="${att.url}" target="_blank" class="mc-attachment-card" download="${att.name}">
      <span class="mc-attachment-icon">${fileIcon}</span>
      <div class="mc-attachment-details">
        <div class="mc-attachment-name">${escapeHTML(att.name)}</div>
        <div class="mc-attachment-size">${att.size || 'مرفق'}</div>
      </div>
      <span class="mc-attachment-dl">تنزيل ⬇️</span>
    </a>
  `;
}

/**
 * Render Right Column (Student Details & Quick Context)
 */
function renderRightSidebar(conv, quickRepliesList) {
  let contextLabel = "🎓 دورة تدريبية";
  let contextTitle = conv.itemTitle;
  let contextSub = conv.lessonName ? `📍 ${conv.lessonName}` : "";

  if (conv.itemType === "Book") {
    contextLabel = "📚 كتاب إلكتروني";
    contextTitle = conv.itemTitle;
    contextSub = conv.chapterName ? `📖 ${conv.chapterName}` : "";
  } else if (conv.itemType === "Assignment") {
    contextLabel = "📝 واجب دراسي ورقمي";
    contextTitle = conv.assignmentTitle || conv.itemTitle;
    contextSub = conv.lessonName ? `📍 ${conv.lessonName}` : "";
  } else if (conv.itemType === "Quiz") {
    contextLabel = "✍️ اختبار وتقييم مهارات";
    contextTitle = conv.quizTitle || conv.itemTitle;
    contextSub = conv.lessonName ? `📍 ${conv.lessonName}` : "";
  }

  return `
    <div class="mc-right-panel">
      <!-- PANEL HEADER WITH CLOSE BUTTON -->
      <div class="mc-right-panel-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--border-color, #e2e8f0); margin-bottom: 8px;">
        <div style="font-size: 14px; font-weight: 800; color: var(--text-color, #1e293b);">👤 تفاصيل الطالب والسياق</div>
        <button type="button" class="mc-panel-close-btn" onclick="window.toggleStudentInfoPanel(event)" aria-label="إغلاق" title="إغلاق اللوحة">✕</button>
      </div>

      <!-- STUDENT PROFILE CARD -->
      <div class="mc-student-profile-card">
        <img src="${conv.studentAvatar}" alt="${conv.studentName}" class="mc-profile-avatar" />
        <div class="mc-profile-name">${conv.studentName}</div>
        <div class="mc-profile-email">📧 ${conv.studentEmail}</div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">🌍 ${conv.country}</div>

        <div class="mc-profile-stats">
          <div class="mc-pstat-item">
            <span class="mc-pstat-val">$328</span>
            <span class="mc-pstat-lbl">إجمالي المشتريات</span>
          </div>
          <div class="mc-pstat-item">
            <span class="mc-pstat-val">3</span>
            <span class="mc-pstat-lbl">دورات / كتب</span>
          </div>
        </div>

        <button type="button" class="mc-btn mc-btn-outline" style="width: 100%; margin-top: 10px; font-size: 12px; justify-content: center; font-weight: 700;" onclick="window.openFullStudentProfile('${conv.studentId}', '${escapeHTML(conv.studentName)}')">
          👤 عرض ملف الطالب الكامل
        </button>
      </div>

      <!-- STATUS SELECTOR -->
      <div>
        <div class="mc-section-title">حالة المحادثة</div>
        <select class="mc-status-select" onchange="window.handleMCChangeStatus('${conv.id}', this.value)">
          <option value="Open" ${conv.status === 'Open' ? 'selected' : ''}>🟢 مفتوحة (قيد المتابعة)</option>
          <option value="Pending" ${conv.status === 'Pending' ? 'selected' : ''}>🟡 بانتظار الرد</option>
          <option value="Resolved" ${conv.status === 'Resolved' ? 'selected' : ''}>✅ مكتملة وتم الحل</option>
          <option value="Closed" ${conv.status === 'Closed' ? 'selected' : ''}>🔒 مغلقة</option>
          <option value="Archived" ${conv.status === 'Archived' ? 'selected' : ''}>📦 مؤرشفة</option>
          <option value="Blocked" ${conv.status === 'Blocked' ? 'selected' : ''}>🚫 محظور</option>
        </select>
      </div>

      <!-- RELATED CONTEXT CARD -->
      <div>
        <div class="mc-section-title">السياق المرتبط</div>
        <div style="background: var(--card-header-bg, #f8fafc); padding: 12px; border-radius: 10px; border: 1px solid var(--border-color, #e2e8f0);">
          <div style="font-size: 12px; font-weight: 700; color: #6366f1; margin-bottom: 4px;">
            ${contextLabel}
          </div>
          <div style="font-size: 13px; font-weight: 800; margin-bottom: 6px;">${contextTitle}</div>
          ${contextSub ? `<div style="font-size: 12px; color: #64748b;">${contextSub}</div>` : ''}

          <button type="button" class="mc-btn mc-btn-outline" style="width: 100%; margin-top: 10px; justify-content: center;" onclick="window.openRelatedItem('${conv.itemType}', '${conv.itemId}', '${conv.id}')">
            ${getOpenButtonText(conv.itemType)} ↗
          </button>
        </div>
      </div>

      <!-- LABELS / TAGS MANAGEMENT -->
      <div>
        <div class="mc-section-title">
          <span>التصنيفات والوسوم</span>
          <button type="button" style="background: none; border: none; color: #6366f1; cursor: pointer; font-size: 12px; font-weight: 700;" onclick="window.promptAddLabel('${conv.id}', event)">+ إضافة</button>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${(conv.labels || []).map((label) => `
            <span class="mc-tag-chip" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px;">
              ${label}
              <span style="cursor: pointer; opacity: 0.7; padding: 0 2px;" onclick="window.removeLabel(event, '${conv.id}', '${escapeHTML(label).replace(/'/g, "\\'")}')" title="إزالة الوسم">✕</span>
            </span>
          `).join("")}
        </div>
      </div>

      <!-- QUICK REPLIES LIST -->
      <div>
        <div class="mc-section-title">
          <span>ردود سريعة جاهزة</span>
          <button type="button" style="background: none; border: none; color: #6366f1; cursor: pointer; font-size: 12px; font-weight: 700;" onclick="window.promptAddNewQuickReply(event)">+ جديد</button>
        </div>

        <div class="mc-quick-replies-list" style="display: flex; flex-direction: column; gap: 6px;">
          ${quickRepliesList.map((qr, idx) => `
            <div class="mc-quick-reply-btn-wrapper" style="display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 10px; border-radius: 8px; background: var(--card-header-bg, #f1f5f9); border: 1px solid var(--border-color, #e2e8f0); transition: all 0.2s;">
              <button type="button" class="mc-quick-reply-text" style="background: none; border: none; padding: 0; text-align: right; cursor: pointer; font-size: 12px; color: inherit; flex: 1; line-height: 1.4; display: flex; align-items: center; gap: 6px;" onclick="window.useQuickReplyText('${escapeHTML(qr)}')">
                <span style="font-size: 13px;">💬</span> <span style="font-weight: 500;">${escapeHTML(qr)}</span>
              </button>
              <button type="button" class="mc-quick-reply-del" style="background: none; border: none; padding: 2px 6px; cursor: pointer; font-size: 12px; color: #94a3b8; border-radius: 4px; opacity: 0.7; transition: all 0.2s; flex-shrink: 0;" onmouseover="this.style.opacity='1'; this.style.color='#ef4444'; this.style.background='#fee2e2';" onmouseout="this.style.opacity='0.7'; this.style.color='#94a3b8'; this.style.background='transparent';" onclick="window.deleteQuickReplyByIndex(event, ${idx})" title="حذف الرد السريع" aria-label="حذف الرد السريع">
                ✕
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderEmptyChatState() {
  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; text-align: center; padding: 40px;">
      <div style="font-size: 56px; margin-bottom: 16px;">💬</div>
      <div style="font-size: 18px; font-weight: 800; color: inherit; margin-bottom: 8px;">مركز التواصل المباشر</div>
      <div style="font-size: 13px; max-width: 320px;">اختر محادثة من القائمة الجانبية لعرض وتتبع الرسائل والملفات المتبادلة مع الطلاب.</div>
    </div>
  `;
}

/* =========================================================
   Event Handlers & Interactivity Actions
   ========================================================= */

window.selectConversation = function (id) {
  selectedConversationId = id;
  markAsRead(id);
  activeMobileTab = "chat";
  renderMessageCenter();
};

window.handleMCFilterSearch = function (val) {
  searchQuery = val;
  renderMessageCenter();
};

window.handleMCFilterStatus = function (status) {
  currentFilter = status;
  renderMessageCenter();
};

window.handleMCItemFilter = function (type) {
  currentItemFilter = type;
  renderMessageCenter();
};

window.sendMessageNow = function () {
  const textarea = document.getElementById("mcComposerTextarea");
  const text = textarea ? textarea.value.trim() : "";

  if (!text && queuedAttachments.length === 0) {
    showCustomAlert("يرجى كتابة نص الرسالة أو إرفاق ملف قبل الإرسال");
    return;
  }

  const conv = currentConversations.find((c) => c.id === selectedConversationId);
  if (!conv) return;

  const newMsg = {
    id: "M-" + Date.now(),
    sender: "teacher",
    text: text,
    timestamp: new Date().toISOString(),
    status: "delivered",
    attachments: [...queuedAttachments]
  };

  conv.messages = conv.messages || [];
  conv.messages.push(newMsg);
  conv.lastUpdated = new Date().toISOString();
  conv.status = "Open";

  // Reset composer
  queuedAttachments = [];
  saveConversations(currentConversations);

  renderMessageCenter();
};

window.handleComposerKeyDown = function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    window.sendMessageNow();
  }
};

window.handleFileInput = function (files) {
  if (!files || files.length === 0) return;

  Array.from(files).forEach((file) => {
    const reader = new FileReader();

    const isImg = file.type.startsWith("image/");
    const isAud = file.type.startsWith("audio/");

    reader.onload = function (e) {
      queuedAttachments.push({
        id: "ATT-" + Date.now() + Math.random().toString(36).substr(2, 4),
        name: file.name,
        type: isImg ? "image" : isAud ? "audio" : "document",
        size: (file.size / 1024).toFixed(1) + " KB",
        url: e.target.result
      });
      renderMessageCenter();
    };

    if (isImg || isAud) {
      reader.readAsDataURL(file);
    } else {
      queuedAttachments.push({
        id: "ATT-" + Date.now(),
        name: file.name,
        type: "document",
        size: (file.size / 1024).toFixed(1) + " KB",
        url: "#"
      });
      renderMessageCenter();
    }
  });
};

window.handleDropFile = function (e) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files) {
    window.handleFileInput(e.dataTransfer.files);
  }
};

window.removeQueuedAtt = function (idx) {
  queuedAttachments.splice(idx, 1);
  renderMessageCenter();
};

window.toggleEmojiMenu = function () {
  const emojis = ["😊", "👍", "🚀", "🙏", "💡", "❓", "📝", "✅", "🎉", "🔥"];
  const textarea = document.getElementById("mcComposerTextarea");
  if (!textarea) return;
  const chosen = emojis[Math.floor(Math.random() * emojis.length)];
  textarea.value += " " + chosen;
  textarea.focus();
};

window.insertCodeSnippet = function () {
  const textarea = document.getElementById("mcComposerTextarea");
  if (!textarea) return;
  textarea.value += "\n```js\n// أضف كودك البرمجي هنا\n\n```\n";
  textarea.focus();
};

window.toggleQuickReplyDropdown = function () {
  const dropdown = document.getElementById("mcQuickReplyDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
};

window.useQuickReplyText = function (text) {
  const textarea = document.getElementById("mcComposerTextarea");
  if (textarea) {
    textarea.value = text;
    textarea.focus();
  }
  const dropdown = document.getElementById("mcQuickReplyDropdown");
  if (dropdown) dropdown.classList.add("hidden");
};

window.promptAddNewQuickReply = async function (event) {
  if (event) {
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.preventDefault === "function") event.preventDefault();
  }
  const inputFn = window.showInputDialog || showInputDialog;
  let text = null;
  if (typeof inputFn === "function") {
    text = await inputFn({
      title: "إضافة رد سريع جديد",
      message: "أدخل نص الرد السريع لاستخدامه لاحقاً في الردود المباشرة:",
      placeholder: "اكتب نص الرد السريع...",
      isMultiline: true,
      confirmText: "حفظ الرد",
      cancelText: "إلغاء",
      icon: "💬"
    });
  } else {
    text = prompt("أدخل نص الرد السريع الجديد:");
  }

  if (text && text.trim()) {
    addQuickReply(text.trim());
    renderMessageCenter();
    if (typeof showCustomAlert === "function") {
      showCustomAlert("تم إضافة الرد السريع بنجاح ✅");
    }
  }
};

window.deleteQuickReplyByIndex = async function (event, index) {
  if (event) {
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.preventDefault === "function") event.preventDefault();
  }

  const confirmFn = window.showConfirmDialog || (typeof showConfirmDialog === "function" ? showConfirmDialog : null);
  let confirmed = false;
  if (typeof confirmFn === "function") {
    confirmed = await confirmFn({
      title: "حذف الرد السريع",
      message: "هل أنت متاكد من رغبتك في حذف هذا الرد السريع من القائمة؟",
      confirmText: "حذف الرد",
      cancelText: "إلغاء",
      type: "danger"
    });
  } else {
    confirmed = confirm("هل أنت متاكد من رغبتك في حذف هذا الرد السريع؟");
  }

  if (confirmed) {
    deleteQuickReply(index);
    renderMessageCenter();
    if (typeof showCustomAlert === "function") {
      showCustomAlert("تم حذف الرد السريع بنجاح ✅");
    }
  }
};

window.togglePin = function (id) {
  const conv = currentConversations.find((c) => c.id === id);
  if (conv) {
    conv.isPinned = !conv.isPinned;
    saveConversations(currentConversations);
    renderMessageCenter();
  }
};

window.toggleStar = function (id) {
  const conv = currentConversations.find((c) => c.id === id);
  if (conv) {
    conv.isStarred = !conv.isStarred;
    saveConversations(currentConversations);
    renderMessageCenter();
  }
};

window.toggleMute = function (id) {
  const conv = currentConversations.find((c) => c.id === id);
  if (conv) {
    conv.isMuted = !conv.isMuted;
    saveConversations(currentConversations);
    renderMessageCenter();
  }
};

window.deleteConv = function (id) {
  if (confirm("هل أنت تأكيد من حذف هذه المحادثة بالكامل؟ لا يمكن التراجع عن ذلك.")) {
    currentConversations = currentConversations.filter((c) => c.id !== id);
    saveConversations(currentConversations);
    if (selectedConversationId === id) {
      selectedConversationId = currentConversations.length > 0 ? currentConversations[0].id : null;
    }
    renderMessageCenter();
    showCustomAlert("تم حذف المحادثة بنجاح");
  }
};

window.handleMCChangeStatus = function (id, status) {
  const conv = currentConversations.find((c) => c.id === id);
  if (conv) {
    conv.status = status;
    saveConversations(currentConversations);
    renderMessageCenter();
    showCustomAlert(`تم تحديث حالة المحادثة إلى: ${status}`);
  }
};

window.promptAddLabel = async function (id, event) {
  if (event) {
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.preventDefault === "function") event.preventDefault();
  }
  const inputFn = window.showInputDialog || showInputDialog;
  let label = null;
  if (typeof inputFn === "function") {
    label = await inputFn({
      title: "إضافة تصنيف / وسم جديد",
      message: "أدخل اسم الوسم أو التصنيف (مثال: سؤال كورس، عاجل، VIP):",
      placeholder: "اسم الوسم...",
      isMultiline: false,
      confirmText: "إضافة",
      cancelText: "إلغاء",
      icon: "🏷️"
    });
  } else {
    label = prompt("أدخل اسم التصنيف/الوسم الجديد (مثال: سؤال كورس، عاجل، VIP):");
  }

  if (label && label.trim()) {
    const conv = currentConversations.find((c) => c.id === id);
    if (conv) {
      conv.labels = conv.labels || [];
      const trimmed = label.trim();
      if (!conv.labels.includes(trimmed)) {
        conv.labels.push(trimmed);
        saveConversations(currentConversations);
        renderMessageCenter();
      }
    }
  }
};

window.removeLabel = function (event, id, label) {
  let targetId = id;
  let targetLabel = label;
  if (typeof event === "string") {
    targetLabel = id;
    targetId = event;
  } else if (event) {
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.preventDefault === "function") event.preventDefault();
  }

  const conv = currentConversations.find((c) => c.id === targetId);
  if (conv && conv.labels) {
    conv.labels = conv.labels.filter((l) => l !== targetLabel);
    saveConversations(currentConversations);
    renderMessageCenter();
  }
};

window.switchMobileTab = function (tab) {
  activeMobileTab = tab;
  renderMessageCenter();
};

window.openRelatedItem = function (type, itemId, convId) {
  // 1. Resolve conversation context if available
  let conv = null;
  if (convId) {
    conv = currentConversations.find((c) => c.id === convId);
  }
  if (!conv && selectedConversationId) {
    conv = currentConversations.find((c) => c.id === selectedConversationId);
  }
  if (!conv && itemId) {
    conv = currentConversations.find((c) => String(c.itemId) === String(itemId) || String(c.id) === String(itemId));
  }

  const effectiveType = (conv ? conv.itemType : type) || "Course";
  const effectiveItemId = (conv ? conv.itemId : itemId);

  // 2. Handle Course, Assignment, or Quiz
  if (effectiveType === "Course" || effectiveType === "Assignment" || effectiveType === "Quiz") {
    const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
    let course = coursesData.find((c) => String(c.id) === String(effectiveItemId)) ||
                 teacherCourses.find((c) => String(c.id) === String(effectiveItemId));

    if (!course && conv && conv.itemTitle) {
      const qTitle = conv.itemTitle.trim().toLowerCase();
      course = coursesData.find((c) => c.title && (c.title.toLowerCase().includes(qTitle) || qTitle.includes(c.title.toLowerCase()))) ||
               teacherCourses.find((c) => c.title && (c.title.toLowerCase().includes(qTitle) || qTitle.includes(c.title.toLowerCase())));
    }

    if (!course && coursesData.length > 0) {
      if (!isNaN(Number(effectiveItemId)) && Number(effectiveItemId) > 0) {
        course = coursesData.find((c) => Number(c.id) === Number(effectiveItemId)) || coursesData[0];
      }
    }

    if (!course) {
      if (typeof showCustomAlert === "function") {
        showCustomAlert("تعذر تحديد الكورس أو الدرس المرتبط بهذا الاستفسار");
      }
      return;
    }

    // Determine if there is a specific lesson associated
    let matchingLesson = null;
    const curriculum = window.CourseService && window.CourseService.getCourseCurriculum
      ? window.CourseService.getCourseCurriculum(course)
      : (course.sections || generateDefaultCurriculum(course));

    const allLessons = [];
    (curriculum || []).forEach((sec) => {
      (sec.lessons || []).forEach((les) => allLessons.push(les));
    });

    if (conv) {
      if (conv.lessonId) {
        matchingLesson = allLessons.find((l) => String(l.id) === String(conv.lessonId));
      }
      if (!matchingLesson && conv.lessonNumber) {
        matchingLesson = allLessons.find((l) => l.number == conv.lessonNumber || String(l.id).endsWith(`-${conv.lessonNumber}`));
      }
      if (!matchingLesson && conv.lessonName) {
        const targetName = conv.lessonName.trim().toLowerCase();
        matchingLesson = allLessons.find((l) => {
          const lTitle = (l.title || "").toLowerCase();
          return lTitle.includes(targetName) || targetName.includes(lTitle);
        });

        if (!matchingLesson) {
          const numMatch = conv.lessonName.match(/\d+/);
          if (numMatch) {
            const num = numMatch[0];
            matchingLesson = allLessons.find((l) => {
              const lTitle = (l.title || "").toLowerCase();
              return lTitle.includes(num) || String(l.id).endsWith(`-${num}`);
            });
          }
        }
      }
    }

    // CASE A: Lesson associated -> Navigate directly to that lesson
    if (matchingLesson) {
      if (window.CourseService && window.CourseService.getCourseProgress) {
        const progress = window.CourseService.getCourseProgress(course.id);
        progress.lastActiveLessonId = matchingLesson.id;
        if (window.CourseService.saveCourseProgress) {
          window.CourseService.saveCourseProgress(course.id, progress);
        }
      }

      if (typeof window.showCourseDetails === "function") {
        window.showCourseDetails(course.id);
      }
      if (typeof window.selectCourseLesson === "function") {
        window.selectCourseLesson(course.id, matchingLesson.id);
      } else if (typeof window.renderCoursePlayerView === "function") {
        window.renderCoursePlayerView(course.id);
      }
      return;
    }

    // CASE B: Course associated without specific lesson -> Navigate to course
    if (typeof window.showCourseDetails === "function") {
      window.showCourseDetails(course.id);
    } else if (typeof window.playCurrentCourse === "function") {
      window.playCurrentCourse(course.id);
    } else {
      if (typeof showCustomAlert === "function") {
        showCustomAlert(`تم فتح الكورس: ${course.title}`);
      }
    }
    return;
  }

  // 3. Handle Book
  if (effectiveType === "Book") {
    const booksList = window.booksData || [];
    let book = booksList.find((b) => String(b.id) === String(effectiveItemId));
    if (!book && conv && conv.itemTitle) {
      const qTitle = conv.itemTitle.trim().toLowerCase();
      book = booksList.find((b) => b.title && (b.title.toLowerCase().includes(qTitle) || qTitle.includes(b.title.toLowerCase())));
    }

    if (book) {
      if (typeof window.openBookReader === "function") {
        window.openBookReader(book.id);
      } else if (typeof window.showBookDetails === "function") {
        window.showBookDetails(book.id);
      } else if (typeof window.openBookPreview === "function") {
        window.openBookPreview(book.id);
      } else {
        if (typeof showCustomAlert === "function") {
          showCustomAlert(`تم فتح الكتاب: ${book.title}`);
        }
      }
    } else {
      if (typeof showCustomAlert === "function") {
        showCustomAlert("تعذر تحديد الكتاب المرتبط بهذا الاستفسار");
      }
    }
    return;
  }

  // Safe fallback if context is missing
  if (typeof showCustomAlert === "function") {
    showCustomAlert("تعذر تحديد المحتوى المرتبط بهذا الاستفسار");
  }
};

window.openFullStudentProfile = function (studentId, studentName) {
  if (typeof window.openStudentDetailPage === "function" && studentId) {
    window.openStudentDetailPage(studentId);
  } else if (typeof window.openEnrolledStudentsPage === "function") {
    window.openEnrolledStudentsPage();
  } else {
    if (typeof showCustomAlert === "function") {
      showCustomAlert(`عرض ملف الطالب: ${studentName || studentId}`);
    }
  }
};

window.promptStartNewConversation = function () {
  const studentName = prompt("أدخل اسم الطالب لبدء محادثة جديدة:");
  if (studentName && studentName.trim()) {
    const newConv = {
      id: "MSG-CONV-" + Date.now(),
      studentId: "STD-" + Math.floor(100 + Math.random() * 900),
      studentName: studentName.trim(),
      studentEmail: studentName.trim().toLowerCase().replace(/\s+/g, ".") + "@gmail.com",
      studentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
      country: "غير محدد",
      isOnline: true,
      lastSeen: "متصل الآن",
      itemType: "Course",
      itemId: 1,
      itemTitle: "استفسار عام من المعلم",
      status: "Open",
      isPinned: false,
      isStarred: false,
      isMuted: false,
      unreadCount: 0,
      labels: ["محادثة جديدة"],
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          id: "M-" + Date.now(),
          sender: "teacher",
          text: "مرحباً " + studentName.trim() + "، كيف يمكنني مساعدتك اليوم؟",
          timestamp: new Date().toISOString(),
          status: "delivered",
          attachments: []
        }
      ]
    };

    currentConversations.unshift(newConv);
    saveConversations(currentConversations);
    selectedConversationId = newConv.id;
    renderMessageCenter();
    showCustomAlert("تم إنشاء المحادثة بنجاح ✅");
  }
};

window.openImageModal = function (url) {
  window.open(url, "_blank");
};

window.exportMessagesCSV = function () {
  let csv = "\uFEFFConversation ID,Student Name,Email,Status,Last Updated,Total Messages\n";
  currentConversations.forEach((c) => {
    csv += `"${c.id}","${c.studentName}","${c.studentEmail}","${c.status}","${c.lastUpdated}",${(c.messages || []).length}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Messages_Export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Helper filter function
function filterConversationsList() {
  return currentConversations.filter((c) => {
    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.studentName || "").toLowerCase().includes(q);
      const matchEmail = (c.studentEmail || "").toLowerCase().includes(q);
      const matchItem = (c.itemTitle || "").toLowerCase().includes(q);
      const matchMsg = (c.messages || []).some((m) => (m.text || "").toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchItem && !matchMsg) return false;
    }

    // Item Type filter
    if (currentItemFilter !== "all" && c.itemType !== currentItemFilter) {
      return false;
    }

    // Status filter
    if (currentFilter === "unread") return (c.unreadCount || 0) > 0;
    if (currentFilter === "pending") return c.status === "Pending";
    if (currentFilter === "resolved") return c.status === "Resolved";
    if (currentFilter === "pinned") return c.isPinned;
    if (currentFilter === "archived") return c.status === "Archived";

    return true;
  });
}

function formatTimeShort(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return isoString;
  }
}

function formatMessageText(text) {
  if (!text) return "";
  // Auto link format
  const escaped = escapeHTML(text);
  return escaped.replace(/\n/g, "<br>");
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.openStudentProfileFromCard = function (e, id) {
  if (e) e.stopPropagation();
  selectedConversationId = id;
  isStudentInfoVisible = true;
  activeMobileTab = "info";
  renderMessageCenter();
};

window.closeStudentInfoPanel = function (e) {
  if (e) e.stopPropagation();
  isStudentInfoVisible = false;
  if (window.innerWidth < 992) {
    activeMobileTab = selectedConversationId ? "chat" : "list";
  }
  renderMessageCenter();
};

window.toggleStudentInfoPanel = function (e) {
  if (e) e.stopPropagation();
  isStudentInfoVisible = !isStudentInfoVisible;
  if (window.innerWidth < 992) {
    activeMobileTab = isStudentInfoVisible ? "info" : (selectedConversationId ? "chat" : "list");
  }
  renderMessageCenter();
};

window.toggleHeaderMenu = function (e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("mcHeaderMenuDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
};

window.closeHeaderMenu = function () {
  const dropdown = document.getElementById("mcHeaderMenuDropdown");
  if (dropdown) dropdown.classList.add("hidden");
};

if (!window._mcHeaderMenuListenersBound) {
  window._mcHeaderMenuListenersBound = true;
  document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("mcHeaderMenuDropdown");
    const btn = document.getElementById("mcHeaderMenuBtn");
    if (dropdown && !dropdown.classList.contains("hidden")) {
      if (!dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
        dropdown.classList.add("hidden");
      }
    }
    const qrDropdown = document.getElementById("mcQuickReplyDropdown");
    if (qrDropdown && !qrDropdown.classList.contains("hidden")) {
      if (!qrDropdown.contains(e.target) && !e.target.closest('button[onclick*="toggleQuickReplyDropdown"]')) {
        qrDropdown.classList.add("hidden");
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      window.closeHeaderMenu();
      const qrDropdown = document.getElementById("mcQuickReplyDropdown");
      if (qrDropdown) qrDropdown.classList.add("hidden");
    }
  });
}
