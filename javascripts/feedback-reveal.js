/* ==========================================================================
   feedback-reveal.js — personal feedback behind a code

   Each [data-fb-reveal] block points (data-fb-src) at a JSON bundle of AES-256-GCM
   ciphertexts, one per student, each keyed by PBKDF2-SHA256 from that student's code.
   The code typed here is tried against every entry; only the matching one decrypts.
   Nothing readable is stored on the site. Built by the private grading folder (build.mjs).
   ========================================================================== */
(function () {
  "use strict";

  const base = () => (typeof __md_scope !== "undefined" ? __md_scope : new URL(".", location));
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const normalize = (code) => code.toUpperCase().replace(/[^0-9A-Z]/g, "");

  async function tryDecrypt(bundle, code) {
    const pass = new TextEncoder().encode(normalize(code));
    const material = await crypto.subtle.importKey("raw", pass, "PBKDF2", false, ["deriveKey"]);
    for (const e of bundle.entries) {
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt: b64(e.salt), iterations: bundle.iter },
        material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      try {
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(e.iv) }, key, b64(e.ct));
        return new TextDecoder().decode(plain);
      } catch (_) { /* wrong key for this entry: GCM tag check failed */ }
    }
    return null;
  }

  function setup(root) {
    if (root.dataset.fbReady) return;
    root.dataset.fbReady = "1";
    const form = root.querySelector("form");
    const input = form.querySelector("input");
    const button = form.querySelector("button");
    const status = form.querySelector(".fb-status");
    const output = root.querySelector(".fb-output");
    let bundle = null;

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (!window.crypto || !crypto.subtle) {
        status.textContent = "Your browser cannot decrypt here. Open the page over https in a recent browser.";
        return;
      }
      if (normalize(input.value).length < 16) {
        status.textContent = "The code has 16 characters, e.g. ABCD-EFGH-JKMN-PQRS.";
        return;
      }
      button.disabled = true;
      status.textContent = "Checking your code…";
      try {
        bundle ??= await (await fetch(new URL(root.dataset.fbSrc, base()))).json();
        const html = await tryDecrypt(bundle, input.value);
        if (!html) {
          status.textContent = "That code does not match any feedback. Check it and try again.";
          return;
        }
        output.innerHTML = html;
        // Material only adds horizontal scrolling to tables it renders itself.
        output.querySelectorAll("table").forEach((t) => {
          const wrap = document.createElement("div");
          wrap.className = "fb-table-wrap";
          t.replaceWith(wrap);
          wrap.append(t);
        });
        output.hidden = false;
        form.hidden = true;
        const hide = document.createElement("button");
        hide.type = "button";
        hide.className = "fb-hide";
        hide.textContent = "Hide my feedback";
        hide.addEventListener("click", () => {
          output.replaceChildren();
          output.hidden = true;
          form.hidden = false;
          input.value = "";
          status.textContent = "";
        });
        output.prepend(hide);
        output.querySelector("h1")?.setAttribute("tabindex", "-1");
        output.querySelector("h1")?.focus();
      } catch (err) {
        status.textContent = "Could not load the feedback file. Reload the page and try again.";
      } finally {
        button.disabled = false;
      }
    });
  }

  function run() {
    document.querySelectorAll("[data-fb-reveal]").forEach(setup);
  }

  if (typeof document$ !== "undefined") document$.subscribe(run);
  else document.addEventListener("DOMContentLoaded", run);
})();
