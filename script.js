const components = [
  "Processor",
  "Graphics Chip",
  "RAM",
  "Storage",
  "Display",
  "Battery",
  "Camera",
  "Speaker",
  "Microphone",
  "Antenna",
  "Charging Port",
  "Motherboard",
  "Vibration Motor",
  "SIM Module",
  "Wi‑Fi Module",
  "Bluetooth Module",
  "GPS Module",
  "Proximity Sensor",
  "Light Sensor",
  "Gyroscope",
  "Accelerometer",
  "Cover",
  "Buttons"
]

function renderComponents() {
  const container = document.getElementById("components")
  components.forEach(name => {
    const row = document.createElement("label")
    row.className = "component"
    const cb = document.createElement("input")
    cb.type = "checkbox"
    cb.value = name
    const span = document.createElement("span")
    span.textContent = name
    row.appendChild(cb)
    row.appendChild(span)
    container.appendChild(row)
  })
}

function getSelectedComponents() {
  const inputs = document.querySelectorAll("#components input[type=checkbox]:checked")
  return Array.from(inputs).map(i => i.value)
}

function formatCurrency(value) {
  const n = Number(value)
  if (!isFinite(n)) return ""
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n)
}

function showSummary({ components, price, company, error }) {
  const box = document.getElementById("summary")
  box.innerHTML = ""
  if (error) {
    const p = document.createElement("div")
    p.className = "error"
    p.textContent = error
    box.appendChild(p)
    return
  }
  const line1 = document.createElement("div")
  line1.className = "summary-item"
  line1.innerHTML = `<span class="pill">Company</span><span>${company}</span>`
  const line2 = document.createElement("div")
  line2.className = "summary-item"
  line2.innerHTML = `<span class="pill">Price</span><span>${formatCurrency(price)}</span>`
  const line3 = document.createElement("div")
  line3.className = "summary-item"
  line3.innerHTML = `<span class="pill">Components</span><span>${components.length ? components.join(", ") : "None"}</span>`
  const line4 = document.createElement("div")
  line4.className = "success"
  line4.textContent = "Sale recorded"
  box.appendChild(line1)
  box.appendChild(line2)
  box.appendChild(line3)
  box.appendChild(line4)
}

function requiredForPower() {
  return ["Processor", "RAM", "Storage", "Display", "Battery", "Motherboard"]
}

function handlePowerOn() {
  const selected = getSelectedComponents()
  const need = requiredForPower()
  const missing = need.filter(n => !selected.includes(n))
  const box = document.getElementById("powerStatus")
  box.innerHTML = ""
  if (missing.length) {
    const line = document.createElement("div")
    line.className = "error"
    line.textContent = `Cannot power on: missing ${missing.join(", ")}`
    box.appendChild(line)
    return
  }
  const ok = document.createElement("div")
  ok.className = "success"
  ok.textContent = "Phone powered on"
  box.appendChild(ok)
}

function handleSell() {
  const price = document.getElementById("price").value
  const company = document.getElementById("company").value
  const selected = getSelectedComponents()
  if (!company) {
    showSummary({ error: "Select a company" })
    return
  }
  if (price === "" || Number(price) < 0) {
    showSummary({ error: "Enter a valid price" })
    return
  }
  showSummary({ components: selected, price, company })
}

function init() {
  renderComponents()
  document.getElementById("sell").addEventListener("click", handleSell)
  document.getElementById("power").addEventListener("click", handlePowerOn)
}

document.addEventListener("DOMContentLoaded", init)
