(() => {
  "use strict";

  const projects = window.PROJECTS || [];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // File names for each media kind: card cover, small thumbnail and full size
  function urls(m) {
    if (m.img) return { cover: m.img + "-md.webp", thumb: m.img + "-sm.webp", full: m.img + ".webp" };
    if (m.video) return { cover: m.poster + "-md.webp", thumb: m.poster + "-sm.webp", full: m.video, poster: m.poster + ".webp" };
    return null;
  }

  const visual = (p) => (p.media || []).filter((m) => m.img || m.video);

  function imgTag(src, style = "") {
    return `<img src="${esc(src)}"${style ? ` style="${esc(style)}"` : ""} alt="" loading="lazy" decoding="async">`;
  }

  function counts(list) {
    const v = list.filter((m) => m.video).length;
    const i = list.length - v;
    const parts = [];
    if (i) parts.push(`${i} photo${i > 1 ? "s" : ""}`);
    if (v) parts.push(`${v} video${v > 1 ? "s" : ""}`);
    return parts.join(" and ");
  }

  function strip(list, title) {
    if (list.length < 2) return "";
    const max = 5;
    const shown = list.length <= max ? list.length : max - 1;
    let h = '<div class="strip">';
    for (let i = 0; i < shown; i++) {
      const m = list[i];
      const u = urls(m);
      h += `<button type="button" class="thumb" data-open="${i}" aria-label="${esc(title)}: ${m.video ? "video" : "photo"} ${i + 1} of ${list.length}">` +
        imgTag(u.thumb) + (m.video ? '<span class="play"></span>' : "") + "</button>";
    }
    if (list.length > shown) {
      const rest = list.length - shown;
      h += `<button type="button" class="thumb more" data-open="${shown}" aria-label="${esc(title)}: ${rest} more">+${rest}</button>`;
    }
    return h + "</div>";
  }

  function card(p, index) {
    const list = visual(p);
    if (!list.length) return "";
    const ci = Math.min(Math.max(p.cover || 0, 0), list.length - 1);
    const m = list[ci];
    const u = urls(m);
    const cover = `<button type="button" class="cover" data-open="${ci}" aria-label="View ${esc(p.title)} (${counts(list)})">` +
      imgTag(u.cover, p.coverPos ? `object-position:${p.coverPos}` : "") + (m.video ? '<span class="play"></span>' : "") + "</button>";
    const year = p.year ? `<span class="year">${esc(p.year)}</span>` : "";
    return `<article class="card" id="${esc(p.id)}" data-project="${index}">${cover}` +
      `<div class="label"><h3>${esc(p.title)}</h3>${year}<p class="desc">${esc(p.description)}</p></div>` +
      strip(list, p.title) + "</article>";
  }

  // Render the cards
  document.querySelector("[data-grid]").innerHTML = projects.map(card).join("");

  // Missing images: show a message instead of a broken image
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.classList.contains("lb-media")) {
      img.replaceWith(Object.assign(document.createElement("p"), { className: "lb-error", textContent: "This photo couldn't be loaded." }));
    } else {
      (img.closest(".cover, .thumb") || img).classList.add("broken");
    }
  }, true);

  // Lightbox
  const lb = document.querySelector(".lb");
  const fig = lb.querySelector(".lb-figure");
  const film = lb.querySelector(".lb-film");
  const titleEl = lb.querySelector("#lb-title");
  const captionEl = lb.querySelector(".lb-caption");
  const countEl = lb.querySelector(".lb-count");
  const prevBtn = lb.querySelector(".lb-prev");
  const nextBtn = lb.querySelector(".lb-next");
  let cur = { p: -1, i: 0, list: [] };

  function open(pi, i) {
    const p = projects[pi];
    cur = { p: pi, i: 0, list: visual(p) };
    if (!cur.list.length) return;
    titleEl.textContent = p.title;
    const multi = cur.list.length > 1;
    prevBtn.hidden = nextBtn.hidden = !multi;
    film.innerHTML = multi
      ? cur.list.map((m, k) => {
          const u = urls(m);
          return `<button type="button" class="thumb" data-go="${k}" aria-label="${m.video ? "Video" : "Photo"} ${k + 1}">` +
            imgTag(u.thumb) + (m.video ? '<span class="play"></span>' : "") + "</button>";
        }).join("")
      : "";
    if (!lb.open) {
      document.documentElement.classList.add("lb-open");
      lb.showModal();
    }
    show(i);
  }

  function setZoom(on, e) {
    const media = fig.querySelector("img.lb-media");
    if (on && media) {
      const r = media.getBoundingClientRect();
      const fx = e ? (e.clientX - r.left) / r.width : 0.5;
      const fy = e ? (e.clientY - r.top) / r.height : 0.5;
      lb.classList.add("zoomed");
      fig.scrollLeft = fx * media.naturalWidth - fig.clientWidth / 2;
      fig.scrollTop = fy * media.naturalHeight - fig.clientHeight / 2;
    } else {
      lb.classList.remove("zoomed");
    }
  }

  function show(i) {
    const n = cur.list.length;
    cur.i = ((i % n) + n) % n;
    const m = cur.list[cur.i];
    const u = urls(m);
    const title = projects[cur.p].title;
    setZoom(false);
    fig.querySelectorAll("video").forEach((v) => v.pause());
    fig.textContent = "";

    let el;
    if (m.video) {
      el = document.createElement("video");
      Object.assign(el, { controls: true, loop: true, muted: true, autoplay: true, playsInline: true, preload: "auto", poster: u.poster });
      el.addEventListener("loadeddata", () => el.classList.add("ready"), { once: true });
      el.setAttribute("aria-label", m.caption || `${title}, video`);
      el.innerHTML = `<source src="${esc(u.full)}.webm" type="video/webm"><source src="${esc(u.full)}.mp4" type="video/mp4">`;
      el.className = "lb-media";
      fig.appendChild(el);
    } else {
      el = new Image();
      el.decoding = "async";
      el.alt = m.caption || `${title}, photo ${cur.i + 1} of ${n}`;
      el.addEventListener("load", () => {
        el.classList.add("ready");
        el.classList.toggle("zoomable", el.naturalWidth > el.clientWidth * 1.15 || el.naturalHeight > el.clientHeight * 1.15);
      });
      el.addEventListener("click", (e) => {
        if (lb.classList.contains("zoomed")) setZoom(false);
        else if (el.classList.contains("zoomable")) setZoom(true, e);
      });
      el.className = "lb-media";
      fig.appendChild(el);
      el.src = u.full;
    }

    captionEl.textContent = m.caption || "";
    countEl.textContent = n > 1 ? `${cur.i + 1} / ${n}` : "";
    film.querySelectorAll("[data-go]").forEach((b) => {
      const on = +b.dataset.go === cur.i;
      b.setAttribute("aria-current", on ? "true" : "false");
      if (on) b.scrollIntoView({ block: "nearest", inline: "center" });
    });

    // Warm the cache for the neighbours
    [cur.i - 1, cur.i + 1].forEach((k) => {
      const nb = cur.list[((k % n) + n) % n];
      if (n > 1 && !nb.video) new Image().src = urls(nb).full;
    });
  }

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      const art = opener.closest("[data-project]");
      if (art) open(+art.dataset.project, +opener.dataset.open);
      return;
    }
    const go = e.target.closest("[data-go]");
    if (go) show(+go.dataset.go);
  });

  prevBtn.addEventListener("click", () => show(cur.i - 1));
  nextBtn.addEventListener("click", () => show(cur.i + 1));
  lb.querySelector(".lb-close").addEventListener("click", () => lb.close());

  // Clicking the dark area around the photo closes the viewer
  fig.addEventListener("click", (e) => { if (e.target === fig && !lb.classList.contains("zoomed")) lb.close(); });

  lb.addEventListener("keydown", (e) => {
    if (cur.list.length < 2) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); show(cur.i - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(cur.i + 1); }
  });

  lb.addEventListener("close", () => {
    fig.querySelectorAll("video").forEach((v) => v.pause());
    fig.textContent = "";
    lb.classList.remove("zoomed");
    document.documentElement.classList.remove("lb-open");
  });

  // Swipe left/right on touch screens
  let touch = null;
  fig.addEventListener("touchstart", (e) => {
    touch = e.touches.length === 1 && !lb.classList.contains("zoomed")
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  fig.addEventListener("touchmove", (e) => { if (e.touches.length > 1) touch = null; }, { passive: true });
  fig.addEventListener("touchend", (e) => {
    if (!touch || cur.list.length < 2) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(cur.i + (dx < 0 ? 1 : -1));
  });
})();
