const container = document.getElementById("projectsContainer");
const modal = document.getElementById("projectModal");
const modalContent = document.querySelector(".modal-content");

let currentCard = null;
let currentScreenshotIndex = 0;
let arrowsHandler = null;
let lightbox = null;



// === Универсальная функция для последовательного появления элементов ===
function runSequence(steps) {
  let i = 0;

  function nextStep() {
    if (i >= steps.length) return;

    const step = steps[i];
    i++;

    if (Array.isArray(step)) {
      // параллельные шаги
      step.forEach(triggerElement);
    } else {
      triggerElement(step);
    }

    const delay = Array.isArray(step)
      ? Math.max(...step.map(s => s.delay || 600))
      : (step.delay || 600);

    setTimeout(nextStep, delay);
  }

  function triggerElement(step) {
    const element = typeof step.el === "string"
      ? document.querySelector(step.el)
      : step.el;

    if (element) {
      element.classList.add(step.className);
    }
  }

  nextStep();
}

// === Рендер карточек ===
function renderProjects(list) {
  const currentNames = list.map(p => p.name);

  // Убираем лишние карточки
  Array.from(container.children).forEach(card => {
    const name = card.querySelector("h3").innerText;
    if (!currentNames.includes(name)) {
      card.classList.remove("show");
      card.classList.add("hide");
      setTimeout(() => card.remove(), 800);
    }
  });

  // Создаем новые карточки
  list.forEach((p) => {
    const exists = [...container.children].some(
      c => c.querySelector("h3").innerText === p.name
    );
    if (exists) return;

    const stars = "★".repeat(p.difficulty) + "".repeat(5 - p.difficulty);
    const card = document.createElement("div");
    card.className = "project animate";
    card.innerHTML = `
      <div class="project-image">
        <img src="${Array.isArray(p.logo) ? p.logo[0] : p.logo}" alt="${p.name}">
      </div>
      <div class="content">
        <div class="type-description">${p.typename ?? ""}</div>
        <h3>${p.name}</h3>
        <div class="content-bottom">
          <div class="resolved-issue-digit">${p.resolvedissue}</div>
          <div class="resolved-issue">${getSolutionWords(p.resolvedissue)}</div>           
          <div class="difficulty">${stars}<br>
          <span class="difficulty2">класс сложности</span></div>
          <div class="year">${p.year ?? "-"} г.</div>
        </div>
      </div>
      <div class="gradient gradient-bottom"></div>
      <div class="gradient gradient-left"></div>
    `;
    card.addEventListener("click", () => openModal(p, card));
    container.appendChild(card);
  });

  // запускаем последовательность появления
  const steps = [
    { el: "header", className: "show", delay: 300 },
    { el: "#projectsContainer", className: "ready", delay: 500 },
    { el: ".logo-circle", className: "show", delay: 300 },
    { el: ".cta-circle", className: "show", delay: 600 }
  ];

  const cards = container.querySelectorAll(".project.animate");
  cards.forEach((card) => {
    steps.push({ el: card, className: "show", delay: 200 });
  });

  steps.push({ el: ".logo-circle", className: "show", delay: 1000 });
  steps.push({ el: ".cta-button", className: "show", delay: 1000 });

  runSequence(steps);
}

