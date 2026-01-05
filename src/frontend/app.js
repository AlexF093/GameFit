let user = null;
let xp = 0;
let character = 'Goku';
let level = 1;
let history = [];
let myRoutine = [];
let routines = {
  'Rutina de Goku': {
    exercises: ['Push-ups', 'Squats', 'Burpees'],
    sessions: []
  },
  'Pierna': {
    exercises: ['Sentadillas', 'Peso muerto', 'Elevación de talones'],
    sessions: []
  }
};
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

  // Asegurar que el modal esté oculto al cambiar de sección
  const editModal = document.getElementById('editTimeModal');
  if (editModal) {
    editModal.classList.add('hidden');
    editModal.style.display = 'none';
  }

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

    // Limpiar ejercicios de rutina activa
    const exercisesContainer = document.getElementById('currentRoutineExercises');
    if (exercisesContainer) {
      exercisesContainer.remove();
    }
  }

  // Asegurar que el modal esté oculto
  const editModal = document.getElementById('editTimeModal');
  if (editModal) {
    editModal.classList.add('hidden');
    // Limpiar valores del modal
    document.getElementById('editHours').value = '';
    document.getElementById('editMinutes').value = '';
    document.getElementById('editSeconds').value = '';
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
document.addEventListener('DOMContentLoaded', function() {
  // Forzar ocultamiento de modales y elementos de temporizador
  setTimeout(() => {
    const editModal = document.getElementById('editTimeModal');
    const routineTimer = document.getElementById('routineTimer');

    if (editModal) {
      editModal.classList.add('hidden');
      editModal.style.display = 'none';
    }
    if (routineTimer) {
      routineTimer.classList.add('hidden');
      routineTimer.style.display = 'none';
    }
  }, 100);

  renderRoutines();
  renderHistory();
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

// 🔐 AUTH
async function signup() {
  const u = signupUser.value;
  const p = signupPass.value;

  if (!u || !p) {
    alert("Por favor completa todos los campos");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Usuario creado exitosamente");
      signupUser.value = "";
      signupPass.value = "";
    } else {
      alert("Error: " + (data.error || "Error desconocido"));
    }
  } catch (error) {
    console.error("Error en signup:", error);
    alert("Error de conexión. Verifica que el servidor esté corriendo.");
  }
}

async function login() {
  const u = loginUser.value;
  const p = loginPass.value;

  if (!u || !p) {
    alert("Por favor completa todos los campos");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (res.ok) {
      user = data.username;
      character = data.character || 'Goku';
      level = data.level || 1;
      xp = data.xp || 0;

      profileUser.textContent = user;
      document.getElementById('profileCharacter').textContent = character;
      document.getElementById('profileLevel').textContent = level;
      xpFill.style.width = xp + "%";
      xpText.textContent = `Nivel ${level} - XP: ${xp}%`;

      authBox.classList.add("hidden");
      profileInfo.classList.remove("hidden");

      // Cambiar a la sección de perfil
      showSection('profile');

      // Actualizar vistas que requieren autenticación
      renderRoutines();
    } else {
      alert("Error: " + (data.error || "Error desconocido"));
    }
  } catch (error) {
    console.error("Error en login:", error);
    alert("Error de conexión. Verifica que el servidor esté corriendo.");
  }
}

// 🏋️ WORKOUT
async function loadWorkout() {
  if (!requireAuth()) return;

  const selectedCharacter = document.getElementById('character').value;
  try {
    const res = await fetch(`http://localhost:3000/api/workouts/${selectedCharacter}`);
    const data = await res.json();

    // Renderizar rutina como lista simple
    routine.innerHTML = `<h3>Rutina de ${selectedCharacter}</h3>`;

    const exercisesList = document.createElement("div");
    exercisesList.className = "generated-routine-list";

    data.routine.forEach(exercise => {
      const exerciseItem = document.createElement("div");
      exerciseItem.className = "generated-exercise-item";
      exerciseItem.innerHTML = `<span class="exercise-name">🏋️ ${exercise}</span>`;
      exercisesList.appendChild(exerciseItem);
    });

    routine.appendChild(exercisesList);

    // Añadir botón para guardar toda la rutina
    const saveButton = document.createElement("button");
    saveButton.textContent = "💾 Añadir toda la rutina a Mi Rutina";
    saveButton.className = "save-routine-btn";
    saveButton.onclick = () => addWorkoutToMyRoutine(data.routine, selectedCharacter);
    routine.appendChild(saveButton);
  } catch (error) {
    console.error("Error loading workout:", error);
    alert("Error al cargar la rutina. Verifica que el servidor esté corriendo.");
  }
}

// ▶️ INICIAR RUTINA
function startRoutine(routineName) {
  if (!requireAuth()) return;

  currentRoutine = routineName;

  // Mostrar el temporizador
  const timerDiv = document.getElementById('routineTimer');
  timerDiv.classList.remove('hidden');

  // Actualizar nombre de la rutina
  document.getElementById('currentRoutineName').textContent = routineName;

  // Limpiar ejercicios anteriores
  const existingExercises = document.getElementById('currentRoutineExercises');
  if (existingExercises) {
    existingExercises.remove();
  }

  // Crear contenedor para ejercicios de la rutina en modo entrenamiento
  const exercisesContainer = document.createElement("div");
  exercisesContainer.id = "currentRoutineExercises";
  exercisesContainer.className = "training-exercises";

  routines[routineName].exercises.forEach(exercise => {
    const exerciseDiv = document.createElement("div");
    exerciseDiv.className = "training-exercise";

    const exerciseHeader = document.createElement("div");
    exerciseHeader.className = "training-exercise-header";
    exerciseHeader.innerHTML = `<h4>🏋️ ${exercise}</h4>`;

    const seriesContainer = document.createElement("div");
    seriesContainer.className = "training-series";

    // Crear 3 series por defecto para cada ejercicio
    for (let i = 0; i < 3; i++) {
      const seriesDiv = document.createElement("div");
      seriesDiv.className = "training-series-item";

      seriesDiv.innerHTML = `
        <span class="series-label">Serie ${i + 1}:</span>
        <input type="number" placeholder="Reps" class="series-input reps-input" min="0">
        <input type="number" placeholder="Peso (kg)" class="series-input weight-input" min="0" step="0.5">
        <input type="number" placeholder="Tiempo (seg)" class="series-input time-input" min="0">
        <button class="complete-series-btn" onclick="completeSeries('${exercise}', ${i}, this)">✔ Completar</button>
      `;

      seriesContainer.appendChild(seriesDiv);
    }

    // Botón para añadir más series
    const addSeriesBtn = document.createElement("button");
    addSeriesBtn.textContent = "➕ Añadir Serie";
    addSeriesBtn.className = "add-series-btn";
    addSeriesBtn.onclick = () => addTrainingSeries(exercise, seriesContainer);

    exerciseDiv.appendChild(exerciseHeader);
    exerciseDiv.appendChild(seriesContainer);
    exerciseDiv.appendChild(addSeriesBtn);

    exercisesContainer.appendChild(exerciseDiv);
  });

  // Insertar después del temporizador
  timerDiv.appendChild(exercisesContainer);

  // Resetear el temporizador
  resetRoutineTimer();

  showSection('myroutine');
}

function createExercise(container, name, canAdd, initial) {
  const ex = {
    name,
    series: []
  };

  // Inicializar series con campos vacíos
  for (let i = 0; i < initial; i++) {
    ex.series.push({
      done: false,
      reps: "",
      weight: "",
      time: ""
    });
  }

  const div = document.createElement("div");
  div.className = "exercise";
  div.innerHTML = `<strong>${name}</strong>`;

  const list = document.createElement("div");
  div.appendChild(list);

  function render() {
    list.innerHTML = "";

    ex.series.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "series" + (s.done ? " completed" : "");

      // Crear inputs para reps, weight, time
      const repsInput = document.createElement("input");
      repsInput.type = "number";
      repsInput.min = "0";
      repsInput.placeholder = "Reps";
      repsInput.value = s.reps;
      repsInput.className = "series-input";
      repsInput.onchange = (e) => {
        s.reps = e.target.value;
      };

      const weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.min = "0";
      weightInput.step = "0.5";
      weightInput.placeholder = "Peso (kg)";
      weightInput.value = s.weight;
      weightInput.className = "series-input";
      weightInput.onchange = (e) => {
        s.weight = e.target.value;
      };

      const timeInput = document.createElement("input");
      timeInput.type = "number";
      timeInput.min = "0";
      timeInput.placeholder = "Tiempo (seg)";
      timeInput.value = s.time;
      timeInput.className = "series-input";
      timeInput.onchange = (e) => {
        s.time = e.target.value;
      };

      const label = document.createElement("span");
      label.textContent = `Serie ${i+1}:`;
      label.className = "series-label";

      const inputsDiv = document.createElement("div");
      inputsDiv.className = "series-inputs";
      inputsDiv.appendChild(repsInput);
      inputsDiv.appendChild(weightInput);
      inputsDiv.appendChild(timeInput);

      const ok = document.createElement("button");
      ok.textContent = "✔";
      ok.className = "complete";
      ok.onclick = () => {
        // Validar que al menos uno de los campos esté lleno
        if (!s.reps && !s.weight && !s.time) {
          alert("Completa al menos repeticiones, peso o tiempo para esta serie");
          return;
        }

        // Marcar como completada
        s.done = true;

        // Añadir a historial
        if (!history.includes(ex.name)) {
          history.push(ex.name);
          renderHistory();
        }

        // Dar XP
        xp = Math.min(100, xp + 5);
        xpFill.style.width = xp + "%";
        xpText.textContent = `Nivel ${level} - XP: ${xp}%`;

        render();
      };

      const del = document.createElement("button");
      del.textContent = "❌";
      del.className = "delete";
      del.onclick = () => {
        ex.series.splice(i, 1);
        render();
      };

      row.append(label, inputsDiv, ok, del);
      list.appendChild(row);
    });

    if (canAdd) {
      const add = document.createElement("button");
      add.textContent = "➕ Añadir serie";
      add.className = "add-series";
      add.onclick = () => {
        ex.series.push({
          done: false,
          reps: "",
          weight: "",
          time: ""
        });
        render();
      };

      list.appendChild(add);
    }
  }

  render();
  container.appendChild(div);
}

