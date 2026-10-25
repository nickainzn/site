// ==UserScript==
// @name         Send Robux
// @icon         https://s6.imgcdn.dev/hDGvcO.png
// @namespace    immortal.st
// @version      1.3
// @description  super 67 realistic robux sender.
// @match        https://www.roblox.com/*
// @run-at       document-idle
// @grant        none
// @inject-into  page
// @noframes
// @license GPLv3
// ==/UserScript==

/* ============================================================
                          immortal.st
   content.js — runs inside the Roblox page.
   The Customised Robux Balance section is owned by the
   extension popup; this file just reacts to the broadcast.
   ============================================================ */
(function () {
  "use strict";

  // Roblox's own Send button, matched by its icon so it works in every language
  var SEND_BUTTON_SCOPE = "#robux-redesign-page button";
  var SEND_BUTTON_ICON = ".icon-regular-arrow-up-from-line";

  var SETTINGS_KEY = "send-robux-userscript:settings";
  var SOURCES = ["connections", "random", "custom"];
  var RANDOM_USER_COUNT = 100;         // IDs tried per load (one request); ~95% are real accounts
  var RANDOM_USER_MAX_ID = 5000000000; // IDs below this are almost all taken
  var CUSTOM_LIST_MAX = 200;

  var CONNECTIONS_TTL = 5 * 60 * 1000; // refetch the list if it's older than this
  var CLOSE_MS = 200;
  var PRESS_MS = 500; // hold time for the touch long-press that opens the menu
  var QUICK_AMOUNTS = [25, 50, 100, 200];

  /* fallback */
  var AVATAR_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIGlkPSJMYXllcl8xIiB3aWR0aD0iOTAiIGhlaWdodD0iOTAiIHg9IjAiIHk9IjAiIHZpZXdCb3g9IjAgMCA5MCA5MCI+PHN0eWxlPi5zdDJ7ZmlsbDpub25lO3N0cm9rZTojMDAwO3N0cm9rZS13aWR0aDoyO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPjxnIGlkPSJ1bmFwcHJvdmVkXzFfIj48cGF0aCBpZD0iYmdfMl8iIGQ9Ik0wIDBoOTB2OTBIMHoiIHN0eWxlPSJmaWxsOiM2NTY2NjgiLz48ZyBpZD0idW5hcHByb3ZlZCIgc3R5bGU9Im9wYWNpdHk6LjMiPjxjaXJjbGUgY3g9IjQ1IiBjeT0iNDguOCIgcj0iMTAiIGNsYXNzPSJzdDIiLz48cGF0aCBkPSJtMzggNDEuNyAxNCAxNC4xTTMyLjUgMjMuNWgtNHY0TTI4LjUgNjIuNXY0aDRNMjguNSAzMS44djZNMjguNSA0MnY2TTI4LjUgNTIuMnY2TTU3LjUgNjYuNWg0di00TTYxLjUgNTguMnYtNk02MS41IDQ4di02TTYxLjUgMzcuOHYtNE0zNi44IDY2LjVoNk00Ny4yIDY2LjVoNk0zNi44IDIzLjVoNk00Ny4yIDIzLjVoNE01MS40IDIzLjZsMy41IDMuNU01Ny45IDMwLjFsMy41IDMuNU01MS4yIDIzLjh2M001OC41IDMzLjhoM001MS4yIDMwLjJ2My42aDMuNiIgY2xhc3M9InN0MiIvPjwvZz48L2c+PC9zdmc+";

  /* ---- Icons (same artwork as the mockup's sprite, currentColor-driven) ---- */
  var ICONS = {
    robux:
      '<svg class="icon icon--robux" viewBox="0 -0.23 24 26.59" aria-hidden="true"><path fill="currentColor" d="M21.4 4.62a5.2 5.2 0 0 1 2.6 4.5V17a5.19 5.19 0 0 1-2.6 4.5l-6.8 3.93a5.19 5.19 0 0 1-5.2 0l-6.8-3.95A5.19 5.19 0 0 1 0 17V9.12a5.2 5.2 0 0 1 2.6-4.5L9.4.7a5.19 5.19 0 0 1 5.2 0zM10.31 2.48L3.69 6.31A3.35 3.35 0 0 0 2 9.23v7.65a3.36 3.36 0 0 0 1.69 2.92l6.62 3.83a3.4 3.4 0 0 0 3.38 0l6.62-3.83A3.36 3.36 0 0 0 22 16.88V9.23a3.35 3.35 0 0 0-1.69-2.92l-6.62-3.83a3.4 3.4 0 0 0-3.38 0zm3.08 2.14l5.22 3A2.78 2.78 0 0 1 20 10v6a2.76 2.76 0 0 1-1.39 2.4l-5.22 3a2.76 2.76 0 0 1-2.78 0l-5.22-3A2.76 2.76 0 0 1 4 16.07V10a2.78 2.78 0 0 1 1.39-2.37l5.22-3a2.76 2.76 0 0 1 2.78 0zM9 16.05h6v-6H9z"/></svg>',
    brand:
      '<svg class="brand__logo" viewBox="0 0 26 28.001" aria-hidden="true"><path fill="currentColor" d="M10.855.561a4.382 4.382 0 0 1 4.29 0l8.71 4.908A4.17 4.17 0 0 1 26 9.094v9.814a4.169 4.169 0 0 1-2.145 3.625l-8.71 4.907-.252.131a4.385 4.385 0 0 1-3.786 0l-.252-.13-2.837-1.6A2.001 2.001 0 0 1 7 24.1V10.001a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4a1 1 0 0 1 0-2h4v-7H9v14.098l2.837 1.598a2.382 2.382 0 0 0 2.326 0l8.711-4.908A2.168 2.168 0 0 0 24 18.908V9.094a2.17 2.17 0 0 0-1.126-1.882l-8.71-4.908a2.383 2.383 0 0 0-2.327 0L3.126 7.211A2.169 2.169 0 0 0 2 9.094v9.814c0 .757.414 1.48 1.126 1.882l.364.205a1.001 1.001 0 0 1-.981 1.743l-.364-.205A4.169 4.169 0 0 1 0 18.908V9.094a4.16 4.16 0 0 1 1.901-3.478l.244-.147 8.71-4.907z"/></svg>',
    close:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg>',
    cal:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4.5 7.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2zM4.5 10h15M8.5 4.2v3M15.5 4.2v3"/></svg>',
    friends:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM3.4 19a5.6 5.6 0 0 1 11.2 0M15.8 5.3a3.1 3.1 0 0 1 0 5.9M17 13.4a5.6 5.6 0 0 1 3.6 5.2"/></svg>',
    info:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M12 11.2v5"/><circle cx="12" cy="7.7" r="1.05" fill="currentColor"/></svg>',
    search:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="m15.6 15.6 4.4 4.4"/></svg>',
    chevron:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="m9.5 6.5 5.5 5.5-5.5 5.5"/></svg>',
    check:
      '<svg class="sent__check" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2.3"/><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M14.5 24.4 21 30.8 33.5 17.4"/></svg>',
    verified:
      '<svg class="verified" viewBox="0 0 28 28" role="img" aria-label="Verified"><rect x="5.88818" width="22.89" height="22.89" transform="rotate(15 5.88818 0)" fill="#0066FF"/><path fill-rule="evenodd" clip-rule="evenodd" d="M20.543 8.7508L20.549 8.7568C21.15 9.3578 21.15 10.3318 20.549 10.9328L11.817 19.6648L7.45 15.2968C6.85 14.6958 6.85 13.7218 7.45 13.1218L7.457 13.1148C8.058 12.5138 9.031 12.5138 9.633 13.1148L11.817 15.2998L18.367 8.7508C18.968 8.1498 19.942 8.1498 20.543 8.7508Z" fill="white"/></svg>'
  };

  /* ============================================================
     Styles — the mockup's CSS, scoped inside a shadow root so
     Roblox's stylesheet and ours can't touch each other
     ============================================================ */
  var CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

.theme {
  --modal-bg:      #191a1f;
  --modal-border:  transparent;
  --modal-shadow:  0 26px 70px rgba(0, 0, 0, 0.62);
  --card-bg:       #202128;
  --card-border:   rgba(255, 255, 255, 0.045);
  --btn-gray:      #2f3039;
  --btn-gray-hov:  #393a44;
  --primary:       #335fff;
  --primary-hov:   #4a72ff;
  --primary-idle:  #263d8f;
  --primary-idle-text: #cbd2ec;
  --chip-border:   rgba(255, 255, 255, 0.05);
  --chip-icon:     #cfd0d4;
  --sent-check:    #e7e8ea;
  --field-border:  rgba(255, 255, 255, 0.14);
  --row-hover:     rgba(255, 255, 255, 0.05);
  --skeleton:      rgba(255, 255, 255, 0.07);
  --avatar-bg:     #2a2b31;
  --backdrop:      rgba(0, 0, 0, 0.6);

  --text:          #f2f3f5;
  --text-soft:     #d7d8dc;
  --text-dim:      #c2c3c9;
  --text-muted:    #a1a2a8;

  --online:        #00a2ff;
  --in-game:       #39c582;
  --in-studio:     #f68802;
  --offline:       #7c7d85;

  --radius-modal:  16px;
  --radius-card:   12px;
  --radius-btn:    10px;

  --font: "Builder Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.theme[data-theme="light"] {
  --modal-bg:      #f7f7f8;
  --modal-border:  rgba(27, 37, 75, 0.08);
  --modal-shadow:  0 2px 4px -0.5px rgba(0, 0, 0, 0.08), 0 10px 20px -0.75px rgba(0, 0, 0, 0.08),
                   0 26px 60px rgba(10, 10, 14, 0.16);
  --card-bg:       #ffffff;
  --card-border:   rgba(27, 37, 75, 0.08);
  --btn-gray:      rgba(27, 37, 75, 0.12);
  --btn-gray-hov:  rgba(27, 37, 75, 0.18);
  --primary-idle:  #b3c3ff;
  --primary-idle-text: #f4f6ff;
  --chip-border:   rgba(27, 37, 75, 0.06);
  --chip-icon:     #494d5a;
  --sent-check:    #202227;
  --field-border:  rgba(27, 37, 75, 0.16);
  --row-hover:     rgba(27, 37, 75, 0.06);
  --skeleton:      rgba(27, 37, 75, 0.08);
  --avatar-bg:     #e4e5ea;
  --backdrop:      rgba(10, 10, 14, 0.5);

  --text:          #202227;
  --text-soft:     #494d5a;
  --text-dim:      #494d5a;
  --text-muted:    #6a6f81;
  --offline:       #a3a6b3;
}

.root {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: grid;
  place-items: center;
  place-content: center; /* the 480px layout box overflows small screens; center it as a track */
  padding: 24px 16px;
  font-family: var(--font);
  font-size: 16px;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: var(--backdrop);
  opacity: 0;
  transition: opacity 0.18s ease;
}
.root.is-open .backdrop { opacity: 1; }

/* ---- Generic icon sizing ---- */
.icon { display: inline-block; width: 1em; height: 1em; flex: none; vertical-align: middle; }
.icon--robux { aspect-ratio: 24 / 26.6; height: 1em; width: auto; }

/* ============================================================
   Modal
   ============================================================ */
.modal {
  position: relative;
  width: 480px;
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  border-radius: var(--radius-modal);
  padding: 6px 18px 18px;
  box-shadow: var(--modal-shadow);
  overflow: hidden;
  opacity: 0;
  /* --fit scales the whole box down on small screens (set in JS); the shape never changes */
  transform: scale(var(--fit, 1)) translateY(10px) scale(0.985);
  transition: opacity 0.2s ease, transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.root.is-open .modal { opacity: 1; transform: scale(var(--fit, 1)); }

/* ---- Header ---- */
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 16px;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand__logo { width: 23px; height: 24.8px; color: var(--text); flex: none; }
.brand__title {
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.1px;
  color: var(--text);
}
.header-right { display: flex; align-items: center; gap: 14px; }
.balance { display: flex; align-items: center; gap: 6px; color: var(--text-soft); }
.balance__icon { font-size: 19px; color: var(--text-soft); }
.balance__amount { font-weight: 600; font-size: 17px; }

.close-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-soft);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}
.close-btn .icon { width: 22px; height: 22px; }
.close-btn:hover { background: var(--row-hover); color: var(--text); }
/* The brand mark doubles as the back button once you're past the list */
.back-btn { width: 23px; height: 24.8px; margin: 0; }

:focus { outline: none; }
:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.modal:focus-visible, .search input:focus-visible { outline: none; }

/* ============================================================
   Screens
   ============================================================ */
.screen { animation: screen-in 0.22s ease both; }

@keyframes screen-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Avatar ---- */
.avatar {
  display: block;
  position: relative;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--avatar-bg);
}
.avatar img { display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.avatar--sm { width: 68px; height: 68px; }

.verified { width: 15px; height: 15px; flex: none; }
/* Premium members get the roblox-plus mark next to their name, like the real site */
.premium-mark { width: 15px; height: 16.2px; }

/* ============================================================
   Screen 1 — pick a connection
   ============================================================ */
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--field-border);
  border-radius: 999px;
  color: var(--text-muted);
  cursor: text;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search:focus-within { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); }
