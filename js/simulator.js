/* ==========================================================================
   Phani Kumari Boda Portfolio — Multi-Project Firmware & Hardware Simulators
   Powers Interactive Simulators for ALL 5 Projects:
   1. Washing Machine FSM & PWM Scope
   2. EV Battery BMS & EKF Thermal Protection Loop
   3. Automotive Temp ADC & PID Hysteresis Fan Controller
   4. Railway Level Crossing IR & Servo Gate Controller
   5. FPGA 8-Tap DSP FIR Filter Frequency Response
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Washing Machine Firmware Simulator
   -------------------------------------------------------------------------- */
class FirmwareSimulator {
  constructor() {
    this.states = {
      IDLE: { name: 'IDLE', pwm: 0, time: 0, text1: 'READY -- PRESS START', text2: 'MODE: STANDARD  [3x4]' },
      WASH: { name: 'WASH', pwm: 40, time: 480, text1: 'WASH        ', text2: 'SPEED: MEDIUM  [40% PWM]' },
      RINSE: { name: 'RINSE', pwm: 30, time: 300, text1: 'RINSE       ', text2: 'SPEED: GENTLE  [30% PWM]' },
      SPIN: { name: 'SPIN', pwm: 85, time: 240, text1: 'SPIN        ', text2: 'SPEED: HIGH    [85% PWM]' },
      DRAIN: { name: 'DRAIN', pwm: 0, time: 120, text1: 'DRAIN       ', text2: 'SPEED: OFF     [00% PWM]' },
      PAUSED: { name: 'PAUSED', pwm: 0, time: 0, text1: 'PAUSED      ', text2: 'START=RESUME STOP=CANCEL' },
      DONE: { name: 'DONE', pwm: 0, time: 5, text1: 'CYCLE COMPLETE!', text2: 'REMOVE LAUNDRY  [BUZZER]' }
    };

    this.currentState = 'IDLE';
    this.savedState = 'WASH';
    this.remainingSeconds = 0;
    this.timerInterval = null;
    this.canvas = null;
    this.ctx = null;
    this.animFrame = null;
    this.phaseAngle = 0;

    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.cacheDOM();
      this.bindEvents();
      this.updateLCDDisplay();
      this.updateFSMIndicators();
      this.initCanvas();
    });
  }

  cacheDOM() {
    this.lcdLine1 = document.getElementById('lcdLine1');
    this.lcdLine2 = document.getElementById('lcdLine2');
    this.pwmText = document.getElementById('pwmDutyText');
    this.statePills = document.querySelectorAll('.fsm-state-pill');
    this.canvas = document.getElementById('pwmScopeCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  bindEvents() {
    const keypad = document.getElementById('keypadGrid');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.key-btn');
        if (!btn) return;
        const key = btn.getAttribute('data-key');
        this.handleKeyPress(key);
      });
    }
  }

  handleKeyPress(key) {
    this.triggerKeyEffect(key);
    switch (key) {
      case 'START':
        if (this.currentState === 'IDLE') this.startCycle('WASH');
        else if (this.currentState === 'PAUSED') this.resumeCycle();
        break;
      case 'STOP':
        if (['WASH', 'RINSE', 'SPIN', 'DRAIN'].includes(this.currentState)) this.pauseCycle();
        else if (this.currentState === 'PAUSED') this.cancelCycle();
        break;
      case 'MODE':
        if (this.currentState === 'IDLE') this.toggleMode();
        break;
      case 'WASH_DIRECT':
        if (this.currentState === 'IDLE') this.startCycle('WASH');
        break;
      case 'RINSE_DIRECT':
        if (this.currentState === 'IDLE') this.startCycle('RINSE');
        break;
      case 'SPIN_DIRECT':
        if (this.currentState === 'IDLE') this.startCycle('SPIN');
        break;
    }
  }

  triggerKeyEffect(key) {
    const btn = document.querySelector(`.key-btn[data-key="${key}"]`);
    if (btn) {
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => { btn.style.transform = ''; }, 120);
    }
  }

  startCycle(initialState = 'WASH') {
    this.currentState = initialState;
    this.remainingSeconds = this.states[initialState].time;
    this.runTimer();
    this.updateLCDDisplay();
    this.updateFSMIndicators();
  }

  pauseCycle() {
    this.savedState = this.currentState;
    this.currentState = 'PAUSED';
    clearInterval(this.timerInterval);
    this.updateLCDDisplay();
    this.updateFSMIndicators();
  }

  resumeCycle() {
    this.currentState = this.savedState;
    this.runTimer();
    this.updateLCDDisplay();
    this.updateFSMIndicators();
  }

  cancelCycle() {
    this.currentState = 'IDLE';
    this.remainingSeconds = 0;
    clearInterval(this.timerInterval);
    this.updateLCDDisplay();
    this.updateFSMIndicators();
  }

  toggleMode() {
    const currentText = this.states.IDLE.text2;
    if (currentText.includes('STANDARD')) {
      this.states.IDLE.text2 = 'MODE: QUICK WASH [3x4]';
      this.states.WASH.time = 240;
    } else {
      this.states.IDLE.text2 = 'MODE: STANDARD  [3x4]';
      this.states.WASH.time = 480;
    }
    this.updateLCDDisplay();
  }

  runTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.updateLCDDisplay();
      } else {
        this.advanceFSMState();
      }
    }, 1000);
  }

  advanceFSMState() {
    const sequence = ['WASH', 'RINSE', 'SPIN', 'DRAIN', 'DONE', 'IDLE'];
    const idx = sequence.indexOf(this.currentState);
    if (idx >= 0 && idx < sequence.length - 1) {
      const nextState = sequence[idx + 1];
      if (nextState === 'IDLE') {
        this.cancelCycle();
      } else {
        this.currentState = nextState;
        this.remainingSeconds = this.states[nextState].time;
        this.updateLCDDisplay();
        this.updateFSMIndicators();
      }
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateLCDDisplay() {
    const stateObj = this.states[this.currentState];
    let line1 = stateObj.text1;
    let line2 = stateObj.text2;

    if (['WASH', 'RINSE', 'SPIN', 'DRAIN'].includes(this.currentState)) {
      line1 = `${stateObj.name.padEnd(8, ' ')} ${this.formatTime(this.remainingSeconds)}`;
    }

    if (this.lcdLine1) this.lcdLine1.innerHTML = `${line1}<span class="lcd-cursor"></span>`;
    if (this.lcdLine2) this.lcdLine2.textContent = line2;
    if (this.pwmText) this.pwmText.textContent = `${stateObj.pwm}%`;
  }

  updateFSMIndicators() {
    this.statePills.forEach(pill => {
      const stateName = pill.getAttribute('data-state');
      pill.className = 'fsm-state-pill';
      if (stateName === this.currentState) {
        if (stateName === 'PAUSED') pill.classList.add('paused');
        else if (stateName === 'DONE') pill.classList.add('done');
        else pill.classList.add('active');
      }
    });
  }

  initCanvas() {
    if (!this.ctx) return;
    const render = () => {
      this.drawPWMWaveform();
      this.animFrame = requestAnimationFrame(render);
    };
    render();
  }

  drawPWMWaveform() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dutyPercent = this.states[this.currentState].pwm;

    ctx.fillStyle = '#080C14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    ctx.strokeStyle = dutyPercent > 50 ? '#F43F5E' : (dutyPercent > 0 ? '#3B82F6' : '#64748B');
    ctx.lineWidth = 2.5;

    const period = 80;
    const onWidth = (period * dutyPercent) / 100;
    this.phaseAngle = (this.phaseAngle + 2) % period;

    ctx.beginPath();
    let currentX = -this.phaseAngle;
    const highY = 25;
    const lowY = height - 25;

    while (currentX < width + period) {
      ctx.moveTo(currentX, dutyPercent > 0 ? highY : lowY);
      ctx.lineTo(currentX + onWidth, dutyPercent > 0 ? highY : lowY);
      ctx.lineTo(currentX + onWidth, lowY);
      ctx.lineTo(currentX + period, lowY);
      if (dutyPercent > 0) ctx.lineTo(currentX + period, highY);
      currentX += period;
    }
    ctx.stroke();
  }
}

