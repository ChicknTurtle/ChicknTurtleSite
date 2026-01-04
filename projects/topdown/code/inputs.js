
const InputManager = {
  pressInput: function(input) {
    Game.inputs[input] = true;
    Game.inputsClicked[input] = true;
    InputManager.keybinds?.[input]?.forEach(keybind => {
      Game.keybinds[keybind] = true;
      Game.keybindsClicked[keybind] = true;
    });
  },

  releaseInput: function(input) {
    delete Game.inputs[input];
    Game.inputsReleased[input] = true;
    InputManager.keybinds?.[input]?.forEach(keybind => {
      delete Game.keybinds[keybind];
      Game.keybindsClicked[keybind] = true;
    });
  },

  unfocus: function() {
    Game.inputs = {};
    Game.keybinds = {};
    Game.mousePos = null;
    Game.prevMousePos = null;
    Game.mouseGamePos = null;
  },

  keybinds: {
    'KeyW': ['walkUp'],
    'ArrowUp': ['walkUp','menuUp'],
    'KeyA': ['walkLeft'],
    'ArrowLeft': ['walkLeft','menuLeft'],
    'KeyS': ['walkDown'],
    'ArrowDown': ['walkDown','menuDown'],
    'KeyD': ['walkRight'],
    'ArrowRight': ['walkRight','menuRight'],
  }
}

window.addEventListener('blur', function(event) {
  InputManager.unfocus()
});
window.addEventListener('visibilitychange', function(event) {
  InputManager.unfocus()
});
document.addEventListener('pointerleave', function(event) {
  InputManager.unfocus()
});

document.addEventListener('mousemove', function(event) {
  Game.mousePos = new Vec2(event.clientX, event.clientY);
});

document.addEventListener('mousedown', function(event) {
  Game.mousePos = new Vec2(event.clientX, event.clientY);
  InputManager.pressInput('Mouse'+event.button);
});
document.addEventListener('mouseup', function(event) {
  InputManager.releaseInput('Mouse'+event.button);
});

document.addEventListener('keydown', function(event) {
  if (Game.loading) return;
  if (!(event.ctrlKey || event.metaKey)) {
    event.preventDefault();
  }
  if (Game.inputs[event.code]) return;
  InputManager.pressInput(event.code);
});
document.addEventListener('keyup', function(event) {
  InputManager.releaseInput(event.code);
});

document.addEventListener("contextmenu", function(event) {
  if (Game.loading) return;
  event.preventDefault();
});

document.addEventListener("wheel", function(event) {
  event.preventDefault();
  const isTouchpad = false;
  if (isTouchpad) {
    if (event.ctrlKey) {
      Game.inputsClicked['scroll'] ??= 0;
      Game.inputsClicked['scroll'] += event.deltaX*2+event.deltaY*2;
    } else {
      Game.inputsClicked['pan'] ??= new Vec2(0,0);
      Game.inputsClicked['pan'].x += event.deltaX*-0.5*(1/Game.cam.zoom);
      Game.inputsClicked['pan'].y += event.deltaY*-0.5*(1/Game.cam.zoom);
    }
  } else {
    Game.inputsClicked['scroll'] ??= 0;
    Game.inputsClicked['scroll'] += event.deltaX+event.deltaY;
  }
},{ passive:false });

document.addEventListener("visibilitychange", function(event) {
  if (Game.loading) return;
  if (Game.state === 'editor') {
    if (document.visibilityState === 'hidden') {
      Editor.autosave();
    }
  }
});
