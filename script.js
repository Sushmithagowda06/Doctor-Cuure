/* ===============================
   CONFIG
================================ */
const API_BASE = "https://doctor-cuure-backend.onrender.com";

/* ===============================
   ELEMENT REFERENCES
================================ */
const bookingForm = document.getElementById("bookingForm");
const doctorSelect = document.getElementById("doctor");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const statusMsg = document.getElementById("status-msg");

/* ===============================
   FORM VALIDATION
================================ */
function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll("input, select, textarea");

  inputs.forEach(input => {
    input.classList.remove("error");

    if (input.hasAttribute("required") && !input.value.trim()) {
      input.classList.add("error");
      isValid = false;
    }

    if (
      input.id === "phone" &&
      input.value.trim() &&
      !/^[0-9]{10}$/.test(input.value)
    ) {
      input.classList.add("error");
      isValid = false;
    }

    if (input.id === "date" && input.value) {
      const selectedDate = new Date(input.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        input.classList.add("error");
        isValid = false;
      }
    }
  });

  return isValid;
}

/* ===============================
   TIME HELPERS
================================ */

// "08:00 AM" → "08:00"
function convertTo24Hour(timeStr) {
  if (!timeStr) return "";
  const [time, meridian] = timeStr.split(" ");
  let [hour, minute] = time.split(":").map(Number);

  if (meridian === "PM" && hour !== 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

// "08:00" → "08:00 AM"
function toAmPmLabel(time24) {
  const [hh, mm] = time24.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")} ${ampm}`;
}

/* ===============================
   SLOT LOADING (DOCTOR + DATE)
================================ */
dateInput.addEventListener("change", async () => {
  const doctor = doctorSelect.value;
  const date = dateInput.value;

  if (!doctor || !date) {
    timeSelect.innerHTML =
      '<option value="">Select doctor & date first</option>';
    return;
  }

  timeSelect.innerHTML = '<option value="">Loading slots...</option>';

  try {
    const res = await fetch(
      `${API_BASE}/available-slots?date=${date}&doctor=${doctor}`
    );

    if (!res.ok) throw new Error("Failed to fetch slots");

    const data = await res.json();

    timeSelect.innerHTML = '<option value="">Select a time</option>';

    if (!data.slots || data.slots.length === 0) {
      timeSelect.innerHTML =
        '<option value="">No slots available</option>';
      return;
    }

    data.slots.forEach(slot => {
      const option = document.createElement("option");
      option.value = slot;
      option.textContent = toAmPmLabel(slot);
      timeSelect.appendChild(option);
    });

  } catch (err) {
    console.error("Slot fetch error:", err);
    timeSelect.innerHTML =
      '<option value="">Server error</option>';
  }
});

/* ===============================
   RESET SLOTS WHEN DOCTOR CHANGES
================================ */
doctorSelect.addEventListener("change", () => {
  timeSelect.innerHTML =
    '<option value="">Select date first</option>';
});

/* ===============================
   FORM SUBMISSION
================================ */
bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateForm(bookingForm)) {
    statusMsg.textContent =
      "❌ Please correct the highlighted fields.";
    statusMsg.style.color = "#dc3545";
    return;
  }

  const formData = new FormData(bookingForm);
  const data = Object.fromEntries(formData);

  const payload = {
    name: data.name,
    phone: data.phone,
    address: data.address,
    doctor: data.doctor,
    service: data.service,
    date: data.date,
    time: convertTo24Hour(data.time),
    notes: data.notes || ""
  };

  statusMsg.textContent = "Booking your appointment...";
  statusMsg.style.color = "#0fa3d4";

  try {
    const res = await fetch(`${API_BASE}/create-appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status === "success") {
      statusMsg.textContent =
        "✅ Appointment booked successfully!";
      statusMsg.style.color = "#198754";
      alert("Appointment booked successfully!");
      bookingForm.reset();
      timeSelect.innerHTML =
        '<option value="">Select a time</option>';
    } else {
      statusMsg.textContent =
        "❌ " + (result.error || "Slot not available.");
      statusMsg.style.color = "#dc3545";
    }

  } catch (err) {
    console.error("Booking error:", err);
    statusMsg.textContent =
      "❌ Could not connect to booking server.";
    statusMsg.style.color = "#dc3545";
  }
});

/* ===============================
   SCROLL TO TOP
================================ */
(function () {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 300);
  });

  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
})();
