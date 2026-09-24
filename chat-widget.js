

‎ * ملف واحد بدون مكتبات. يعمل داخل Shadow DOM فلا يتعارض مع تنسيقات الموقع.

 *

‎ * الإضافة في الموقع (قبل </body>):

 * <script src="/almoghani-chat-widget.js" defer

 *   data-endpoint="https://YOUR-WORKER.workers.dev"

 *   data-side="left"

 *   data-whatsapp="966557073007"></script>

 *

‎ * الخيارات:

 *   data-endpoint  رابط الخادم الوسيط (مطلوب)

 *   data-side      left | right   (الافتراضي left)

 *   data-whatsapp  رقم واتساب يظهر عند حدوث خطأ

 *   data-title     عنوان النافذة

 *   data-offset    مسافة إضافية من أسفل الشاشة بالبكسل (إن كان في الموقع أزرار عائمة أخرى)

 */

(function () {

  "use strict";

  var script =

    document.currentScript ||

    document.querySelector("script[data-endpoint]");

  var ds = (script && script.dataset) || {};

  var cfg = {

    endpoint: ds.endpoint || "",

    side: ds.side === "right" ? "right" : "left",

    whatsapp: ds.whatsapp || "966557073007",

    title: ds.title || "مساعد المغني",

    offset: parseInt(ds.offset || "0", 10) || 0,

  };

  if (!cfg.endpoint) {

    console.error("[chat-widget] أضف data-endpoint برابط الخادم الوسيط.");

    return;

  }

  var STORE_KEY = "almoghani_chat_v1";

  var MAX_HISTORY = 12;

  var GREETING =

‎    "أهلاً بك في موقع المغني. اسألني عن الأعمال والخدمات، أو اطلب مساعدة في فكرتك.";

  var QUICK = [

‎    "ما الخدمات التي تقدمها؟",

‎    "أريد تصميم موقع",

‎    "كيف أتواصل معك؟",

  ];

‎  // خط عربي (اختياري: إن تعذر التحميل يُستخدم خط النظام)

  try {

    var link = document.createElement("link");

    link.rel = "stylesheet";

    link.href =

      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap";

    document.head.appendChild(link);

  } catch (e) {}

  var CSS = `

  :host { all: initial; }

  * { box-sizing: border-box; }

  .wrap {

    --g: #00612f; --g-deep: #0a3d26; --gold: #c8a24a;

    --ink: #12241b; --mist: #eef3ef; --line: #d5e0d8;

    position: fixed; z-index: 2147483000;

    bottom: calc(20px + ${cfg.offset}px + env(safe-area-inset-bottom, 0px));

    ${cfg.side}: 20px;

    font-family: "IBM Plex Sans Arabic", Tahoma, system-ui, sans-serif;

    color: var(--ink); direction: rtl; line-height: 1.6;

  }

  button { font: inherit; cursor: pointer; }

  :focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }

  .launcher {

    display: flex; align-items: center; gap: 10px;

    background: var(--g); color: #fff; border: 0;

    border-radius: 999px; padding: 13px 20px 13px 18px;

    msgs.appendChild(d);

    scroll();

    return d;

  }

  function setBusy(b) {

    busy = b;

    sendBtn.disabled = b;

  }

  async function send(text) {

    text = (text || "").trim();

    if (!text || busy) return;

    chips.hidden = true;

    addMsg("user", text);

    history.push({ role: "user", content: text });

    input.value = "";

    input.style.height = "auto";

    setBusy(true);

    var typing = document.createElement("div");

    typing.className = "m bot typing";

    typing.innerHTML = "<i></i><i></i><i></i>";

    msgs.appendChild(typing);

    scroll();

    var ctl = new AbortController();

    var timer = setTimeout(function () { ctl.abort(); }, 30000);

    try {

      var res = await fetch(cfg.endpoint, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),

        signal: ctl.signal,

      });

      var data = await res.json().catch(function () { return {}; });

      if (!res.ok || !data.reply) throw new Error(data.error || "http " + res.status);

      typing.remove();

      addMsg("assistant", data.reply);

      history.push({ role: "assistant", content: data.reply });

      save();

    } catch (e) {

      typing.remove();

      addMsg(

        "assistant",

‎        "تعذر الوصول إلى المساعد الآن. أعد المحاولة بعد قليل، أو راسلني مباشرة على واتساب: https://wa.me/" + cfg.whatsapp,

        true

      );

    } finally {

      clearTimeout(timer);

      setBusy(false);

    }

  }

  function open() {

    panel.hidden = false;

    panel.classList.remove("enter");

    void panel.offsetWidth;

    panel.classList.add("enter");

    wrap.classList.add("open");

    launcher.setAttribute("aria-expanded", "true");

    scroll();

    if (window.matchMedia("(pointer: fine)").matches) input.focus();

  }

  function close() {

    panel.hidden = true;

    wrap.classList.remove("open");

    launcher.setAttribute("aria-expanded", "false");

    launcher.focus();

  }

  launcher.addEventListener("click", open);

  $(".close").addEventListener("click", close);

  root.addEventListener("keydown", function (e) {

    if (e.key === "Escape" && !panel.hidden) close();

  });

  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });

  input.addEventListener("keydown", function (e) {

    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {

      e.preventDefault();

      send(input.value);

    }

  });

  input.addEventListener("input", function () {

    input.style.height = "auto";

    input.style.height = Math.min(input.scrollHeight, 110) + "px";

  });

‎  // الرسائل السريعة

  QUICK.forEach(function (q) {

    var b = document.createElement("button");

    b.type = "button";

    b.textContent = q;

    b.addEventListener("click", function () { send(q); });

    chips.appendChild(b);

  });

‎  // استرجاع المحادثة داخل نفس الجلسة

  try {

    var saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");

    if (Array.isArray(saved)) history = saved;

  } catch (e) {}

  addMsg("assistant", GREETING);

  if (history.length) {

    chips.hidden = true;

    history.forEach(function (m) { addMsg(m.role, m.content); });

  }

  function mount() { document.body.appendChild(host); }

  if (document.body) mount();

  else document.addEventListener("DOMContentLoaded", mount);

})();
