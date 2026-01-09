const InputManager = {
  activePointerId: null,

  pressInput: function (input) {
    Game.inputs[input] = true;
    Game.inputsClicked[input] = true;
    InputManager.keybinds?.[input]?.forEach(keybind => {
      Game.keybinds[keybind] = true;
      Game.keybindsClicked[keybind] = true;
    });
  },

  releaseInput: function (input) {
    delete Game.inputs[input];
    Game.inputsReleased[input] = true;
    InputManager.keybinds?.[input]?.forEach(keybind => {
      delete Game.keybinds[keybind];
      Game.keybindsReleased[keybind] = true;
    });
  },

  unfocus: function () {
    Game.inputs = {};
    Game.keybinds = {};
    Game.mousePos = null;
    Game.prevMousePos = null;
    Game.mouseGamePos = null;
    InputManager.activePointerId = null;
  },

  keybinds: {
    'Space': ['roll'],
  }
}

window.addEventListener('blur', function (event) {
  InputManager.unfocus()
});
window.addEventListener('visibilitychange', function (event) {
  InputManager.unfocus()
});

document.addEventListener(('onpointerrawupdate' in window) ? 'pointerrawupdate' : 'pointermove', function (event) {
  if (event.pointerType === 'mouse') {
    Game.mousePos = new Vec2(event.clientX, event.clientY);
    return;
  }

  if (InputManager.activePointerId === null || InputManager.activePointerId === event.pointerId) {
    Game.mousePos = new Vec2(event.clientX, event.clientY);
    if (InputManager.activePointerId === event.pointerId && event.cancelable) {
      event.preventDefault();
    }
  }
}, { passive: false });

document.addEventListener('pointerdown', function (event) {
  if (event.pointerType === 'mouse') {
    Game.mousePos = new Vec2(event.clientX, event.clientY);
    InputManager.pressInput('Mouse' + event.button);
    return;
  }

  if (InputManager.activePointerId !== null) return;
  InputManager.activePointerId = event.pointerId;

  Game.mousePos = new Vec2(event.clientX, event.clientY);

  if (event.cancelable) event.preventDefault();
  InputManager.pressInput('Mouse0');
}, { passive: false });

document.addEventListener('pointerup', function (event) {
  if (event.pointerType === 'mouse') {
    InputManager.releaseInput('Mouse' + event.button);
    return;
  }

  if (InputManager.activePointerId !== event.pointerId) return;
  InputManager.activePointerId = null;

  if (event.cancelable) event.preventDefault();
  InputManager.releaseInput('Mouse0');
}, { passive: false });

document.addEventListener('pointercancel', function (event) {
  if (InputManager.activePointerId !== event.pointerId) return;
  InputManager.activePointerId = null;

  if (event.cancelable) event.preventDefault();
  InputManager.releaseInput('Mouse0');
}, { passive: false });

document.addEventListener('pointerleave', function () {
  InputManager.unfocus()
}, { passive: true });

document.addEventListener('keydown', function (event) {
  if (Game.loading) return;
  if (!(event.ctrlKey || event.metaKey)) {
    event.preventDefault();
  }
  if (Game.inputs[event.code]) return;
  InputManager.pressInput(event.code);
});
document.addEventListener('keyup', function (event) {
  InputManager.releaseInput(event.code);
});

document.addEventListener("contextmenu", function (event) {
  if (Game.loading) return;
  event.preventDefault();
});

document.addEventListener("wheel", function (event) {
  event.preventDefault();
  const isTouchpad = false;
  if (isTouchpad) {
    if (event.ctrlKey) {
      Game.inputsClicked['scroll'] ??= 0;
      Game.inputsClicked['scroll'] += event.deltaX * 2 + event.deltaY * 2;
    } else {
      Game.inputsClicked['pan'] ??= new Vec2(0, 0);
      Game.inputsClicked['pan'].x += event.deltaX * -0.5 * (1 / Game.cam.zoom);
      Game.inputsClicked['pan'].y += event.deltaY * -0.5 * (1 / Game.cam.zoom);
    }
  } else {
    Game.inputsClicked['scroll'] ??= 0;
    Game.inputsClicked['scroll'] += event.deltaX + event.deltaY;
  }
}, { passive: false });

document.addEventListener("visibilitychange", function (event) {
  if (Game.loading) return;
  if (Game.state === 'editor') {
    if (document.visibilityState === 'hidden') {
      Editor.autosave();
    }
  }
});
