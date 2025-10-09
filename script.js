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
	   <div class="resolved-issue-digit">${p.resolvedissue}</div>
          <div class="resolved-issue">${getSolutionWords(p.resolvedissue)}</div>           
        <div class="type-description">${p.typename ?? ""}</div>
        <h3>${p.name}</h3>
        <div class="content-bottom">
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

function adjustTopbarShift() {
  const row = document.querySelector(".topbar-row");
  const opts = document.getElementById("contactOptions");
  if (!row || !opts) return;

  const last = opts.querySelector(".contact-option:last-child");
  if (!last) {
    row.style.setProperty("--auto-shift", "0px");
    return;
  }

  // чуть раньше реагируем (через 550–600мс)
  setTimeout(() => {
    const lastRect = last.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;

    // вычисляем переполнение
    let overflow = Math.ceil(lastRect.right - vw + 12);

    // добавляем небольшой запас (чтобы не впритык)
    if (overflow > 0) overflow += 42;  // <--- 👈 добавляем 42px воздуха

    if (overflow > 0) {
      const shiftValue = Math.min(overflow, vw * 0.3); // <--- 👈 увеличил максимум до 30% ширины
      row.style.setProperty("--auto-shift", `-${shiftValue}px`);
    } else {
      row.style.setProperty("--auto-shift", "0px");
    }
  }, 0); // <--- 👈 уменьшаем задержку (реагирует почти сразу после выезда)
}

function resetTopbarShift() {
  const row = document.querySelector(".topbar-row");
  if (row) row.style.setProperty("--auto-shift", "0px");
}



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

  // ⚙️ подгоняем после окончания всех анимаций (последняя монета появляется через ~600мс)
  setTimeout(() => {
    adjustTopbarShift();
  }, 900);
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
  closeTimer = setTimeout(hideContactOptions, 7000);
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
      contactCircle.innerHTML = `<span class="order_button">Контакты</span>`;
      contactCircle.removeAttribute("href");
      contactCircle.dataset.state = "text";
      contactCircle.style.transform = "rotateY(0deg)";
    }, FIRST_SPIN_DURATION / 2);

    contactOptions.innerHTML = "";
	 setTimeout(() => resetTopbarShift(), 600);
  }, 700);
}



// === склонение слов в зависимости от числа ===
function getSolutionWords(n) {
  const lastTwo = n % 100;
  const last = n % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "уникальных<br>решений";
  }
  if (last === 1) {
    return "уникальное<br>решение";
  }
  if (last >= 2 && last <= 4) {
    return "уникальных<br>решения";
  }
  return "уникальных<br>решений";
}