// === Сортировка и фильтрация (с FLIP-анимацией) ===
function applyFilters() {
  let list = [...projects];

  const filter = filterSelect.value;
  if (filter !== "all") list = list.filter(p => p.type === filter);

  const sort = sortSelect.value;
  list.sort((a, b) => {
    if (sort === "year") return b.year - a.year;
    if (sort === "name") return a.name.localeCompare(b.name);
    return a.rank - b.rank;
  });

  // Текущие карточки в DOM
  const cards = Array.from(container.querySelectorAll(".project"));

  // Проверяем: это просто перестановка существующих карточек,
  // или набор карточек меняется (например, при фильтре)?
  const namesNow  = cards.map(c => c.querySelector("h3").innerText);
  const namesNext = list.map(p => p.name);
  const sameSet =
    namesNow.length === namesNext.length &&
    namesNow.every(n => namesNext.includes(n));

  // Если набор другой (фильтр), просто перерендерим без FLIP
  if (!sameSet) {
    renderProjects(list);
    return;
  }

  // --- FLIP: FIRST (снимем текущие позиции) ---
  const firstRects = new Map();
  cards.forEach(card => firstRects.set(card, card.getBoundingClientRect()));

  // Переставляем карточки в DOM в новом порядке
  const byName = new Map(cards.map(c => [c.querySelector("h3").innerText, c]));
  list.forEach(p => {
    const card = byName.get(p.name);
    if (card) container.appendChild(card);
  });

  // --- FLIP: LAST + INVERT (анимируем переезд) ---
  byName.forEach((card) => {
    const last  = card.getBoundingClientRect();
    const first = firstRects.get(card);
    if (!first) return;

    const dx = first.left - last.left;
    const dy = first.top  - last.top;

    if (dx !== 0 || dy !== 0) {
      card.style.transform  = `translate(${dx}px, ${dy}px)`;
      card.style.transition = "none";

      requestAnimationFrame(() => {
        card.style.transition = "transform 1600ms cubic-bezier(0.22,1,0.36,1)";
        card.style.transform  = "translate(0,0)";
      });

      card.addEventListener("transitionend", () => {
        card.style.transition = "";
        card.style.transform  = "";
      }, { once: true });
    }
  });
}



// === Запуск событий ===
document.addEventListener("DOMContentLoaded", () => {
  if (typeof projects !== "undefined") {
    renderProjects(projects);
  }

  const logo = document.querySelector(".logo-circle");

  if (logo) {
    logo.addEventListener("click", (e) => {
      if (logo.classList.contains("spinning")) return;

      const rect = logo.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const centerX = rect.width / 2;

      // направление толчка
      const direction = clickX < centerX ? -1 : 1;

      // случайное число оборотов (5–20)
      const rotations = Math.floor(Math.random() * 10) + 5;

      // задаём переменные
      logo.style.setProperty("--rotations", rotations);
      logo.style.setProperty("--tilt", `${direction * 20}px`);
      logo.style.setProperty("--twist", `${direction * 2}deg`);

      logo.classList.add("spinning");

      logo.addEventListener("animationend", () => {
        logo.classList.remove("spinning");
        logo.style.removeProperty("--tilt");
        logo.style.removeProperty("--twist");
      }, { once: true });
    });
  }
});

const contactCircle = document.getElementById("contactCircle");
const contactOptions = document.getElementById("contactOptions");
contactCircle.dataset.state = contactCircle.dataset.state || "text";
// Массив доступных событий
const actions = [
  { name: "Telegram", icon: "img/tg1.png", link: "https://t.me/nedmaier" },
  { name: "Email", icon: "img/mail_white2.png", link: "mailto:test@example.com" },
  { name: "WhatsApp", icon: "img/whatsupp_white.png", link: "https://wa.me/123456789" }
];

let closeTimer = null;
// ⚙️ параметры для настройки
const FIRST_SPIN_DEG = 180;      // угол поворота первой монеты (обычно 180)
const FIRST_SPIN_DURATION = 600; // длительность анимации первой монеты (мс)
const FIRST_SHIFT = 120;         // сдвиг вправо второй монеты
const SPIN_DEG = 720;            // обороты остальных монет (540 / 720 / 1080 и т.д.)

// === Клик по кнопке ===
contactCircle.addEventListener("click", (e) => {
  const isIcon = contactCircle.dataset.state === "icon";

  if (isIcon) {
    window.open(actions[0].link, "_blank");
    return;
  }
  e.preventDefault();

  if (actions.length === 0) return;

  // Переворот основной кнопки → становится первой монетой
  contactCircle.style.transition = `transform ${FIRST_SPIN_DURATION}ms ease`;
  contactCircle.style.transform = `rotateY(${FIRST_SPIN_DEG}deg)`;

  setTimeout(() => {
    contactCircle.innerHTML = `<img src="${actions[0].icon}" alt="${actions[0].name}">`;
    contactCircle.removeAttribute("href");
    contactCircle.dataset.state = "icon";
    contactCircle.style.transform = "rotateY(0deg)"; // сброс в нормальное положение
  }, FIRST_SPIN_DURATION / 2);

  if (actions.length > 1) {
    showContactOptions();
  }
});

