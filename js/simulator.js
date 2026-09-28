/* ==========================================================================
   Phani Kumari Boda Portfolio — Multi-Project Firmware & Hardware Simulators
   Powers Dedicated Live Interactive Simulators for ALL 5 Projects:
   1. Washing Machine FSM & PWM Scope
   2. EV Battery BMS & EKF Thermal Protection Loop
   3. Automotive Temp ADC & PID Hysteresis Fan Controller
   4. Railway Level Crossing IR & Servo Gate Controller
   5. Ibex RISC-V SoC Demo System & CPU Pipeline Telemetry
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
      this.updateLCDDisplay();
      this.initCanvas();
    });
  }

  cacheDOM() {
    this.lcdLine1 = document.getElementById('lcdLine1_p1');
    this.lcdLine2 = document.getElementById('lcdLine2_p1');
    this.canvas = document.getElementById('pwmScopeCanvas_p1');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  handleKeyPress(key) {
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

  startCycle(initialState = 'WASH') {
    this.currentState = initialState;
    this.remainingSeconds = this.states[initialState].time;
    this.runTimer();
    this.updateLCDDisplay();
  }

  pauseCycle() {
    this.savedState = this.currentState;
    this.currentState = 'PAUSED';
    clearInterval(this.timerInterval);
    this.updateLCDDisplay();
  }

  resumeCycle() {
    this.currentState = this.savedState;
    this.runTimer();
    this.updateLCDDisplay();
  }

  cancelCycle() {
    this.currentState = 'IDLE';
    this.remainingSeconds = 0;
    clearInterval(this.timerInterval);
    this.updateLCDDisplay();
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
    if (this.canvas.clientWidth && this.canvas.width !== this.canvas.clientWidth) {
      this.canvas.width = this.canvas.clientWidth;
    }
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

    ctx.strokeStyle = dutyPercent > 50 ? '#EF4444' : (dutyPercent > 0 ? '#10B981' : '#64748B');
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
    const tempSlider = document.getElementById('bmsTempSlider_p2');
    const currSlider = document.getElementById('bmsCurrentSlider_p2');

    if (tempSlider && currSlider) {
      tempSlider.addEventListener('input', () => this.update());
      currSlider.addEventListener('input', () => this.update());
      this.update();
    }
  }

  update() {
    const temp = parseFloat(document.getElementById('bmsTempSlider_p2').value);
    const current = parseFloat(document.getElementById('bmsCurrentSlider_p2').value);

    const tempVal = document.getElementById('bmsTempVal_p2');
    const currVal = document.getElementById('bmsCurrentVal_p2');
    const socVal = document.getElementById('bmsSocVal_p2');
    const ekfVal = document.getElementById('bmsEkfVal_p2');
    const relayBadge = document.getElementById('bmsRelayBadge_p2');
    const canFrame = document.getElementById('bmsCanFrame_p2');

    if (tempVal) tempVal.textContent = `${temp.toFixed(1)} °C`;
    if (currVal) currVal.textContent = `${current.toFixed(1)} A`;

    let soc = Math.max(0, Math.min(100, 85.5 - (current * 0.15)));
    let ekfError = 0.02 + (temp > 45 ? (temp - 45) * 0.005 : 0);

    if (socVal) socVal.textContent = `${soc.toFixed(1)} %`;
    if (ekfVal) ekfVal.textContent = `± ${(ekfError * 100).toFixed(2)} %`;

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
    const tempInput = document.getElementById('autoTempSlider_p3');
    if (tempInput) {
      tempInput.addEventListener('input', () => this.update());
      this.update();
    }
  }

  update() {
    const temp = parseFloat(document.getElementById('autoTempSlider_p3').value);
    const tempDisplay = document.getElementById('autoTempDisplay_p3');
    const adcDisplay = document.getElementById('autoAdcDisplay_p3');
    const pwmDisplay = document.getElementById('autoPwmDisplay_p3');
    const stateBadge = document.getElementById('autoStateBadge_p3');

    const adcRaw = Math.round((temp / 120) * 4095);
    
    let pwmDuty = 0;
    let stateText = 'FAN OFF (COOL)';
    let badgeClass = 'badge green';

    if (temp >= 105) {
      pwmDuty = 100;
      stateText = '🚨 CRITICAL OVERHEAT: 100% FAN + ENGINE WARN';
      badgeClass = 'badge red';
    } else if (temp >= 85) {
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
    const triggerBtn = document.getElementById('railTriggerBtn_p4');
    const clearBtn = document.getElementById('railClearBtn_p4');

    if (triggerBtn && clearBtn) {
      triggerBtn.addEventListener('click', () => this.simulateTrainApproach());
      clearBtn.addEventListener('click', () => this.simulateTrainPass());
    }
  }

  simulateTrainApproach() {
    const irA = document.getElementById('railIrA_p4');
    const irB = document.getElementById('railIrB_p4');
    const servoAngle = document.getElementById('railServoAngle_p4');
    const statusText = document.getElementById('railStatusText_p4');

    if (irA) irA.textContent = 'DETECTED (0V)';
    if (irB) irB.textContent = 'ARMED';
    if (servoAngle) servoAngle.textContent = '90° (CLOSED)';
    if (statusText) {
      statusText.className = 'badge red';
      statusText.textContent = '🚨 TRAIN APPROACHING — GATE DOWN — SIREN ON';
    }
  }

  simulateTrainPass() {
    const irA = document.getElementById('railIrA_p4');
    const irB = document.getElementById('railIrB_p4');
    const servoAngle = document.getElementById('railServoAngle_p4');
    const statusText = document.getElementById('railStatusText_p4');

    if (irA) irA.textContent = 'CLEAR (5V)';
    if (irB) irB.textContent = 'PASSED (0V)';
    if (servoAngle) servoAngle.textContent = '0° (OPEN)';
    if (statusText) {
      statusText.className = 'badge green';
      statusText.textContent = '✅ TRACK CLEAR — GATE UP — SAFE';
    }
  }
}

/* --------------------------------------------------------------------------
   5. Ibex RISC-V SoC Demo System Simulator
   -------------------------------------------------------------------------- */
