/* ============================================================
   Customised Robux Balance — popup
   Sets settings.balanceOn + settings.balance via background.js,
   which broadcasts to every open Roblox tab.
   ============================================================ */

"use strict";

const PRESETS = [1000, 5000, 10000, 50000, 100000, 1000000];

const el = {
  balanceOn:     document.getElementById("balanceOn"),
  balanceField:  document.getElementById("balanceField"),
  customBalance: document.getElementById("customBalance"),
  hint:          document.getElementById("hint"),
  presets:       document.getElementById("presets")
};

let settings = null;

function formatRobux(value) {
  const v = Math.max(0, Number(value) || 0);
  if (v < 1000000) return v.toLocaleString("en-US");
  const unit = v < 1000000000 ? ["M", 1000000] : v < 1000000000000 ? ["B", 1000000000] : ["T", 1000000000000];
  const n = Math.round((v / unit[1]) * 10) / 10;
  return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + unit[0];
}

function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (resp) => {
      if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
      else resolve(resp || { ok: false, error: "No response" });
    });
  });
}

function buildPresets() {
  el.presets.replaceChildren();
  PRESETS.forEach((value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.amount = String(value);
    btn.textContent = formatRobux(value);
    btn.addEventListener("click", () => {
      el.customBalance.value = String(value);
      el.balanceOn.checked = true;
      el.balanceField.hidden = false;
      updateSettings({ balance: value, balanceOn: true });
      syncPresetSelection();
    });
    el.presets.append(btn);
  });
  syncPresetSelection();
}

function syncPresetSelection() {
  const current = Number(el.customBalance.value) || 0;
  Array.from(el.presets.children).forEach((btn) => {
    btn.classList.toggle("is-selected", Number(btn.dataset.amount) === current);
  });
}

function render() {
  if (!settings) return;
  el.balanceOn.checked = settings.balanceOn;
  el.balanceField.hidden = !settings.balanceOn;
  if (document.activeElement !== el.customBalance) {
    el.customBalance.value = String(settings.balance);
  }
  syncPresetSelection();
}

async function updateSettings(patch) {
  const resp = await sendMessage({ type: "update-settings", patch });
  if (resp.ok && resp.settings) {
    settings = resp.settings;
    render();
  }
}

el.balanceOn.addEventListener("change", (e) => {
  updateSettings({ balanceOn: e.target.checked });
  el.balanceField.hidden = !e.target.checked;
  if (e.target.checked) {
    el.customBalance.focus();
    el.customBalance.select();
  }
});

el.customBalance.addEventListener("input", (e) => {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
  if (digits !== e.target.value) e.target.value = digits;
  syncPresetSelection();
  updateSettings({ balance: Number(digits) || 0 });
});

async function init() {
  buildPresets();
  const resp = await sendMessage({ type: "get-settings" });
  if (resp.ok && resp.settings) {
    settings = resp.settings;
    render();
  }
}

init();