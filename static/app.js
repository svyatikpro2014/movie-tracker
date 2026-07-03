const API_URL = "http://localhost:8000";

let token = localStorage.getItem("reel_token") || null;
let currentMode = "login"; // "login" | "register"
let activeStatus = "";     // filter state
let allMovies = [];

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    showApp();
    loadMovies();
  }

  document.querySelectorAll("#status-filters .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#status-filters .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeStatus = chip.dataset.status;
      renderMovies();
    });
  });
});

// ===================== AUTH UI =====================
function switchTab(mode) {
  currentMode = mode;
  document.getElementById("tab-login").classList.toggle("active", mode === "login");
  document.getElementById("tab-register").classList.toggle("active", mode === "register");
  document.getElementById("auth-submit").textContent = mode === "login" ? "Войти" : "Создать аккаунт";
  document.getElementById("auth-submit").onclick = mode === "login" ? login : register;
  hideAuthError();
}

function showAuthError(message) {
  const el = document.getElementById("auth-error");
  el.textContent = message;
  el.hidden = false;
}

function hideAuthError() {
  document.getElementById("auth-error").hidden = true;
}

function showApp() {
  document.getElementById("auth-screen").hidden = true;
  document.getElementById("app-screen").hidden = false;
}

function showAuth() {
  document.getElementById("app-screen").hidden = true;
  document.getElementById("auth-screen").hidden = false;
}

// ===================== AUTH LOGIC =====================
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  hideAuthError();

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      switchTab("login");
      showAuthError("Аккаунт создан. Теперь войдите.");
    } else {
      const error = await response.json();
      showAuthError(error.detail || "Не удалось зарегистрироваться");
    }
  } catch (err) {
    showAuthError("Сервер недоступен");
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  hideAuthError();

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      token = data.access_token;
      localStorage.setItem("reel_token", token);
      showApp();
      loadMovies();
    } else {
      showAuthError("Неверный email или пароль");
    }
  } catch (err) {
    showAuthError("Сервер недоступен");
  }
}

function logout() {
  token = null;
  localStorage.removeItem("reel_token");
  showAuth();
}

// ===================== MOVIES =====================
async function loadMovies() {
  try {
    const response = await fetch(`${API_URL}/movies/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.status === 401) {
      logout();
      return;
    }

    allMovies = await response.json();
    renderMovies();
  } catch (err) {
    console.error("Failed to load movies", err);
  }
}

function renderMovies() {
  const list = document.getElementById("movies-list");
  const empty = document.getElementById("empty-state");

  let movies = allMovies;
  if (activeStatus) {
    movies = movies.filter(m => m.status === activeStatus);
  }

  list.innerHTML = "";

  if (movies.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const statusLabels = {
    Want_to_watch: "Хочу посмотреть",
    Watched: "Посмотрел"
  };

  movies.forEach(movie => {
    const ticket = document.createElement("div");
    ticket.className = "ticket";
    ticket.innerHTML = `
      <div class="ticket-stub"></div>
      <div class="ticket-body">
        <div class="ticket-info">
          <p class="ticket-title">${escapeHtml(movie.film_name)}</p>
          <div class="ticket-meta">
            <span class="status-pill ${movie.status}">${statusLabels[movie.status] || movie.status}</span>
          </div>
        </div>
        <div class="ticket-actions">
          <select class="status-select" onchange="updateStatus(${movie.id}, this.value)">
            <option value="Want_to_watch" ${movie.status === "Want_to_watch" ? "selected" : ""}>Хочу посмотреть</option>
            <option value="Watched" ${movie.status === "Watched" ? "selected" : ""}>Посмотрел</option>
          </select>
          <button class="icon-btn danger" title="Удалить" onclick="deleteMovie(${movie.id})">✕</button>
        </div>
      </div>
    `;
    list.appendChild(ticket);
  });
}

async function addMovie() {
  const film_name = document.getElementById("film_name").value.trim();
  const status = document.getElementById("status").value;

  if (!film_name) return;

  try {
    const response = await fetch(`${API_URL}/movies/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ film_name, status })
    });

    if (response.ok) {
      document.getElementById("film_name").value = "";
      loadMovies();
    } else {
      const error = await response.json();
      alert(error.detail || "Не удалось добавить фильм");
    }
  } catch (err) {
    alert("Сервер недоступен");
  }
}

async function updateStatus(movieId, newStatus) {
  try {
    const response = await fetch(`${API_URL}/movies/${movieId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      loadMovies();
    }
  } catch (err) {
    console.error("Failed to update status", err);
  }
}

async function deleteMovie(movieId) {
  try {
    const response = await fetch(`${API_URL}/movies/${movieId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
      loadMovies();
    }
  } catch (err) {
    console.error("Failed to delete movie", err);
  }
}

// ===================== UTIL =====================
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
