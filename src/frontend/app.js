let user = null;
let history = [];
let myRoutine = [];
let routines = {
  'Rutina de Goku': {
    exercises: ['Push-ups', 'Squats', 'Burpees']
  },
  'Pierna': {
    exercises: ['Sentadillas', 'Peso muerto', 'Elevación de talones']
  }
};

// Cargar datos desde localStorage
try {
  user = JSON.parse(localStorage.getItem('user')) || null;
  history = JSON.parse(localStorage.getItem('history')) || [];
  myRoutine = JSON.parse(localStorage.getItem('myRoutine')) || [];
  routines = JSON.parse(localStorage.getItem('routines')) || routines;
  xp = parseInt(localStorage.getItem('xp')) || 0;
} catch (e) {
  console.error('Error loading from localStorage:', e);
  // Reset to defaults
  user = null;
  history = [];
  myRoutine = [];
  routines = {
    'Rutina de Goku': { exercises: ['Push-ups', 'Squats', 'Burpees'] },
    'Pierna': { exercises: ['Sentadillas', 'Peso muerto', 'Elevación de talones'] }
  };
  xp = 0;
}

let currentRoutine = null;
let routineTimer = null;
let routineStartTime = null;
let routineElapsedTime = 0;

function showSection(id) {
  // Verificar autenticación para secciones protegidas
  if ((id === 'myroutine' || id === 'workout' || id === 'history') && !user) {
    alert("Debes iniciar sesión para acceder a esta sección");
    showSection('profile');
    return;
  }

  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // Reset completo del temporizador cuando cambias de sección
  resetRoutineTimer();
}

function resetRoutineTimer() {
  if (routineTimer) {
    clearInterval(routineTimer);
    routineTimer = null;
  }
  routineElapsedTime = 0;
  currentRoutine = null;

  const timerDiv = document.getElementById('routineTimer');
  if (timerDiv) {
    timerDiv.classList.add("hidden");
  }

  // Resetear display del timer
  const timerDisplay = document.getElementById('timerDisplay');
  if (timerDisplay) {
    timerDisplay.textContent = "00:00:00";
  }

  // Resetear botones del timer
  const startBtn = document.getElementById('startTimer');
  const pauseBtn = document.getElementById('pauseTimer');
  const stopBtn = document.getElementById('stopTimer');

  if (startBtn) startBtn.classList.remove('hidden');
  if (pauseBtn) pauseBtn.classList.add('hidden');
  if (stopBtn) stopBtn.classList.add('hidden');
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', async function() {
  renderRoutines();
  renderHistory();
  updateProfile();

  if (user) {
    await loadRoutinesFromServer();
    await loadHistoryFromServer();
  }
});

// 🔐 VERIFICACIÓN DE AUTENTICACIÓN
function requireAuth() {
  if (!user) {
    alert("Debes iniciar sesión para realizar esta acción");
    showSection('profile');
    return false;
  }
  return true;
}

// 📊 ACTUALIZAR PERFIL
function updateProfile() {
  if (user) {
    document.getElementById('profileUser').textContent = user;
    document.getElementById('profileXP').textContent = xp;

    // Calcular nivel y progreso
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;
    const progressPercent = (xpInLevel / 100) * 100;

    document.getElementById('xpLevel').textContent = `Nivel ${level}`;
    document.getElementById('xpFill').style.width = `${progressPercent}%`;
  }
}

// 🔐 AUTH
async function signup() {
  const u = document.getElementById('signupUser').value;
  const p = document.getElementById('signupPass').value;

  if (!u || !p) {
    alert("Por favor completa todos los campos");
    return;
  }

  try {
    const res = await fetch("http://localhost:3002/api/auth/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Usuario creado exitosamente");
      document.getElementById('signupUser').value = "";
      document.getElementById('signupPass').value = "";
    } else {
      alert("Error: " + (data.error || "Error desconocido"));
    }
  } catch (error) {
    console.error("Error en signup:", error);
    alert("Error de conexión. Verifica que el servidor esté corriendo.");
  }
}

async function login() {
  const u = document.getElementById('loginUser').value;
  const p = document.getElementById('loginPass').value;

  if (!u || !p) return alert("Por favor completa todos los campos");

  try {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (res.ok) {
      user = data.username;
      xp = data.xp || 0; 

      // Guardar en localStorage opcionalmente
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('xp', xp);

      updateProfile();
      document.getElementById('authBox').classList.add("hidden");
      document.getElementById('profileInfo').classList.remove("hidden");
      showSection('profile');

      await loadRoutinesFromServer();
      await loadHistoryFromServer();

    } else {
      alert("Error: " + (data.error || "Error desconocido"));
    }
  } catch (error) {
    console.error("Error en login:", error);
    alert("Error de conexión. Verifica que el servidor esté corriendo.");
  }
}


// 🚪 CERRAR SESIÓN
function logout() {
  user = null;
  localStorage.removeItem('user');
  document.getElementById('profileInfo').classList.add("hidden");
  document.getElementById('authBox').classList.remove("hidden");
  showSection('profile');
}

