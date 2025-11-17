// renderer.js
window.addEventListener("DOMContentLoaded", () => {
  // Version anzeigen
  const vEl = document.getElementById("appVersion");
  if (vEl && window.appInfo && window.appInfo.version) {
    vEl.textContent = `v${window.appInfo.version}`;
  }

  const defaultPanels = [
    { id: "panel-chatgpt", title: "ChatGPT", url: "https://chat.openai.com" },
    { id: "panel-claude", title: "Claude", url: "https://claude.ai" },
    { id: "panel-gemini", title: "Gemini", url: "https://gemini.google.com" },
    { id: "panel-grok", title: "Grok", url: "https://grok.com" },
    { id: "panel-venice", title: "Venice", url: "https://venice.ai" }
  ];

  const panelsFromConfig = window.panelConfig && Array.isArray(window.panelConfig.panels)
    ? window.panelConfig.panels
    : [];
  const panels = panelsFromConfig.length > 0 ? panelsFromConfig : defaultPanels;

  const panelContainer = document.getElementById("panelContainer");
  const webviews = [];

  panels.forEach(panel => {
    const panelDiv = document.createElement("div");
    panelDiv.className = "panel";

    // 1) Titelzeile
    const headerDiv = document.createElement("div");
    headerDiv.className = "panel-header";
    headerDiv.textContent = panel.title;

    // 2) Adresszeile
    const addrBar = document.createElement("div");
    addrBar.className = "panel-addressbar";

    const addrInput = document.createElement("input");
    addrInput.type = "text";
    addrInput.className = "panel-addressbar-input";
    addrInput.value = panel.url; // Start-URL vorbefuellen

    const addrButton = document.createElement("button");
    addrButton.className = "panel-addressbar-button";
    addrButton.textContent = "Go";

    addrBar.appendChild(addrInput);
    addrBar.appendChild(addrButton);

    // 3) Webview
    const webview = document.createElement("webview");
    webview.className = "panel-webview";
    webview.setAttribute("src", panel.url);
    webview.setAttribute("allowpopups", "true");

    webviews.push(webview);

    const setHeader = (titleText, urlText) => {
      const cleanedTitle = (titleText || "").trim();
      if (cleanedTitle) {
        headerDiv.textContent = cleanedTitle;
        return;
      }
      if (urlText) {
        try {
          const host = new URL(urlText).host;
          if (host) {
            headerDiv.textContent = host;
            return;
          }
        } catch (err) {
          // ignore invalid URL
        }
      }
      headerDiv.textContent = panel.title;
    };

    // Navigation von der Adresszeile aus steuern
    const navigate = () => {
      let url = addrInput.value.trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }
      webview.loadURL(url);
    };

    addrButton.addEventListener("click", navigate);
    addrInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        navigate();
      }
    });

    // Wenn im Webview navigiert wird, Adresszeile aktualisieren
    webview.addEventListener("did-navigate", (event) => {
      addrInput.value = event.url;
      setHeader("", event.url);
    });
    webview.addEventListener("did-navigate-in-page", (event) => {
      addrInput.value = event.url;
      setHeader("", event.url);
    });
    webview.addEventListener("page-title-updated", (event) => {
      setHeader(event.title, addrInput.value);
    });

    panelDiv.appendChild(headerDiv);
    panelDiv.appendChild(addrBar);
    panelDiv.appendChild(webview);
    panelContainer.appendChild(panelDiv);
  });

  const promptInput = document.getElementById("promptInput");
  const sendButton = document.getElementById("sendButton");

  const injectScript = (prompt) => `
    (async function () {
      const promptText = ${JSON.stringify(prompt)};
      const delay = (ms) => new Promise(res => setTimeout(res, ms));
      const host = location.host || "";

      const selectorMap = {
        chatgpt: [
          "[data-testid=\\"conversation-ql-editor\\"] div[contenteditable=\\"true\\"]",
          "[data-id=\\"root\\"] textarea",
          "textarea",
          "div[contenteditable=\\"true\\"]"
        ],
        claude: [
          "[data-testid=\\"chat-input-box\\"] textarea",
          "[data-testid=\\"chat-input-box\\"] div[contenteditable=\\"true\\"]",
          "[data-testid=\\"chat-input\\"] textarea",
          "[data-testid=\\"chat-input\\"] div[contenteditable=\\"true\\"]",
          "[role=\\"textbox\\"][contenteditable=\\"true\\"]",
          "textarea[placeholder*=\\"Message\\"]",
          "textarea[aria-label*=\\"Message\\"]",
          "textarea"
        ],
        grok: [
          "[data-testid*=\\"composer\\"] div[contenteditable=\\"true\\"]",
          "[data-testid*=\\"composer\\"] textarea",
          "[role=\\"textbox\\"][contenteditable=\\"true\\"]",
          "textarea[data-testid*=\\"composer\\"]",
          "textarea[placeholder*=\\"ask\\"]",
          "textarea[placeholder*=\\"frage\\"]",
          "textarea"
        ],
        venice: [
          "[role=\\"textbox\\"][contenteditable]",
          "[data-testid*=\\"chat-input\\"] div[contenteditable=\\"true\\"]",
          "[data-testid*=\\"chat-input\\"] textarea",
          "form textarea",
          "form [contenteditable=\\"true\\"]",
          "textarea[placeholder*=\\"Ask a question\\"]",
          "div[contenteditable=\\"true\\"]",
          "textarea"
        ],
        gemini: [
          "[contenteditable=\\"true\\"][role=\\"textbox\\"]",
          "[aria-label*=\\"Prompt\\"][contenteditable=\\"true\\"]",
          "[aria-label*=\\"Message\\"][contenteditable=\\"true\\"]",
          "[contenteditable=\\"true\\"][data-aria-label]",
          "textarea[aria-label]",
          "textarea[jsname]",
          "textarea"
        ],
        generic: [
          "textarea",
          "div[contenteditable=\\"true\\"]",
          "input[type=\\"text\\"]",
          "input[type=\\"search\\"]"
        ]
      };

      const isVisible = (el) => {
        if (!el) return false;
        if (el.offsetParent !== null) return true;
        const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
        return !!rect && rect.width > 0 && rect.height > 0;
      };

      const collectMatches = (root, selectors) => {
        const results = [];
        selectors.forEach(sel => {
          try {
            results.push(...root.querySelectorAll(sel));
          } catch (err) {
            // ignore invalid selectors on certain hosts
          }
        });
        return results;
      };

      const deepFindVisible = (selectors) => {
        const stack = [document];
        const candidates = [];

        while (stack.length) {
          const node = stack.pop();
          if (!node) continue;
          if (node.querySelectorAll) {
            selectors.forEach(sel => {
              try {
                candidates.push(...node.querySelectorAll(sel));
              } catch (err) {
                // ignore invalid selectors
              }
            });
          }
          // traverse shadow DOM
          if (node.shadowRoot) {
            stack.push(node.shadowRoot);
          }
          // traverse children
          if (node.children) {
            for (const child of node.children) {
              stack.push(child);
            }
          }
        }

        const visible = candidates.filter(isVisible);
        if (visible.length > 0) return visible[visible.length - 1];
        if (candidates.length > 0) return candidates[candidates.length - 1];
        return null;
      };

      const setValueAndNotify = (el) => {
        if (!el) return "no-input-found";
        const isTextControl = el.tagName === "TEXTAREA" || el.tagName === "INPUT";
        try {
          el.focus({ preventScroll: true });
          if (typeof el.click === "function") el.click();
        } catch (err) {
          // focus best-effort
        }
        if (isTextControl) {
          el.value = promptText;
          if (typeof el.setSelectionRange === "function") {
            const end = promptText.length;
            el.setSelectionRange(end, end);
          }
        } else {
          el.textContent = promptText;
        }
        el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return "ok";
      };

      const trySend = (el) => {
        if (!el) return;
        const eventInit = {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        };
        el.dispatchEvent(new KeyboardEvent("keydown", eventInit));
        el.dispatchEvent(new KeyboardEvent("keyup", eventInit));
      };

      const hostSelectors = (() => {
        if (host.includes("chat.openai.com")) return selectorMap.chatgpt;
        if (host.includes("claude.ai")) return selectorMap.claude;
        if (host.includes("grok") || host.includes("x.ai")) return selectorMap.grok;
        if (host.includes("venice")) return selectorMap.venice;
        if (host.includes("gemini.google.com")) return selectorMap.gemini;
        return [];
      })();

      const selectors = [...hostSelectors, ...selectorMap.generic];

      // kurze Verzoegerung, falls das Eingabefeld lazy geladen wird
      await delay(120);
      let el = deepFindVisible(selectors);
      if (!el) {
        await delay(180);
        el = deepFindVisible(selectors);
      }
      // als letzte Option: gerade fokussiertes Element verwenden
      if (!el && document.activeElement && document.activeElement !== document.body) {
        el = document.activeElement;
      }

      const res = setValueAndNotify(el);
      trySend(el);
      return res;
    })();
  `;

  function sendPrompt() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    webviews.forEach(wv => {
      try {
        wv.executeJavaScript(injectScript(prompt), false)
          .then(result => {
            console.log("Inject result", wv.getAttribute("src"), result);
          })
          .catch(err => {
            console.error("Inject error", wv.getAttribute("src"), err);
          });
      } catch (err) {
        console.error("Error calling executeJavaScript on webview:", err);
      }
    });
  }

  sendButton.addEventListener("click", sendPrompt);
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  });

  // Menue-Events aus preload.js
  if (window.electronAPI) {
    if (window.electronAPI.onReloadAllPanels) {
      window.electronAPI.onReloadAllPanels(() => {
        webviews.forEach(wv => wv.reload());
      });
    }
    if (window.electronAPI.onMenuSendPrompt) {
      window.electronAPI.onMenuSendPrompt(() => {
        sendPrompt();
      });
    }
  }
});
