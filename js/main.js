// --------------------
// MAIN GAME LOGIC
// --------------------
import { rotateHour, rotateMinute, setTime } from "./clock.js";

window.rotateHour = rotateHour;
window.rotateMinute = rotateMinute;
window.setTime = setTime;

// Beispiel-Testaufruf:
setTime(3, 45); // zeigt 3:45