/* --------------------------------------------------------------------------
   2. EV Battery BMS & EKF Thermal Loop Simulator
   -------------------------------------------------------------------------- */
class EVBMSSimulator {
  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    const tempSlider = document.getElementById('bmsTempSlider');
    const currSlider = document.getElementById('bmsCurrentSlider');

    if (tempSlider && currSlider) {
      tempSlider.addEventListener('input', () => this.update());
      currSlider.addEventListener('input', () => this.update());
      this.update();
    }
  }

  update() {
    const temp = parseFloat(document.getElementById('bmsTempSlider').value);
    const current = parseFloat(document.getElementById('bmsCurrentSlider').value);

    const tempVal = document.getElementById('bmsTempVal');
    const currVal = document.getElementById('bmsCurrentVal');
    const socVal = document.getElementById('bmsSocVal');
    const ekfVal = document.getElementById('bmsEkfVal');
    const relayBadge = document.getElementById('bmsRelayBadge');
    const canFrame = document.getElementById('bmsCanFrame');

    if (tempVal) tempVal.textContent = `${temp.toFixed(1)} °C`;
    if (currVal) currVal.textContent = `${current.toFixed(1)} A`;

    // SOC Calculation (EKF Correction based on cell temperature drift)
    let soc = Math.max(0, Math.min(100, 85.5 - (current * 0.15)));
    let ekfError = 0.02 + (temp > 45 ? (temp - 45) * 0.005 : 0);

    if (socVal) socVal.textContent = `${soc.toFixed(1)} %`;
    if (ekfVal) ekfVal.textContent = `± ${(ekfError * 100).toFixed(2)} %`;

    // Thermal Relay Protection Stateflow Logic
    if (temp >= 60 || current >= 90) {
      if (relayBadge) {
        relayBadge.className = 'badge red';
        relayBadge.textContent = '🚨 RELAY TRIP: OVER-TEMP CRITICAL';
      }
      if (canFrame) canFrame.textContent = `0x07F | [ERR_THERMAL_RUNAWAY] | RELAY=DISCONNECT`;
    } else if (temp >= 45) {
      if (relayBadge) {
        relayBadge.className = 'badge amber';
        relayBadge.textContent = '⚠️ WARNING: THERMAL DERATING';
      }
      if (canFrame) canFrame.textContent = `0x03E | [WARN_TEMP_HIGH] | LIMIT_CURR=40A`;
    } else {
      if (relayBadge) {
        relayBadge.className = 'badge green';
        relayBadge.textContent = '✅ RELAY CLOSED: NORMAL OPERATION';
      }
      if (canFrame) canFrame.textContent = `0x012 | SOC=${soc.toFixed(1)}% | TEMP=${temp.toFixed(1)}C | V_CELL=3.78V`;
    }
  }
}