// ✔ COMPLETAR SERIE DURANTE ENTRENAMIENTO
function completeSeries(exerciseName, seriesIndex, buttonElement) {
  const seriesItem = buttonElement.parentElement;
  const repsInput = seriesItem.querySelector('.reps-input');
  const weightInput = seriesItem.querySelector('.weight-input');
  const timeInput = seriesItem.querySelector('.time-input');

  // Validar que al menos uno de los campos esté lleno
  if (!repsInput.value && !weightInput.value && !timeInput.value) {
    alert("Completa al menos repeticiones, peso o tiempo para esta serie");
    return;
  }

  // Marcar como completada
  seriesItem.classList.add('completed');
  buttonElement.disabled = true;
  buttonElement.textContent = "✅ Completada";

  // Deshabilitar inputs
  repsInput.disabled = true;
  weightInput.disabled = true;
  timeInput.disabled = true;

  // Añadir a historial si no está ya
  if (!history.includes(exerciseName)) {
    history.push(exerciseName);
    renderHistory();
  }

  // Dar XP
  xp = Math.min(100, xp + 5);
  xpFill.style.width = xp + "%";
  xpText.textContent = `Nivel ${level} - XP: ${xp}%`;
}

// ➕ AÑADIR SERIE DURANTE ENTRENAMIENTO
function addTrainingSeries(exerciseName, container) {
  const seriesCount = container.querySelectorAll('.training-series-item').length;
  const seriesDiv = document.createElement("div");
  seriesDiv.className = "training-series-item";

  seriesDiv.innerHTML = `
    <span class="series-label">Serie ${seriesCount + 1}:</span>
    <input type="number" placeholder="Reps" class="series-input reps-input" min="0">
    <input type="number" placeholder="Peso (kg)" class="series-input weight-input" min="0" step="0.5">
    <input type="number" placeholder="Tiempo (seg)" class="series-input time-input" min="0">
    <button class="complete-series-btn" onclick="completeSeries('${exerciseName}', ${seriesCount}, this)">✔ Completar</button>
  `;

  container.appendChild(seriesDiv);
}


