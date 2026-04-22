// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "habits";

// ─── DOM References ───────────────────────────────────────────────────────────

const addForm    = document.getElementById("addForm");
const habitInput = document.getElementById("habitInput");
const habitList  = document.getElementById("habitList");
const emptyState = document.getElementById("emptyState");
const summary    = document.getElementById("summary");
const inputError = document.getElementById("inputError");

// ─── Data Layer ───────────────────────────────────────────────────────────────

/**
 * Reads the habits array from localStorage.
 * The try/catch protects against corrupt data — if JSON.parse throws,
 * we return an empty array rather than crashing the whole app.
 */
function loadHabits() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    // Corrupt data in localStorage — start fresh
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Writes the habits array to localStorage.
 * JSON.stringify converts the array to a string because localStorage
 * can only store strings, not objects.
 */
function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

/**
 * Shows an error message below the input and shakes the field.
 * The shake class is removed after the animation ends so it can be re-triggered.
 */
function showInputError(message) {
  inputError.textContent = message;
  inputError.classList.remove("hidden");

  habitInput.classList.add("shake");
  habitInput.addEventListener(
    "animationend",
    () => habitInput.classList.remove("shake"),
    { once: true } // auto-removes the listener after it fires once
  );
}

/** Clears any visible input error. */
function clearInputError() {
  inputError.textContent = "";
  inputError.classList.add("hidden");
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * Clears and redraws the entire habit list from localStorage.
 * Also updates the summary count and toggles the empty state.
 */
function renderHabits() {
  const habits = loadHabits();
  habitList.innerHTML = "";

  if (habits.length === 0) {
    emptyState.classList.remove("hidden");
    summary.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  const completedCount = habits.filter(h => h.completed).length;
  summary.textContent = `${completedCount} of ${habits.length} completed`;
  summary.classList.remove("hidden");

  habits.forEach(habit => {
    habitList.appendChild(createHabitElement(habit));
  });
}

/**
 * Builds and returns a single <li> element for one habit object.
 */
function createHabitElement(habit) {
  const li = document.createElement("li");
  li.classList.add("habit-item");
  if (habit.completed) li.classList.add("completed");
  li.dataset.id = habit.id;

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("habit-checkbox");
  checkbox.checked = habit.completed;
  checkbox.setAttribute("aria-label", `Mark "${habit.name}" as complete`);
  checkbox.addEventListener("change", () => toggleHabit(habit.id));

  // Habit name
  const nameSpan = document.createElement("span");
  nameSpan.classList.add("habit-name");
  nameSpan.textContent = habit.name;

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", `Delete "${habit.name}"`);
  deleteBtn.addEventListener("click", () => deleteHabit(habit.id));

  li.appendChild(checkbox);
  li.appendChild(nameSpan);
  li.appendChild(deleteBtn);

  return li;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Validates, then adds a new habit.
 * Rejects blank names and case-insensitive duplicates.
 * Uses unshift() so new habits appear at the top of the list.
 */
function addHabit(name) {
  const trimmed = name.trim();

  if (!trimmed) {
    showInputError("Please enter a habit name.");
    return false; // signal failure so the caller can keep focus on the input
  }

  const habits = loadHabits();

  // Prevent duplicates (case-insensitive comparison)
  const isDuplicate = habits.some(
    h => h.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    showInputError("That habit already exists.");
    return false;
  }

  const newHabit = {
    id: Date.now(), // unique millisecond timestamp used as an ID
    name: trimmed,
    completed: false,
  };

  habits.unshift(newHabit); // newest habits go to the top
  saveHabits(habits);
  renderHabits();
  return true; // signal success
}

/**
 * Flips the completed status of the habit with the matching id.
 */
function toggleHabit(id) {
  const habits = loadHabits();
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  habit.completed = !habit.completed;
  saveHabits(habits);
  renderHabits();
}

/**
 * Removes the habit with the matching id.
 * Array.filter() creates a new array without the deleted item.
 */
function deleteHabit(id) {
  const habits = loadHabits().filter(h => h.id !== id);
  saveHabits(habits);
  renderHabits();
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

addForm.addEventListener("submit", (event) => {
  event.preventDefault(); // prevent the browser's default page-reload behavior

  const success = addHabit(habitInput.value);

  if (success) {
    clearInputError();
    habitInput.value = "";
  }

  habitInput.focus();
});

// Clear the error as soon as the user starts correcting their input
habitInput.addEventListener("input", clearInputError);

// ─── Init ─────────────────────────────────────────────────────────────────────

renderHabits();