// 🏋️ WORKOUT
async function loadWorkout() {
  if (!requireAuth()) return;

  const selectedCharacter = document.getElementById('character').value;
  try {
    const res = await fetch(`http://localhost:3002/api/workouts/${selectedCharacter}`);
    const data = await res.json();

    // Renderizar rutina como lista simple
    const routineDiv = document.getElementById('routine');
    routineDiv.innerHTML = `<h3>Rutina de ${selectedCharacter}</h3>`;

    const exercisesList = document.createElement("div");
    exercisesList.className = "generated-routine-list";

    data.routine.forEach(exercise => {
      const exerciseItem = document.createElement("div");
      exerciseItem.className = "generated-exercise-item";
      exerciseItem.innerHTML = `<span class="exercise-name">🏋️ ${exercise}</span>`;
      exercisesList.appendChild(exerciseItem);
    });

    routineDiv.appendChild(exercisesList);

    // Añadir botón para guardar toda la rutina
    const saveButton = document.createElement("button");
    saveButton.textContent = "💾 Añadir toda la rutina a Mi Rutina";
    saveButton.className = "save-routine-btn";
    saveButton.onclick = () => addWorkoutToMyRoutine(data.routine, selectedCharacter);
    routineDiv.appendChild(saveButton);

  } catch (error) {
    console.error("Error loading workout:", error);
    alert("Error al cargar la rutina. Verifica que el servidor esté corriendo.");
  }
}

// ▶️ INICIAR RUTINA
function startRoutine(routineName) {
  if (!requireAuth()) return;

  if (!routineName) {           
    alert("Error: no se ha seleccionado ninguna rutina.");
    return;
  }

  // Resetear el timer antes de iniciar
  resetRoutineTimer();

  currentRoutine = routineName;

  // Mostrar el temporizador
  const timerDiv = document.getElementById('routineTimer');
  timerDiv.classList.remove('hidden');

  // Actualizar nombre de la rutina
  document.getElementById('currentRoutineName').textContent = routineName;

  // Iniciar el timer automáticamente
  startRoutineTimer();
}

// ⏱️ FUNCIONES DEL TEMPORIZADOR
function startRoutineTimer() {
  if (!routineTimer) {
    routineStartTime = Date.now() - routineElapsedTime;
    routineTimer = setInterval(updateTimer, 1000);
    document.getElementById('startTimer').classList.add('hidden');
    document.getElementById('pauseTimer').classList.remove('hidden');
    document.getElementById('stopTimer').classList.remove('hidden');
  }
}

function pauseRoutineTimer() {
  clearInterval(routineTimer);
  routineTimer = null;
  document.getElementById('pauseTimer').classList.add('hidden');
  document.getElementById('startTimer').classList.remove('hidden');
}

async function stopRoutineTimer() {
  // Guardar sesión en historial
  const session = {
    routineName: currentRoutine,
    date: new Date().toLocaleString(),
    duration: routineElapsedTime
  };
  // Añadir al historial global
  history.push(session);

  // Guardar en localStorage
  localStorage.setItem('history', JSON.stringify(history));
  localStorage.setItem('routines', JSON.stringify(routines));

  // Añadir XP por completar rutina
  xp += 10;
  localStorage.setItem('xp', xp);
  updateProfile();

  await fetch("http://localhost:3002/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user,
      routineName: currentRoutine || "Desconocida",
      date: new Date().toLocaleString(),
      duration: routineElapsedTime
    })
  });

  // 💾 Guardar XP en backend
  await fetch("http://localhost:3002/api/auth/update-xp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, xp })
  });

  renderHistory();

  // Reset completo
  resetRoutineTimer();

  // 🔄 RECARGAR HISTORIAL DESDE SERVIDOR
  await loadHistoryFromServer();


  alert("¡Rutina completada! +10 XP. Guardada en el historial.");
}

function updateTimer() {
  if (routineStartTime) {
    routineElapsedTime = Date.now() - routineStartTime;
  }

  const hours = Math.floor(routineElapsedTime / 3600000);
  const minutes = Math.floor((routineElapsedTime % 3600000) / 60000);
  const seconds = Math.floor((routineElapsedTime % 60000) / 1000);

  document.getElementById('timerDisplay').textContent =
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ✏️ EDITAR RUTINA
async function editRoutine(routineName) {
  if (!requireAuth()) return;

  const newName = prompt("Nuevo nombre para la rutina:", routineName);
  if (!newName || newName === routineName) return;

  const exercises = routines[routineName].exercises;

  await fetch("http://localhost:3002/api/routines", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user,
      oldName: routineName,
      newName,
      exercises
    })
  });

  await loadRoutinesFromServer();
  alert("Rutina actualizada");
}


// 🗑️ ELIMINAR RUTINA
async function deleteRoutine(routineName) {
  if (!requireAuth()) return;

  if (!confirm(`¿Eliminar la rutina "${routineName}"?`)) return;

  await fetch("http://localhost:3002/api/routines", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user,
      name: routineName
    })
  });

  await loadRoutinesFromServer();
  alert("Rutina eliminada");
}


