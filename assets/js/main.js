// Johan & Mónica — invitación de boda
// Scroll-driven site logic (map animations, reveals, RSVP CTA).
// Mobile-first, single scroll container (window).

(() => {
  "use strict";

  // ---- Configuration -------------------------------------------------
  // Update this with the real WhatsApp number before sharing the invitation
  // (country code + number, digits only — e.g. "573001234567").
  const CONFIG = {
    whatsappNumber: "573245840166",
    whatsappMessage:
      "¡Hola Johan y Mónica! Confirmo mi asistencia a la boda del 21 y 22 de noviembre en La Vega 🌿",
    motionIntensity: 1, // 0.4 - 1.8
    showProgress: true
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const q = (s, root = document) => Array.from(root.querySelectorAll(s));

  // ---- Guest groups ---------------------------------------------------
  // Each family/guest group gets one city assigned privately (tell them
  // which one when you invite them). Typing that city on the gate screen
  // personalizes the boarding pass name, the closing message and the
  // WhatsApp confirmation text.
  //
  // PLACEHOLDER DATA: these 20 cities and names are random examples —
  // replace "city", "passengers" and "message" below with your real
  // guest list before sharing the invitation.

  const GUEST_GROUPS = [
    { city: "Xian", passengers: "Nicolas Camilo", message: "." },
    { city: "Miami", passengers: "Patricia & Guillermo", message: "." },
    { city: "Madrid", passengers: "Margarita", message: "." },
    { city: "Dubai", passengers: "Nefta & Paula", message: "." },
    { city: "Budapest", passengers: "Arely y Nixon", message: "." },
    { city: "Cracovia", passengers: "Aleja & Alejo", message: "." },
    { city: "Praga", passengers: "Andre", message: "." },
    { city: "Vergara", passengers: "Angélica & Beto", message: "." },
    { city: "Oslo", passengers: "Otilia & Jairo", message: "." },
    { city: "Estocolmo", passengers: "Thomas Steve", message: "." },
    { city: "Beijing", passengers: "Primo!", message: "." },
    { city: "Viena", passengers: "Carlos, Lore & Noah", message: "." },
    { city: "Chicago", passengers: "Ana", message: "." },
    { city: "Santo Domingo", passengers: "Sebas & Angie", message: "." },
    { city: "Shanghai", passengers: "Sebas & Angélica", message: "." },
    { city: "Cusco", passengers: "Juni & Nata", message: "." },
    { city: "Ubud", passengers: "Jose & Francy", message: "." },
    { city: "Nueva York", passengers: "Cristian & Dani", message: "." },
    { city: "Bangkok", passengers: "Jose, Der, Isa & Sebas", message: "." },
    { city: "Lima", passengers: "Abuelitas María & Rosaura", message: "." },
    { city: "Punta Cana", passengers: "Lapislázuli Flaca", message: "." }
  ];
  const CITY_STORAGE_KEY = "invitacionCiudad";

  const DIACRITICS_RE = new RegExp("[̀-ͯ]", "g");

  function normalizeCity(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(DIACRITICS_RE, "")
      .trim()
      .toLowerCase();
  }

  function findGuestGroup(cityInput) {
    const n = normalizeCity(cityInput);
    if (!n) return null;
    return GUEST_GROUPS.find((g) => normalizeCity(g.city) === n) || null;
  }

  function applyGuestGroup(group) {
    if (!group) return;
    const nameEl = document.getElementById("passengerNames");
    if (nameEl) nameEl.textContent = group.passengers;
    const msgEl = document.getElementById("personalMessage");
    if (msgEl) msgEl.textContent = group.message || "";
    CONFIG.whatsappMessage =
      "¡Hola Johan y Mónica! Somos " +
      group.passengers +
      ". ¡Check-in confirmado! Modo turista listo para recorrer todo el lugar y disfrutar con ustedes este momento tan especial. Me podré llevar el centro de mesa de recuerdo?";
    setupCtaLink();
  }

  // Wires the gate form; returns an already-validated group when the guest's
  // city was remembered from a previous visit (gate is hidden immediately),
  // or null when the gate is left showing and waiting for input.
  function setupCityGate() {
    const gate = document.getElementById("cityGate");
    const form = document.getElementById("cityGateForm");
    const input = document.getElementById("cityGateInput");
    const error = document.getElementById("cityGateError");
    if (!gate || !form || !input) return null;

    let saved = null;
    try {
      saved = localStorage.getItem(CITY_STORAGE_KEY);
    } catch (e) {}
    if (saved) {
      const group = findGuestGroup(saved);
      if (group) {
        gate.style.display = "none";
        return group;
      }
      try {
        localStorage.removeItem(CITY_STORAGE_KEY);
      } catch (e) {}
    }

    gate.style.display = "flex";
    document.body.style.overflow = "hidden";

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const group = findGuestGroup(input.value);
      if (!group) {
        if (error) error.hidden = false;
        input.focus();
        return;
      }
      if (error) error.hidden = true;
      try {
        localStorage.setItem(CITY_STORAGE_KEY, group.city);
      } catch (e) {}
      applyGuestGroup(group);
      gate.style.display = "none";
      document.body.style.overflow = "";
    });

    return null;
  }

  const site = {
    mi: CONFIG.motionIntensity,
    sc: window
  };

  function viewH() {
    return site.sc && site.sc !== window ? site.sc.clientHeight : innerHeight;
  }

  function relTop(el) {
    const r = el.getBoundingClientRect();
    if (site.sc && site.sc !== window) {
      return r.top - site.sc.getBoundingClientRect().top;
    }
    return r.top;
  }

  function prog(el) {
    if (!el) return null;
    const span = el.offsetHeight - viewH();
    if (span <= 24) return null;
    return clamp(-relTop(el) / span, 0, 1);
  }

  function scrollPos() {
    const sc = site.sc;
    if (sc && sc !== window) {
      return { top: sc.scrollTop, max: Math.max(1, sc.scrollHeight - sc.clientHeight) };
    }
    return {
      top: scrollY,
      max: Math.max(1, document.documentElement.scrollHeight - innerHeight)
    };
  }

  // ---- RSVP CTA link ----------------------------------------------------
  function setupCtaLink() {
    const link = document.getElementById("ctaLink");
    if (!link) return;
    const num = CONFIG.whatsappNumber.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(CONFIG.whatsappMessage);
    link.href = "https://wa.me/" + num + "?text=" + msg;
  }

  // ---- Details carousel dots --------------------------------------------
  function setupDetailsCarousel() {
    const carousel = document.querySelector("[data-carousel]");
    const dots = q("[data-carousel-dot]");
    if (!carousel || !dots.length) return;
    const count = carousel.children.length;

    function update() {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      const progress = maxScroll > 0 ? clamp(carousel.scrollLeft / maxScroll, 0, 1) : 0;
      const active = Math.round(progress * (count - 1));
      dots.forEach((dot, i) => {
        const on = i === active;
        dot.style.background = on ? "#f3f0e7" : "#7c9375";
        dot.style.transform = on ? "scale(1.6)" : "scale(1)";
      });
    }

    carousel.addEventListener("scroll", update, { passive: true });
    update();
  }

  // ---- Deep-linking (?at=beat or #beat) --------------------------------
  function jumpToBeat() {
    const beats = {
      opening: ["opening", 0],
      origin: ["origin", 0],
      cancun: ["intl", 0.21],
      thailand: ["intl", 0.36],
      indonesia: ["intl", 0.5],
      china: ["intl", 0.64],
      tromso: ["intl", 0.79],
      paris: ["intl", 0.95],
      transform: ["transform", 0.55],
      transformed: ["transform", 0.95],
      moto: ["nat", 0.08],
      laslajas: ["nat", 0.79],
      frontera: ["nat", 0.97],
      bridge: ["bridge", 0],
      reveal: ["reveal", 0.8],
      details: ["details", 0],
      rsvp: ["rsvp", 0.5]
    };
    let key = new URLSearchParams(location.search).get("at");
    if (!key && location.hash) key = location.hash.slice(1);
    const b = beats[key];
    if (!b) return;
    const el = document.getElementById(b[0]);
    if (!el) return;
    const sp = scrollPos();
    const top = relTop(el) + sp.top;
    const span = Math.max(0, el.offsetHeight - viewH());
    const dest = top + span * b[1];
    if (site.sc && site.sc !== window) site.sc.scrollTop = dest;
    else scrollTo({ top: dest, behavior: "auto" });
  }

  // ---- Main scroll-driven update loop ----------------------------------
  function update() {
    const vh = viewH();
    const mi = site.mi;
    const cl = clamp;

    // safety net: reveal anything already inside the viewport
    if (site.reveals) {
      site.reveals.forEach((el) => {
        if (el.style.opacity === "1") return;
        const t = relTop(el);
        const h = el.getBoundingClientRect().height;
        if (t < vh * 0.92 && t + h > 0) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
    }

    site.stages.forEach((s) => {
      const p = prog(s.el);
      if (p === null) return;
      const n = s.n;
      const i = Math.min(n - 1, Math.floor(p * n));
      const local = cl(p * n - i, 0, 1);
      const u = 2 * local - 1;
      const eased = (i + 0.5 + 0.5 * Math.sign(u) * Math.pow(Math.abs(u), 2.2)) / n;
      const len = s.path.getTotalLength();
      const d = cl(eased * len, 0.5, len - 2);
      const a = s.path.getPointAtLength(d);
      const b = s.path.getPointAtLength(d + 1.5);
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (s.marker.hasAttribute("data-upright")) {
        const dir = Math.cos((ang * Math.PI) / 180) >= 0 ? 1 : -1;
        let tilt = dir > 0 ? ang : ang - 180;
        if (tilt > 90) tilt -= 360;
        if (tilt < -90) tilt += 360;
        tilt = cl(tilt * 0.55, -24, 24);
        s.marker.setAttribute(
          "transform",
          "translate(" + a.x.toFixed(1) + "," + a.y.toFixed(1) + ") rotate(" + tilt.toFixed(1) + ") scale(" + dir + ",1)"
        );
      } else {
        s.marker.setAttribute(
          "transform",
          "translate(" + a.x.toFixed(1) + "," + a.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")"
        );
      }
      if (s.shift) {
        const win = +s.shift.getAttribute("data-win");
        const total = +s.shift.getAttribute("data-total");
        const ty = cl(win * 0.5 - a.y, win - total, 0);
        s.shift.setAttribute("transform", "translate(0," + ty.toFixed(1) + ")");
      }
      s.prog.style.strokeDasharray = String(len);
      s.prog.style.strokeDashoffset = String(len * (1 - eased));
      const isLastStop = i === n - 1;
      const alpha = local < 0.18 ? local / 0.18 : local > 0.84 && !isLastStop ? (1 - local) / 0.16 : 1;
      s.stops.forEach((el, k) => {
        const on = k === i;
        el.style.opacity = on ? cl(alpha, 0, 1).toFixed(2) : "0";
        el.style.transform = "translateY(" + (on ? (1 - cl(alpha, 0, 1)) * 16 * mi : 16 * mi) + "px)";
        el.style.pointerEvents = on && alpha > 0.6 ? "auto" : "none";
      });
      s.dots.forEach((el, k) => {
        el.setAttribute("r", String(k === i ? 7 : 4.5));
        el.style.fill = k <= i ? "#7e9a76" : "#fbf7f0";
        el.style.opacity = String(k <= i ? 1 : 0.5);
      });
      s.labels.forEach((el, k) => {
        el.style.opacity = String(k === i ? 1 : 0.28);
      });
    });

    const tf = site.tf;
    const tfP = prog(tf.sec);
    if (tfP !== null && tf.pass && tf.moto && tf.line && tf.kicker && tf.bg) {
      const p = tfP;
      const seg = (x, a, b) => cl((x - a) / (b - a), 0, 1);
      tf.bg.style.opacity = String(seg(p, 0.4, 0.9));
      const out = seg(p, 0.12, 0.45);
      tf.pass.style.opacity = (1 - out).toFixed(2);
      tf.pass.style.transform =
        "translateY(" + (-56 * out * mi).toFixed(1) + "px) rotate(" + (-7 * out).toFixed(1) + "deg)";
      const inn = seg(p, 0.42, 0.72);
      tf.moto.style.opacity = inn.toFixed(2);
      tf.moto.style.transform = "translateX(" + (-70 + 70 * inn).toFixed(1) + "px)";
      if (tf.wheel) tf.wheel.style.transform = "rotate(" + (p * 900).toFixed(1) + "deg)";
      if (tf.roadline) {
        const L = tf.roadline.getTotalLength();
        tf.roadline.style.strokeDasharray = String(L);
        tf.roadline.style.strokeDashoffset = String(L * (1 - seg(p, 0.34, 0.8)));
      }
      tf.line.style.opacity = String(seg(p, 0.68, 0.9));
      tf.line.style.transform = "translateY(" + (14 - 14 * seg(p, 0.68, 0.95)) + "px)";
      tf.kicker.textContent = p < 0.42 ? "Guardamos los pasabordos" : "Y encendimos la moto";
    }

    const rv = site.rev;
    const rvP = prog(rv.sec);
    if (rvP !== null && rv.flap && rv.card && rv.bg && rv.hint) {
      const p = rvP;
      const seg = (x, a, b) => cl((x - a) / (b - a), 0, 1);
      rv.bg.style.opacity = String(seg(p, 0.1, 0.62));
      if (rv.book) rv.book.style.transform = "translateX(" + (26 * seg(p, 0.08, 0.5)).toFixed(1) + "px)";
      const rot = -172 * seg(p, 0.08, 0.46);
      rv.flap.style.transform = "rotateY(" + rot.toFixed(1) + "deg)";
      rv.flap.style.zIndex = rot > -92 ? "4" : "0";
      const rise = seg(p, 0.48, 0.9);
      rv.card.style.transform = "translateY(" + (-118 * rise).toFixed(1) + "px) scale(" + (1 + 0.05 * rise).toFixed(3) + ")";
      rv.hint.style.opacity = (1 - seg(p, 0.05, 0.3)).toFixed(2);
      rv.leaves.forEach((el, k) => {
        el.style.opacity = (0.85 * seg(p, 0.4, 0.85)).toFixed(2);
        el.style.transform = "translate(" + (k ? 1 : -1) * (26 - 26 * seg(p, 0.4, 0.9)) + "px,0)";
      });
    }

    site.parallax.forEach((el) => {
      const sp = +(el.getAttribute("data-speed") || 0.5);
      const rel = (relTop(el) + el.getBoundingClientRect().height / 2) / vh - 0.5;
      const base = el.style.transform.indexOf("translateX(-50%)") === 0 ? "translateX(-50%) " : "";
      el.style.transform = base + "translateY(" + (-rel * 34 * sp * mi).toFixed(1) + "px)";
    });

    const sp = scrollPos();
    const docP = cl(sp.top / sp.max, 0, 1);
    if (site.pill) site.pill.style.opacity = docP > 0.015 ? "1" : "0";
    if (site.miniProg) {
      const L = site.miniProg.getTotalLength();
      site.miniProg.style.strokeDasharray = String(L);
      site.miniProg.style.strokeDashoffset = String(L * (1 - docP));
      const pt = site.miniProg.getPointAtLength(L * docP);
      site.miniDot.setAttribute("cx", String(pt.x));
      site.miniDot.setAttribute("cy", String(pt.y));
    }
    if (site.cta && site.rsvp) {
      const rt = relTop(site.rsvp);
      const on = rt < vh * 0.6 && rt + site.rsvp.offsetHeight > 0;
      site.cta.style.opacity = on ? "1" : "0";
      site.cta.style.transform = "translateX(-50%) translateY(" + (on ? 0 : 24) + "px)";
      site.cta.style.pointerEvents = on ? "auto" : "none";
    }

    let cur = site.sections[0];
    site.sections.forEach((s) => {
      if (relTop(s) <= vh * 0.45) cur = s;
    });
    if (!cur) return;
    const lbl = cur.getAttribute("data-label");
    if (site.miniLabel && site.miniLabel.textContent !== lbl) site.miniLabel.textContent = lbl;
  }

  // ---- Boot ---------------------------------------------------------------
  function init() {
    const initialGroup = setupCityGate();
    if (initialGroup) {
      applyGuestGroup(initialGroup);
    } else {
      setupCtaLink();
    }
    setupDetailsCarousel();

    // find the real scroll container (window, or a scrolling ancestor)
    site.sc = window;
    let n = document.querySelector("[data-progress]");
    n = n && n.parentElement;
    while (n && n !== document.body) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 4) {
        site.sc = n;
        break;
      }
      n = n.parentElement;
    }

    let last = 0;
    site.onScroll = () => {
      const now = performance && performance.now ? performance.now() : Date.now();
      if (now - last < 15) return;
      last = now;
      try {
        update();
      } catch (e) {}
    };
    addEventListener("scroll", site.onScroll, { passive: true, capture: true });
    addEventListener("resize", site.onScroll);
    if (site.sc !== window) site.sc.addEventListener("scroll", site.onScroll, { passive: true });

    site.stages = q("[data-stage]").map((el) => ({
      el,
      n: +el.getAttribute("data-count"),
      path: el.querySelector("[data-path]"),
      prog: el.querySelector("[data-prog-path]"),
      marker: el.querySelector("[data-marker]"),
      shift: el.querySelector("[data-route-shift]"),
      stops: Array.from(el.querySelectorAll("[data-stop]")),
      dots: Array.from(el.querySelectorAll("[data-dot]")),
      labels: Array.from(el.querySelectorAll("[data-dotlabel]"))
    }));
    site.sections = q("section[data-label]");
    site.parallax = q("[data-parallax]");
    site.tf = {
      sec: document.getElementById("transform"),
      bg: document.querySelector("[data-tf-bg]"),
      pass: document.querySelector("[data-tf-pass]"),
      roadline: document.querySelector("[data-tf-roadline]"),
      moto: document.querySelector("[data-tf-moto]"),
      wheel: document.querySelector("[data-tf-wheel]"),
      line: document.querySelector("[data-tf-line]"),
      kicker: document.querySelector("[data-tf-kicker]")
    };
    site.rev = {
      sec: document.getElementById("reveal"),
      bg: document.querySelector("[data-rev-bg]"),
      flap: document.querySelector("[data-rev-flap]"),
      card: document.querySelector("[data-rev-card]"),
      hint: document.querySelector("[data-rev-hint]"),
      book: document.querySelector("[data-rev-book]"),
      leaves: q("[data-rev-leaf]")
    };
    site.pill = document.querySelector("[data-progress]");
    site.miniProg = document.querySelector("[data-mini-prog]");
    site.miniDot = document.querySelector("[data-mini-dot]");
    site.miniLabel = document.querySelector("[data-mini-label]");
    site.cta = document.querySelector("[data-cta]");
    if (!CONFIG.showProgress && site.pill) site.pill.style.display = "none";

    q("[data-reveal]").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(" + 20 * site.mi + "px)";
      el.style.transition = "opacity .8s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1)";
      el.style.transitionDelay = (+(el.getAttribute("data-delay") || 0)) + "ms";
    });
    site.io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = "1";
            e.target.style.transform = "none";
            site.io.unobserve(e.target);
          }
        }),
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    site.reveals = q("[data-reveal]");
    site.reveals.forEach((el) => site.io.observe(el));

    site.rsvp = document.getElementById("rsvp");

    jumpToBeat();
    try {
      update();
    } catch (e) {}
    addEventListener("load", () => {
      try {
        update();
      } catch (e) {}
    });
    setInterval(() => {
      try {
        update();
      } catch (e) {}
    }, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
