// script.js
(() => {
  const promptArea = document.getElementById("promptArea");
  const copyBtn = document.getElementById("copyBtn");
  const toastEl = document.getElementById("toast");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  // chooser elements
  const chooser = document.getElementById("chooser");
  const chooserTitle = document.getElementById("chooserTitle");
  const chooserOptions = document.getElementById("chooserOptions");
  const customInput = document.getElementById("customInput");
  const cancelBtn = document.getElementById("cancelBtn");
  const applyBtn = document.getElementById("applyBtn");

  // copy modal elements (fallback for Genially iframe)
  const copyModal = document.getElementById("copyModal");
  const copyTextarea = document.getElementById("copyTextarea");
  const copyModalClose = document.getElementById("copyModalClose");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const closeBtn2 = document.getElementById("closeBtn2");

  // Templates: prompt lines with embedded chips
  const CONFIG = {
    character: {
      title: "Character",
      chips: {
        hero: ["kitten", "puppy", "bunny", "bear cub", "unicorn", "robot"],
        style: ["cartoon", "watercolour", "play‑dough", "children's book", "sticker", "3D toy"],
        mood: ["happy", "kind", "brave", "surprised", "sleepy", "magical"],
        colors: ["bright", "pastel", "warm", "cool", "rainbow", "black and white"],
        extra: ["with a hat", "with a backpack", "with a balloon", "with glasses", "with a crown", "with wings"],
        bg: ["transparent", "no background", "sky", "forest", "room", "city"]
      },
      lines: [
        `Draw {hero} as the main character.`,
        `Style: {style}. Mood: {mood}.`,
        `Colours: {colors}.`,
        `Extra: {extra}.`,
        `Background around the main character: {bg}.`,
        `Picture for a children's book: simple shapes, clear lines, no text, high quality.`
      ]
    },
    background: {
      title: "Background",
      chips: {
        place: ["forest", "city", "castle", "beach", "space", "school"],
        time: ["morning", "day", "evening", "night", "sunset", "sunrise"],
        style: ["cartoon", "watercolour", "children's book", "pastel", "paper craft", "3D world"],
        mood: ["magical", "calm", "festive", "mysterious", "joyful", "cosy"],
        details: ["rainbow", "stars", "lanterns", "snowflakes", "flowers", "clouds"],
        camera: ["wide shot", "panorama", "top view", "eye level", "far away", "mid-scene"]
      },
      lines: [
        `Draw a background for a children's book: {place}.`,
        `Time: {time}. Mood: {mood}.`,
        `Style: {style}.`,
        `Add details: {details}.`,
        `Camera: {camera}.`,
        `Background without characters, clean and pretty, soft light, no text, high quality.`
      ]
    }
  };

  // current state (selected values)
  let currentTemplate = "character";
  const state = {
    character: {
      hero: "kitten",
      style: "cartoon",
      mood: "happy",
      colors: "bright",
      extra: "with a hat",
      bg: "transparent",
    },
    background: {
      place: "forest",
      time: "day",
      style: "children's book",
      mood: "cosy",
      details: "stars",
      camera: "wide shot",
    }
  };

  // chooser runtime
  let activeKey = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 1400);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function chipHTML(key) {
    const value = state[currentTemplate][key] || "";
    const display = value.trim() ? value : "press";
    const isEmpty = !value.trim();
    return `<span class="chip ${isEmpty ? "empty" : ""}" data-key="${escapeHtml(key)}">
      <span class="val">${escapeHtml(display)}</span>
      <span class="caret">▾</span>
    </span>`;
  }

  function renderPrompt() {
    const tpl = CONFIG[currentTemplate];
    const htmlLines = tpl.lines.map((line) => {
      const withChips = line.replace(/\{([a-z_]+)\}/g, (_, key) => chipHTML(key));
      return `<p class="line">${withChips}</p>`;
    }).join("");

    promptArea.innerHTML = htmlLines;

    promptArea.querySelectorAll(".chip").forEach((el) => {
      el.addEventListener("click", () => openChooser(el));
    });
  }

  function setTemplate(name) {
    currentTemplate = name;

    tabs.forEach((b) => {
      const active = b.dataset.template === name;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });

    renderPrompt();
  }

  function openChooser(chipEl) {
    activeKey = chipEl.dataset.key;

    const tpl = CONFIG[currentTemplate];
    const options = (tpl.chips[activeKey] || []).slice();
    const current = (state[currentTemplate][activeKey] || "").trim();

    chooserTitle.textContent = "Select an option";
    chooserOptions.innerHTML = "";
    customInput.value = "";

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "optBtn" + (opt === current ? " selected" : "");
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        chooserOptions.querySelectorAll(".optBtn").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");
        customInput.value = "";
      });
      chooserOptions.appendChild(btn);
    });

    chooser.classList.add("open");
    chooser.setAttribute("aria-hidden", "false");
    setTimeout(() => customInput.focus(), 0);
  }

  function closeChooser() {
    chooser.classList.remove("open");
    chooser.setAttribute("aria-hidden", "true");
    activeKey = null;
  }

  function applyChooser() {
    if (!activeKey) return;

    const typed = (customInput.value || "").trim();
    if (typed) {
      state[currentTemplate][activeKey] = typed;
      renderPrompt();
      closeChooser();
      return;
    }

    const selectedBtn = chooserOptions.querySelector(".optBtn.selected");
    if (selectedBtn) {
      state[currentTemplate][activeKey] = selectedBtn.textContent.trim();
      renderPrompt();
      closeChooser();
      return;
    }

    closeChooser();
  }

  function getPlainPromptText() {
    const tpl = CONFIG[currentTemplate];
    const values = state[currentTemplate];

    return tpl.lines.map((line) =>
      line.replace(/\{([a-z_]+)\}/g, (_, key) => values[key] ? values[key] : "...")
    ).join("\n");
  }

  // ===== Genially/iframe friendly copy =====
  function fallbackCopyExecCommand(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }

    document.body.removeChild(textarea);
    return ok;
  }

  function openCopyModal(text) {
    if (!copyModal || !copyTextarea) {
      showToast("Could not copy");
      return;
    }

    copyTextarea.value = text;
    copyModal.classList.add("open");
    copyModal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      copyTextarea.focus();
      copyTextarea.select();
    }, 0);
  }

  function closeCopyModal() {
    if (!copyModal) return;
    copyModal.classList.remove("open");
    copyModal.setAttribute("aria-hidden", "true");
  }

  function copyPromptText() {
    const text = getPlainPromptText();

    // 1) try execCommand copy (best chance in Genially iframe)
    const ok = fallbackCopyExecCommand(text);

    if (ok) {
      showToast("Prompt copied");
      return;
    }

    // 2) fallback: manual modal
    openCopyModal(text);
  }

  // ===== Auto-scale (optional) =====
  function autoScaleInit() {
    const fitWrap = document.getElementById("fitWrap");
    if (!fitWrap) return;

    const BASE_W = 1100;
    const BASE_H = 620;

    function fit() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pad = 12;

      const raw = Math.min((w - pad) / BASE_W, (h - pad) / BASE_H);
      const scale = Math.floor(raw * 100) / 100; // reduce blur

      fitWrap.style.transform = `scale(${scale})`;
    }

    window.addEventListener("resize", fit);
    fit();
    setTimeout(fit, 50);
    setTimeout(fit, 200);
    setTimeout(fit, 600);
  }

  // events
  tabs.forEach((btn) => btn.addEventListener("click", () => setTemplate(btn.dataset.template)));

  if (copyBtn) copyBtn.addEventListener("click", copyPromptText);

  if (cancelBtn) cancelBtn.addEventListener("click", closeChooser);
  if (applyBtn) applyBtn.addEventListener("click", applyChooser);

  if (chooser) chooser.addEventListener("click", (e) => {
    if (e.target === chooser) closeChooser();
  });

  if (copyModalClose) copyModalClose.addEventListener("click", closeCopyModal);
  if (closeBtn2) closeBtn2.addEventListener("click", closeCopyModal);

  if (selectAllBtn) selectAllBtn.addEventListener("click", () => {
    if (!copyTextarea) return;
    copyTextarea.focus();
    copyTextarea.select();
  });

  if (copyModal) copyModal.addEventListener("click", (e) => {
    if (e.target === copyModal) closeCopyModal();
  });

  window.addEventListener("keydown", (e) => {
    // chooser
    if (chooser && chooser.classList.contains("open")) {
      if (e.key === "Escape") closeChooser();
      if (e.key === "Enter") applyChooser();
    }
    // copy modal
    if (copyModal && copyModal.classList.contains("open")) {
      if (e.key === "Escape") closeCopyModal();
    }
  });

  // init
  setTemplate("character");
  autoScaleInit();
})();
