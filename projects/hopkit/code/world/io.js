import { Vec2 } from "./../utils/lib.js"
import { Game } from "./../game.js"
import { World } from "./world.js"
import { LZString } from "./../lib/lz-string.js";

export const WorldIO = {
  version: 2,
  FILE_EXT: 'json',

  _rleEncode(arr) {
    if (!arr || !arr.length) return [];
    const out = [];
    let runVal = arr[0], runLen = 1;
    for (let i = 1; i < arr.length; i++) {
      const v = arr[i];
      if (v === runVal) runLen++;
      else {
        out.push(runLen, runVal);
        runVal = v;
        runLen = 1;
      }
    }
    out.push(runLen, runVal);
    return out;
  },

  _rleDecodeFlat(pairs) {
    const out = [];
    if (!Array.isArray(pairs)) return out;
    for (let i = 0; i < pairs.length; i += 2) {
      const len = pairs[i] | 0;
      const val = pairs[i + 1];
      for (let k = 0; k < len; k++) out.push(val);
    }
    return out;
  },

  getSaveData() {
    const S = World.CHUNK_SIZE | 0;
    const chunksSrc = World.chunks || World.loadedChunks || {};

    // build palette
    const paletteSet = new Set([null]);
    for (const key in chunksSrc) {
      const chunk = chunksSrc[key];
      if (!chunk || !chunk.layers) continue;
      const layers = chunk.layers;
      for (const layerKey of Object.keys(layers)) {
        const layer = layers[layerKey];
        const tiles = layer && layer.tiles;
        if (!tiles) continue;
        for (let r = 0; r < S; r++) {
          const row = tiles[r];
          if (!row) continue;
          for (let c = 0; c < S; c++) {
            const t = row[c];
            if (t !== null && t !== undefined) paletteSet.add(t);
          }
        }
      }
    }

    const palette = Array.from(paletteSet);
    const idOf = Object.create(null);
    for (let i = 0; i < palette.length; i++) {
      const name = (palette[i] === null ? "__NULL__" : palette[i]);
      idOf[name] = i;
    }

    const kMap = Object.create(null);
    const kArr = [];
    function keyIndex(key) {
      if (!kMap.hasOwnProperty(key)) {
        kMap[key] = kArr.length;
        kArr.push(key);
      }
      return kMap[key];
    }

    const save = {
      v: this.version,
      p: palette,
      c: []
    };

    for (const key in chunksSrc) {
      const chunk = chunksSrc[key];
      if (!chunk || !chunk.layers) continue;

      const layersArr = [];
      let chunkHasData = false;

      for (const layerKey of Object.keys(chunk.layers)) {
        const layer = chunk.layers[layerKey];
        if (!layer || !layer.tiles) continue;

        const tiles = layer.tiles;
        const flat = new Array(S * S);
        let idx = 0;
        let allNull = true;

        for (let r = 0; r < S; r++) {
          const row = tiles[r] || [];
          for (let c = 0; c < S; c++) {
            const t = row[c] ?? null;
            const id = idOf[(t ?? "__NULL__")];
            flat[idx++] = id;
            if (t !== null && t !== undefined) allNull = false;
          }
        }

        const tdFlat = [];
        const td = layer.tiledata;
        if (td && typeof td === "object") {
          for (const coord in td) {
            const obj = td[coord];
            if (!obj || typeof obj !== "object") continue;
            const keys = Object.keys(obj);
            if (!keys.length) continue;

            const parts = coord.split(",");
            const x = parts[0] | 0;
            const y = parts[1] | 0;
            if (x < 0 || x >= S || y < 0 || y >= S) continue;

            const idx1D = y * S + x;
            tdFlat.push(idx1D);
            tdFlat.push(keys.length);
            for (let ki = 0; ki < keys.length; ki++) {
              const kk = keys[ki];
              const kidx = keyIndex(String(kk));
              tdFlat.push(kidx);
              tdFlat.push(obj[kk]);
            }
          }
        }

        // skip empty layers
        if (allNull && tdFlat.length === 0) continue;

        layersArr.push([layerKey | 0, this._rleEncode(flat), tdFlat]);
        chunkHasData = true;
      }

      if (!chunkHasData) continue;

      const pos = chunk.pos;
      const posArr = (pos && typeof pos.x === "number" && typeof pos.y === "number")
        ? [pos.x | 0, pos.y | 0]
        : key.split(",").map(v => v | 0);

      save.c.push([posArr[0], posArr[1], layersArr]);
    }

    if (kArr.length) save.k = kArr;
    return save;
  },

  loadSaveData(saveData) {
    if (!saveData || typeof saveData !== "object") {
      console.log("Savedata is undefined or invalid type");
      return "Savedata is undefined or invalid type";
    }

    const palette = Array.isArray(saveData.p)
      ? saveData.p
      : (Array.isArray(saveData.palette) ? saveData.palette : null);

    if (!Array.isArray(palette)) {
      console.warn("Savedata is missing palette property");
      return "Savedata is missing palette property";
    }

    const S = World.CHUNK_SIZE | 0;
    const nameOf = (i) => (palette[i] === null ? null : palette[i]);

    const newChunks = {};
    let loaded = 0;

    const rawChunks = Array.isArray(saveData.c) ? saveData.c
      : (Array.isArray(saveData.chunks) ? saveData.chunks : null);

    if (!Array.isArray(rawChunks)) {
      console.warn("Savedata is missing chunks property");
      return "Savedata is missing chunks property";
    }

    const isV2 = String(saveData.v) === "2";

    const kArr = Array.isArray(saveData.k) ? saveData.k : [];

    for (let n = 0; n < rawChunks.length; n++) {
      const entry = rawChunks[n];
      if (!Array.isArray(entry)) continue;

      if (isV2 && entry.length >= 3 && Array.isArray(entry[2])) {
        const x = entry[0] | 0;
        const y = entry[1] | 0;
        const layersArr = entry[2];

        const pos = new Vec2(x, y);
        const chunk = new World.Chunk(pos);
        let chunkHasData = false;

        for (let li = 0; li < layersArr.length; li++) {
          const la = layersArr[li];
          if (!Array.isArray(la) || la.length < 2) continue;
          const layerIndex = la[0] | 0;
          const tRLE = Array.isArray(la[1]) ? la[1] : [];
          const tdFlat = Array.isArray(la[2]) ? la[2] : [];

          const flat = this._rleDecodeFlat(tRLE);
          if (flat.length === 0) continue;
          if (flat.length !== S * S) {
            console.warn(
              `RLE length mismatch for chunk [${x},${y}] layer ${layerIndex} ` +
              `(got ${flat.length}, expected ${S * S})`
            );
            return `RLE length mismatch for chunk [${x},${y}] layer ${layerIndex} (got ${flat.length}, expected ${S * S})`;
          }

          const layerObj = chunk.initLayer(layerIndex);
          const tiles = layerObj.tiles;
          let idx = 0;
          let tileCount = 0;

          for (let r = 0; r < S; r++) {
            const row = tiles[r];
            for (let c = 0; c < S; c++) {
              const tileName = nameOf(flat[idx++] ?? 0);
              row[c] = tileName;
              if (tileName !== null && tileName !== undefined) tileCount++;
            }
          }

          layerObj.tileCount = tileCount;
          layerObj.tiledata = layerObj.tiledata || {};

          for (let p = 0; p < tdFlat.length;) {
            const idx1D = tdFlat[p++] | 0;
            const pairCount = tdFlat[p++] | 0;
            const entries = [];
            for (let pi = 0; pi < pairCount; pi++) {
              const kidx = tdFlat[p++] | 0;
              const keyName = (kArr[kidx] !== undefined ? kArr[kidx] : String(kidx));
              const val = tdFlat[p++];
              entries.push([keyName, val]);
            }

            const r = (idx1D / S) | 0;
            const c = idx1D % S;
            if (r < 0 || r >= S || c < 0 || c >= S) continue;
            const obj = Object.fromEntries(entries);
            if (obj && Object.keys(obj).length) {
              layerObj.tiledata[`${c},${r}`] = obj;
            }
          }

          // drop empty layers
          if (tileCount === 0 && Object.keys(layerObj.tiledata).length === 0) {
            delete chunk.layers[layerIndex];
          } else {
            chunkHasData = true;
          }
        }

        if (!chunkHasData) continue;
        chunk.rerender = true;
        newChunks[`${x},${y}`] = chunk;
        loaded++;
        continue;
      }

      // fallback v1 format
      if (entry.length >= 2 && Array.isArray(entry[0]) && entry[0].length === 2) {
        const posArr = entry[0];
        const data = entry[1] || {};
        const x = posArr[0] | 0;
        const y = posArr[1] | 0;

        const layersRaw = (data.l ?? data.layers) || {
          [(World.layers && World.layers.GROUND) || 0]: data
        };

        const pos = new Vec2(x, y);
        const chunk = new World.Chunk(pos);
        let chunkHasData = false;

        for (const layerKey of Object.keys(layersRaw)) {
          const layerData = layersRaw[layerKey] || {};
          const flat = this._rleDecodeFlat(layerData.t);

          if (flat.length === 0) continue;
          if (flat.length !== S * S) {
            console.warn(
              `RLE length mismatch for chunk [${x},${y}] layer ${layerKey} ` +
              `(got ${flat.length}, expected ${S * S})`
            );
            return `RLE length mismatch for chunk [${x},${y}] layer ${layerKey} (got ${flat.length}, expected ${S * S})`;
          }

          const layerIndex = layerKey | 0;
          const layerObj = chunk.initLayer(layerIndex);
          const tiles = layerObj.tiles;
          let idx = 0;
          let tileCount = 0;

          for (let r = 0; r < S; r++) {
            const row = tiles[r];
            for (let c = 0; c < S; c++) {
              const tileName = nameOf(flat[idx++] ?? 0);
              row[c] = tileName;
              if (tileName !== null && tileName !== undefined) tileCount++;
            }
          }

          layerObj.tileCount = tileCount;
          layerObj.tiledata = layerObj.tiledata || {};

          const tdList = (layerData.d ?? layerData.td) || [];
          if (Array.isArray(tdList)) {
            for (let k = 0; k < tdList.length; k++) {
              const pair = tdList[k];
              if (!Array.isArray(pair) || pair.length < 2) continue;
              const i = pair[0] | 0;
              const entries = pair[1];
              const r = (i / S) | 0;
              const c = i % S;
              if (r < 0 || r >= S || c < 0 || c >= S) continue;

              const obj = Object.fromEntries(Array.isArray(entries) ? entries : []);
              if (obj && Object.keys(obj).length) {
                layerObj.tiledata[`${c},${r}`] = obj;
              }
            }
          }

          if (tileCount === 0 && Object.keys(layerObj.tiledata).length === 0) {
            delete chunk.layers[layerIndex];
          } else {
            chunkHasData = true;
          }
        }

        if (!chunkHasData) continue;
        chunk.rerender = true;
        newChunks[`${x},${y}`] = chunk;
        loaded++;
        continue;
      }
    }

    console.debug(`Successfully loaded savedata (${loaded} chunk(s), version:${saveData.v ?? saveData.version ?? 'unknown'})`);
    World.chunks = newChunks;
    return true;
  }
};