.search .icon { width: 19px; height: 19px; }
.search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: 15px;
}
.search input::placeholder { color: var(--text-muted); }

.list-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 16px 2px 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.list-wrap {
  position: relative;
  height: min(360px, calc(100vh - 260px));
  min-height: 200px;
  margin: 0 -10px;
}
.list {
  height: 100%;
  overflow-y: auto;
  padding: 0 6px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--btn-gray-hov) transparent;
}

.person {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.person:hover { background: var(--row-hover); }
.person:focus-visible { outline: none; background: var(--row-hover); box-shadow: inset 0 0 0 2px var(--primary); }
.person__avatar { position: relative; flex: none; }
.presence {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2.5px solid var(--modal-bg);
  background: var(--dot);
}
.is-game    { --dot: var(--in-game); }
.is-studio  { --dot: var(--in-studio); }
.is-online  { --dot: var(--online); }
.is-offline { --dot: var(--offline); }

.person__text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.person__name { display: flex; align-items: center; gap: 5px; min-width: 0; }
.person__display {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
}
.person__meta {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--text-muted);
}
.person__place.is-game { color: var(--in-game); }
.person__chev { width: 18px; height: 18px; color: var(--text-muted); opacity: 0.6; transition: opacity 0.15s, transform 0.15s; }
.person:hover .person__chev, .person:focus-visible .person__chev { opacity: 1; transform: translateX(2px); }

/* ---- Loading / empty / error ---- */
.list-state {
  position: absolute;
  inset: 0;
  padding: 0 6px;
}
.skeleton-row { display: flex; align-items: center; gap: 12px; padding: 8px; }
.skeleton-row .avatar, .skeleton-bar {
  background: var(--skeleton);
  animation: pulse 1.4s ease-in-out infinite;
}
.skeleton-bar { display: block; height: 11px; border-radius: 6px; }
.skeleton-row .person__text { gap: 8px; }
@keyframes pulse { 50% { opacity: 0.45; } }

.message {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 28px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.45;
}
.message .icon { width: 30px; height: 30px; margin-bottom: 4px; }
.message__title { font-weight: 600; font-size: 16px; color: var(--text); }
.message__actions { display: flex; gap: 6px; margin-top: 6px; }

.link-btn {
  border: 0;
  background: none;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--primary);
  font-family: inherit;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.link-btn:hover { background: var(--row-hover); }

/* ---- Buttons ---- */
.btn {
  font-family: inherit;
  font-weight: 600;
  font-size: 17px;
  border: none;
  border-radius: var(--radius-btn);
  cursor: pointer;
  color: #fff;
  transition: background 0.15s, transform 0.05s, color 0.15s;
}
.btn:active { transform: translateY(1px); }
.btn--block { display: block; width: 100%; height: 46px; margin-top: 22px; }

.btn--primary { background: var(--primary); color: #fff; }
.btn--primary:hover { background: var(--primary-hov); }
/* Idle state mirrors the muted navy "Next" in the first screenshot */
.btn--primary.is-idle { background: var(--primary-idle); color: var(--primary-idle-text); cursor: default; }
.btn--primary.is-idle:hover { background: var(--primary-idle); }
.btn--primary.is-idle:active { transform: none; }

.btn--secondary { background: var(--btn-gray); color: var(--text-soft); }
.btn--secondary:hover { background: var(--btn-gray-hov); }

/* ---- Footnote ---- */
.footnote {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 400;
  margin: 14px 0 4px;
}
.footnote--left { text-align: left; line-height: 1.45; margin-top: 14px; }

/* ============================================================
   Screen 2 — amount entry (mockup screen 1)
   ============================================================ */
.recipient {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}
.avatar--lg { width: 72px; height: 72px; }
.recipient__name {
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  font-weight: 700;
  font-size: 17px;
  color: var(--text);
}
.recipient__name span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

.amount-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin: 26px 0 4px;
  color: var(--text-soft);
}
.amount-display__icon { font-size: 34px; }

/* Editable big amount: looks like the original static number,
   but tapping it opens the keyboard on mobile. */
.amount-display__value {
  font-family: inherit;
  font-weight: 700;
  font-size: 40px;
  line-height: 1;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: 0;
  padding: 0;
  margin: 0;
  width: 4.5ch;                 /* grows via sizeAmountInput() */
  max-width: 100%;
  text-align: center;
  caret-color: var(--primary);
  transition: width 0.12s ease;
  -moz-appearance: textfield;
  appearance: textfield;
}
.amount-display__value::-webkit-outer-spin-button,
.amount-display__value::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.amount-display__value:focus { outline: none; }

/* Content-hugging chips, centred as a group (matches the original layout) */
.quick-amounts { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 26px; }
.quick-amount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  background: var(--btn-gray);
  border: 1px solid var(--chip-border);
  border-radius: 9px;
  color: var(--text-soft);
  font-family: inherit;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.05s, opacity 0.15s;
}
.quick-amount .icon--robux { font-size: 15px; color: var(--chip-icon); }
.quick-amount:hover { background: var(--btn-gray-hov); }
.quick-amount:active { transform: translateY(1px); }
.quick-amount.is-selected {
  background: var(--btn-gray-hov);
  box-shadow: inset 0 0 0 2px var(--primary);
}
.quick-amount:disabled { opacity: 0.45; cursor: not-allowed; }
.quick-amount:disabled:hover { background: var(--btn-gray); }
.quick-amount:disabled:active { transform: none; }

/* ============================================================
   Screen 3 — confirmation (mockup screen 2)
   ============================================================ */
.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 18px;
  margin-top: 6px;
}
.profile-card__name {
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  font-weight: 700;
  font-size: 17px;
  color: var(--text);
  margin-top: 9px;
}
.profile-card__name span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.profile-card__handle { font-size: 15px; color: var(--text-muted); margin-top: 2px; }
.profile-card__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 24px;
  margin-top: 18px;
}
.stat, .profile-card__joined {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  color: var(--text-dim);
}
.stat .icon, .profile-card__joined .icon { width: 16px; height: 16px; color: var(--text-muted); }
.stat__dot { width: 9px; height: 9px; margin: 0 3px; border-radius: 50%; background: var(--dot); }
.profile-card__joined { justify-content: center; margin-top: 12px; }
.profile-card__joined .skeleton-bar { width: 96px; }

.recipient-card {
  text-align: center;
  padding: 20px 18px;
  margin-top: 14px;
}
.recipient-card__amount {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text);
  font-weight: 700;
  font-size: 32px;
  line-height: 1;
}
.recipient-card__amount .icon--robux { font-size: 30px; color: var(--text-soft); }
.recipient-card__sub { margin: 10px 0 0; color: var(--text-muted); font-size: 14px; }

.actions { display: flex; gap: 12px; margin-top: 16px; }
.actions .btn { height: 46px; }
.actions .btn--primary { flex: 1.22; }
.actions .btn--secondary { flex: 1; }

/* ============================================================
   Screen 4 — sent confirmation (mockup screen 3)
   ============================================================ */
.sent {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 0 4px;
}
.sent__check { width: 46px; height: 46px; color: var(--sent-check); }
.sent__text {
  margin: 28px 0 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}
