const dbUrl = "https://script.google.com/macros/s/AKfycbwQDEsHwfn0xU6ISAcrtT0W3dhnXPdNsjVd2h6ZbDCyRdWkVCzIXM1CZWDLn5LpnbYBfw/exec";
const vistaUrl = "https://t3sl4co1l.github.io/bingovista/bingovista.html"
var canvasSize = 0;

var preloaded = [];
var tabs = [];
var tabPanels = [];
var tabNavs = [];
var currentTab = "";

document.addEventListener("DOMContentLoaded", function() {
    var searchParams = new URLSearchParams(document.URL.split("?")[1]);

    var reqUrl = new URL(dbUrl);
    var tabMakingPromise;
    try {
        tabMakingPromise = fetch(reqUrl)
            .then(response => response.json())
            .then((resp) => {
                var character = searchParams.get("character") || resp["default"];
                currentTab = character;
                var tabList = resp["list"];
                var found = false;
                for (var tab of tabList) {
                    createTab(tab, tab == character);
                    found |= tab == character;
                }
                if (!found && character !== "default")
                    createTab(character, true);
            });
    } catch (error) {
        var statusMessage = document.getElementById("status-message");
        statusMessage.classList.remove("ellipsed");
        statusMessage.innerHTML = "error fetching data :<br/>" + error.message + "<br/><br/>Please reload the page or contact Gzethicus.";
        return;
    }

    var character = searchParams.get("character") || "default";
    canvasSize = parseInt(window.getComputedStyle(document.body).getPropertyValue("--canvas-size"));
    loadTab(character, tabMakingPromise);

    const seePlayed = document.getElementById("see-played");
    if (seePlayed !== undefined) {
        togglePlayedVisibility({"target" : {"checked" : seePlayed.checked}});
    }
});

function showTab(targetTab) {
    const tabName = targetTab.getAttribute("aria-controls");
    loadTab(tabName);

    for (const tab of tabs) {
        if (tab === targetTab)
            continue;
        tab.setAttribute("aria-selected", false);
        tab.tabIndex = -1;
    }
    targetTab.setAttribute("aria-selected", true);
    targetTab.tabIndex = 0;

    const targetTabPanel = document.getElementById(tabName);
    for (const panel of tabPanels) {
        if (panel === targetTabPanel)
            continue;
        panel.hidden = true;
    }
    targetTabPanel.hidden = false;
    
    const targetTabNav = document.getElementById(tabName + "-nav");
    for (const nav of tabNavs) {
        if (nav === targetTabNav)
            continue;
        nav.hidden = true;
    }
    targetTabNav.hidden = false;
    currentTab = tabName;
}

function createTab(tab, selected) {
    const newTab = document.createElement("div");
    newTab.className = "text-button";
    newTab.role = "tab";
    newTab.setAttribute("aria-selected", selected);
    newTab.setAttribute("aria-controls", tab);
    newTab.addEventListener("click", (e) => {
        showTab(e.target);
    })
    document.getElementById("tabs").appendChild(newTab);
    newTab.appendChild(document.createTextNode(tab));
    tabs.push(newTab);

    const newTabPanel = document.createElement("div");
    newTabPanel.id = tab;
    newTabPanel.role = "tabpanel";
    newTabPanel.tabIndex = selected ? 0 : -1;
    newTabPanel.hidden = !selected;
    document.getElementById("board-list").appendChild(newTabPanel);
    tabPanels.push(newTabPanel);
    
    const newTabNav = document.createElement("div");
    newTabNav.id = tab + "-nav";
    newTabNav.role = "tabpanel";
    newTabNav.tabIndex = selected ? 0 : -1;
    newTabNav.hidden = !selected;
    document.getElementById("navigation").appendChild(newTabNav);
    tabNavs.push(newTabNav);
}

async function loadTab(tab, tabMakingPromise) {
    if (preloaded.includes(tab))
        return;

    document.getElementById("status-message").style.display = "block";
    var resp = await fetchBoardList(tab);
    tab = resp["name"];
    var boardList = resp["list"];
    preloaded.push(tab);
    if (tabMakingPromise !== undefined)
        await tabMakingPromise;

    if (document.getElementById("board-info") !== undefined && document.getElementById("navigation") !== undefined) {
        for (i = 0; i < boardList.length; i++) {
            createBoardInfo(boardList[i].name, tab);
            displayBoardInfo(boardList[i]);
        }
        document.getElementById("status-message").style.display = "none";
    }
}

