
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function downloadSong(song) {
    const arrayBuffer = nbs.toArrayBuffer(song);
    const fixedBuffer = arrayBuffer.slice(0);
    const blob = new Blob([fixedBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "randomSong.nbs";
    a.click();
    URL.revokeObjectURL(url);
}