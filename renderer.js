// renderer.js

window.addEventListener("DOMContentLoaded", () => {
  const panels = [
    { id: "panel-chatgpt", title: "Chatti", url: "https://chat.openai.com" },
    { id: "panel-grok",    title: "Grokki",  url: "https://grok.com" },       // anpassen, falls andere URL
    { id: "panel-claude",  title: "Clodi",  url: "https://claude.ai" },
    { id: "panel-veni",    title: "Veni",    url: "https://venice.ai" },      // Beispiel
    { id: "panel-gemini",  title: "Geminii",  url: "https://gemini.google.com" }
  ];

  const panelContainer = document.getElementById("panelContainer");
  const webviews = []; // hier sammeln wir alle Webview-Refs

  // Panels dynamisch erzeugen
  panels.forEach(panel => {
    const panelDiv = document.createElement("div");
    panelDiv.className = "panel";

    const headerDiv = document.createElement("div");
    headerDiv.className = "panel-header";
    headerDiv.textContent = panel.title;

    const webview = document.createElement("webview");
    webview.className = "panel-webview";
    webview.setAttribute("src", panel.url);
    webview.setAttribute("allowpopups", "true");

    // Referenz speichern
    webviews.push(webview);

    panelDiv.appendChild(headerDiv);
    panelDiv.appendChild(webview);
    panelContainer.appendChild(panelDiv);
  });

  const promptInput = document.getElementById("promptInput");
  const sendButton = document.getElementById("sendButton");

  const injectScript = (prompt) => `
    (function () {
      const promptText = ${JSON.stringify(prompt)};
      const host = location.host || "";

      function setValue(el) {
        if (!el) return "no-input-found";

        if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
          el.value = promptText;
        } else {
          el.innerText = promptText;
        }

        const inputEvent = new InputEvent("input", { bubbles: true });
        el.dispatchEvent(inputEvent);

        return "ok";
      }

      // optionaler Autosend – wird von vielen Seiten ignoriert,
      // aber schadet nicht, wenn er "ins Leere" geht
      function trySend(el) {
        if (!el) return;
        const kd = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        el.dispatchEvent(kd);
        const ku = new KeyboardEvent("keyup", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        el.dispatchEvent(ku);
      }

      function findGenericInput() {
        const candidates = [];
        candidates.push(...document.querySelectorAll("textarea"));
        candidates.push(...document.querySelectorAll('div[contenteditable="true"]'));
        candidates.push(...document.querySelectorAll('input[type="text"], input[type="search"]'));
        const visible = candidates.filter(el => el && el.offsetParent !== null);
        if (visible.length === 0) return null;
        return visible[visible.length - 1];
      }

      // ---------- ChatGPT ----------
      if (host.includes("chat.openai.com")) {
        let el =
          document.querySelector('textarea') ||
          document.querySelector('div[contenteditable="true"]');
        if (!el) el = findGenericInput();
        const res = setValue(el);
        trySend(el);
        return res;
      }

      // ---------- SuperGrok (grok / x.ai) ----------
      if (host.includes("grok") || host.includes("x.ai")) {
        // verschiedene mögliche Varianten probieren
        let el =
          document.querySelector('textarea[placeholder*="ask"]') ||
          document.querySelector('textarea[placeholder*="Frage"]') ||
          document.querySelector('div[contenteditable="true"][role="textbox"]') ||
          document.querySelector('div[contenteditable="true"]') ||
          document.querySelector("textarea");
        if (!el) el = findGenericInput();
        console.log("Multi-AI-Browser: Grok input element", el);
        const res = setValue(el);
        trySend(el);
        return res;
      }

      // ---------- Claude ----------
      if (host.includes("claude.ai")) {
        let el =
          document.querySelector('textarea[placeholder*="Wie kann ich dir heute helfen"]') ||
          document.querySelector('textarea[placeholder*="Type your message"]') ||
          document.querySelector('[data-testid="chat-input"] textarea') ||
          document.querySelector('[data-testid="chat-input"] div[contenteditable="true"]') ||
          document.querySelector("textarea") ||
          document.querySelector('div[contenteditable="true"]');
        if (!el) el = findGenericInput();
        console.log("Multi-AI-Browser: Claude input element", el);
        const res = setValue(el);
        trySend(el);
        return res;
      }

      // ---------- Venice ----------
      if (host.includes("venice")) {
        let el =
          document.querySelector('textarea[placeholder*="Ask a question"]') ||
          document.querySelector("textarea") ||
          document.querySelector('div[contenteditable="true"]');
        if (!el) el = findGenericInput();
        const res = setValue(el);
        trySend(el);
        return res;
      }

      // ---------- Gemini ----------
      if (host.includes("gemini.google.com")) {
        let el =
          document.querySelector('div[contenteditable="true"][role="textbox"]') ||
          document.querySelector('textarea[aria-label]') ||
          document.querySelector("textarea");
        if (!el) el = findGenericInput();
        const res = setValue(el);
        trySend(el);
        return res;
      }

      // ---------- generischer Fallback ----------
      const el = findGenericInput();
      const res = setValue(el);
      trySend(el);
      return res;
    })();
  `;

  const sendPrompt = () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    // direkt jede Webview ansprechen
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
  };

  sendButton.addEventListener("click", sendPrompt);
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  });
});