// === Открыть модалку (FLIP с деталями и скриншотами) ===
function openModal(project, card) {
  const container = document.getElementById("projectsContainer");

  // уже раскрыта — выходим
  if (card.classList.contains("expanded")) return;
// 📍 Сохраняем индекс карточки
card.dataset.nextSibling = card.nextElementSibling ? card.nextElementSibling.dataset.name || card.nextElementSibling.querySelector("h3")?.innerText || "" : "";
  // закрываем предыдущую, если была
  const opened = container.querySelector(".project.expanded");
  if (opened && opened !== card) closeModal(opened);

  // включаем режим "остальные скрыть"
  container.classList.add("expanded");
  // 🧹 Скрываем остальные карточки до начала анимации
container.querySelectorAll(".project").forEach(el => {
  if (el !== card) el.classList.add("hidden-project");
});
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
  ${project.description ? `<h4>О проекте</h4>${project.description}` : ""}
  ${project.status ? `<p><strong>Статус:</strong> ${project.status}</p>` : ""}
  ${project.details ? `<p class="details"><strong>Подробности:</strong> ${project.details}</p>` : ""}  
`;

// ✅ вставляем блок «Авторские решения»
if (project.solutions && project.solutions.length) {
  const solutionsBlock = document.createElement("div");
  solutionsBlock.className = "solutions-block";
  solutionsBlock.innerHTML = `<h4>Уникальные решения</h4>`;

  project.solutions.forEach((sol) => {
    const item = document.createElement("div");
    item.className = "solution-item";
    item.innerHTML = `
      <div class="solution-title">
        <span class="title-text">${sol.title}</span>
        <span class="toggle-icon"></span>
      </div>
      <div class="solution-desc">${sol.description}</div>
    `;
    solutionsBlock.appendChild(item);
  });

  details.appendChild(solutionsBlock);

  // аккордеон
 solutionsBlock.querySelectorAll(".solution-title").forEach(title => {
  title.addEventListener("click", () => {
    const item = title.parentElement;
    const desc = title.nextElementSibling;

    item.classList.toggle("active");
    desc.classList.toggle("show");
  });
});
}

// === новый блок information ===
if (project.information && project.information.length) {
  const infoBlock = document.createElement("div");
  infoBlock.className = "info-block";
  infoBlock.innerHTML = `<h4>Краткая информация</h4>`;

  const ul = document.createElement("ul");
  project.information.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });

  infoBlock.appendChild(ul);
  details.appendChild(infoBlock);
}
// ✅ после блока решений добавляем скриншоты
if (shotsHTML) {
  details.insertAdjacentHTML("beforeend", shotsHTML);
}

  // включаем expanded
  card.classList.add("expanded", "expanding");
  card.setAttribute("aria-expanded", "true");
  card.appendChild(details);
  // 🔹 Добавляем внешнюю кнопку "вернуться"
	let backBtn = document.createElement("button");
	backBtn.className = "close-details-floating";
	backBtn.textContent = "Вернуться к списку проектов";
	document.body.appendChild(backBtn);

// позиционируем кнопку над карточкой
function positionBackButton() {
  const rect = card.getBoundingClientRect();
  backBtn.style.position = "absolute";
backBtn.style.top = `${window.scrollY + rect.top - Math.min(50, rect.height * 0.03)}px`;

const btnWidth = backBtn.offsetWidth || 240; // fallback если кнопка ещё не отрисовалась
backBtn.style.left = `${window.scrollX + rect.left + rect.width / 2 - btnWidth / 2}px`;
}
positionBackButton();

// обновляем при скролле/resize
window.addEventListener("scroll", positionBackButton);
window.addEventListener("resize", positionBackButton);

// закрытие
backBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  closeModal(card);
  backBtn.remove();
  window.removeEventListener("scroll", positionBackButton);
  window.removeEventListener("resize", positionBackButton);
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
	
	  img.addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(img.src);
  });
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
	// 💫 Плавно скрываем остальные карточки, кроме раскрытой
setTimeout(() => {
  document.querySelectorAll(".project").forEach(el => {
    if (el !== card) {
      el.classList.add("faded-out");
    }
  });
}, 150); // небольшая задержка, чтобы не ломать FLIP  
	  
    if (e.propertyName !== "transform") return;
    card.style.transition = "";
    card.style.transform  = "";
    card.classList.remove("expanding", "will-expand");
    card.removeEventListener("transitionend", tidy);
  });
}

// === Закрыть модалку (FLIP обратно) ===
function closeModal(card) {
  // 🧹 Удаляем плавающую кнопку, если есть
  const floatingBtn = document.querySelector(".close-details-floating");
  if (floatingBtn) floatingBtn.remove();

  const container = document.getElementById("projectsContainer");
  if (!card) card = container.querySelector(".project.expanded");
  if (!card) return;

  // 💫 предотвращаем "прыжок" из-за исчезающего скролла
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflowY = "hidden";
  }

  // --- 1️⃣ возвращаем все карточки в поток, иначе они "display:none" и не видны FLIP ---
  container.querySelectorAll(".project.hidden-project").forEach(el => el.classList.remove("hidden-project"));

  // --- 2️⃣ сохраняем позиции до закрытия ---
  const cards = Array.from(container.querySelectorAll(".project"));
  const firstRects = new Map();
  cards.forEach(el => firstRects.set(el, el.getBoundingClientRect()));

  // --- 3️⃣ переключаемся в обычный режим ---
  card.classList.add("collapsing");
  card.classList.remove("expanded");
  card.setAttribute("aria-expanded", "false");
  container.classList.remove("expanded");

  // --- 4️⃣ форсируем пересчёт макета ---
  void container.offsetWidth;

  // --- 5️⃣ новые позиции ---
  const lastRects = new Map();
  cards.forEach(el => lastRects.set(el, el.getBoundingClientRect()));

  // --- 6️⃣ FLIP-анимация для всех карточек ---
  cards.forEach(el => {
    const first = firstRects.get(el);
    const last  = lastRects.get(el);
    if (!first || !last) return;
    const dx = first.left - last.left;
    const dy = first.top  - last.top;
    const sx = first.width  / last.width  || 1;
    const sy = first.height / last.height || 1;

    el.style.transition = "none";
    el.style.transform  = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    el.style.willChange = "transform";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 🎬 тут можно регулировать скорость возврата (увеличивай 900ms → 1300ms, 1500ms и т.д.)
        el.style.transition = "transform 1300ms cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease";
        el.style.transform  = "translate(0,0) scale(1)";
        el.style.opacity = "1";
        el.style.filter = "blur(0)";
      });
    });

    el.addEventListener("transitionend", function onEnd(e) {
      if (e.propertyName !== "transform") return;
      el.style.transition = "";
      el.style.transform  = "";
      el.style.willChange = "";
      el.removeEventListener("transitionend", onEnd);
    });
  });

  // --- 7️⃣ убираем детали ---
  const details = card.querySelector(".project-details");
  if (details) details.remove();

  // --- 8️⃣ возвращаем карточку на своё место ---
  setTimeout(() => {
    const nextName = card.dataset.nextSibling;
    if (nextName) {
      const nextEl = [...container.children].find(el => {
        const title = el.querySelector("h3")?.innerText;
        return title === nextName;
      });
      if (nextEl) container.insertBefore(card, nextEl);
      else container.appendChild(card);
    } else {
      container.appendChild(card);
    }
    card.classList.remove("collapsing");

    // ✅ полностью восстанавливаем кликабельность и внешний вид
    container.querySelectorAll(".project").forEach(el => {
      el.style.opacity = "1";
      el.style.filter = "none";
      el.style.pointerEvents = "auto";
    });

    // 🧹 возвращаем прокрутку после завершения анимации
    document.body.style.overflowY = "";
    document.body.style.paddingRight = "";
  }, 1300);
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



// ======================================================
// 🔹 Работа с URL (открытие по ссылке / назад)
// ======================================================
function openProjectByLink(link) {
  if (!link) return;
  const project = projects.find(p => p.link === link);
  if (!project) return;

  const card = [...document.querySelectorAll(".project")].find(
    el => el.querySelector("h3")?.innerText === project.name
  );

  if (card) {
    openModal(project, card);
  } else {
    // если карточка ещё не отрендерена (например, фильтр другой)
    applyFilters();
    setTimeout(() => {
      const retry = [...document.querySelectorAll(".project")].find(
        el => el.querySelector("h3")?.innerText === project.name
      );
      if (retry) openModal(project, retry);
    }, 600);
  }
}

window.addEventListener("popstate", () => {
  const link = window.location.pathname.replace("/", "");
  if (!link) {
    // если вернулись на главную — закрываем текущий проект
    const opened = document.querySelector(".project.expanded");
    if (opened) closeModal(opened);
  } else {
    openProjectByLink(link);
  }
});

// ======================================================
// 🔹 Изменение URL при открытии / закрытии проекта
// ======================================================
const originalOpenModal = openModal;
openModal = function (project, card) {
  originalOpenModal(project, card);

  // ✅ Меняем URL только если есть link
  if (project.link && typeof project.link === "string" && project.link.trim() !== "") {
    window.history.pushState({ project: project.link }, "", `/${project.link}`);
  }
};

const originalCloseModal = closeModal;
closeModal = function (card) {
  originalCloseModal(card);

  // ✅ Возврат URL только если был изменён
  if (window.location.pathname !== "/") {
    window.history.pushState({}, "", "/");
  }
};

// === Инициализация ===
document.addEventListener("DOMContentLoaded", () => {
  sortSelect.value = "year";   // по умолчанию сортируем по дате
  applyFilters();
   // 🔹 NEW: проверяем, есть ли ссылка в адресной строке
  const link = window.location.pathname.replace("/", "");
  if (link) openProjectByLink(link); // если есть — открываем нужный проект
});