.screen--sent .btn--block { margin-top: 30px; }

/* ============================================================
   Settings menu (Alt+M)
   ============================================================ */
.menu {
  position: fixed;
  top: 124px; /* just below the balance pill, so the Send button stays clickable */
  right: 16px;
  z-index: 2147483001;
  width: 320px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  padding: 4px 16px 14px;
  background: var(--modal-bg);
  border: 1px solid var(--field-border);
  border-radius: var(--radius-modal);
  box-shadow: var(--modal-shadow);
  font-family: var(--font);
  font-size: 14px;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  opacity: 0;
  transform: translateY(-6px) scale(0.985);
  transition: opacity 0.16s ease, transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.menu.is-open { opacity: 1; transform: none; }
.menu:focus-visible, .menu textarea:focus-visible, .menu__field input:focus-visible { outline: none; }

.menu__header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 8px; }
.menu__title { font-weight: 700; font-size: 16px; }
.menu__section { padding: 12px 0; border-top: 1px solid var(--field-border); }
.menu__section:last-of-type { padding-bottom: 4px; }
.menu__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 24px;
  font-weight: 600;
  cursor: pointer;
}
.menu__label { margin-bottom: 8px; font-weight: 600; }
.menu__hint { margin: 8px 0 0; font-size: 12.5px; line-height: 1.4; color: var(--text-muted); }
.menu__actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; }
.menu__status { min-width: 0; font-size: 12.5px; line-height: 1.35; color: var(--text-muted); overflow-wrap: anywhere; }

.switch {
  appearance: none;
  flex: none;
  position: relative;
  width: 36px;
  height: 20px;
  margin: 0;
  border-radius: 999px;
  background: var(--btn-gray-hov);
  cursor: pointer;
  transition: background 0.15s;
}
.switch::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s;
}
.switch:checked { background: var(--primary); }
.switch:checked::before { transform: translateX(16px); }

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: var(--btn-gray);
}
.segmented button {
  height: 30px;
  padding: 0 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-soft);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.segmented button:hover { color: var(--text); }