// 📋 RENDERIZAR RUTINAS
function renderRoutines() {
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

  Object.keys(routines).forEach(routineName => {
    const routine = routines[routineName];
    const routineDiv = document.createElement("div");
    routineDiv.className = "routine-card";

    routineDiv.innerHTML = `
      <h3>${routineName}</h3>
      <p>${routine.exercises.length} ejercicios</p>
      <div class="routine-actions">
        <button onclick="startRoutine('${routineName}')">🚀 Empezar Rutina</button>
        <button onclick="editRoutine('${routineName}')">✏️ Editar</button>
        <button onclick="deleteRoutine('${routineName}')">🗑️ Eliminar</button>
      </div>
      <div class="routine-exercises">
        ${routine.exercises.map(ex => `<span class="exercise-tag">${ex}</span>`).join('')}
      </div>
    `;

    routinesList.appendChild(routineDiv);
  });
}

// 🚀 EMPEZAR RUTINA
function startRoutine(routineName) {
  if (!requireAuth()) return;

  currentRoutine = routineName;
  document.getElementById('currentRoutineName').textContent = routineName;
  routineTimer.classList.remove("hidden");

  // Limpiar ejercicios anteriores
  const existingExercises = document.getElementById('currentRoutineExercises');
  if (existingExercises) {
    existingExercises.remove();
  }

  // Crear contenedor para ejercicios de la rutina
  const exercisesContainer = document.createElement("div");
  exercisesContainer.id = "currentRoutineExercises";

  routines[routineName].exercises.forEach(exercise => {
    createExercise(exercisesContainer, exercise, false, 3);
  });

  // Insertar después del temporizador
  const timerDiv = document.getElementById('routineTimer');
  timerDiv.appendChild(exercisesContainer);

  showSection('myroutine');
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

function stopRoutineTimer() {
  // Guardar sesión en historial
  const session = {
    routineName: currentRoutine,
    date: new Date().toLocaleString(),
    duration: routineElapsedTime,
    exercises: getCurrentExercisesData()
  };

  if (!routines[currentRoutine].sessions) {
    routines[currentRoutine].sessions = [];
  }
  routines[currentRoutine].sessions.push(session);

  // Añadir al historial global
  history.push(session);

  renderHistory();

  // Reset completo
  resetRoutineTimer();

  alert("¡Rutina completada! Guardada en el historial.");
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

function editRoutineTime() {
  const hours = Math.floor(routineElapsedTime / 3600000);
  const minutes = Math.floor((routineElapsedTime % 3600000) / 60000);
  const seconds = Math.floor((routineElapsedTime % 60000) / 1000);

  document.getElementById('editHours').value = hours;
  document.getElementById('editMinutes').value = minutes;
  document.getElementById('editSeconds').value = seconds;

  document.getElementById('editTimeModal').classList.remove('hidden');
}

function saveEditedTime() {
  const hours = parseInt(document.getElementById('editHours').value) || 0;
  const minutes = parseInt(document.getElementById('editMinutes').value) || 0;
  const seconds = parseInt(document.getElementById('editSeconds').value) || 0;

  routineElapsedTime = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
  updateTimer();
  closeEditModal();
}

function closeEditModal() {
  document.getElementById('editTimeModal').classList.add('hidden');
}

// 📊 OBTENER DATOS DE EJERCICIOS ACTUALES (MODIFICADO PARA ENTRENAMIENTO)
function getCurrentExercisesData() {
  const exercises = [];
  const exerciseElements = document.querySelectorAll('#currentRoutineExercises .training-exercise');

  exerciseElements.forEach(exerciseEl => {
    const exerciseName = exerciseEl.querySelector('h4').textContent.replace('🏋️ ', '');
    const series = [];

    // Buscar todas las series completadas en este ejercicio
    const completedSeries = exerciseEl.querySelectorAll('.training-series-item.completed');
    completedSeries.forEach(seriesEl => {
      const repsInput = seriesEl.querySelector('.reps-input');
      const weightInput = seriesEl.querySelector('.weight-input');
      const timeInput = seriesEl.querySelector('.time-input');

      series.push({
        reps: repsInput.value || '0',
        weight: weightInput.value || '0',
        time: timeInput.value || '0'
      });
    });

    if (series.length > 0) {
      exercises.push({
        name: exerciseName,
        series: series
      });
    }
  });

  return exercises;
}

// ✏️ EDITAR RUTINA
function editRoutine(routineName) {
  if (!requireAuth()) return;

  // Implementar edición de rutina
  alert(`Función de edición para "${routineName}" próximamente disponible`);
}

// 🗑️ ELIMINAR RUTINA
function deleteRoutine(routineName) {
  if (!requireAuth()) return;

  if (confirm(`¿Estás seguro de eliminar la rutina "${routineName}"?`)) {
    delete routines[routineName];
    renderRoutines();
  }
}

// 📋 RENDERIZAR LISTA DE RUTINAS
function renderRoutines() {
  const routinesList = document.getElementById('routinesList');
  routinesList.innerHTML = "";

  if (Object.keys(routines).length === 0) {
    routinesList.innerHTML = "<p style='text-align: center; color: #64748b; font-style: italic;'>No tienes rutinas guardadas aún. ¡Genera una rutina y añádela!</p>";
    return;
  }

  Object.keys(routines).forEach(routineName => {
    const routineDiv = document.createElement("div");
    routineDiv.className = "routine-item";

    const routineHeader = document.createElement("div");
    routineHeader.className = "routine-header";

    const routineTitle = document.createElement("h3");
    routineTitle.textContent = routineName;

    const exerciseCount = document.createElement("span");
    exerciseCount.className = "exercise-count";
    exerciseCount.textContent = `${routines[routineName].exercises.length} ejercicios`;

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "routine-buttons";

    const startBtn = document.createElement("button");
    startBtn.textContent = "▶️ Iniciar Rutina";
    startBtn.className = "start-routine-btn";
    startBtn.onclick = () => startRoutine(routineName);

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ Editar";
    editBtn.className = "edit-routine-btn";
    editBtn.onclick = () => editRoutine(routineName);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Eliminar";
    deleteBtn.className = "delete-routine-btn";
    deleteBtn.onclick = () => deleteRoutine(routineName);

    buttonsDiv.appendChild(startBtn);
    buttonsDiv.appendChild(editBtn);
    buttonsDiv.appendChild(deleteBtn);

    routineHeader.appendChild(routineTitle);
    routineHeader.appendChild(exerciseCount);
    routineHeader.appendChild(buttonsDiv);

    const exercisesList = document.createElement("div");
    exercisesList.className = "routine-exercises";
    exercisesList.innerHTML = "<strong>Ejercicios:</strong><ul>" +
      routines[routineName].exercises.map(ex => `<li>${ex}</li>`).join('') +
      "</ul>";

    routineDiv.appendChild(routineHeader);
    routineDiv.appendChild(exercisesList);

    routinesList.appendChild(routineDiv);
  });
}

// 📜 RENDERIZAR HISTORIAL
function renderHistory() {
  historyList.innerHTML = "";

  if (!user) {
    historyList.innerHTML = `
      <div class="auth-required-message">
        <h3>🔒 Sección Protegida</h3>
        <p>Debes iniciar sesión para ver tu historial de rutinas.</p>
        <button onclick="showSection('profile')">Ir al Perfil</button>
      </div>
    `;
    return;
  }

  if (history.length === 0) {
    historyList.innerHTML = "<li style='text-align: center; color: #64748b; font-style: italic;'>No has completado rutinas aún</li>";
    return;
  }

  history.forEach((session, index) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const duration = formatDuration(session.duration);
    li.innerHTML = `
      <div class="history-header" onclick="toggleHistoryDetails(${index})">
        <strong>${session.routineName}</strong>
        <span class="history-date">${session.date}</span>
        <span class="history-duration">⏱️ ${duration}</span>
        <span class="history-toggle">▼</span>
      </div>
      <div class="history-details" id="history-details-${index}" style="display: none;">
        <div class="exercise-summary">
          ${session.exercises && session.exercises.length > 0 ?
            session.exercises.map(ex => `
              <div class="exercise-summary-item">
                <strong>${ex.name}</strong>
                ${ex.series.map((s, i) => `
                  <div class="series-summary">
                    Serie ${i+1}: ${s.reps || 0} reps, ${s.weight || 0}kg, ${s.time || 0}s
                  </div>
                `).join('')}
              </div>
            `).join('') :
            '<p>No hay datos de ejercicios registrados</p>'
          }
        </div>
      </div>
    `;

    historyList.appendChild(li);
  });
}

function toggleHistoryDetails(index) {
  const details = document.getElementById(`history-details-${index}`);
  const toggle = details.previousElementSibling.querySelector('.history-toggle');

  if (details.style.display === 'none') {
    details.style.display = 'block';
    toggle.textContent = '▲';
  } else {
    details.style.display = 'none';
    toggle.textContent = '▼';
  }
}

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
