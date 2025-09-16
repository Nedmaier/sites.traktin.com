const projects = [
  {
    rank: 1,
    name: "Интернет-магазин техники",
    year: 2023,
    image: "media/project1.png",
    description: "Полноценный интернет-магазин с каталогом и корзиной.",
    technologies: ["React", "Node.js", "Stripe"],
    integrations: ["CRM", "Payment"],
    engine: "Custom",
    type: "shop",
    status: "работает",
    duration: "3 месяца",
    difficulty: 4
  },
  {
    rank: 2,
    name: "Сайт компании X",
    year: 2022,
    image: "media/project2.png",
    description: "Корпоративный сайт с блогом и формами обратной связи.",
    technologies: ["WordPress"],
    integrations: ["Email API"],
    engine: "WordPress",
    type: "company",
    status: "работает",
    duration: "1 месяц",
    difficulty: 2
  },
  {
    rank: 3,
    name: "Личный блог",
    year: 2021,
    image: "media/project3.png",
    description: "Простой блог для личных заметок.",
    technologies: ["Hugo"],
    integrations: [],
    engine: "Static",
    type: "personal",
    status: "в архиве",
    duration: "2 недели",
    difficulty: 1
  }
];

const container = document.getElementById("projectsContainer");
const sortSelect = document.getElementById("sortSelect");
const filterSelect = document.getElementById("filterSelect");

function renderProjects(list) {
  container.innerHTML = "";
  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "project";
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="content">
        <h3>${p.name}</h3>
        <div class="meta">${p.year} • ${p.status} • ${p.duration}</div>
        <p>${p.description}</p>
        <p><b>Технологии:</b> ${p.technologies.join(", ")}</p>
        <p><b>Интеграции:</b> ${p.integrations.length ? p.integrations.join(", ") : "—"}</p>
        <p><b>Движок:</b> ${p.engine}</p>
        <p><b>Тип:</b> ${p.type}</p>
        <div class="difficulty">
          <b>Сложность:</b> ${"★".repeat(p.difficulty)}${"☆".repeat(5 - p.difficulty)}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function applyFilters() {
  let list = [...projects];

  // Фильтр
  const filter = filterSelect.value;
  if (filter !== "all") {
    list = list.filter(p => p.type === filter);
  }

  // Сортировка
  const sort = sortSelect.value;
  list.sort((a, b) => {
    if (sort === "rank") return a.rank - b.rank;
    if (sort === "year") return b.year - a.year;
    if (sort === "name") return a.name.localeCompare(b.name);
  });

  renderProjects(list);
}

sortSelect.addEventListener("change", applyFilters);
filterSelect.addEventListener("change", applyFilters);

applyFilters(); // первый рендер
