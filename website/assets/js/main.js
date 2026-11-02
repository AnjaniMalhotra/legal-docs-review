/* PayNest Technologies — site behaviour
   Shared header/footer, navigation, counters, tabs, FAQ, pricing calculator and forms.
   Nothing here sends data anywhere: forms are handled entirely in the browser. */

(function () {
  "use strict";

  const LOGO = `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="pnGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <path d="M20 2 35 8v11c0 9.4-6.4 16.6-15 19-8.6-2.4-15-9.6-15-19V8z" fill="url(#pnGrad)"/>
      <path d="M12 23c2.5 3 5 4.4 8 4.4s5.5-1.4 8-4.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M14.5 19.5c1.7 1.9 3.5 2.8 5.5 2.8s3.8-.9 5.5-2.8" fill="none" stroke="#ccfbf1" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="20" cy="14" r="3.2" fill="#fff"/>
    </svg>`;

  const NAV = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "platform.html", label: "Platform", key: "platform" },
    { href: "security.html", label: "Privacy & Security", key: "security" },
    { href: "pricing.html", label: "Pricing", key: "pricing" },
    { href: "about.html", label: "About", key: "about" },
    { href: "contact.html", label: "Contact", key: "contact" },
  ];

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const page = document.body.dataset.page;
    const links = NAV.map(
      (n) => `<li><a href="${n.href}"${n.key === page ? ' aria-current="page"' : ""}>${n.label}</a></li>`
    ).join("");

    mount.outerHTML = `
      <div class="trust-bar">🔒 <strong>Your payroll data never leaves PayNest.</strong>
        Own data centres in Bengaluru &amp; Pune · zero third-party processors ·
        <a href="security.html">See how</a></div>
      <header class="site-header" id="top">
        <div class="container nav">
          <a class="logo" href="index.html" aria-label="PayNest home">${LOGO}<span>Pay<em>Nest</em></span></a>
          <nav aria-label="Main">
            <ul class="nav__links" id="nav-links">
              ${links}
              <li class="mobile-cta"><a class="btn btn--primary btn--block" href="contact.html">Book a demo</a></li>
            </ul>
          </nav>
          <div class="nav__cta">
            <a class="nav__login" href="#" data-toast="The client portal is available only on PayNest's secure network.">Client login</a>
            <a class="btn btn--primary" href="contact.html">Book a demo</a>
            <button class="nav__toggle" aria-controls="nav-links" aria-expanded="false" aria-label="Open menu"><span></span></button>
          </div>
        </div>
      </header>`;
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    const year = new Date().getFullYear();
    mount.outerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer__grid">
            <div>
              <a class="logo" href="index.html">${LOGO}<span>Pay<em>Nest</em></span></a>
              <p>Private payroll for organisations that can't afford a leak. Run on our own servers, in our own data centres, by our own people.</p>
              <div class="footer__badges">
                <span>ISO 27001 certified</span><span>Data stored in India</span><span>0 third-party processors</span>
              </div>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="platform.html#payroll">Payroll processing</a></li>
                <li><a href="platform.html#tax">Tax &amp; statutory</a></li>
                <li><a href="platform.html#attendance">Attendance &amp; leave</a></li>
                <li><a href="platform.html#selfservice">Employee app</a></li>
                <li><a href="pricing.html">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="about.html">About us</a></li>
                <li><a href="about.html#careers">Careers</a></li>
                <li><a href="security.html">Privacy &amp; security</a></li>
                <li><a href="contact.html">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="legal.html#privacy">Privacy policy</a></li>
                <li><a href="legal.html#terms">Terms of service</a></li>
                <li><a href="legal.html#sla">Service levels</a></li>
                <li><a href="legal.html#cookies">Cookies (we use none)</a></li>
              </ul>
            </div>
          </div>
          <div class="footer__bottom">
            <span>© ${year} PayNest Technologies Pvt. Ltd. · Bengaluru, India</span>
            <span>This website uses no cookies, trackers or third-party scripts.</span>
          </div>
        </div>
      </footer>
      <div class="toast" role="status" aria-live="polite" id="toast"></div>`;
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3200);
  }

  function initToasts() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-toast]");
      if (!t) return;
      e.preventDefault();
      toast(t.dataset.toast);
    });
  }

  /* ---------- Header behaviour ---------- */
  function initNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav__toggle");
    if (!header) return;

    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = header.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && header.classList.contains("is-open")) {
          header.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }
  }

  /* ---------- Reveal + counters ---------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  function formatIN(n) {
    return Math.round(n).toLocaleString("en-IN");
  }

  function initCounters() {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const start = performance.now();
      const dur = 1400;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = prefix + (decimals ? val.toFixed(decimals) : formatIN(val)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) return els.forEach(run);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            run(en.target);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Hero mock: animated payroll run ---------- */
  function initPayrollMock() {
    const bar = document.querySelector("[data-progress]");
    const label = document.querySelector("[data-progress-label]");
    if (!bar) return;
    const stages = [
      [18, "Importing attendance…"],
      [46, "Computing salaries & TDS…"],
      [74, "Generating 9,120 payslips…"],
      [100, "Salary file sent to bank ✓"],
    ];
    let i = 0;
    const tick = () => {
      const [pct, text] = stages[i];
      bar.style.width = pct + "%";
      if (label) label.textContent = text;
      i = (i + 1) % stages.length;
      setTimeout(tick, i === 0 ? 3200 : 1700);
    };
    setTimeout(tick, 400);
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach((root) => {
      const btns = Array.from(root.querySelectorAll('[role="tab"]'));
      const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
      const select = (btn, focus) => {
        btns.forEach((b) => {
          const on = b === btn;
          b.setAttribute("aria-selected", String(on));
          b.tabIndex = on ? 0 : -1;
        });
        panels.forEach((p) => (p.hidden = p.id !== btn.getAttribute("aria-controls")));
        if (focus) btn.focus();
      };
      btns.forEach((b, idx) => {
        b.addEventListener("click", () => {
          select(b);
          history.replaceState(null, "", "#" + b.dataset.hash);
        });
        b.addEventListener("keydown", (e) => {
          const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
          if (!dir) return;
          e.preventDefault();
          select(btns[(idx + dir + btns.length) % btns.length], true);
        });
      });
      const fromHash = btns.find((b) => "#" + b.dataset.hash === location.hash);
      select(fromHash || btns[0]);
      if (fromHash) root.scrollIntoView({ block: "start" });
    });
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    document.querySelectorAll(".faq__q").forEach((q) => {
      const a = document.getElementById(q.getAttribute("aria-controls"));
      q.addEventListener("click", () => {
        const open = q.getAttribute("aria-expanded") === "true";
        q.setAttribute("aria-expanded", String(!open));
        a.style.maxHeight = open ? "0px" : a.scrollHeight + "px";
      });
    });
  }

  /* ---------- Pricing ---------- */
  const PLANS = {
    essential: { name: "Essential", monthly: 60, setup: 25000 },
    professional: { name: "Professional", monthly: 80, setup: 50000 },
    enterprise: { name: "Enterprise", monthly: 110, setup: 100000 },
  };
  const ANNUAL_DISCOUNT = 0.1;

  function initBillingToggle() {
    const toggle = document.querySelector("[data-billing]");
    if (!toggle) return;
    const btns = toggle.querySelectorAll("button");
    const apply = (mode) => {
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      document.querySelectorAll("[data-price]").forEach((el) => {
        const base = parseFloat(el.dataset.price);
        el.textContent = "₹" + formatIN(mode === "annual" ? base * (1 - ANNUAL_DISCOUNT) : base);
      });
      document.querySelectorAll("[data-billing-note]").forEach((el) => {
        el.textContent = mode === "annual" ? "per employee / month, billed annually" : "per employee / month, billed monthly";
      });
      const calcMode = document.querySelector(`input[name="calc-billing"][value="${mode}"]`);
      if (calcMode) {
        calcMode.checked = true;
        calcMode.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.mode)));
    apply("monthly");
  }

  function initCalculator() {
    const form = document.getElementById("calc");
    if (!form) return;
    const range = form.querySelector("#calc-employees");
    const number = form.querySelector("#calc-employees-num");
    const out = {
      count: document.getElementById("calc-count"),
      monthly: document.getElementById("calc-monthly"),
      annual: document.getElementById("calc-annual"),
      rate: document.getElementById("calc-rate"),
      setup: document.getElementById("calc-setup"),
      first: document.getElementById("calc-first"),
      plan: document.getElementById("calc-plan"),
      cta: document.getElementById("calc-cta"),
    };

    const update = (source) => {
      let n = parseInt(source === "number" ? number.value : range.value, 10);
      if (isNaN(n)) n = 50;
      n = Math.max(50, Math.min(20000, n));
      if (source !== "number") number.value = n;
      if (source !== "range") range.value = Math.min(n, parseInt(range.max, 10));

      const planKey = form.querySelector('input[name="calc-plan"]:checked').value;
      const billing = form.querySelector('input[name="calc-billing"]:checked').value;
      const plan = PLANS[planKey];
      const rate = billing === "annual" ? plan.monthly * (1 - ANNUAL_DISCOUNT) : plan.monthly;
      const monthly = rate * n;
      const annual = monthly * 12;

      out.count.textContent = formatIN(n);
      out.rate.textContent = "₹" + formatIN(rate) + " × " + formatIN(n);
      out.monthly.textContent = "₹" + formatIN(monthly);
      out.annual.textContent = "₹" + formatIN(annual);
      out.setup.textContent = "₹" + formatIN(plan.setup);
      out.first.textContent = "₹" + formatIN(annual + plan.setup);
      out.plan.textContent = plan.name + (planKey === "enterprise" ? " (indicative)" : "");
      out.cta.href = `contact.html?plan=${planKey}&employees=${n}`;
    };

    range.addEventListener("input", () => update("range"));
    number.addEventListener("input", () => update("number"));
    number.addEventListener("blur", () => {
      const n = Math.max(50, Math.min(20000, parseInt(number.value, 10) || 50));
      number.value = n;
      update("number");
    });
    form.addEventListener("change", (e) => {
      if (e.target.name === "calc-plan" || e.target.name === "calc-billing") update();
    });
    update();
  }

  /* ---------- Forms ---------- */
  const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|rediffmail|icloud|proton(mail)?)\./i;

  function validateField(field) {
    const input = field.querySelector("input, select, textarea");
    if (!input) return true;
    const v = input.value.trim();
    let msg = "";
    if (input.required && !v && input.type !== "checkbox") msg = "This field is required.";
    else if (input.type === "checkbox" && input.required && !input.checked) msg = "Please confirm to continue.";
    else if (v && input.type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Enter a valid email address.";
      else if (input.dataset.work !== undefined && FREE_MAIL.test(v)) msg = "Please use your work email address.";
    } else if (v && input.type === "tel" && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/\s/g, ""))) {
      msg = "Enter a valid 10-digit Indian mobile number.";
    } else if (v && input.type === "number") {
      const n = Number(v);
      if (input.min && n < Number(input.min)) msg = `Minimum is ${input.min}.`;
    }
    field.classList.toggle("has-error", !!msg);
    const err = field.querySelector(".error");
    if (err) err.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  function initForms() {
    document.querySelectorAll("form[data-validate]").forEach((form) => {
      const fields = Array.from(form.querySelectorAll(".field, .check-field"));

      fields.forEach((f) => {
        const input = f.querySelector("input, select, textarea");
        if (!input) return;
        input.addEventListener("blur", () => validateField(f));
        input.addEventListener("input", () => f.classList.contains("has-error") && validateField(f));
        input.addEventListener("change", () => f.classList.contains("has-error") && validateField(f));
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const ok = fields.map(validateField).every(Boolean);
        if (!ok) {
          const first = form.querySelector(".has-error input, .has-error select, .has-error textarea");
          if (first) first.focus();
          toast("Please fix the highlighted fields.");
          return;
        }
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        const original = btn.textContent;
        btn.textContent = "Sending…";
        setTimeout(() => {
          const ref = "PN-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
          const success = document.getElementById(form.dataset.success);
          const name = (form.querySelector('[name="name"]') || {}).value || "";
          if (success) {
            success.querySelector("[data-ref]").textContent = ref;
            const who = success.querySelector("[data-name]");
            if (who) who.textContent = name.split(" ")[0] || "there";
            form.hidden = true;
            success.classList.add("is-visible");
            success.setAttribute("tabindex", "-1");
            success.focus();
          }
          form.reset();
          btn.disabled = false;
          btn.textContent = original;
        }, 900);
      });
    });

    document.querySelectorAll("[data-reset-form]").forEach((b) =>
      b.addEventListener("click", () => {
        const form = document.getElementById(b.dataset.resetForm);
        const success = b.closest(".form-success");
        success.classList.remove("is-visible");
        form.hidden = false;
        form.querySelector("input, select, textarea").focus();
      })
    );

    // Prefill demo form from pricing calculator (?plan=…&employees=…)
    const params = new URLSearchParams(location.search);
    const plan = document.getElementById("plan");
    const emp = document.getElementById("employees");
    if (plan && params.get("plan")) plan.value = params.get("plan");
    if (emp && params.get("employees")) emp.value = params.get("employees");
    const topic = document.getElementById("topic");
    if (topic && params.get("topic")) topic.value = params.get("topic");
    else if (topic && params.get("plan")) topic.value = "pricing";

    // Newsletter (footer-style inline forms)
    document.querySelectorAll("form[data-inline]").forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = f.querySelector("input");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
          toast("Enter a valid email address.");
          input.focus();
          return;
        }
        f.reset();
        toast("Thanks! You'll get our quarterly privacy brief.");
      })
    );
  }

  /* ---------- Boot ---------- */
  renderHeader();
  renderFooter();
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initToasts();
    initReveal();
    initCounters();
    initPayrollMock();
    initTabs();
    initFaq();
    initBillingToggle();
    initCalculator();
    initForms();
  });
})();
