// ====== CONFIG ======
// Укажите точную дату свадьбы в формате ISO, например:
// const WEDDING_DATE_ISO = "2026-08-15T16:45:00+03:00";
const WEDDING_DATE_ISO = "2026-06-26T16:00:00+03:00";

// При наличии mp3 можно добавить путь, например "./music.mp3"
const BACKGROUND_MUSIC_SRC = "";

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

initDateAndCountdown();
initCalendarButton();
initRevealAnimations();
initMusic();
initSurveyForm();