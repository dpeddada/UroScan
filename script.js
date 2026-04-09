const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bleDevice = null;
let bleServer = null;
let txCharacteristic = null;
let rxCharacteristic = null;

const MAX_POINTS = 20;

const ALERT_THRESHOLDS = {
  turbidityHigh: 150,
  weightHigh: 500,
  weightLow: 0,
  spectrometerHigh: 70
};

let activeAlerts = [];
let lastWeight = null;
let lastVolume = null;
let lastTurbidity = null;

const deviceStatus = document.getElementById("deviceStatus");
const bleStatus = document.getElementById("bleStatus");
const connectBtn = document.getElementById("connectBtn");
const demoBtn = document.getElementById("demoBtn");
const screens = document.querySelectorAll(".screen");
const alertsList = document.getElementById("alertsList");

function showScreen(screenId) {
  screens.forEach((screen) => screen.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const flowBtn = document.getElementById("flowBtn");
const volumeBtn = document.getElementById("volumeBtn");
const specBtn = document.getElementById("specBtn");
const turbBtn = document.getElementById("turbBtn");

if (flowBtn) {
  flowBtn.addEventListener("click", () => showScreen("loadScreen"));
}

if (volumeBtn) {
  volumeBtn.addEventListener("click", () => showScreen("loadScreen"));
}

if (specBtn) {
  specBtn.addEventListener("click", () => showScreen("spectrometerScreen"));
}

if (turbBtn) {
  turbBtn.addEventListener("click", () => showScreen("turbidityScreen"));
}

document.querySelectorAll(".back-btn").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(btn.dataset.back));
});

function updateConnectionUI(connected, name = "Not Connected") {
  deviceStatus.textContent = connected ? `Device: ${name}` : "Device: Not Connected";
  bleStatus.textContent = connected ? "Bluetooth: Connected" : "Bluetooth: Disconnected";
}

function appendLog(id, msg) {
  const box = document.getElementById(id);
  if (!box) return;
  const time = new Date().toLocaleTimeString();
  box.textContent += `\n[${time}] ${msg}`;
  box.scrollTop = box.scrollHeight;
}

function logAll(msg) {
  appendLog("loadLog", msg);
  appendLog("turbLog", msg);
  appendLog("specLog", msg);
}

function addAlert(message) {
  if (!activeAlerts.includes(message)) {
    activeAlerts.push(message);
    renderAlerts();
  }
}

function removeAlert(message) {
  activeAlerts = activeAlerts.filter((alert) => alert !== message);
  renderAlerts();
}

function renderAlerts() {
  alertsList.innerHTML = activeAlerts.length
    ? activeAlerts.map((alert) => `• ${alert}`).join("<br>")
    : "No active alerts.";
}

function addChartPoint(chart, values) {
  const time = new Date().toLocaleTimeString();

  chart.data.labels.push(time);
  chart.data.datasets.forEach((dataset, index) => {
    dataset.data.push(values[index]);
  });

  if (chart.data.labels.length > MAX_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets.forEach((dataset) => dataset.data.shift());
  }

  chart.update();
}

