export function initPathEditor(cfg) {
    const $ = (id) => document.getElementById(id);
    const grid = $("grid");
    const pal = $("colorPalette");
    const curLbl = $("currentColor");
    const saveBt = $("savePath");
    const info = $("saveInfo");
    const colors = [
        "#ffd500",
        "#1e88ff",
        "#ff0040",
        "#00c77b",
        "#ff9900",
        "#9d4dff",
        "#00dadb",
        "#ff61ff",
    ];
    let active = null;
    const path = [...cfg.path];
    const key = (r, c) => `${r},${c}`;
    const busy = new Set();
    cfg.board.dots.forEach((d) => busy.add(key(d.row, d.col)));
    colors.forEach((c) => {
        const b = document.createElement("button");
        b.className = "color-btn";
        b.dataset.color = c;
        b.style.background = c;
        pal.appendChild(b);
    });
    const setActive = (c) => {
        active = c;
        curLbl.textContent = c !== null && c !== void 0 ? c : "–";
        curLbl.style.color = c !== null && c !== void 0 ? c : "";
        pal
            .querySelectorAll(".color-btn")
            .forEach((btn) => btn.classList.toggle("active", btn.dataset.color === c));
    };
    pal.addEventListener("click", (e) => {
        const btn = e.target.closest(".color-btn");
        if (btn)
            setActive(btn.dataset.color);
    });
    const { rows, cols, dots } = cfg.board;
    grid.className = "grid";
    grid.style.gridTemplate = `repeat(${rows},var(--cell)) / repeat(${cols},var(--cell))`;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            const d = document.createElement("div");
            d.className = "cell";
            d.dataset.row = "" + r;
            d.dataset.col = "" + c;
            grid.appendChild(d);
        }
    dots.forEach((d) => {
        const cell = sel(d.row, d.col);
        cell.classList.add("marker");
        cell.style.color = d.color;
    });
    path.forEach((s) => {
        const cell = sel(s.row, s.col);
        cell.classList.add("trail");
        cell.style.background = s.color;
        busy.add(key(s.row, s.col));
    });
    grid.addEventListener("click", (e) => {
        const cell = e.target.closest(".cell");
        if (!cell)
            return;
        const r = +cell.dataset.row, c = +cell.dataset.col, k = key(r, c);
        if (cell.classList.contains("marker"))
            return;
        if (cell.classList.contains("trail")) {
            cell.classList.remove("trail");
            cell.style.background = "";
            busy.delete(k);
            const idx = path.findIndex((p) => p.row === r && p.col === c);
            if (idx >= 0)
                path.splice(idx, 1);
            return;
        }
        if (!active)
            return;
        cell.classList.add("trail");
        cell.style.background = active;
        busy.add(k);
        path.push({ row: r, col: c, color: active });
    });
    saveBt.onclick = () => {
        fetch(cfg.saveUrl, {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": cfg.csrf,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cells: path }),
        })
            .then((r) => r.json())
            .then(() => {
            info.textContent = "✔ zapisano";
            setTimeout(() => (info.textContent = ""), 1500);
        })
            .catch(() => alert("Błąd zapisu"));
    };
    function sel(r, c) {
        return grid.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    }
}
//# sourceMappingURL=path_editor.js.map