async function fetchBoardList(character) {
    var reqUrl = new URL(dbUrl);
    reqUrl.search = "character=" + character;

    var resp;
    try {
        resp = await fetch(reqUrl).then(response => response.json());
    } catch (error) {
        var statusMessage = document.getElementById("status-message");
        statusMessage.classList.remove("ellipsed");
        statusMessage.innerHTML = "error fetching data :<br/>" + error.message + "<br/><br/>Please reload the page or contact Gzethicus.";
        return;
    }
    return resp;
}

function createBoardInfo(name, character) {
    const newDiv = document.createElement("div");
    newDiv.className = "board-info";
    newDiv.id = name;
    document.getElementById(character || "board-list").appendChild(newDiv);

    const link = document.createElement("a");
    link.href = "#" + name;
    link.id = name + "-link";
    link.appendChild(document.createTextNode(name));
    document.getElementById(character + "-nav").appendChild(link);
}

function displayBoardInfo(data) {
    var bv = new Bingovista();
	bv.loadModpack("bingovista/mods/watcher.json");
    var successCallBack = displayBoardInfoCallback.bind(this, data, bv)
    bv.setup({ dataSrc: data.string, dataType: "text", loadSuccess: successCallBack});
}

function displayBoardInfoCallback(data, bv) {
    const infoDiv = document.getElementById(data.name);
    const divLink = document.getElementById(data.name + "-link");
    if (data.used) {
        infoDiv.classList.add("played");
        divLink.classList.add("played");
    } else {
        infoDiv.classList.remove("played");
        divLink.classList.remove("played");
    }

    bv.boardId = data.name + "-canvas";
    bv.board.comments = data.name;
    bv.board.perks = bv.maps.expflags.find((el) => el.name === "LOCKOUT").value;

    bv.boardToBin();

    const infoName = document.createElement("label");
    infoName.className = "board-name";
    infoName.appendChild(document.createTextNode(data.name));
    infoDiv.appendChild(infoName);

    const infoCreator = document.createElement("label");
    infoCreator.className = "board-shelter";
    infoCreator.appendChild(document.createTextNode("by " + data.creator));
    infoDiv.appendChild(infoCreator);

    if(data.playtesters) {
        const infoTesters = document.createElement("label");
        infoTesters.className = "board-shelter";
        infoTesters.appendChild(document.createTextNode("playtesting: " + data.playtesters));
        infoDiv.appendChild(infoTesters);
    }

    const extraControls = document.createElement("div");
    infoDiv.appendChild(extraControls);

    const playedContainer = document.createElement("label");
    playedContainer.className = "icon-button";
    playedContainer.title = "Toggle available/played";
    const playedInput = document.createElement("input");
    playedInput.type = "checkbox";
    playedInput.checked = !data.used;
    playedInput.addEventListener("change", setPlayed.bind(this, data.name));
    playedContainer.appendChild(playedInput);
    const playedIcon = document.createElement("span");
    playedContainer.appendChild(playedIcon);
    extraControls.appendChild(playedContainer);

    const infoShelter = document.createElement("label");
    infoShelter.className = "board-shelter";
    infoShelter.appendChild(document.createTextNode(bv.board.shelter));
    extraControls.appendChild(infoShelter);

    const vistaLink = document.createElement("a");
    vistaLink.className = "icon-button";
    vistaLink.href = vistaUrl + "?b=" + Bingovista.binToBase64u(bv.board.bin);
    vistaLink.target = "_blank";
    const vistaIcon = document.createElement("img");
    vistaIcon.src = "graphics\\bingoVista.png";
    vistaLink.title = "View on BingoVista";
    vistaIcon.alt = "View on BingoVista";
    vistaLink.appendChild(vistaIcon);
    extraControls.appendChild(vistaLink);

    const shortLink = document.createElement("label");
    shortLink.className = "icon-button";
    shortLink.title = "Get a short link to this board";
    shortLink.addEventListener("click", getShortLink.bind(this, bv.board));
    const linkIcon = document.createElement("img");
    linkIcon.src = "graphics\\link.svg";
    shortLink.appendChild(linkIcon);
    extraControls.appendChild(shortLink);

    if (data.screenshot.startsWith("http")) {
        // temporary solution while waiting for bingovista to be updated to Watcher
        const crop = document.createElement("div");
        crop.className = "crop";
        infoDiv.appendChild(crop)
        const boardScreenShot = document.createElement("img")
        boardScreenShot.appendChild(document.createTextNode(data.string));
        boardScreenShot.addEventListener("click", onCanvasClicked);
        boardScreenShot.src = data.screenshot;
        crop.appendChild(boardScreenShot);
    } else {
        const canvDiv = document.createElement("div");
        canvDiv.id = data.name + "-canvas";
        infoDiv.appendChild(canvDiv);
        const infoCanvas = document.createElement("canvas");
        infoCanvas.width = canvasSize;
        infoCanvas.height = canvasSize;
        infoCanvas.appendChild(document.createTextNode(data.string));
        infoCanvas.addEventListener("click", onCanvasClicked);
        canvDiv.appendChild(infoCanvas);
        const cursDiv = document.createElement("div");
        canvDiv.appendChild(cursDiv);
        
        bv.refreshBoard();
    }
}