WorldIO.encodeLevel = function(data) {
  return LZString.compressToBase64(JSON.stringify(data));
}

WorldIO.decodeLevel = function(code) {
  return JSON.parse(LZString.decompressFromBase64(code));
}

WorldIO.copyLevelCode = function() {
  const saveData = WorldIO.getSaveData();
  const code = WorldIO.encodeLevel(saveData);
  navigator.clipboard.writeText(code).then(() => {
    console.log("Level code copied to clipboard", code);
    alert("Level code copied to clipboard:\n\n" + code);
  }).catch(err => {
    console.error("Failed to copy level code: ", err);
    alert("Failed to copy level code: " + err);
  });
}

WorldIO.loadFromCode = function() {
  const code = prompt("Paste level code:");
  if (!code) return;
  try {
    const saveData = WorldIO.decodeLevel(code);
    const result = WorldIO.loadSaveData(saveData);
    if (result !== true) {
      alert(`Failed to load world from code: ${result}`);
    } else {
      WorldIO.autosave();
    }
  } catch (err) {
    alert(`Failed to load world from code: ${err}`);
  }
}

WorldIO.saveToFile = function() {
  console.log("Saving world to file...");
  try {
    const saveData = WorldIO.getSaveData();
    const jsonData = JSON.stringify(saveData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${Game.id}_level.${WorldIO.FILE_EXT}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    throw err;
  }
}

WorldIO.loadFromFile = async function() {
  console.log("Loading world from file...");
  try {
    Game.fileInput.accept = `.${WorldIO.FILE_EXT},application/json`;
    Game.fileInput.multiple = false;

    const file = await new Promise((resolve) => {
      const onChange = () => {
        const f = Game.fileInput.files && Game.fileInput.files[0];
        Game.fileInput.value = "";
        resolve(f || null);
      };
      Game.fileInput.addEventListener("change", onChange, { once: true });
      Game.fileInput.click();
    });

    if (!file) return;

    const content = await file.text();
    const saveData = JSON.parse(content);
    const result = WorldIO.loadSaveData(saveData);
    if (result !== true) {
      alert(`Failed to load world from file: ${result}`);
    } else {
      WorldIO.autosave();
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      if (error.name === 'SyntaxError') {
        alert("Failed to load world from file: not a valid json file");
      } else {
        alert(`Failed to load world from file: ${error}`);
      }
    }
  }
};

WorldIO.autosave = function() {
  const saveData = WorldIO.getSaveData();
  localStorage.setItem(`${Game.id}.autosave`, WorldIO.encodeLevel(saveData));
}

WorldIO.loadAutosave = function() {
  const autosave = localStorage.getItem(`${Game.id}.autosave`);
  if (autosave) {
    const saveData = WorldIO.decodeLevel(autosave) ?? JSON.parse(autosave);
    WorldIO.loadSaveData(saveData);
    console.log('Loaded autosave.')
  } else {
    console.log('No autosave found.');
  }
}