class IbexSoCSimulator {
  constructor() {
    this.pc = 0x80000000;
    this.instructions = [
      { pc: '0x80000000', asm: 'lui  sp, 0x80004', desc: 'Initialize stack pointer' },
      { pc: '0x80000004', asm: 'jal  ra, main',     desc: 'Jump to main C routine' },
      { pc: '0x80000100', asm: 'li   a0, 0x40000000', desc: 'Load UART Base Address' },
      { pc: '0x80000104', asm: 'li   a1, 0x55',       desc: 'Load Tx byte 0x55 (ASCII "U")' },
      { pc: '0x80000108', asm: 'sw   a1, 0(a0)',      desc: 'Write to UART Tx register' },
      { pc: '0x8000010C', asm: 'lw   a2, 4(a0)',      desc: 'Read UART status flag' }
    ];
    this.instIdx = 0;
    this.timer = null;

    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    const freqSlider = document.getElementById('ibexFreqSlider_p5');
    if (freqSlider) {
      freqSlider.addEventListener('input', (e) => this.updateFreq(parseFloat(e.target.value)));
      this.updateFreq(50);
    }
    this.startPipeline();
  }

  updateFreq(freqMHz) {
    const freqText = document.getElementById('ibexFreqText_p5');
    const mipsText = document.getElementById('ibexMipsText_p5');
    const uartText = document.getElementById('ibexUartText_p5');

    if (freqText) freqText.textContent = `${freqMHz} MHz`;
    
    // CPI = 1.15 for RV32IMC core
    const mips = (freqMHz / 1.15).toFixed(1);
    if (mipsText) mipsText.textContent = `${mips} MIPS`;
    if (uartText) uartText.textContent = `[IBEX RISC-V SOC] | FREQ=${freqMHz}MHz | BAUD=115200 | RV32IMC OK`;
  }

  startPipeline() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const inst = this.instructions[this.instIdx];
      const pcEl = document.getElementById('ibexPcVal_p5');
      const asmEl = document.getElementById('ibexAsmVal_p5');
      const regEl = document.getElementById('ibexRegVal_p5');

      if (pcEl) pcEl.textContent = inst.pc;
      if (asmEl) asmEl.textContent = inst.asm;
      if (regEl) regEl.textContent = `x10/a0 = 0x40000000 | CPI = 1.15`;

      this.instIdx = (this.instIdx + 1) % this.instructions.length;
    }, 1200);
  }
}

// Global Instances
window.simulator = new FirmwareSimulator();
window.evBmsSim = new EVBMSSimulator();
window.autoTempSim = new AutomotiveTempSimulator();
window.railSim = new RailwayGateSimulator();
window.ibexSim = new IbexSoCSimulator();