/* --------------------------------------------------------------------------
   3. Automotive Engine Temp & PID Fan Controller Simulator
   -------------------------------------------------------------------------- */
class AutomotiveTempSimulator {
  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    const tempInput = document.getElementById('autoTempSlider');
    if (tempInput) {
      tempInput.addEventListener('input', () => this.update());
      this.update();
    }
  }

  update() {
    const temp = parseFloat(document.getElementById('autoTempSlider').value);
    const tempDisplay = document.getElementById('autoTempDisplay');
    const adcDisplay = document.getElementById('autoAdcDisplay');
    const pwmDisplay = document.getElementById('autoPwmDisplay');
    const stateBadge = document.getElementById('autoStateBadge');

    // 12-bit ADC calculation (0-4095 for 0-120°C)
    const adcRaw = Math.round((temp / 120) * 4095);
    
    // PID & Hysteresis Logic
    let pwmDuty = 0;
    let stateText = 'FAN OFF (COOL)';
    let badgeClass = 'badge green';

    if (temp >= 105) {
      pwmDuty = 100;
      stateText = '🚨 CRITICAL OVERHEAT: 100% FAN + ENGINE WARN';
      badgeClass = 'badge red';
    } else if (temp >= 85) {
      // Linear PID region
      pwmDuty = Math.round(30 + ((temp - 85) / 20) * 60);
      stateText = '🔥 HIGH TEMP: PID REGULATION ACTIVE';
      badgeClass = 'badge amber';
    } else if (temp >= 65) {
      pwmDuty = 30;
      stateText = '🌀 WARM TEMP: LOW SPEED FAN (30%)';
      badgeClass = 'badge blue';
    } else {
      pwmDuty = 0;
      stateText = '❄️ NORMAL TEMP: FAN OFF';
      badgeClass = 'badge green';
    }

    if (tempDisplay) tempDisplay.textContent = `${temp.toFixed(1)} °C`;
    if (adcDisplay) adcDisplay.textContent = `0x${adcRaw.toString(16).toUpperCase().padStart(3, '0')} (${adcRaw})`;
    if (pwmDisplay) pwmDisplay.textContent = `${pwmDuty} % PWM`;
    if (stateBadge) {
      stateBadge.className = badgeClass;
      stateBadge.textContent = stateText;
    }
  }
}