// ➕ AÑADIR RUTINA MANUAL
function addRoutine() {
  if (!requireAuth()) return;

  document.getElementById('addRoutineForm').classList.remove('hidden');
}

async function saveNewRoutine() {
  if (!requireAuth()) return;

  const name = document.getElementById('newRoutineName').value.trim();
  const exercisesText = document.getElementById('newRoutineExercises').value.trim();

  if (!name || !exercisesText) {
    alert("Por favor completa todos los campos");
    return;
  }

  const exercises = exercisesText
    .split(',')
    .map(e => e.trim())
    .filter(e => e);

  if (exercises.length === 0) {
    alert("Debes añadir al menos un ejercicio");
    return;
  }

  try {
    // 🔥 GUARDAR EN BACKEND
    await fetch("http://localhost:3002/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user,
        name,
        exercises
      })
    });

    // 🔄 RECARGAR DESDE SERVIDOR
    await loadRoutinesFromServer();

    cancelAddRoutine();
    alert("Rutina creada y guardada correctamente");

  } catch (error) {
    console.error("Error guardando rutina:", error);
    alert("Error al guardar la rutina");
  }
}


function cancelAddRoutine() {
  document.getElementById('addRoutineForm').classList.add('hidden');
  document.getElementById('newRoutineName').value = '';
  document.getElementById('newRoutineExercises').value = '';
}

// 📋 RENDERIZAR RUTINAS
function renderRoutines() {
  const routinesList = document.getElementById('routinesList');
  routinesList.innerHTML = "";

  if (!user) {
    routinesList.innerHTML = `
      <div class="auth-required-message">
        <h3>🔒 Sección Protegida</h3>
        <p>Debes iniciar sesión para acceder a tus rutinas personalizadas.</p>
        <button onclick="showSection('profile')">Ir al Perfil</button>
      </div>
    `;
    return;
  }

  // Botón para añadir nueva rutina
  const addBtn = document.createElement("button");
  addBtn.textContent = "➕ Crear Nueva Rutina";
  addBtn.className = "add-routine-btn";
  addBtn.onclick = addRoutine;
  routinesList.appendChild(addBtn);

  Object.keys(routines).forEach(routineName => {
    const routine = routines[routineName];
    const routineDiv = document.createElement("div");
    routineDiv.className = "routine-card";

    // Crear elementos individualmente para mejor control
    const h3 = document.createElement("h3");
    h3.textContent = routineName;
    routineDiv.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = `${routine.exercises.length} ejercicios`;
    routineDiv.appendChild(p);

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "routine-actions";

    const startBtn = document.createElement("button");
    startBtn.className = "start-routine-btn";
    startBtn.textContent = "▶️ Iniciar Rutina";
    startBtn.addEventListener('click', () => startRoutine(routineName));
    actionsDiv.appendChild(startBtn);

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ Editar";
    editBtn.addEventListener('click', () => editRoutine(routineName));
    actionsDiv.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Eliminar";
    deleteBtn.addEventListener('click', () => deleteRoutine(routineName));
    actionsDiv.appendChild(deleteBtn);

    routineDiv.appendChild(actionsDiv);

    const exercisesDiv = document.createElement("div");
    exercisesDiv.className = "routine-exercises";
    routine.exercises.forEach(ex => {
      const tag = document.createElement("span");
      tag.className = "exercise-tag";
      tag.textContent = ex;
      exercisesDiv.appendChild(tag);
    });
    routineDiv.appendChild(exercisesDiv);

    routinesList.appendChild(routineDiv);
  });
}

// 📜 RENDERIZAR HISTORIAL
function renderHistory() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML = "<li style='text-align: center; color: #64748b; font-style: italic;'>No has completado rutinas aún</li>";
    return;
  }

  history.forEach(session => {
    const li = document.createElement("li");
    li.className = "history-item";

    const duration = formatDuration(session.duration);
    li.innerHTML = `
      <strong>${session.routineName}</strong>
      <span class="history-date">${session.date}</span>
      <span class="history-duration">⏱️ ${duration}</span>
    `;

    historyList.appendChild(li);
  });
}

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 💾 AÑADIR RUTINA A MIS RUTINAS
async function addWorkoutToMyRoutine(exercises, character) {
  if (!requireAuth()) return;

  await fetch("http://localhost:3002/api/routines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user,
      name: `Rutina de ${character}`,
      exercises
    })
  });

  await loadRoutinesFromServer();
  alert("Rutina guardada en el servidor");
}



// 🌐 CARGAR RUTINAS DESDE BACKEND
async function loadRoutinesFromServer() {
  if (!user) return;

  const res = await fetch(`http://localhost:3002/api/routines/${user}`);
  const data = await res.json();

  routines = {};
  data.forEach(r => {
    routines[r.name] = { exercises: r.exercises };
  });

  renderRoutines();
}

// 📜 CARGAR HISTORIAL DESDE BACKEND
async function loadHistoryFromServer() {
  if (!user) return;

  const res = await fetch(`http://localhost:3002/api/history/${user}`);
  history = await res.json();

  renderHistory();
}