// === Выкат остальных монет ===
function showContactOptions() {
  contactOptions.innerHTML = "";

  actions.slice(1).forEach((action, i) => {
    const div = document.createElement("div");
    div.className = "contact-option";

    // Сдвиг вправо (вторая монета дальше на FIRST_SHIFT)
    div.style.setProperty("--shift", `${(i + 1) * FIRST_SHIFT}px`);

    // Фиксированное вращение
    div.style.setProperty("--spin", `${SPIN_DEG}deg`);

    div.innerHTML = `<img src="${action.icon}" alt="${action.name}">`;
    div.addEventListener("click", () => window.open(action.link, "_blank"));
    contactOptions.appendChild(div);

    setTimeout(() => {
      div.offsetWidth;
      div.classList.add("show");
    }, i * 200);
  });

  contactOptions.classList.add("show");

  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(hideContactOptions, 3000);
}

function hideContactOptions() {
  [...contactOptions.children].reverse().forEach((div, i) => {
    setTimeout(() => {
      div.classList.remove("show");
    }, i * 250);
  });

  setTimeout(() => {
    contactCircle.style.transition = `transform ${FIRST_SPIN_DURATION}ms ease`;
    contactCircle.style.transform = `rotateY(${FIRST_SPIN_DEG}deg)`;

    setTimeout(() => {
      contactCircle.innerHTML = `<span class="order_button">Контакты<br>для заказа</span>`;
      contactCircle.removeAttribute("href");
      contactCircle.dataset.state = "text";
      contactCircle.style.transform = "rotateY(0deg)";
    }, FIRST_SPIN_DURATION / 2);

    contactOptions.innerHTML = "";
  }, 700);
}



// === склонение слов в зависимости от числа ===
function getSolutionWords(n) {
  const lastTwo = n % 100;
  const last = n % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "интересных<br>решений";
  }
  if (last === 1) {
    return "интересное<br>решение";
  }
  if (last >= 2 && last <= 4) {
    return "интересных<br>решения";
  }
  return "интересных<br>решений";
}

