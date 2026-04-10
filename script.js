const screens = document.querySelectorAll('.screen');

function showScreen(id){
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById("flowBtn").onclick = () => showScreen("loadScreen");
document.getElementById("volumeBtn").onclick = () => showScreen("volumeScreen");
document.getElementById("turbBtn").onclick = () => showScreen("turbidityScreen");
document.getElementById("specBtn").onclick = () => showScreen("spectrometerScreen");

document.querySelectorAll(".back-btn").forEach(btn=>{
  btn.onclick = ()=> showScreen("homeScreen");
});

new Chart(document.getElementById("loadChart"), {type:'line', data:{labels:[],datasets:[{data:[]}]}});
new Chart(document.getElementById("volumeChart"), {type:'line', data:{labels:[],datasets:[{data:[]}]}});
new Chart(document.getElementById("turbidityChart"), {type:'line', data:{labels:[],datasets:[{data:[]}]}});
new Chart(document.getElementById("spectrometerChart"), {type:'line', data:{labels:[],datasets:[{data:[]}]}});