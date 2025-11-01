const dbUrl = "https://script.google.com/macros/s/AKfycbxDRSVpPLWVR3Yzf3dmfTJ2a42ETasB4JisCcnczAzw9w2c5eUeddK17iKldUdiG62xqQ/exec";
const canvasSize = "454";


document.addEventListener("DOMContentLoaded", async function() {
    const copyConfirm = document.getElementById("copy-confirm");
    copyConfirm.addEventListener("animationend", function () {copyConfirm.style.visibility = "hidden";})

    const boardList = await fetch(dbUrl + "?board=0").then(response => response.json());
    for (i = 0; i < boardList.length; i++) {
        createBoardInfo(boardList[i])
        fetch(dbUrl + "?board=" + (i + 1)).then(response => response.json()).then(displayBoardInfo);
    }
});

function createBoardInfo(name) {
    const newDiv = document.createElement("div");
    newDiv.className = "board-info";
    newDiv.id = name;
    document.body.appendChild(newDiv);
}

function displayBoardInfo(data) {
    const infoDiv = document.getElementById(data.name);

    const infoName = document.createElement("label");
    infoName.className = "board-name";
    infoName.appendChild(document.createTextNode(data.name));
    infoDiv.appendChild(infoName);

    const infoShelter = document.createElement("label");
    infoShelter.className = "board-shelter";
    infoShelter.appendChild(document.createTextNode(data.shelter));
    infoDiv.appendChild(infoShelter);

    const infoCanvas = document.createElement("canvas");
    infoCanvas.id = data.name + "-canvas";
    infoCanvas.width = canvasSize;
    infoCanvas.height = canvasSize;
    infoCanvas.appendChild(document.createTextNode(data.string));
    infoCanvas.addEventListener("click", onCanvasClicked)
    infoDiv.appendChild(infoCanvas);
    drawBoard(infoCanvas.id, data.string)
}

function drawBoard(canvasId, boardString) {
	document.getElementById("textbox").value = boardString;
    parseText();
    redrawBoard(canvasId);
}

function onCanvasClicked(e) {
    const callback = confirmCopyToClipboard.bind(this, e)
    navigator.clipboard.writeText(e.target.textContent).then(callback);
}

function confirmCopyToClipboard(e) {
    const confirm = document.getElementById("copy-confirm");
    confirm.style.animation = "none";
    confirm.style.left = e.pageX - confirm.offsetWidth / 2 + "px";
    confirm.style.top = e.pageY - confirm.offsetHeight + "px";
    confirm.style.visibility = "visible";
    confirm.style.animation = null;
}