// === Открыть модалку (FLIP с деталями и скриншотами) ===
function openModal(project, card) {
  const container = document.getElementById("projectsContainer");

  // уже раскрыта — выходим
  if (card.classList.contains("expanded")) return;

  // закрываем предыдущую, если была
  const opened = container.querySelector(".project.expanded");
  if (opened && opened !== card) closeModal(opened);

  // включаем режим "остальные скрыть"
  container.classList.add("expanded");
  card.classList.add("will-expand");

  // FIRST: текущее (collapsed)
  const first = card.getBoundingClientRect();

  // вставляем/перестраиваем details
  let details = card.querySelector(".project-details");
  if (details) details.remove();

  details = document.createElement("div");
  details.className = "project-details";

  const screenshots = Array.isArray(project.screenshots) ? project.screenshots : [];
  let idx = 0;
  const hasShots = screenshots.length > 0;

  const shotsHTML = hasShots ? `
    <div class="screenshots-slider active">
      <button class="prev" type="button" aria-label="Предыдущий">‹</button>
      <img class="current" src="${screenshots[0]}" alt="screenshot">
      <button class="next" type="button" aria-label="Следующий">›</button>
    </div>
  ` : "";

  details.innerHTML = `
    <button class="close-details" type="button">Вернуться к списку проектов</button>
    <h2>Детали проекта</h2>
    ${project.status ? `<p><strong>Статус:</strong> ${project.status}</p>` : ""}
    ${project.description ? `<p><strong>Описание:</strong> ${project.description}</p>` : ""}
    ${project.details ? `<p class="details"><strong>Подробности:</strong> ${project.details}</p>` : ""}
    ${(project.technologies && project.technologies.length) ? `<p><strong>Технологии:</strong> ${project.technologies.join(", ")}</p>` : ""}
    ${shotsHTML}
  `;

  // включаем expanded
  card.classList.add("expanded", "expanding");
  card.setAttribute("aria-expanded", "true");
  card.appendChild(details);

  // кнопка «назад»
  details.querySelector(".close-details").addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal(card);
  });

  // если есть слайдер
  if (hasShots) {
    const img = details.querySelector("img.current");
    const prev = details.querySelector(".prev");
    const next = details.querySelector(".next");

    function show(i) {
      if (!screenshots.length) return;
      idx = (i + screenshots.length) % screenshots.length;
      img.classList.add("fade-out");
      setTimeout(() => {
        img.src = screenshots[idx];
        img.classList.remove("fade-out");
      }, 220);
    }
    prev.addEventListener("click", (e) => { e.stopPropagation(); show(idx - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); show(idx + 1); });
  }

  // LAST: expanded
  const last = card.getBoundingClientRect();

  // INVERT
  const dx = first.left - last.left;
  const dy = first.top  - last.top;
  const sx = first.width  / last.width  || 1;
  const sy = first.height / last.height || 1;

  card.style.transition = "none";
  card.style.transform  = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      card.style.transition = "transform 1300ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease";
      card.style.transform  = "translate(0,0) scale(1)";
    });
  });

  card.addEventListener("transitionend", function tidy(e) {
    if (e.propertyName !== "transform") return;
    card.style.transition = "";
    card.style.transform  = "";
    card.classList.remove("expanding", "will-expand");
    card.removeEventListener("transitionend", tidy);
  });
}

// === Закрыть модалку (FLIP обратно) ===
function closeModal(card) {
  const container = document.getElementById("projectsContainer");
  if (!card) card = container.querySelector(".project.expanded");
  if (!card) return;

  // LAST (expanded)
  const last = card.getBoundingClientRect();

  // финальный DOM (collapsed)
  card.classList.add("collapsing");
  card.classList.remove("expanded");
  card.setAttribute("aria-expanded", "false");

  // FIRST (collapsed)
  const first = card.getBoundingClientRect();

  // INVERT
  const dx = last.left - first.left;
  const dy = last.top  - first.top;
  const sx = last.width  / first.width  || 1;
  const sy = last.height / first.height || 1;

  card.style.transition = "none";
  card.style.transform  = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      card.style.transition = "transform 1200ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease";
      card.style.transform  = "translate(0,0) scale(1)";
    });
  });

  card.addEventListener("transitionend", function tidy(e) {
    if (e.propertyName !== "transform") return;

    card.style.transition = "";
    card.style.transform  = "";
    card.classList.remove("collapsing");

    // удаляем детали
    const details = card.querySelector(".project-details");
    if (details) details.remove();

    // остальные снова видны
    container.classList.remove("expanded");

    card.removeEventListener("transitionend", tidy);
  }, { once: true });
}





// === Закрытие по клику на фон ===
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// === Закрытие по Escape ===
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (lightbox) { closeLightbox(); return; }
    if (modal.style.display === "grid") closeModal();
  }
});

// === Fade-переключение картинки ===
function fadeChange(img, newSrc) {
  img.classList.add("fade-out");
  setTimeout(() => {
    img.src = newSrc;
    img.classList.remove("fade-out");
  }, 200);
}

// === Lightbox ===
function openLightbox(src) {
  if (lightbox) lightbox.remove();
  lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `<img src="${src}" alt="full">`;
  document.body.appendChild(lightbox);
  lightbox.addEventListener("click", () => closeLightbox());
}
function closeLightbox() {
  if (lightbox) {
    lightbox.remove();
    lightbox = null;
  }
}



sortSelect.addEventListener("change", applyFilters);
filterSelect.addEventListener("change", applyFilters);

// === Инициализация ===
document.addEventListener("DOMContentLoaded", () => {
  sortSelect.value = "year";   // по умолчанию сортируем по дате
  applyFilters();
});
