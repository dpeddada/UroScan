const screens = document.querySelectorAll('.screen');

function showScreen(id) {
  screens.forEach(screen => screen.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById("flowBtn").addEventListener("click", () => showScreen("loadScreen"));
document.getElementById("volumeBtn").addEventListener("click", () => showScreen("volumeScreen"));
document.getElementById("turbBtn").addEventListener("click", () => showScreen("turbidityScreen"));
document.getElementById("specBtn").addEventListener("click", () => showScreen("spectrometerScreen"));

document.querySelectorAll(".back-btn").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.back));
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true
    }
  }
};

const loadChart = new Chart(document.getElementById("loadChart"), {
  type: 'line',
  data: {
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [{
      label: 'Flow Rate',
      data: [9, 12, 11, 15, 14, 18],
      borderWidth: 3,
      tension: 0.3
    }]
  },
  options: chartOptions
});

const volumeChart = new Chart(document.getElementById("volumeChart"), {
  type: 'line',
  data: {
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [{
      label: 'Volume',
      data: [120, 150, 190, 235, 260, 300],
      borderWidth: 3,
      tension: 0.3
    }]
  },
  options: chartOptions
});

const turbidityChart = new Chart(document.getElementById("turbidityChart"), {
  type: 'line',
  data: {
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [{
      label: 'Turbidity',
      data: [22, 24, 30, 35, 42, 48],
      borderWidth: 3,
      tension: 0.3
    }]
  },
  options: chartOptions
});

const spectrometerChart = new Chart(document.getElementById("spectrometerChart"), {
  type: 'line',
  data: {
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [{
      label: 'Color',
      data: [10, 14, 19, 21, 25, 28],
      borderWidth: 3,
      tension: 0.3
    }]
  },
  options: chartOptions
});

function setMetric(id, text) {
  document.getElementById(id).textContent = text;
}

function setAlert(id, text, isAlert) {
  const box = document.getElementById(id);
  box.textContent = text;
  box.classList.toggle('alert', Boolean(isAlert));
}

setMetric('flowMetricValue', '17.0 mL/sec');
setMetric('volumeMetricValue', '300 mL');
setMetric('turbMetricValue', '48 rNTU');
setMetric('colorMetricValue', '28');

setAlert('flowAlertBox', 'Alert - Normal', false);
setAlert('volumeAlertBox', 'Alert - Normal', false);
setAlert('turbAlertBox', 'Alert - Slightly High', true);
setAlert('colorAlertBox', 'Alert - Normal', false);

document.getElementById("connectBtn").addEventListener("click", () => {
  document.getElementById("deviceStatus").textContent = "Device: UroScan BLE";
  document.getElementById("bleStatus").textContent = "Bluetooth: Connected";
});

document.getElementById("demoBtn").addEventListener("click", () => {
  loadChart.data.datasets[0].data = [10, 13, 12, 16, 18, 19];
  volumeChart.data.datasets[0].data = [110, 145, 185, 230, 275, 320];
  turbidityChart.data.datasets[0].data = [18, 23, 31, 40, 47, 55];
  spectrometerChart.data.datasets[0].data = [9, 13, 17, 22, 26, 30];

  loadChart.update();
  volumeChart.update();
  turbidityChart.update();
  spectrometerChart.update();

  setMetric('flowMetricValue', '19.0 mL/sec');
  setMetric('volumeMetricValue', '320 mL');
  setMetric('turbMetricValue', '55 rNTU');
  setMetric('colorMetricValue', '30');

  setAlert('flowAlertBox', 'Alert - Normal', false);
  setAlert('volumeAlertBox', 'Alert - Normal', false);
  setAlert('turbAlertBox', 'Alert - High', true);
  setAlert('colorAlertBox', 'Alert - Normal', false);

  document.getElementById("deviceStatus").textContent = "Device: Demo Mode";
  document.getElementById("bleStatus").textContent = "Bluetooth: Simulated";
});