/* --------------------------------------------------------------------------
   4. Railway Gate IR & Servo Controller Simulator
   -------------------------------------------------------------------------- */
class RailwayGateSimulator {
  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    const triggerBtn = document.getElementById('railTriggerBtn');
    const clearBtn = document.getElementById('railClearBtn');

    if (triggerBtn && clearBtn) {
      triggerBtn.addEventListener('click', () => this.simulateTrainApproach());
      clearBtn.addEventListener('click', () => this.simulateTrainPass());
    }
  }

  simulateTrainApproach() {
    const irA = document.getElementById('railIrA');
    const irB = document.getElementById('railIrB');
    const servoAngle = document.getElementById('railServoAngle');
    const statusText = document.getElementById('railStatusText');
    const gateVisual = document.getElementById('railGateVisual');

    if (irA) irA.textContent = 'DETECTED (0V)';
    if (irB) irB.textContent = 'ARMED';
    if (servoAngle) servoAngle.textContent = '90° (CLOSED)';
    if (statusText) {
      statusText.className = 'badge red';
      statusText.textContent = '🚨 TRAIN APPROACHING — GATE DOWN — SIREN ON';
    }
    if (gateVisual) gateVisual.style.transform = 'rotate(0deg)'; // horizontal closed
  }

  simulateTrainPass() {
    const irA = document.getElementById('railIrA');
    const irB = document.getElementById('railIrB');
    const servoAngle = document.getElementById('railServoAngle');
    const statusText = document.getElementById('railStatusText');
    const gateVisual = document.getElementById('railGateVisual');

    if (irA) irA.textContent = 'CLEAR (5V)';
    if (irB) irB.textContent = 'PASSED (0V)';
    if (servoAngle) servoAngle.textContent = '0° (OPEN)';
    if (statusText) {
      statusText.className = 'badge green';
      statusText.textContent = '✅ TRACK CLEAR — GATE UP — SAFE';
    }
    if (gateVisual) gateVisual.style.transform = 'rotate(-75deg)'; // vertical open
  }
}

/* --------------------------------------------------------------------------
   5. FPGA 8-Tap DSP FIR Filter Simulator
   -------------------------------------------------------------------------- */
class FPGAFilterSimulator {
  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    this.canvas = document.getElementById('firCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.drawFrequencyResponse(25); // Default 25MHz cutoff
    }

    const slider = document.getElementById('firCutoffSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const cutoff = parseFloat(e.target.value);
        const text = document.getElementById('firCutoffText');
        if (text) text.textContent = `${cutoff} MHz`;
        this.drawFrequencyResponse(cutoff);
      });
    }
  }

  drawFrequencyResponse(cutoff) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#0D1117';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#21262D';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Filter Response Curve
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const cutoffX = (cutoff / 50) * w; // 50MHz Nyquist

    ctx.moveTo(0, 20); // 0dB
    ctx.lineTo(cutoffX * 0.8, 20);
    ctx.quadraticCurveTo(cutoffX, 20, cutoffX * 1.2, h - 20); // Roll-off
    ctx.lineTo(w, h - 15); // Stopband attenuation (-40dB)
    ctx.stroke();

    // Cutoff Marker Line
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cutoffX, 0);
    ctx.lineTo(cutoffX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '11px JetBrains Mono';
    ctx.fillText(`Fc = ${cutoff}MHz (-3dB)`, cutoffX + 6, 35);
  }
}

// Global Instances
window.simulator = new FirmwareSimulator();
window.evBmsSim = new EVBMSSimulator();
window.autoTempSim = new AutomotiveTempSimulator();
window.railSim = new RailwayGateSimulator();
window.fpgaSim = new FPGAFilterSimulator();