.segmented button[aria-checked="true"] { background: var(--primary); color: #fff; }

.menu textarea {
  display: block;
  width: 100%;
  height: 96px;
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid var(--field-border);
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
}
.menu textarea::placeholder { color: var(--text-muted); }
.menu__field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  margin-top: 10px;
  padding: 0 12px;
  border: 1px solid var(--field-border);
  border-radius: 10px;
  color: var(--text-soft);
  cursor: text;
}
.menu__field .icon--robux { font-size: 17px; }
.menu__field input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-weight: 600;
  font-size: 15px;
}
.menu textarea:focus, .menu__field:focus-within { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); }
.btn--sm { flex: none; height: 32px; padding: 0 14px; border-radius: 8px; font-size: 14px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
`;

  /* ============================================================
     Roblox web APIs — the same ones Roblox's own Send sheet uses
     ============================================================ */
  var csrfToken = (document.querySelector('meta[name="csrf-token"]') || {}).dataset?.token || "";

  async function getJSON(url) {
    var res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("GET " + url + " -> " + res.status);
    return res.json();
  }

  async function postJSON(url, body, isRetry) {
    var res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
      body: JSON.stringify(body)
    });
    // Roblox rotates CSRF tokens: a 403 hands back a fresh one to retry with
    var freshToken = res.headers.get("x-csrf-token");
    if (res.status === 403 && freshToken && !isRetry) {
      csrfToken = freshToken;
      return postJSON(url, body, true);
    }
    if (!res.ok) throw new Error("POST " + url + " -> " + res.status);
    return res.json();
  }

  function chunk(list, size) {
    var out = [];
    for (var i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
  }

  async function getMyUserId() {
    var meta = document.querySelector('meta[name="user-data"]');
    if (meta && meta.dataset.userid) return Number(meta.dataset.userid);
    return (await getJSON("https://users.roblox.com/v1/users/authenticated")).id;
  }

  async function getBalance(userId) {
    return (await getJSON("https://economy.roblox.com/v1/users/" + userId + "/currency")).robux;
  }

  async function getConnectionCount(userId) {
    return (await getJSON("https://friends.roblox.com/v1/users/" + userId + "/friends/count")).count;
  }

  // Presence is a nice-to-have; an empty map just means everyone shows as offline
  async function getOnlinePresence(userId) {
    try {
      var res = await getJSON("https://friends.roblox.com/v1/users/" + userId + "/friends/online");
      return new Map((res.data || []).map(function (f) { return [f.id, f.userPresence || {}]; }));
    } catch (err) {
      return new Map();
    }
  }

  async function getConnectionPage(userId, cursor) {
    var params = new URLSearchParams({ userSort: "1", limit: "50" });
    if (cursor) params.set("cursor", cursor);
    var res = await getJSON("https://friends.roblox.com/v1/users/" + userId + "/friends/find?" + params);
    return {
      ids: (res.PageItems || []).map(function (p) { return p.id; }),
      next: res.NextCursor || null
    };
  }

  async function getUsers(ids) {
    var out = [];
    for (var part of chunk(ids, 100)) {
      var res = await postJSON("https://users.roblox.com/v1/users", { userIds: part, excludeBannedUsers: true });
      out.push.apply(out, res.data || []);
    }
    return out;
  }

  async function getHeadshots(ids) {
    var out = new Map();
    for (var part of chunk(ids, 100)) {
      var pending = part.slice();
      for (var attempt = 0; attempt < 3 && pending.length; attempt++) {
        var params = new URLSearchParams({ userIds: pending.join(","), size: "150x150", format: "Png", isCircular: "false" });
        var res = await getJSON("https://thumbnails.roblox.com/v1/users/avatar-headshot?" + params);
        var next = [];
        (res.data || []).forEach(function (t) {
          if (t.state === "Completed" && t.imageUrl) out.set(Number(t.targetId), t.imageUrl);
          else next.push(Number(t.targetId));
        });
        pending = next;
        if (pending.length && attempt < 2) await new Promise(function (resolve) { setTimeout(resolve, 500); });
      }
    }
    return out;
  }

  // Names that don't exist (or are banned) simply don't come back
  async function getUsersByName(usernames) {
    var out = [];
    for (var part of chunk(usernames, 100)) {
      var res = await postJSON("https://users.roblox.com/v1/usernames/users", { usernames: part, excludeBannedUsers: true });
      out.push.apply(out, res.data || []);
    }
    return out;
  }

  // Presence for people who aren't connections, in the same shape the friends endpoint gives.
  // Like there, it's a nice-to-have: on failure everyone just shows as offline.
  var PRESENCE_TYPES = { 1: "Online", 2: "InGame", 3: "InStudio" };

  async function getPresence(ids) {
    var out = new Map();
    try {
      for (var part of chunk(ids, 100)) {
        var res = await postJSON("https://presence.roblox.com/v1/presence/users", { userIds: part });
        (res.userPresences || []).forEach(function (p) {
          out.set(p.userId, { UserPresenceType: PRESENCE_TYPES[p.userPresenceType], lastLocation: p.lastLocation });
        });
      }
    } catch (err) {
      /* keep whatever arrived */
    }
    return out;
  }

  var PRESENCE_RANK = { game: 0, studio: 1, online: 2 };

  function describePresence(p) {
    if (!p) return null;
    var place = p.lastLocation && p.lastLocation !== "Website" ? p.lastLocation : "";
    if (p.UserPresenceType === "InGame") return { kind: "game", label: place || "In an experience" };
    if (p.UserPresenceType === "InStudio") return { kind: "studio", label: "In Studio" };
    if (p.UserPresenceType === "Online") return { kind: "online", label: "Online" };
    return null;
  }

  /* ============================================================
     State
     ============================================================ */
  var store = {
    userId: null,
    source: null,     // which settings.source the list below was loaded from
    people: [],       // in-experience, online, then Roblox's own order
    missing: [],      // custom usernames Roblox didn't find
    total: null,      // from /friends/count, so the header is right before paging finishes
    status: "idle",   // idle | loading | ready | error
    hasMore: false,
    loadedAt: 0,
    balance: null     // balance last fetched from Roblox; null until the first fetch lands
  };
  var state = {
    screen: "pick",   // pick | amount | confirm | sent
    query: "",
    selected: null,
    amount: 0
  };

  /* ---- Settings: changed from the popup, saved by the background worker ---- */
  var settings = {
    enabled: true,
    source: "random",
    usernames: [],
    userSearch: true,   // look up any exact username typed in the search box
    balanceOn: false,
    balance: 1000,
    loopSend: false
  };

  function loadSettingsFallback() {
    var s = { enabled: true, source: "random", usernames: [], userSearch: true, balanceOn: false, balance: 1000, loopSend: false };
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      if (typeof saved.enabled === "boolean") s.enabled = saved.enabled;
      if (SOURCES.indexOf(saved.source) !== -1) s.source = saved.source;
      if (Array.isArray(saved.usernames)) s.usernames = parseUsernames(saved.usernames.join("\n"));
      if (typeof saved.userSearch === "boolean") s.userSearch = saved.userSearch;
      if (typeof saved.loopSend === "boolean") s.loopSend = saved.loopSend;
      if (typeof saved.balanceOn === "boolean") s.balanceOn = saved.balanceOn;
      if (Number.isFinite(saved.balance) && saved.balance >= 0) s.balance = Math.floor(saved.balance);
    } catch (err) {
      /* blocked or corrupt storage: fall back to the defaults */
    }
    return s;
  }

  // Sync with the extension's storage when running inside the extension,
  // otherwise fall back to localStorage so the userscript still works standalone.
  function loadSettingsFromExtension() {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: "get-settings" }, function (resp) {
          if (resp && resp.ok && resp.settings) {
            Object.assign(settings, resp.settings);
            syncMenu();
            renderBalance();
            applyPageBalance();
          }
        });
      }
    } catch (err) { /* not in an extension context */ }
  }

  function saveSettings() {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: "settings-changed", settings: settings });
      } else {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (err) {
      /* still applies until the page reloads */
    }
  }

  // Boot: use the localStorage snapshot immediately, then replace it with
  // whatever the extension has stored (if we're running as a content script)
  settings = loadSettingsFallback();
  loadSettingsFromExtension();

  function parseUsernames(text) {
    var seen = new Set();
    return String(text).split(/[\s,;]+/)
      .map(function (name) { return name.replace(/^@/, ""); })
      .filter(function (name) {
        var key = name.toLowerCase();
        if (!name || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, CUSTOM_LIST_MAX);
  }

  // Robux amounts the way real UIs show them: comma-separated, then M/B/T past a million
  function formatRobux(value) {
    var v = Math.max(0, Number(value) || 0);
    if (v < 1000000) return v.toLocaleString("en-US");
    var unit = v < 1000000000 ? ["M", 1000000] : v < 1000000000000 ? ["B", 1000000000] : ["T", 1000000000000];
    var n = Math.round((v / unit[1]) * 10) / 10;
    return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + unit[0];
  }

  // The balance the dialog shows and caps amounts at. Sending deducts from it like the
  // mockup's balance; store.balance re-syncs from Roblox on the next fetch.
  function shownBalance() {
    return settings.balanceOn ? settings.balance : store.balance;
  }

  function currentTheme() {
    return document.body.classList.contains("light-theme") ? "light" : "dark"; // follow Roblox's own setting
  }

  var ui = null;             // built on first open
  var menu = null;           // built on first toggle
  var sendButton = null;     // the Roblox button we opened from (focus returns here)
  var loadToken = 0;
  var closeTimer = 0;
  var bypassHook = false;
  var press = null;          // an active long-press on the Send button: { x, y }
  var pressTimer = 0;
  var pressClearTimer = 0;
  var pressFired = false;
  var savedScroll = null;
  var rowCache = new Map();
  var joinedCache = new Map();
  var searchToken = 0;      // user-search lookups for the pick screen
  var searchPeople = [];
  var searchPending = false;
  var searchTimer = 0;

  function reduceMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---- Tiny DOM helper: user-provided text only ever goes through textContent ---- */
  function h(tag, props, children) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (key) {
      var value = props[key];
      if (value == null || value === false) return;
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key.slice(0, 2) === "on") el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    });
    (children || []).forEach(function (child) { if (child) el.append(child); });
    return el;
  }

  function icon(name, extraClass) {
    var tpl = document.createElement("template");
    tpl.innerHTML = ICONS[name]; // static markup from ICONS only
    var el = tpl.content.firstElementChild;
    if (extraClass) el.classList.add.apply(el.classList, extraClass.split(" "));
    return el;
  }

  function avatarEl(person, className) {
    var el = h("span", {
      class: className,
      style: "display:block;position:relative;flex:none;width:44px;height:44px;border-radius:50%;overflow:hidden;background:var(--avatar-bg)"
    });
    var img = h("img", {
      src: person.avatar || AVATAR_FALLBACK,
      alt: "",
      loading: "lazy",
      decoding: "async",
      style: "display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover"
    });
    // Images that fail to load show Roblox's unapproved placeholder (once — that can't fail)
    img.addEventListener("error", function onerr() {
      img.removeEventListener("error", onerr);
      img.src = AVATAR_FALLBACK;
    });
    el.append(img);
    return el;
  }

  // One stylesheet shared by the dialog and the menu. Constructed stylesheets
  // aren't subject to the page's style-src CSP.
  var sharedSheet = null;

  function adoptStyles(shadow) {
    try {
      if (!sharedSheet) {
        sharedSheet = new CSSStyleSheet();
        sharedSheet.replaceSync(CSS);
      }
      shadow.adoptedStyleSheets = [sharedSheet];
    } catch (err) {
      shadow.append(h("style", { text: CSS }));
    }
  }

  /* ============================================================
     Build the dialog (once per page)
     ============================================================ */
  function buildUI() {
    var host = h("div", { id: "send-robux-userscript" });
    var shadow = host.attachShadow({ mode: "open" });
    adoptStyles(shadow);

    var refs = {};

    /* ---- Header (shared across all screens) ---- */
    refs.balance = h("span", { class: "balance__amount", text: "—" });
    refs.backBtn = h("button", { class: "close-btn back-btn", type: "button", "aria-label": "Back", hidden: true, onclick: goBack }, [icon("brand")]);
    refs.logo = icon("brand");
    var header = h("header", { class: "modal__header" }, [
      h("div", { class: "brand" }, [
        refs.backBtn,
        refs.logo,
        h("span", { class: "brand__title", id: "srx-title", text: "Send Robux" })
      ]),
      h("div", { class: "header-right" }, [
        h("span", { class: "balance", title: "Your balance" }, [icon("robux", "balance__icon"), refs.balance]),
        h("button", { class: "close-btn", type: "button", "aria-label": "Close", onclick: function () { close(); } }, [icon("close")])
      ])
    ]);

    /* ---- Screen 1: pick a player (same wording whichever list is on) ---- */
    refs.search = h("input", {
      type: "text",
      placeholder: "Search",
      "aria-label": "Search players",
      autocomplete: "off",
      spellcheck: "false",
      enterkeyhint: "go",
      oninput: function (e) {
        state.query = e.target.value;
        refs.list.scrollTop = 0;
        scheduleUserSearch();
      }
    });
    refs.count = h("span", { class: "list-head__count" });
    refs.list = h("div", { class: "list", role: "group", "aria-label": "Send to" });
    refs.listState = h("div", { class: "list-state", hidden: true });
    refs.pick = h("section", { class: "screen screen--pick" }, [
      h("label", { class: "search" }, [icon("search"), refs.search]),
      h("div", { class: "list-head" }, [h("span", { text: "Send to" }), refs.count]),
      h("div", { class: "list-wrap" }, [refs.list, refs.listState])
    ]);

    /* ---- Screen 2: amount entry (mockup screen 1) ---- */
    refs.amountAvatar = h("div");
    refs.amountName = h("span");
    refs.amountBadge = icon("verified");
    refs.amountPlus = icon("brand", "premium-mark");

    // The big amount is a real input so tapping it on mobile opens the keyboard,
    // but it's styled to look identical to the previous static span.
    refs.amountValue = h("input", {
      class: "amount-display__value",
      type: "text",
      inputmode: "numeric",
      pattern: "[0-9]*",
      autocomplete: "off",
      spellcheck: "false",
      "aria-label": "Robux amount",
      value: "0",
      oninput: function (e) {
        var digits = e.target.value.replace(/\D/g, "").slice(0, 12);
        var n = digits ? Number(digits) : 0;
        setAmount(n);
      },
      onfocus: function (e) {
        requestAnimationFrame(function () { e.target.select(); });
      },
      onblur: function () {
        // Snap back to the formatted, clamped value when you tap away
        renderAmount();
      }
    });

    refs.quickButtons = QUICK_AMOUNTS.map(function (value) {
      return h("button", { class: "quick-amount", type: "button", onclick: function () { setAmount(value); } }, [
        icon("robux"),
        h("span", { text: formatRobux(value) })
      ]);
    });
    refs.nextBtn = h("button", { class: "btn btn--primary btn--block is-idle", type: "button", text: "Next", onclick: goToConfirm });
    refs.amount = h("section", { class: "screen screen--amount", hidden: true }, [
      h("div", { class: "recipient" }, [
        refs.amountAvatar,
        h("div", { class: "recipient__name" }, [refs.amountName, refs.amountBadge, refs.amountPlus])
      ]),
      h("div", { class: "amount-display" }, [icon("robux", "amount-display__icon"), refs.amountValue]),
      h("div", { class: "quick-amounts" }, refs.quickButtons),
      refs.nextBtn,
      h("p", { class: "footnote", text: "Robux are sent instantly with no fees" })
    ]);

    /* ---- Screen 3: confirmation (mockup screen 2) ---- */
    refs.avatarSlot = h("div");
    refs.name = h("span");
    refs.badge = icon("verified");
    refs.plus = icon("brand", "premium-mark");
    refs.handle = h("div", { class: "profile-card__handle" });
    refs.presenceStat = h("span", { class: "stat" });
    refs.joinedText = h("span");
    refs.joinedRow = h("div", { class: "profile-card__joined" }, [icon("info"), refs.joinedText]);
    refs.confirmAmount = h("span");
    refs.confirmAmountText = h("span");
    refs.sendBtn = h("button", { class: "btn btn--primary", type: "button", text: "Send", onclick: send });
    refs.confirm = h("section", { class: "screen screen--confirm", hidden: true }, [
      h("div", { class: "card profile-card" }, [
        refs.avatarSlot,
        h("div", { class: "profile-card__name" }, [refs.name, refs.badge, refs.plus]),
        refs.handle,
        h("div", { class: "profile-card__stats" }, [refs.presenceStat]),
        refs.joinedRow
      ]),
      h("div", { class: "card recipient-card" }, [
        h("div", { class: "recipient-card__amount" }, [icon("robux"), refs.confirmAmount]),
        h("p", { class: "recipient-card__sub" }, ["The recipient will get ", refs.confirmAmountText, " Robux."])
      ]),
      h("div", { class: "actions" }, [
        refs.sendBtn,
        h("button", { class: "btn btn--secondary", type: "button", text: "Edit", onclick: function () { goTo("amount"); focusAmount(); } })
      ]),
      h("p", { class: "footnote footnote--left", text: "You need an age check or parental consent to send Robux. Once you send, you cannot cancel." })
    ]);

    /* ---- Screen 4: sent confirmation (mockup screen 3) ---- */
    refs.sentAmount = h("span");
    refs.okBtn = h("button", { class: "btn btn--primary btn--block", type: "button", text: "OK", onclick: function () { if (settings.loopSend) restartFlow(); else close(); } });
    refs.sent = h("section", { class: "screen screen--sent", hidden: true }, [
      h("div", { class: "sent" }, [
        icon("check"),
        h("p", { class: "sent__text" }, ["You sent ", refs.sentAmount, " Robux"])
      ]),
      refs.okBtn
    ]);

    // tabindex keeps focus inside the dialog when you click its background, so Esc and typed amounts still work
    refs.modal = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "srx-title", tabindex: "-1" },
      [header, refs.pick, refs.amount, refs.confirm, refs.sent]);
    refs.root = h("div", { class: "root theme" }, [
      h("div", { class: "backdrop", onclick: function () { close(); } }),
      refs.modal
    ]);
    shadow.append(refs.root);

    shadow.addEventListener("keydown", onKeydown);
    // Keep Roblox's page-level shortcuts from reacting to typing in the dialog
    ["keydown", "keyup", "keypress"].forEach(function (type) {
      host.addEventListener(type, function (e) { e.stopPropagation(); });
    });

    // Keep the modal fitted: content height changes, window resizes, rotation
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(fitModal).observe(refs.modal);
    window.addEventListener("resize", fitModal);
    window.addEventListener("orientationchange", fitModal);

    refs.host = host;
    refs.shadow = shadow;
    return refs;
  }

  /* ============================================================
     Screen navigation (the modal morphs to the new screen's height)
     ============================================================ */
  function goTo(name, instant) {
    var screens = { pick: ui.pick, amount: ui.amount, confirm: ui.confirm, sent: ui.sent };
    var from = ui.modal.offsetHeight;
    Object.keys(screens).forEach(function (key) { screens[key].hidden = key !== name; });
    state.screen = name;

    // The brand mark doubles as the back button on the amount and confirm screens
    var canGoBack = name === "amount" || name === "confirm";
    ui.backBtn.hidden = !canGoBack;
    ui.logo.style.display = canGoBack ? "none" : "";
    fitModal(); // each screen is a different height

    if (instant || reduceMotion()) return;
    var to = ui.modal.offsetHeight;
    if (from !== to) {
      ui.modal.animate([{ height: from + "px" }, { height: to + "px" }], {
        duration: 240,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
      });
    }
  }

  /* ---- Screen 1: player list, from whichever source the menu has selected ---- */
  async function loadPeople() {
    var token = ++loadToken;
    var source = settings.source;
    store.source = source;
    store.status = "loading";
    store.people = [];
    store.missing = [];
    store.hasMore = false;
    store.total = null;
    rowCache.clear();
    renderList();
    renderMenuStatus();

    try {
      if (source === "random") await loadRandomUsers(token);
      else if (source === "custom") await loadCustomUsers(token);
      else await loadConnections(token);
      if (token !== loadToken) return;
      store.loadedAt = Date.now();
    } catch (err) {
      if (token !== loadToken) return;
      console.warn("[Send Robux userscript] couldn't load the player list:", err);
      store.hasMore = false;
      // Keep whatever pages already arrived; only show the error if there's nothing to pick from
      store.status = store.people.length ? "ready" : "error";
      renderList();
    }
    renderMenuStatus();
  }

  /* Premium membership has no batch endpoint: one small check per person */
  async function getPremium(ids) {
    var out = new Map();
    await Promise.all(ids.map(async function (id) {
      try {
        out.set(id, !!(await getJSON("https://premiumfeatures.roblox.com/v1/users/" + id + "/validate-membership")));
      } catch (err) {
        out.set(id, false); // can't tell -> no mark
      }
    }));
    return out;
  }

  function noHeadshots() {
    return new Map();
  }

  async function loadConnections(token) {
    var userId = store.userId || (store.userId = await getMyUserId());
    getConnectionCount(userId).then(function (count) {
      if (token !== loadToken) return;
      store.total = count;
      renderList();
    }, function () {});

    var results = await Promise.all([getOnlinePresence(userId), getConnectionPage(userId)]);
    var presence = results[0];
    var page = results[1];
    if (token !== loadToken) return;

    // Online connections go first even if Roblox pages them in later
    var onlineIds = Array.from(presence.keys()).sort(function (a, b) {
      var pa = describePresence(presence.get(a));
      var pb = describePresence(presence.get(b));
      return (pa ? PRESENCE_RANK[pa.kind] : 9) - (pb ? PRESENCE_RANK[pb.kind] : 9);
    });
    var seen = new Set();
    var batch = onlineIds.concat(page.ids);

    for (;;) {
      // Online connections usually show up again in the first page, so dedupe as we go
      var fresh = batch.filter(function (id) {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      if (fresh.length) {
        var info = await Promise.all([getUsers(fresh), getHeadshots(fresh).catch(noHeadshots), getPremium(fresh)]);
        if (token !== loadToken) return;
        var usersById = new Map(info[0].map(function (u) { return [u.id, u]; }));
        fresh.forEach(function (id) {
          var u = usersById.get(id);
          if (!u) return; // banned or deleted accounts drop out
          store.people.push(toPerson(u, info[1].get(id), presence.get(id), info[2].get(id)));
        });
      }
      store.hasMore = !!page.next;
      store.status = "ready";
      renderList();
      if (!page.next) return;

      page = await getConnectionPage(userId, page.next);
      if (token !== loadToken) return;
      batch = page.ids;
    }
  }

  function randomUserIds(count) {
    var ids = new Set();
    while (ids.size < count) ids.add(1 + Math.floor(Math.random() * RANDOM_USER_MAX_ID));
    return Array.from(ids);
  }

  async function loadRandomUsers(token) {
    // Unknown or banned IDs simply don't come back from the users lookup
    var ids = randomUserIds(RANDOM_USER_COUNT);
    var results = await Promise.all([getUsers(ids), getHeadshots(ids).catch(noHeadshots), getPresence(ids), getPremium(ids)]);
    if (token !== loadToken) return;

    var people = results[0].map(function (u) { return toPerson(u, results[1].get(u.id), results[2].get(u.id), results[3].get(u.id)); });
    // Same order as the connections list: in an experience, in Studio, online, then everyone else
    store.people = people.sort(function (a, b) {
      return (a.presence ? PRESENCE_RANK[a.presence.kind] : 9) - (b.presence ? PRESENCE_RANK[b.presence.kind] : 9);
    });
    store.status = "ready";
    renderList();
  }

  async function loadCustomUsers(token) {
    var names = settings.usernames;
    var users = names.length ? await getUsersByName(names) : [];
    var ids = users.map(function (u) { return u.id; });
    var results = await Promise.all([getHeadshots(ids).catch(noHeadshots), getPresence(ids), getPremium(ids)]);
    if (token !== loadToken) return;

    // Roblox answers in its own order; keep the order the names were typed in
    var byRequested = new Map(users.map(function (u) { return [String(u.requestedUsername).toLowerCase(), u]; }));
    var seen = new Set();
    names.forEach(function (name) {
      var u = byRequested.get(name.toLowerCase());
      if (!u) {
        store.missing.push(name);
        return;
      }
      if (seen.has(u.id)) return; // an old and a current username of the same account
      seen.add(u.id);
      store.people.push(toPerson(u, results[0].get(u.id), results[1].get(u.id), results[2].get(u.id)));
    });
    store.status = "ready";
    renderList();
  }

  /* ---- User searcher: the search box can look up any exact username ---- */
  function scheduleUserSearch() {
    clearTimeout(searchTimer);
    searchToken++;
    searchPeople = [];
    searchPending = settings.userSearch && !!state.query.trim();
    renderList();
    if (searchPending) searchTimer = setTimeout(runUserSearch, 200);
  }

  async function runUserSearch() {
    var token = searchToken;
    var name = state.query.trim().replace(/^@/, "");
    if (!settings.userSearch || !name) return;
    try {
      var users = await getUsersByName([name]);
      var ids = users.map(function (u) { return u.id; });
      var results = await Promise.all([getHeadshots(ids).catch(noHeadshots), getPresence(ids), getPremium(ids)]);
      if (token !== searchToken) return;
      searchPeople = users.map(function (u) { return toPerson(u, results[0].get(u.id), results[1].get(u.id), results[2].get(u.id)); });
    } catch (err) {
      if (token !== searchToken) return;
      /* lookup failed: fall back to filtering the list we have */
    }
    searchPending = false;
    renderList();

    // On touch screens, if the search returned exactly one person, skip the tap
    // and go straight to the amount screen.
    if (
      searchPeople.length === 1 &&
      window.matchMedia("(pointer: coarse)").matches &&
      state.screen === "pick"
    ) {
      pickRecipient(searchPeople[0]);
    }
  }

  function toPerson(u, avatar, presence, premium) {
    return {
      id: u.id,
      name: u.name,
      displayName: u.displayName || u.name,
      verified: !!u.hasVerifiedBadge,
      premium: !!premium,
      avatar: avatar || null,
      presence: describePresence(presence),
      search: (u.displayName + " " + u.name).toLowerCase()
    };
  }

  function rowFor(person) {
    var row = rowCache.get(person.id);
    if (row) return row;

    var meta = h("span", { class: "person__meta" }, [h("span", { text: "@" + person.name })]);
    if (person.presence) {
      meta.append(" · ", h("span", { class: "person__place is-" + person.presence.kind, text: person.presence.label }));
    }
    row = h("button", {
      class: "person",
      type: "button",
      tabindex: "-1",
      onclick: function () { pickRecipient(person); },
      onfocus: function () { setRovingRow(row); }
    }, [
      h("span", { class: "person__avatar" }, [
        avatarEl(person, "avatar"),
        person.presence && h("span", { class: "presence is-" + person.presence.kind })
      ]),
      h("span", { class: "person__text" }, [
        h("span", { class: "person__name" }, [
          h("span", { class: "person__display", text: person.displayName }),
          person.verified && icon("verified"),
          person.premium && icon("brand", "premium-mark")
        ]),
        meta
      ]),
      icon("chevron", "person__chev")
    ]);
    rowCache.set(person.id, row);
    return row;
  }

  function skeleton() {
    var rows = [];
    for (var i = 0; i < 6; i++) {
      var nameBar = h("span", { class: "skeleton-bar" });
      var metaBar = h("span", { class: "skeleton-bar" });
      nameBar.style.width = 38 + ((i * 17) % 30) + "%"; // via CSSOM: inline style attributes can trip CSP
      metaBar.style.width = 22 + ((i * 11) % 18) + "%";
      rows.push(h("div", { class: "skeleton-row", "aria-hidden": "true" }, [
        h("span", { class: "avatar" }),
        h("span", { class: "person__text" }, [nameBar, metaBar])
      ]));
    }
    return h("div", { role: "status", "aria-label": "Loading players" }, rows);
  }

  function message(iconName, title, body, actions) {
    return h("div", { class: "message" }, [
      icon(iconName),
      h("div", { class: "message__title", text: title }),
      body && h("div", { text: body }),
      actions && h("div", { class: "message__actions" }, actions.map(function (a) {
        return h("button", { class: "link-btn", type: "button", text: a[0], onclick: a[1] });
      }))
    ]);
  }

  function renderList() {
    if (!ui) return;
    var q = state.query.trim().toLowerCase();
    var local = q ? store.people.filter(function (p) { return p.search.indexOf(q) !== -1; }) : store.people;
    var searching = settings.userSearch && !!q;
    var people = local;
    if (searching) {
      // The looked-up user comes first, then anything that matches in the list we loaded
      var seen = new Set();
      people = searchPeople.concat(local).filter(function (p) {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }

    // Roblox's total counts banned/deleted accounts we drop, so it's only shown until paging finishes
    var total = store.hasMore && store.total != null ? store.total : store.people.length;
    ui.count.textContent =
      store.status === "loading" && !store.people.length ? "" :
      q ? String(people.length) :
      String(total);

    var stateEl = null;
    if (!people.length && store.status === "error") {
      stateEl = message("info", "Couldn't load the list",
        store.source === "connections" ? "Check that you're signed in, then try again."
          : "Roblox may be limiting lookups. Wait a moment, then try again.",
        [["Try again", loadPeople], ["Use Roblox's picker", openNativeSheet]]);
    } else if (!people.length && (store.status !== "ready" || searchPending)) {
      stateEl = skeleton();
    } else if (!people.length && searching) {
      stateEl = message("search", "No matches",
        "Nobody matches “" + state.query.trim() + "”.",
        [["Look up @" + state.query.trim().replace(/^@/, ""), function () {
          searchToken++;
          searchPending = true;
          renderList();
          runUserSearch();
        }]]);
    } else if (!people.length && !store.people.length && store.source === "custom") {
      stateEl = message("friends", "No players in your list",
        settings.usernames.length ? "None of those usernames exist on Roblox." : "Add usernames in the menu.",
        [["Open menu", function () { toggleMenu(true); }]]);
    } else if (!people.length && !store.people.length && store.source === "random") {
      stateEl = message("friends", "No players found", "Roblox didn't return anyone this time.", [["Try again", loadPeople]]);
    } else if (!people.length && !store.people.length) {
      stateEl = message("friends", "No connections yet", "People you connect with on Roblox will show up here.");
    } else if (!people.length) {
      if (store.hasMore) {
        stateEl = message("search", "Still loading…", "Checking the rest of your connections.");
      } else if (settings.userSearch) {
        stateEl = message("search", "No matches",
          "Nobody matches “" + state.query.trim() + "”. Try the exact Roblox username.",
          [["Look up @" + state.query.trim().replace(/^@/, ""), function () {
            searchToken++;
            searchPending = true;
            renderList();
            runUserSearch();
          }]]);
      } else {
        stateEl = message("search", "No matches",
          "Nobody matches “" + state.query.trim() + "”.",
          [["Enable user searcher", function () { updateSettings({ userSearch: true }); }]]);
      }
    }

    ui.listState.replaceChildren.apply(ui.listState, stateEl ? [stateEl] : []);
    ui.listState.hidden = !stateEl;
    ui.list.hidden = !!stateEl;
    if (stateEl) return;

    // Appending keeps focus and scroll put while later pages stream in
    var rows = people.map(rowFor);
    var current = Array.from(ui.list.children);
    var isPrefix = current.length <= rows.length && current.every(function (el, i) { return el === rows[i]; });
    if (isPrefix) ui.list.append.apply(ui.list, rows.slice(current.length));
    else ui.list.replaceChildren.apply(ui.list, rows);

    var roving = rows.find(function (r) { return r.tabIndex === 0; }) || rows[0];
    setRovingRow(roving);
  }

  // Only one row is a tab stop; arrow keys move between rows
  function setRovingRow(row) {
    if (!row) return;
    rowCache.forEach(function (r) { if (r !== row && r.tabIndex !== -1) r.tabIndex = -1; });
    row.tabIndex = 0;
  }

  function moveInList(e) {
    var rows = Array.from(ui.list.children);
    if (ui.list.hidden || !rows.length) return;
    var active = ui.shadow.activeElement;
    if (active === ui.search) {
      if (e.key === "ArrowDown") { e.preventDefault(); rows[0].focus(); }
      return;
    }
    var i = rows.indexOf(active);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === "ArrowDown") rows[Math.min(i + 1, rows.length - 1)].focus();
    else if (i === 0) ui.search.focus();
    else rows[i - 1].focus();
  }

  /* ---- Picking someone fills the amount and confirm screens ---- */
  function pickRecipient(person) {
    state.selected = person;
    setAmount(0);
    sizeAmountInput();

    ui.amountAvatar.replaceChildren(avatarEl(person, "avatar avatar--lg"));
    ui.amountName.textContent = person.displayName;
    ui.amountBadge.style.display = person.verified ? "" : "none";
    ui.amountPlus.style.display = person.premium ? "" : "none";

    ui.avatarSlot.replaceChildren(avatarEl(person, "avatar avatar--sm"));
    ui.name.textContent = person.displayName;
    ui.badge.style.display = person.verified ? "" : "none";
    ui.plus.style.display = person.premium ? "" : "none";
    ui.handle.textContent = "@" + person.name;

    var presence = person.presence || { kind: "offline", label: "Offline" };
    ui.presenceStat.className = "stat is-" + presence.kind;
    ui.presenceStat.replaceChildren(h("span", { class: "stat__dot" }), h("span", { text: presence.label }));

    ui.joinedRow.hidden = false;
    ui.joinedText.replaceChildren(h("span", { class: "skeleton-bar" }));
    loadJoinedYear(person);

    goTo("amount");
    focusAmount();
  }

  async function loadJoinedYear(person) {
    if (!joinedCache.has(person.id)) {
      joinedCache.set(person.id, getJSON("https://users.roblox.com/v1/users/" + person.id).then(function (u) {
        return new Date(u.created).getFullYear();
      }));
    }
    try {
      var year = await joinedCache.get(person.id);
      if (state.selected === person) ui.joinedText.textContent = "Joined in " + year;
    } catch (err) {
      joinedCache.delete(person.id);
      if (state.selected === person) ui.joinedRow.hidden = true;
    }
  }

  function backToList() {
    goTo("pick");
    var row = state.selected && rowCache.get(state.selected.id);
    if (row && row.isConnected && !ui.list.hidden) row.focus();
    else ui.search.focus();
  }

  // OK on the sent screen with "Loop after Send" on: start the flow over at its beginning
  function restartFlow() {
    state.query = "";
    state.selected = null;
    setAmount(0);
    ui.search.value = "";
    ui.list.scrollTop = 0;
    scheduleUserSearch(); // drops any lookup results and shows the whole list again
    backToList();
  }

  function goBack() {
    if (state.screen === "confirm") {
      goTo("amount");
      focusAmount();
    } else {
      backToList();
    }
  }

  /* ---- Screen 2: amount (same rules as the mockup, capped at the balance shown) ---- */
  function setAmount(value) {
    var balance = shownBalance();
    var cap = balance != null ? balance : 999999;
    state.amount = Math.max(0, Math.min(cap, Math.floor(value) || 0));
    renderAmount();
  }

  function renderAmount() {
    if (!ui) return;
    var balance = shownBalance();

    // Only write the formatted value back into the input if the user isn't
    // actively typing in it — otherwise we'd fight their keystrokes.
    var focused = ui.shadow && ui.shadow.activeElement === ui.amountValue;
    var formatted = formatRobux(state.amount);
    if (!focused) {
      ui.amountValue.value = state.amount > 0 ? formatted : "0";
    } else if (state.amount <= 0) {
      ui.amountValue.value = "";
    }

    ui.quickButtons.forEach(function (btn, i) {
      var value = QUICK_AMOUNTS[i];
      var tooMuch = balance != null && value > balance;
      btn.classList.toggle("is-selected", value === state.amount && state.amount > 0);
      btn.disabled = tooMuch;
      btn.title = tooMuch ? "Not enough Robux" : "";
    });

    // Brighten "Next" from idle navy to vivid blue once a valid amount is set
    ui.nextBtn.classList.toggle("is-idle", state.amount <= 0);
    ui.nextBtn.setAttribute("aria-disabled", String(state.amount <= 0));

    sizeAmountInput();
  }

  // Grows the amount input to fit its content, up to a max, so it always looks
  // like the original big number rather than a fixed-width text box.
  function sizeAmountInput() {
    if (!ui || !ui.amountValue) return;
    var text = ui.amountValue.value || "0";
    // ~0.62em per char at 40px; add a bit of slack for the caret
    var chars = Math.max(1, text.length);
    ui.amountValue.style.width = (chars * 0.62 + 0.5).toFixed(2) + "ch";
  }

  // The dialog itself takes focus so typed digits land in the amount straight away
  function focusAmount() {
    ui.modal.focus({ preventScroll: true });
  }

  /* ---- Screen 3: confirmation ---- */
  function goToConfirm() {
    if (state.amount <= 0 || !state.selected) return;
    ui.confirmAmount.textContent = formatRobux(state.amount);
    ui.confirmAmountText.textContent = formatRobux(state.amount);
    goTo("confirm");
    ui.sendBtn.focus();
  }

  /* ---- Send -> sent confirmation (the mockup's send(): deduct and show screen 3) ---- */
  function send() {
    if (state.amount <= 0 || !state.selected) return;
    var sent = state.amount;

    // The balance goes down by what was sent, like the mockup's. A client-side
    // balance stays down; a fetched one re-syncs when the dialog opens again.
    if (settings.balanceOn) {
      settings.balance = Math.max(0, settings.balance - sent);
      saveSettings();
    } else if (store.balance != null) {
      store.balance = Math.max(0, store.balance - sent);
    }
    renderBalance();
    applyPageBalance();

    ui.sentAmount.textContent = formatRobux(sent);
    goTo("sent");
    ui.okBtn.focus();
  }

  /* ============================================================
     Open / close
     ============================================================ */
  // Header balance (client-side value if that's on), and anything that depends on it
  function renderBalance() {
    if (!ui) return;
    var balance = shownBalance();
    ui.balance.textContent = balance != null ? formatRobux(balance) : "—";
    if (balance != null && state.amount > balance) setAmount(balance);
    else renderAmount();
  }

  // Always fetches and returns the real balance, whatever the dialog is showing
  async function refreshBalance() {
    try {
      var userId = store.userId || (store.userId = await getMyUserId());
      var robux = Number(await getBalance(userId));
      store.balance = robux;
      renderBalance();
      renderMenuStatus();
      return robux;
    } catch (err) {
      return null; // keep the last value we showed
    }
  }

  /* ============================================================
     The page's own balance displays
     ------------------------------------------------------------
     With "Customised Robux Balance" on (set from the popup), the
     navbar counter and the balance by Roblox's Send button show
     the popup's value too, so the page matches the dialog.
     Turning it off puts the real balance back.
     ============================================================ */
  var PAGE_BALANCE_SELECTOR = ".font-builder-extended.content-action-standard.text-title-large";
  var NAVBAR_ROBUX_SELECTOR = "#navbar-robux, [class*='navbar-robux']";
  var pageBalanceShown = null; // the value written to the page; null while the page shows its own
  var pageSyncTimer = 0;
  var pageSyncObserver = null;

  function sendButtonEl() {
    var buttons = document.querySelectorAll(SEND_BUTTON_SCOPE);
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].querySelector(SEND_BUTTON_ICON)) return buttons[i];
    }
    return null;
  }

  function isNumberText(text) {
    return /\d/.test(text) && /^[\d\s.,]*[kKmMbBtT]?$/.test(text);
  }

  // The balance span by the Send button (the redesign page's own classes) and the navbar counter
  function pageBalanceRegions() {
    var button = sendButtonEl();
    var spans = document.querySelectorAll(PAGE_BALANCE_SELECTOR);
    var near = null;
    var anywhere = null;
    for (var i = 0; i < spans.length; i++) {
      if (!isNumberText(spans[i].textContent)) continue;
      if (!anywhere) anywhere = spans[i];
      for (var row = button && button.parentElement, up = 0; row && up < 3; row = row.parentElement, up++) {
        if (row.contains(spans[i])) { near = spans[i]; break; }
      }
      if (near) break;
    }
    var nav = document.querySelector(NAVBAR_ROBUX_SELECTOR);
    return [near || anywhere, nav].filter(Boolean);
  }

  // The first number in a display is its balance; expectText limits the rewrite to
  // displays currently showing that (so one that changed on its own is left alone)
  function rewriteNumbers(region, expectText, value) {
    var walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var old = node.nodeValue;
      if (!isNumberText(old)) continue;
      var trimmed = old.trim();
      if (expectText != null && trimmed !== expectText) return;
      var next = formatRobux(value);
      if (trimmed !== next) {
        var start = old.indexOf(trimmed);
        node.nodeValue = old.slice(0, start) + next + old.slice(start + trimmed.length);
      }
      return;
    }
  }

  function applyPageBalance() {
    clearTimeout(pageSyncTimer);

    if (settings.balanceOn) {
      pageBalanceRegions().forEach(function (region) { rewriteNumbers(region, null, settings.balance); });
      pageBalanceShown = settings.balance;
      if (!pageSyncObserver) {
        // The page re-renders these, so put the value back whenever it drifts
        pageSyncObserver = new MutationObserver(function () {
          clearTimeout(pageSyncTimer);
          pageSyncTimer = setTimeout(applyPageBalance, 100);
        });
        pageSyncObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
      }
      return;
    }

    if (pageSyncObserver) { pageSyncObserver.disconnect(); pageSyncObserver = null; }
    if (pageBalanceShown == null) return;
    var shown = pageBalanceShown;
    // Back to the real balance, fetched fresh so the number isn't stale
    refreshBalance().then(function (robux) {
      if (settings.balanceOn || robux == null) return;
      pageBalanceRegions().forEach(function (region) { rewriteNumbers(region, formatRobux(shown), robux); });
      pageBalanceShown = null;
    });
  }

  function lockScroll() {
    if (savedScroll) return;
    var html = document.documentElement;
    // Roblox scrolls the page through body's overflow (it drives the viewport while html's
    // is visible), so hide overflow on whichever element is actually in charge
    var target = getComputedStyle(html).overflowY === "visible" ? document.body : html;
    savedScroll = { target: target, overflow: target.style.overflow, gutter: html.style.scrollbarGutter };
    html.style.scrollbarGutter = "stable"; // keep the scrollbar's space so the page doesn't shift
    target.style.overflow = "hidden";
  }

  function unlockScroll() {
    if (!savedScroll) return;
    savedScroll.target.style.overflow = savedScroll.overflow;
    document.documentElement.style.scrollbarGutter = savedScroll.gutter;
    savedScroll = null;
  }

  /* Small screens: scale the whole modal down instead of squeezing it —
     the box keeps its shape and just gets smaller */
  function fitModal() {
    if (!ui) return;
    var w = ui.modal.offsetWidth;
    var h = ui.modal.offsetHeight;
    if (!w || !h) return;
    var k = Math.min(1, (window.innerWidth - 32) / w, (window.innerHeight - 48) / h);
    ui.modal.style.setProperty("--fit", k.toFixed(4));
  }

  function open(fromButton) {
    if (!ui) ui = buildUI();
    clearTimeout(closeTimer);
    sendButton = fromButton;

    ui.root.dataset.theme = currentTheme();

    state.query = "";
    state.selected = null;
    setAmount(0);
    ui.search.value = "";
    ui.list.scrollTop = 0;
    goTo("pick", true);

    if (!ui.host.isConnected) document.body.append(ui.host);
    lockScroll();
    ui.modal.getBoundingClientRect(); // commit the closed pose so the open transition runs
    ui.root.classList.add("is-open");

    // Skip auto-focus on touch screens so the keyboard doesn't jump up
    if (window.matchMedia("(pointer: fine)").matches) ui.search.focus();

    renderBalance();
    refreshBalance();
    var stale = store.source !== settings.source || Date.now() - store.loadedAt > CONNECTIONS_TTL;
    if (store.status === "error" || store.status === "idle" || (store.status === "ready" && !store.hasMore && stale)) {
      loadPeople();
    } else {
      renderList();
    }
  }

  function close(after) {
    if (!ui || !ui.root.classList.contains("is-open")) return;
    ui.root.classList.remove("is-open");
    closeTimer = setTimeout(function () {
      ui.host.remove();
      unlockScroll();
      if (sendButton && sendButton.isConnected) sendButton.focus({ preventScroll: true });
      if (after) after();
    }, reduceMotion() ? 0 : CLOSE_MS);
  }

  // Fallback to Roblox's own recipient sheet
  function openNativeSheet() {
    var button = sendButton;
    close(function () {
      if (!button || !button.isConnected) return;
      bypassHook = true;
      try { button.click(); } finally { bypassHook = false; }
    });
  }

  /* ---- Keyboard: Esc closes, Tab stays inside, arrows walk the list, digits type an amount ---- */
  function focusables() {
    return Array.from(ui.modal.querySelectorAll("button, input")).filter(function (el) {
      return !el.disabled && el.tabIndex !== -1 && el.getClientRects().length > 0;
    });
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      var items = focusables();
      if (!items.length) return;
      var active = ui.shadow.activeElement;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && (active === first || items.indexOf(active) === -1)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || items.indexOf(active) === -1)) { e.preventDefault(); first.focus(); }
      return;
    }

    // Allow typing a custom amount with the keyboard, like the mockup's screen 1
    if (state.screen === "amount") {
      // When the amount input has focus, let the browser handle keystrokes —
      // its oninput handler feeds setAmount() and keeps things in sync.
      var inputFocused = ui.shadow.activeElement === ui.amountValue;
      if (inputFocused) {
        if (e.key === "Enter") {
          e.preventDefault();
          ui.amountValue.blur();
          goToConfirm();
        }
        return;
      }

      if (e.key.length === 1 && e.key >= "0" && e.key <= "9" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setAmount(Number(String(state.amount) + e.key));
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setAmount(Math.floor(state.amount / 10));
      } else if (e.key === "Enter" && e.target === ui.modal) {
        e.preventDefault();
        goToConfirm();
      }
      return;
    }
    if (state.screen !== "pick") return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      moveInList(e);
    } else if (e.key === "Enter" && e.target === ui.search) {
      var firstRow = !ui.list.hidden && ui.list.firstElementChild;
      if (firstRow) { e.preventDefault(); firstRow.click(); }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.target !== ui.search && e.key !== " ") {
      ui.search.focus(); // typing anywhere in the list goes to search
    }
  }

  /* ============================================================
     Settings menu — Alt+M, or Shift+click the Send button
     (Customised Robux Balance now lives in the extension popup)
     ============================================================ */
  var menuCloseTimer = 0;
  var menuReturnFocus = null;

  function buildMenu() {
    var host = h("div", { id: "send-robux-userscript-menu" });
    var shadow = host.attachShadow({ mode: "open" });
    adoptStyles(shadow);
    var refs = { host: host, shadow: shadow };

    /* ---- Dialog on/off ---- */
    refs.enabled = h("input", { class: "switch", type: "checkbox", onchange: function (e) { updateSettings({ enabled: e.target.checked }); } });

    /* ---- Player list ---- */
    refs.sourceButtons = [["connections", "Connections"], ["random", "Random"], ["custom", "Custom"]].map(function (pair) {
      return h("button", { type: "button", role: "radio", "data-source": pair[0], text: pair[1], onclick: function () { updateSettings({ source: pair[0] }); } });
    });
    refs.randomRow = h("div", { class: "menu__actions" }, [
      h("span", { class: "menu__status", text: "Random Roblox players, online first." }),
      h("button", { class: "link-btn", type: "button", text: "Shuffle", onclick: loadPeople })
    ]);
    refs.usernames = h("textarea", {
      placeholder: "Usernames, one per line",
      "aria-label": "Custom usernames",
      autocomplete: "off",
      spellcheck: "false"
    });
    refs.customStatus = h("span", { class: "menu__status", role: "status" });
    refs.customRow = h("div", {}, [
      refs.usernames,
      h("div", { class: "menu__actions" }, [
        refs.customStatus,
        h("button", { class: "btn btn--primary btn--sm", type: "button", text: "Save", onclick: saveUsernames })
      ])
    ]);

    /* ---- User searcher ---- */
    refs.userSearch = h("input", { class: "switch", type: "checkbox", onchange: function (e) { updateSettings({ userSearch: e.target.checked }); } });

    /* ---- Loop after Send ---- */
    refs.loopSend = h("input", { class: "switch", type: "checkbox", onchange: function (e) { updateSettings({ loopSend: e.target.checked }); } });

    refs.panel = h("div", { class: "menu theme", role: "dialog", "aria-label": "Send Robux settings", tabindex: "-1" }, [
      h("header", { class: "menu__header" }, [
        h("span", { class: "menu__title", text: "Send Robux settings" }),
        h("button", { class: "close-btn", type: "button", "aria-label": "Close menu", onclick: closeMenu }, [icon("close")])
      ]),
      h("div", { class: "menu__section" }, [
        h("label", { class: "menu__row" }, [h("span", { text: "Enable" }), refs.enabled])
      ]),
      h("div", { class: "menu__section" }, [
        h("div", { class: "menu__label", id: "srx-source-label", text: "Player list" }),
        h("div", { class: "segmented", role: "radiogroup", "aria-labelledby": "srx-source-label" }, refs.sourceButtons),
        refs.randomRow,
        refs.customRow,
        h("label", { class: "menu__row" }, [h("span", { text: "User searcher" }), refs.userSearch]),
        h("p", { class: "menu__hint", text: "Makes the dialog's search box find any exact username you type." })
      ]),
      h("div", { class: "menu__section" }, [
        h("label", { class: "menu__row" }, [h("span", { text: "Loop after Send" }), refs.loopSend]),
        h("p", { class: "menu__hint", text: "OK on the sent screen starts the flow over at the pick screen instead of closing the dialog." })
      ]),
      h("p", { class: "menu__hint", text: "Customised Robux Balance lives in the extension popup. Alt+M or Shift+click Send opens this menu; on touch screens, hold the Send button." })
    ]);
    shadow.append(refs.panel);

    shadow.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target === refs.usernames) {
        e.preventDefault();
        saveUsernames();
      }
    });
    // Keep Roblox's page-level shortcuts (and the dialog behind) from reacting to typing in the menu
    ["keydown", "keyup", "keypress"].forEach(function (type) {
      host.addEventListener(type, function (e) { e.stopPropagation(); });
    });
    return refs;
  }

  // Controls mirror the settings; the usernames box is only filled when the menu opens,
  // so a half-typed list isn't overwritten
  function syncMenu() {
    if (!menu) return;
    menu.enabled.checked = settings.enabled;
    menu.userSearch.checked = settings.userSearch;
    menu.loopSend.checked = settings.loopSend;
    menu.sourceButtons.forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.dataset.source === settings.source));
    });
    menu.randomRow.hidden = settings.source !== "random";
    menu.customRow.hidden = settings.source !== "custom";
    renderMenuStatus();
  }

  function renderMenuStatus() {
    if (!menu) return;
    var text = "";
    if (settings.source === "custom" && store.source === "custom") {
      if (store.status === "loading") text = "Looking up…";
      else if (store.status === "error") text = "Lookup failed. Save to try again.";
      else if (store.missing.length) text = store.people.length + " found. Not found: " + store.missing.join(", ");
      else if (settings.usernames.length) text = store.people.length + (store.people.length === 1 ? " player" : " players");
    }
    menu.customStatus.textContent = text;
  }

  function updateSettings(patch) {
    var listChanged = ("source" in patch && patch.source !== settings.source) ||
      ("usernames" in patch && settings.source === "custom");
    Object.assign(settings, patch);
    saveSettings();
    syncMenu();
    if ("balanceOn" in patch || "balance" in patch) {
      renderBalance();
      applyPageBalance();
    }
    if ("userSearch" in patch) scheduleUserSearch();
    if (listChanged) loadPeople(); // also while the dialog is closed, so the list is ready when it opens
  }

  function saveUsernames() {
    var names = parseUsernames(menu.usernames.value);
    menu.usernames.value = names.join("\n");
    updateSettings({ usernames: names });
  }

  function toggleMenu(show) {
    var isOpen = !!menu && menu.panel.classList.contains("is-open");
    if (show == null) show = !isOpen;
    if (show === isOpen) return;
    if (!show) {
      closeMenu();
      return;
    }

    if (!menu) menu = buildMenu();
    clearTimeout(menuCloseTimer);
    menu.panel.dataset.theme = currentTheme();
    menu.usernames.value = settings.usernames.join("\n");
    syncMenu();

    menuReturnFocus = (ui && ui.shadow.activeElement) || document.activeElement;
    if (!menu.host.isConnected) document.body.append(menu.host);
    menu.panel.getBoundingClientRect(); // commit the closed pose so the open transition runs
    menu.panel.classList.add("is-open");
    menu.panel.focus({ preventScroll: true });
    if (store.balance == null) refreshBalance(); // for the "real balance" line
  }

  function closeMenu() {
    if (!menu || !menu.panel.classList.contains("is-open")) return;
    menu.panel.classList.remove("is-open");
    menuCloseTimer = setTimeout(function () { menu.host.remove(); }, reduceMotion() ? 0 : 160);
    if (menuReturnFocus && menuReturnFocus.isConnected) menuReturnFocus.focus({ preventScroll: true });
    menuReturnFocus = null;
  }

  // Capture phase, so it works from anywhere on the page, including inside the dialog.
  // No Ctrl: on some layouts AltGr (= Ctrl+Alt) + M types a character.
  window.addEventListener("keydown", function (e) {
    if (e.code !== "KeyM" || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) return;
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  }, true);

  /* ============================================================
     Hook Roblox's Send button
     ------------------------------------------------------------
     Roblox's buttons react to pointer events as well as click, so
     the whole press is stopped in the capture phase before React
     sees it. Alt+click lets the original sheet through, Shift+click
     opens the menu. Touch has no modifiers, so holding the button
     opens the menu — and the click after the hold is swallowed so
     it doesn't also open the dialog.
     ============================================================ */
  function findSendButton(target) {
    var button = target instanceof Element ? target.closest(SEND_BUTTON_SCOPE) : null;
    return button && button.querySelector(SEND_BUTTON_ICON) ? button : null;
  }

  function intercept(e) {
    if (bypassHook || e.altKey) return;

    // ---- Long press on touch stands in for Shift+click ----
    if (e.type === "touchstart" && findSendButton(e.target)) {
      pressFired = false;
      clearTimeout(pressClearTimer); // an older gesture's cleanup must not touch this one
      var t = e.touches && e.touches[0];
      press = { x: t ? t.clientX : 0, y: t ? t.clientY : 0 };
      clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        pressFired = true;
        toggleMenu(true);
      }, PRESS_MS);
    } else if (e.type === "touchmove") {
      var m = e.touches && e.touches[0];
      if (press && m && (Math.abs(m.clientX - press.x) > 10 || Math.abs(m.clientY - press.y) > 10)) {
        press = null; // it turned into a scroll
        clearTimeout(pressTimer);
      }
      return;
    } else if (e.type === "touchend" || e.type === "touchcancel") {
      if (press) {
        press = null;
        clearTimeout(pressTimer);
        // the click after the hold lands right away; the flag expires just after it
        clearTimeout(pressClearTimer);
        pressClearTimer = setTimeout(function () { pressFired = false; }, 700);
      }
    } else if (e.type === "contextmenu") {
      if (press && findSendButton(e.target)) {
        e.preventDefault(); // Android opens its own menu on a hold
        if (!pressFired) {
          pressFired = true;
          toggleMenu(true);
        }
      }
      return;
    } else if (e.type === "click" && pressFired) {
      pressFired = false;
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }

    if (!settings.enabled && !e.shiftKey) return; // dialog turned off: Roblox's sheet, but the menu stays reachable
    var button = findSendButton(e.target);
    if (!button) return;
    if ((e.type === "keydown" || e.type === "keyup") && e.key !== "Enter" && e.key !== " ") return;

    e.stopImmediatePropagation();
    if (e.type === "click") {
      e.preventDefault();
      if (e.shiftKey) toggleMenu(true);
      else open(button);
    }
  }

  ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "touchmove", "touchcancel", "contextmenu", "keydown", "keyup", "click"]
    .forEach(function (type) {
      window.addEventListener(type, intercept, { capture: true, passive: type.indexOf("touch") === 0 });
    });

  // The navbar counter is on every page; sync it (and the balance by the Send button) at load
  applyPageBalance();

  /* ============================================================
     Extension message bridge — popup <-> content script
     The popup owns settings; it broadcasts through background.js,
     which lands here as "settings-updated".
     ============================================================ */
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case "settings-updated": {
          // Background pushed new settings (e.g. popup changed something).
          // Refresh the visible balance + page displays when the balance changed.
          if (msg.settings) {
            var prevBalanceOn = settings.balanceOn;
            var prevBalance = settings.balance;
            var listChanged = msg.settings.source !== settings.source ||
              (msg.settings.usernames && JSON.stringify(msg.settings.usernames) !== JSON.stringify(settings.usernames));
            Object.assign(settings, msg.settings);

            if (prevBalanceOn !== settings.balanceOn || prevBalance !== settings.balance) {
              renderBalance();
              applyPageBalance();
            }
            syncMenu();
            if (listChanged) loadPeople();
          }
          sendResponse({ ok: true });
          break;
        }

        case "request-balance": {
          refreshBalance().then(function (balance) {
            sendResponse({ ok: true, balance: balance });
          });
          return true; // async
        }

        case "open-menu": {
          toggleMenu(true);
          sendResponse({ ok: true });
          break;
        }

        case "get-state": {
          sendResponse({
            ok: true,
            screen: state.screen,
            amount: state.amount,
            selected: state.selected
              ? { id: state.selected.id, name: state.selected.name, displayName: state.selected.displayName }
              : null,
            balance: store.balance,
            settings: settings
          });
          break;
        }

        default:
          sendResponse({ ok: false, error: "Unknown content message: " + msg.type });
      }
    });
  }
})();