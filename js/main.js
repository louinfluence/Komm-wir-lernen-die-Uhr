const sideMenu=document.getElementById("sideMenu");
const menuToggle=document.getElementById("menuToggle");
const closeMenu=document.getElementById("closeMenu");
const modeToggle=document.getElementById("modeToggle");
const body=document.body;
const slider=document.getElementById("timeSlider");

const modeSwitch=document.getElementById("modeSwitch");
const displaySwitch=document.getElementById("displaySwitch");
const themeSwitch=document.getElementById("themeSwitch");

let liveMode=false;
let displayMode="24h";
let liveInterval=null;

/* Menü öffnen/schließen */
menuToggle.addEventListener("click",()=>sideMenu.classList.toggle("visible"));
closeMenu.addEventListener("click",()=>sideMenu.classList.remove("visible"));

/* Theme */
themeSwitch.addEventListener("change",()=>{
  body.classList.toggle("dark",themeSwitch.checked);
});

/* Echtzeit vs Lernmodus */
modeSwitch.addEventListener("change",()=>{
  liveMode=modeSwitch.checked;
  if(liveMode) startLiveClock(); else clearInterval(liveInterval);
});

/* 12h / 24h */
displaySwitch.addEventListener("change",()=>{
  displayMode=displaySwitch.checked?"24h":"12h";
  toggleClockFace(displayMode);
  if(liveMode){ startLiveClock(); }
});

/* Zeitanzeige über Slider */
slider.addEventListener("input",()=>{
  if(!liveMode){
    const t=parseInt(slider.value);
    const h=Math.floor(t/60);
    const m=t%60;
    setTime(h,m);
  }
});

/* Uhr wechseln */
function toggleClockFace(mode){
  const z12=document.getElementById("ziffernblatt_12h");
  const z24=document.getElementById("ziffernblatt_24h");
  if(mode==="24h"){ z12.classList.add("hidden"); z24.classList.remove("hidden"); }
  else { z24.classList.add("hidden"); z12.classList.remove("hidden"); }
}

/* Echtzeitmodus */
function startLiveClock(){
  clearInterval(liveInterval);
  function update(){
    const now=new Date();
    setTime(now.getHours(),now.getMinutes());
  }
  update();
  liveInterval=setInterval(update,10000);
}

/* Initial */
document.addEventListener("DOMContentLoaded",()=>{
  setTime(3,0);
});