async function setPlayed(board, e) {
    var payload = {
        method : "POST",
        redirect: "follow",
        headers : {"Content-Type" : "text/plain"},
        body: JSON.stringify({
            "character" : currentTab,
            "board" : board,
            "used" : !e.target.checked
        })
    };

    var res;
    try {
        res = await fetch(dbUrl, payload);
    } catch (error) {
        e.target.checked ^= true;
        return;
    }
    if (res.ok && !e.target.checked) {
        document.getElementById(board).classList.add("played");
        document.getElementById(board + "-link").classList.add("played");
    } else if (res.ok) {
        document.getElementById(board).classList.remove("played");
        document.getElementById(board + "-link").classList.remove("played");
    } else {
        e.target.checked ^= true;
    }
}

function onCanvasClicked(e) {
    const callback = confirmCopyToClipboard.bind(this, e);
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

function togglePlayedVisibility(e) {
    const visible = e.target.checked;
    var styleSheet;
    for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        if (sheet.href.includes("/styles.css")) {
            styleSheet = sheet;
            break;
        }
    }

    for (var i = 0; i < styleSheet.cssRules.length; i++) {
        var rule = styleSheet.cssRules[i];
        if (rule.selectorText === ".played") {
            if (visible)
                rule.style.removeProperty("display");
            else
                rule.style.display = "none"
            break;
        }
    }
}


async function getShortLink(board, e) {
    const callback = confirmCopyToClipboard.bind(this, e);
    makeRequest(board)
    .then((resp) => {
        return navigator.clipboard.writeText(resp);
    }).then(callback);
}


// shamelessly copied from T3sl4co1l's shortener and tweaked a tiny bit
function makeRequest(board) {
    var status;
    return fetch(
        new URL("https://www.seventransistorlabs.com/bserv/BingoServer.dll"), {
            method: "POST",
            body: board.bin,
            headers: {
                "content-type": "application/octet-stream"
            }
        }
    ).then(function(r) {
        //	Request succeeds
        console.log("Response: " + r.status + ", content-type: " + r.headers.get("content-type"));
        return r.arrayBuffer();
    }, function(r) {
        //	Request failed (connection, invalid CORS, etc. error)
        status = "Error connecting to server, or request rejected.";
    }).then(function(a) {
        //	success, arrayBuffer() complete
        var s = new TextDecoder().decode(new Uint8Array(a));
        var resp;
        try {
            resp = JSON.parse(s);
        } catch (e) {
            status = "Server accepted request; error parsing response: \"" + s + "\"";
            return;
        }
        if (resp.status === undefined || resp.cause === undefined || resp.key === undefined) {
            status = "Server returned unexpected response; status: " + resp.status + ", cause: " + resp.cause + ", key: " + resp.key;
            return;
        }
        if (resp.cause === "exists")
            status = "Board already exists, or collision occurred; please verify the shortened URL is as desired.";
        else
            status = "Accepted.";
        console.log(status)

        return "https://t3sl4co1l.github.io/bingovista/bingovista.html?q=" + resp.key;
    });
}
