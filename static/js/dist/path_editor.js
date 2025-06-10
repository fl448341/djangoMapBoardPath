// src/path_editor.ts
export function initPathEditor(cfg) {
    const $ = (id) => document.getElementById(id);
    const grid = $("grid");
    const saveBt = $("savePath");
    const info = $("saveInfo");
    const key = (r, c) => `${r},${c}`;
    const neighbors = (r1, c1, r2, c2) => Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    // busy = markery + już zatwierdzone ścieżki
    const busy = new Set();
    cfg.board.dots.forEach(d => busy.add(key(d.row, d.col)));
    cfg.path.forEach(p => busy.add(key(p.row, p.col)));
    // które kolory już użyte
    const usedColors = new Set(cfg.path.map(p => p.color));
    // stan rysowania
    let activeColor = null;
    let isDrawing = false;
    let drawPath = [];
    let drawSet = new Set();
    // budowa siatki
    grid.innerHTML = "";
    grid.style.gridTemplate = `repeat(${cfg.board.rows},1fr)/repeat(${cfg.board.cols},1fr)`;
    for (let r = 0; r < cfg.board.rows; r++) {
        for (let c = 0; c < cfg.board.cols; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = "" + r;
            cell.dataset.col = "" + c;
            grid.appendChild(cell);
        }
    }
    // markery
    cfg.board.dots.forEach(d => {
        const cell = grid.querySelector(`.cell[data-row="${d.row}"][data-col="${d.col}"]`);
        cell.classList.add("marker");
        cell.dataset.markerColor = d.color;
        // ustawiamy tylko color, nie tło
        cell.style.color = d.color;
        if (usedColors.has(d.color)) {
            cell.classList.add("used");
        }
    });
    function isMarkerCell(r, c) {
        return cfg.board.dots.some(d => d.row === r && d.col === c);
    }
    function getDirection(from, to) {
        if (from.r === to.r) {
            return from.c < to.c ? "right" : "left";
        }
        else {
            return from.r < to.r ? "down" : "up";
        }
    }
    function getPathType(pathIndex, path) {
        const curr = path[pathIndex];
        if (isMarkerCell(curr.r, curr.c)) {
            return "marker";
        }
        if (path.length === 1)
            return "dot";
        const prev = pathIndex > 0 ? path[pathIndex - 1] : null;
        const next = pathIndex < path.length - 1 ? path[pathIndex + 1] : null;
        if (!prev) {
            const nextDir = getDirection(curr, next);
            return `line-${nextDir}`;
        }
        if (!next) {
            const prevDir = getDirection(prev, curr);
            return `line-${prevDir}`;
        }
        const prevDir = getDirection(prev, curr);
        const nextDir = getDirection(curr, next);
        if (prevDir === nextDir) {
            return `line-${prevDir}`;
        }
        else {
            return `corner-${prevDir}-${nextDir}`;
        }
    }
    function drawPathInCell(cell, pathType, color) {
        // usuń istniejącą ścieżkę
        const existing = cell.querySelector(".path-line");
        if (existing)
            existing.remove();
        if (pathType === "marker") {
            // tylko ustawiamy color, pseudo::before zrobi wypełnienie
            cell.style.color = color;
            return;
        }
        const el = document.createElement("div");
        el.className = `path-line path-${pathType}`;
        el.style.setProperty("--path-color", color);
        cell.appendChild(el);
    }
    // rysowanie już zapisanych ścieżek
    const pathsByColor = new Map();
    cfg.path.forEach(p => {
        if (!pathsByColor.has(p.color))
            pathsByColor.set(p.color, []);
        pathsByColor.get(p.color).push({ r: p.row, c: p.col });
    });
    pathsByColor.forEach((path, color) => {
        path.forEach((pt, idx) => {
            const cell = grid.querySelector(`.cell[data-row="${pt.r}"][data-col="${pt.c}"]`);
            cell.classList.add("trail");
            const type = getPathType(idx, path);
            drawPathInCell(cell, type, color);
        });
    });
    function addPreview(r, c) {
        const k = key(r, c);
        if (drawSet.has(k))
            return;
        drawSet.add(k);
        drawPath.push({ r, c });
        const cell = grid.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        cell.classList.add("preview");
        const type = getPathType(drawPath.length - 1, drawPath);
        drawPathInCell(cell, type, activeColor);
    }
    function clearPreview() {
        grid.querySelectorAll(".preview").forEach(cell => {
            cell.classList.remove("preview");
            const p = cell.querySelector(".path-line");
            if (p)
                p.remove();
            // tło zostawiamy czarne
        });
        drawPath = [];
        drawSet.clear();
    }
    function updatePreviewPaths() {
        drawPath.forEach((pt, idx) => {
            const cell = grid.querySelector(`.cell[data-row="${pt.r}"][data-col="${pt.c}"]`);
            if (cell.classList.contains("preview")) {
                const type = getPathType(idx, drawPath);
                drawPathInCell(cell, type, activeColor);
            }
        });
    }
    // obsługa rysowania
    grid.addEventListener("mousedown", e => {
        const el = e.target.closest(".cell");
        if (!el || !el.classList.contains("marker") || el.classList.contains("used"))
            return;
        activeColor = el.dataset.markerColor;
        isDrawing = true;
        clearPreview();
        const r = +el.dataset.row;
        const c = +el.dataset.col;
        drawPath = [{ r, c }];
        drawSet = new Set([key(r, c)]);
        e.preventDefault();
    });
    grid.addEventListener("mouseover", e => {
        if (!isDrawing || !activeColor)
            return;
        const el = e.target.closest(".cell");
        if (!el)
            return;
        const r = +el.dataset.row;
        const c = +el.dataset.col;
        const k = key(r, c);
        const last = drawPath[drawPath.length - 1];
        // cofnij
        if (el.classList.contains("preview") && drawPath.length >= 2) {
            const penult = drawPath[drawPath.length - 2];
            if (r === penult.r && c === penult.c) {
                const rem = drawPath.pop();
                drawSet.delete(key(rem.r, rem.c));
                const rc = grid.querySelector(`.cell[data-row="${rem.r}"][data-col="${rem.c}"]`);
                rc.classList.remove("preview");
                const p = rc.querySelector(".path-line");
                if (p)
                    p.remove();
                updatePreviewPaths();
            }
            return;
        }
        if (!neighbors(last.r, last.c, r, c))
            return;
        if (busy.has(k) && !el.classList.contains("marker"))
            return;
        // zakończenie na drugim markerze
        if (el.classList.contains("marker") &&
            el.dataset.markerColor === activeColor &&
            !(drawPath[0].r === r && drawPath[0].c === c)) {
            drawPath.push({ r, c });
            drawPath.forEach((pt, idx) => {
                busy.add(key(pt.r, pt.c));
                const cc = grid.querySelector(`.cell[data-row="${pt.r}"][data-col="${pt.c}"]`);
                cc.classList.remove("preview");
                cc.classList.add("trail");
                const tp = getPathType(idx, drawPath);
                drawPathInCell(cc, tp, activeColor);
            });
            // oznacz markery
            [drawPath[0], drawPath[drawPath.length - 1]].forEach(pt => {
                const mc = grid.querySelector(`.cell[data-row="${pt.r}"][data-col="${pt.c}"]`);
                mc.classList.add("used");
            });
            isDrawing = false;
            usedColors.add(activeColor);
            drawPath.forEach(p => cfg.path.push({ row: p.r, col: p.c, color: activeColor }));
            return;
        }
        if (!busy.has(k)) {
            addPreview(r, c);
            updatePreviewPaths();
        }
    });
    document.addEventListener("mouseup", () => {
        if (isDrawing) {
            isDrawing = false;
            clearPreview();
        }
    });
    saveBt.addEventListener("click", () => {
        fetch(cfg.saveUrl, {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": cfg.csrf,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cells: cfg.path }),
        })
            .then(r => r.json())
            .then(() => {
            info.textContent = "✔ zapisano";
            setTimeout(() => (info.textContent = ""), 1500);
        })
            .catch(() => alert("Błąd zapisu"));
    });
}
//# sourceMappingURL=path_editor.js.map