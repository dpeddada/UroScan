let device, characteristic;
let loadChart, turbidityChart;

window.onload = () => {
  loadChart = new Chart(document.getElementById('loadChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Load', data: [] }] }
  });

  turbidityChart = new Chart(document.getElementById('turbidityChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Turbidity', data: [] }] }
  });
};

function showSection(id) {
  document.getElementById('load').style.display = 'none';
  document.getElementById('turbidity').style.display = 'none';
  document.getElementById(id).style.display = 'block';
}

async function connectBLE() {
  device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ['battery_service']
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('battery_service');
  characteristic = await service.getCharacteristic('battery_level');

  await characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', handleData);
}

function handleData(event) {
  const value = event.target.value.getUint8(0);
  const time = new Date().toLocaleTimeString();

  loadChart.data.labels.push(time);
  loadChart.data.datasets[0].data.push(value);
  loadChart.update();

  turbidityChart.data.labels.push(time);
  turbidityChart.data.datasets[0].data.push(Math.random()*100);
  turbidityChart.update();

  if (value > 80) {
    document.getElementById('alert').innerText = "ALERT: High Load!";
  } else {
    document.getElementById('alert').innerText = "";
  }
}
