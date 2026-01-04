const WorldIO = {
  version: 2,

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

    // palette of all tile names on all layers
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
            if (t !== null && t !== undefined) {
              paletteSet.add(t);
            }
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

    const save = {
      version: this.version,
      palette,
      chunkSize: [S, S],
      chunks: []
    };

    for (const key in chunksSrc) {
      const chunk = chunksSrc[key];
      if (!chunk || !chunk.layers) continue;

      const layersData = {};
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

        const tdList = [];
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
            tdList.push([idx1D, Object.entries(obj)]);
          }
        }

        // skip empty layers
        if (allNull && tdList.length === 0) continue;

        layersData[layerKey] = {
          t: this._rleEncode(flat),
          td: tdList
        };
        chunkHasData = true;
      }

      if (!chunkHasData) continue;

      const pos = chunk.pos;
      const posArr = (pos && typeof pos.x === "number" && typeof pos.y === "number")
        ? [pos.x | 0, pos.y | 0]
        : key.split(",").map(v => v | 0);

      save.chunks.push([
        posArr,
        { layers: layersData }
      ]);
    }

    return save;
  },

  loadSaveData(saveData) {
    if (!saveData || typeof saveData !== "object") {
      console.log("Savedata is undefined or invalid type");
      return "Savedata is undefined or invalid type";
    }
    if (!saveData.palette) {
      console.warn("Savedata is missing palette property");
      return "Savedata is missing palette property";
    }
    if (!saveData.chunkSize) {
      console.warn("Savedata is missing chunkSize property");
      return "Savedata is missing chunkSize property";
    }
    if (!saveData.chunks) {
      console.warn("Savedata is missing chunks property");
      return "Savedata is missing chunks property";
    }

    const S = World.CHUNK_SIZE | 0;
    const palette = Array.isArray(saveData.palette) ? saveData.palette : [];
    const nameOf = (i) => (palette[i] === null ? null : palette[i]);

    const newChunks = {};
    let loaded = 0;

    for (let n = 0; n < saveData.chunks.length; n++) {
      const entry = saveData.chunks[n];
      if (!Array.isArray(entry) || entry.length < 2) continue;

      const posArr = entry[0];
      const data = entry[1] || {};
      if (!Array.isArray(posArr) || posArr.length !== 2) continue;

      const x = posArr[0] | 0;
      const y = posArr[1] | 0;

      // New format: data.layers = { layerId: {t, td}, ... }
      // Old format (single layer): no layers -> treat "data" as FLOOR layer.
      const layersRaw = data.layers || {
        [(World.layers && World.layers.FLOOR) || 0]: data
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
            if (tileName !== null && tileName !== undefined) {
              tileCount++;
            }
          }
        }

        layerObj.tileCount = tileCount;
        layerObj.tiledata = layerObj.tiledata || {};

        const tdList = layerData.td || [];
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
              layerObj.tiledata[`${c},${r}`] = obj; // x=c, y=r
            }
          }
        }

        // Drop empty layers
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
    }

    console.log(
      `Successfully loaded savedata (${loaded} chunk(s), version:${saveData.version ?? 'unknown'})`
    );
    World.chunks = newChunks;

    return true;
  }
};
