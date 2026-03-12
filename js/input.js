const keys = {};
const justPressed = {};
const toClear = [];

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) {
      justPressed[e.code] = true;
      toClear.push(e.code);
    }
    keys[e.code] = true;
    e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    e.preventDefault();
  });
}

export function isKeyHeld(code) {
  return !!keys[code];
}

export function isKeyJustPressed(code) {
  return !!justPressed[code];
}

export function clearFrameInput() {
  for (const code of toClear) {
    justPressed[code] = false;
  }
  toClear.length = 0;
}

export function getJustPressedLetter() {
  for (const code of toClear) {
    if (code.startsWith('Key')) {
      return code.charAt(3);
    }
  }
  return null;
}
