// ====== CONFIG ======
// Укажите точную дату свадьбы в формате ISO, например:
// const WEDDING_DATE_ISO = "2026-08-15T16:45:00+03:00";
const WEDDING_DATE_ISO = "2026-06-26T16:00:00+03:00";

// При наличии mp3 можно добавить путь, например "./music.mp3"
const BACKGROUND_MUSIC_SRC = "";
const OUTFIT_MANIFEST_PATH = "./assets/outfits/outfits-manifest.json";

// ====== DOM ======
const weddingDateText = document.getElementById("weddingDateText");
const countdownEl = document.getElementById("countdown");
const calendarBtn = document.getElementById("calendarBtn");
const musicToggle = document.getElementById("musicToggle");
const bgMusic = document.getElementById("bgMusic");
const form = document.getElementById("rsvpForm");
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");

function formatDateRu(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getWeddingDate() {
  if (!WEDDING_DATE_ISO) return null;
  const dt = new Date(WEDDING_DATE_ISO);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function initDateAndCountdown() {
  const weddingDate = getWeddingDate();

  if (!weddingDate) {
    if (weddingDateText) weddingDateText.textContent = "[дата свадьбы]";
    countdownEl.textContent = "Укажите дату в script.js";
    return;
  }

  if (weddingDateText) weddingDateText.textContent = formatDateRu(weddingDate);

  const updateCountdown = () => {
    const now = new Date();
    const diff = weddingDate.getTime() - now.getTime();

    if (diff <= 0) {
      countdownEl.textContent = "Этот день уже наступил 💙";
      return;
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    countdownEl.textContent = `${days} дн ${hours} ч ${minutes} мин`;
  };

  updateCountdown();
  setInterval(updateCountdown, 60_000);
}

function toICSDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function initCalendarButton() {
  calendarBtn.addEventListener("click", (e) => {
    const weddingDate = getWeddingDate();
    if (!weddingDate) {
      e.preventDefault();
      alert("Пожалуйста, сначала укажите точную дату свадьбы в script.js");
      return;
    }

    e.preventDefault();
    const endDate = new Date(weddingDate.getTime() + 4 * 60 * 60 * 1000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Wedding Invite//RU",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@wedding-invite.local`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(weddingDate)}`,
      `DTEND:${toICSDate(endDate)}`,
      "SUMMARY:Свадьба Данила и Екатерины",
      "DESCRIPTION:Свадебное торжество",
      "LOCATION:Москва",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding-invite.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

function initRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  elements.forEach((el) => observer.observe(el));
}

function normalizePath(path) {
  if (typeof path !== "string") return "";
  if (path.startsWith("./")) return path;
  if (path.startsWith("assets/")) return `./${path}`;
  if (path.startsWith("/assets/")) return `.${path}`;
  return path;
}

function groupOutfitImages(paths = []) {
  const groupsMap = new Map();

  const sorted = [...paths]
    .map(normalizePath)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ru"));

  sorted.forEach((path) => {
    const fileName = path.split("/").pop() || "";
    const pairMatch = fileName.match(/^(.*?_sample_\d+)_([12])\.(jpe?g|png|webp)$/i);

    if (pairMatch) {
      const key = pairMatch[1];
      const side = Number(pairMatch[2]);
      if (!groupsMap.has(key)) groupsMap.set(key, { type: "pair", images: [] });
      groupsMap.get(key).images[side - 1] = path;
      return;
    }

    groupsMap.set(path, { type: "single", images: [path] });
  });

  return [...groupsMap.values()]
    .map((group) => ({ ...group, images: group.images.filter(Boolean) }))
    .filter((group) => group.images.length > 0);
}

function captionByCategory(category) {
  if (category === "man") return "Образ для него";
  if (category === "women") return "Образ для неё";
  return "Образ для пары";
}

function altByCategory(category, isPair, index) {
  const base = category === "man"
    ? "Мужской образ"
    : category === "women"
      ? "Женский образ"
      : "Парный образ";

  return isPair ? `${base} в coastal elegant стиле, ракурс ${index + 1}` : `${base} в coastal elegant стиле`;
}

function createOutfitCard(group, category, index) {
  const article = document.createElement("article");
  article.className = `outfit-card-item reveal${group.type === "pair" ? " outfit-card-item--pair" : ""}`;
  article.style.setProperty("--stagger", `${index * 70}ms`);

  const media = document.createElement("div");
  media.className = `outfit-card-media${group.type === "pair" ? " outfit-card-media--pair" : ""}`;

  group.images.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    img.alt = altByCategory(category, group.type === "pair", i);
    media.appendChild(img);
  });

  const caption = document.createElement("p");
  caption.className = "outfit-card-caption";
  caption.textContent = captionByCategory(category);

  article.append(media, caption);
  return article;
}

function initTrackDragScroll(track) {
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  track.addEventListener("pointerdown", (e) => {
    isDown = true;
    startX = e.clientX;
    startScrollLeft = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    track.scrollLeft = startScrollLeft - (e.clientX - startX);
  });

  const stop = () => {
    isDown = false;
  };

  track.addEventListener("pointerup", stop);
  track.addEventListener("pointercancel", stop);
  track.addEventListener("pointerleave", stop);
}

function initCarouselControls(section) {
  const track = section.querySelector("[data-outfit-carousel-track]");
  const prevBtn = section.querySelector("[data-outfit-carousel-prev]");
  const nextBtn = section.querySelector("[data-outfit-carousel-next]");
  if (!track || !prevBtn || !nextBtn) return;

  const getStep = () => {
    const firstCard = track.querySelector(".outfit-card-item");
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 280;
    return Math.max(cardWidth + 16, Math.floor(track.clientWidth * 0.86));
  };

  prevBtn.addEventListener("click", () => track.scrollBy({ left: -getStep(), behavior: "smooth" }));
  nextBtn.addEventListener("click", () => track.scrollBy({ left: getStep(), behavior: "smooth" }));
  initTrackDragScroll(track);
}


async function initOutfitCarousels() {
  const sections = document.querySelectorAll("[data-outfit-carousel-section]");
  if (!sections.length) return;

  let manifest;
  try {
    const res = await fetch(OUTFIT_MANIFEST_PATH, { cache: "no-store" });
    if (!res.ok) throw new Error("Manifest load failed");
    manifest = await res.json();
  } catch {
    return;
  }

  sections.forEach((section) => {
    const category = section.getAttribute("data-outfit-carousel-section");
    const track = section.querySelector("[data-outfit-carousel-track]");
    if (!category || !track) return;

    const groups = groupOutfitImages(Array.isArray(manifest?.[category]) ? manifest[category] : []);
    track.innerHTML = "";
    groups.forEach((group, index) => {
      const card = createOutfitCard(group, category, index);
      track.appendChild(card);
    });

    initCarouselControls(section);
  });
}

function initMusic() {
  const source = bgMusic.querySelector("source");
  if (BACKGROUND_MUSIC_SRC) {
    source.src = BACKGROUND_MUSIC_SRC;
    bgMusic.load();
  }

  musicToggle.addEventListener("click", async () => {
    if (!BACKGROUND_MUSIC_SRC) {
      alert("Добавьте путь к музыке в BACKGROUND_MUSIC_SRC внутри script.js");
      return;
    }

    try {
      if (bgMusic.paused) {
        bgMusic.muted = false;
        await bgMusic.play();
        musicToggle.textContent = "Выключить музыку";
        musicToggle.setAttribute("aria-pressed", "true");
      } else {
        bgMusic.pause();
        musicToggle.textContent = "Включить музыку";
        musicToggle.setAttribute("aria-pressed", "false");
      }
    } catch {
      alert("Не удалось запустить музыку. Проверьте файл и настройки браузера.");
    }
  });
}

function initSurveyForm() {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";
    formSuccess.textContent = "";

    const data = new FormData(form);
    const food = data.get("food");
    const drink = data.get("drink");

    if (!food || !drink) {
      formError.textContent = "Пожалуйста, выберите вариант еды и алкоголя.";
      return;
    }

    const payload = { food, drink, submittedAt: new Date().toISOString() };

    // Заглушка отправки: замените на fetch('/api/rsvp', { method: 'POST', ... })
    await new Promise((resolve) => setTimeout(resolve, 550));
    console.log("RSVP payload:", payload);

    formSuccess.textContent = "Спасибо! Ваши предпочтения сохранены 💙";
    form.reset();
  });
}

(async function initApp() {
  initDateAndCountdown();
  initCalendarButton();
  await initOutfitCarousels();
  initRevealAnimations();
  initMusic();
  initSurveyForm();
})();