const loadChart = new Chart(document.getElementById("loadChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Weight (g)",
        data: [],
        borderWidth: 2,
        tension: 0.3
      },
      {
        label: "Volume (mL)",
        data: [],
        borderWidth: 2,
        tension: 0.3
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

const turbidityChart = new Chart(document.getElementById("turbidityChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Turbidity (rNTU)",
        data: [],
        borderWidth: 2,
        tension: 0.3
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

const spectrometerChart = new Chart(document.getElementById("spectrometerChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Spectrometer Value",
        data: [],
        borderWidth: 2,
        tension: 0.3
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

async function connectBLE() {
  try {
    if (!navigator.bluetooth) {
      alert("Use Chrome or Edge for Web Bluetooth.");
      return;
    }

    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ name: "UroScale" }],
      optionalServices: [UART_SERVICE_UUID]
    });

    bleDevice.addEventListener("gattserverdisconnected", () => {
      updateConnectionUI(false);
      logAll("Disconnected.");
      document.getElementById("specStatus").textContent = "Disconnected";
      addAlert("BLE Disconnected");
    });

    bleServer = await bleDevice.gatt.connect();
    const service = await bleServer.getPrimaryService(UART_SERVICE_UUID);

    txCharacteristic = await service.getCharacteristic(UART_TX_CHAR_UUID);
    rxCharacteristic = await service.getCharacteristic(UART_RX_CHAR_UUID);

    await txCharacteristic.startNotifications();
    txCharacteristic.addEventListener("characteristicvaluechanged", handleNotifications);

    updateConnectionUI(true, bleDevice.name || "UroScale");
    logAll("Connected.");
    document.getElementById("specStatus").textContent = "Connected";
    removeAlert("BLE Disconnected");
    removeAlert("BLE Connection Failed");
  } catch (err) {
    console.error(err);
    updateConnectionUI(false);
    logAll("Connection failed.");
    document.getElementById("specStatus").textContent = "Connection Failed";
    addAlert("BLE Connection Failed");
  }
}

function handleNotifications(event) {
  const text = new TextDecoder().decode(event.target.value).trim();
  logAll(text);

  let weightUpdated = false;
  let turbidityUpdated = false;

  const weightMatch = text.match(/Weight_g=([0-9.+-]+)/i);
  if (weightMatch) {
    lastWeight = parseFloat(weightMatch[1]);
    document.getElementById("weightValue").textContent = `${lastWeight.toFixed(2)} g`;
    weightUpdated = true;

    if (lastWeight > ALERT_THRESHOLDS.weightHigh) addAlert("Weight above normal threshold");
    else removeAlert("Weight above normal threshold");

    if (lastWeight < ALERT_THRESHOLDS.weightLow) addAlert("Weight below normal threshold");
    else removeAlert("Weight below normal threshold");
  }

  const volumeMatch = text.match(/Volume_mL=([0-9.+-]+)/i);
  if (volumeMatch) {
    lastVolume = parseFloat(volumeMatch[1]);
    document.getElementById("volumeValue").textContent = `${lastVolume.toFixed(2)} mL`;
  }

  const beamMatch = text.match(/Beam_ADC=([0-9.+-]+)/i);
  if (beamMatch) {
    document.getElementById("beamValue").textContent = beamMatch[1];
  }

  if (/MOTION_DETECTED/i.test(text)) {
    document.getElementById("motionValue").textContent = "Motion Detected";
    addAlert("Motion detected");
  } else if (/NO_MOTION/i.test(text)) {
    document.getElementById("motionValue").textContent = "No Motion";
    removeAlert("Motion detected");
  }

  const rntuMatch = text.match(/rNTU=([0-9.+-]+)/i);
  if (rntuMatch) {
    lastTurbidity = parseFloat(rntuMatch[1]);
    document.getElementById("turbidityValue").textContent = `${lastTurbidity.toFixed(1)} rNTU`;
    turbidityUpdated = true;

    if (lastTurbidity > ALERT_THRESHOLDS.turbidityHigh) addAlert("Turbidity above threshold");
    else removeAlert("Turbidity above threshold");
  }

  const byteMatch = text.match(/Turb(?:idity)?\s*byte=([0-9.+-]+)/i);
  if (byteMatch) {
    document.getElementById("byteValue").textContent = byteMatch[1];
  }

  const bdlMatch = text.match(/BDL=([A-Z]+)/i);
  if (bdlMatch) {
    document.getElementById("bdlValue").textContent = bdlMatch[1];
  }

  const satMatch = text.match(/SAT=([A-Z]+)/i);
  if (satMatch) {
    document.getElementById("satValue").textContent = satMatch[1];
  }

  const specMatch = text.match(/SPEC=([0-9.+-]+)/i);
  if (specMatch) {
    const specNumber = parseFloat(specMatch[1]);
    document.getElementById("specValue").textContent = specNumber.toFixed(2);
    document.getElementById("specSubvalue").textContent = "Live BLE data";
    document.getElementById("specStatus").textContent = "Receiving Data";
    addChartPoint(spectrometerChart, [specNumber]);

    if (specNumber > ALERT_THRESHOLDS.spectrometerHigh) addAlert("Spectrometer value above threshold");
    else removeAlert("Spectrometer value above threshold");
  }

  if (weightUpdated && lastWeight !== null && lastVolume !== null) {
    addChartPoint(loadChart, [lastWeight, lastVolume]);
  }

  if (turbidityUpdated && lastTurbidity !== null) {
    addChartPoint(turbidityChart, [lastTurbidity]);
  }
}

async function sendCommand(command) {
  if (!rxCharacteristic) {
    logAll("Not connected.");
    addAlert("BLE Disconnected");
    return;
  }

  try {
    const data = new TextEncoder().encode(command + "\n");
    await rxCharacteristic.writeValue(data);
    logAll("Sent: " + command);
  } catch (err) {
    console.error(err);
    logAll("Send failed: " + command);
  }
}

connectBtn.addEventListener("click", connectBLE);

demoBtn.addEventListener("click", () => {
  updateConnectionUI(true, "Demo Mode");

  const demoWeight = 21.3;
  const demoVolume = 21.3;
  const demoTurbidity = 132.5;
  const demoSpec = 58.0;

  document.getElementById("weightValue").textContent = `${demoWeight.toFixed(2)} g`;
  document.getElementById("volumeValue").textContent = `${demoVolume.toFixed(2)} mL`;
  document.getElementById("motionValue").textContent = "No Motion";
  document.getElementById("beamValue").textContent = "2140";

  document.getElementById("turbidityValue").textContent = `${demoTurbidity.toFixed(1)} rNTU`;
  document.getElementById("byteValue").textContent = "87";
  document.getElementById("bdlValue").textContent = "NO";
  document.getElementById("satValue").textContent = "NO";

  document.getElementById("specValue").textContent = demoSpec.toFixed(2);
  document.getElementById("specSubvalue").textContent = "Demo spectrometer value";
  document.getElementById("specStatus").textContent = "Demo";

  addChartPoint(loadChart, [demoWeight, demoVolume]);
  addChartPoint(turbidityChart, [demoTurbidity]);
  addChartPoint(spectrometerChart, [demoSpec]);

  logAll("Demo mode enabled.");
});

document.getElementById("helpBtn").addEventListener("click", () => {
  document.getElementById("helpBox").classList.toggle("show");
  document.getElementById("faqBox").classList.remove("show");
  document.getElementById("alertsBox").classList.remove("show");
  document.getElementById("patientBox").classList.remove("show");
});

document.getElementById("faqBtn").addEventListener("click", () => {
  document.getElementById("faqBox").classList.toggle("show");
  document.getElementById("helpBox").classList.remove("show");
  document.getElementById("alertsBox").classList.remove("show");
  document.getElementById("patientBox").classList.remove("show");
});

document.getElementById("alertsHomeBtn").addEventListener("click", () => {
  document.getElementById("alertsBox").classList.toggle("show");
  document.getElementById("helpBox").classList.remove("show");
  document.getElementById("faqBox").classList.remove("show");
  document.getElementById("patientBox").classList.remove("show");
});

document.getElementById("patientBtn").addEventListener("click", () => {
  document.getElementById("patientBox").classList.toggle("show");
  document.getElementById("helpBox").classList.remove("show");
  document.getElementById("faqBox").classList.remove("show");
  document.getElementById("alertsBox").classList.remove("show");
});

document.getElementById("tareBtn").addEventListener("click", () => sendCommand("tare"));
document.getElementById("rawBtn").addEventListener("click", () => sendCommand("raw"));
document.getElementById("beamBtn").addEventListener("click", () => sendCommand("beam"));

document.getElementById("readTurbBtn").addEventListener("click", () => sendCommand("turb"));
document.getElementById("labelABtn").addEventListener("click", () => sendCommand("A"));
document.getElementById("labelBBtn").addEventListener("click", () => sendCommand("B"));

document.getElementById("requestSpecBtn").addEventListener("click", () => {
  sendCommand("spec");
  document.getElementById("specStatus").textContent = "Waiting for Data";
});

renderAlerts();
