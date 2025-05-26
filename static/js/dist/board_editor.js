var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function initBoardEditor(cfg) {
    const $ = (id) => document.getElementById(id);
    const nameInput = $("boardName");
    const nameErr = $("nameError");
    const rowsInput = $("rowsInput");
    const colsInput = $("colsInput");
    const grid = $("gridContainer");
    const palette = $("colorPalette");
    const activeLbl = $("currentColor");
    const genBtn = $("generateGrid");
    const saveBtn = $("saveBoard");
    let rows = +rowsInput.value, cols = +colsInput.value;
    const dots = [];
    const left = new Map();
    let activeColor = null;
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
    colors.forEach((c) => left.set(c, 2));
    colors.forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "color-btn";
        btn.dataset.color = c;
        btn.style.background = c;
        btn.innerHTML = '<span class="counter">2</span>';
        palette.appendChild(btn);
    });
    function setActive(col) {
        activeColor = col;
        // podświetlenie przycisków
        palette
            .querySelectorAll(".color-btn")
            .forEach((b) => b.classList.toggle("active", b.dataset.color === col));
        // zamiast tekstu, ustawiamy tło swatcha
        activeLbl.textContent = "";
        if (col) {
            activeLbl.style.backgroundColor = col;
        }
        else {
            activeLbl.style.backgroundColor = "transparent";
        }
    }
    palette.addEventListener("click", (e) => {
        const btn = e.target.closest(".color-btn");
        if (btn)
            setActive(btn.dataset.color);
    });
    function buildGrid() {
        rows = +rowsInput.value;
        cols = +colsInput.value;
        grid.innerHTML = "";
        grid.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
        grid.style.gridTemplateRows = `repeat(${rows}, var(--cell))`;
        const frag = document.createDocumentFragment();
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.row = "" + r;
                cell.dataset.col = "" + c;
                frag.appendChild(cell);
            }
        grid.appendChild(frag);
        dots.forEach((d) => placeDot(d.row, d.col, d.color));
    }
    function placeDot(r, c, color) {
        const cell = grid.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        cell.classList.add("dot");
        cell.style.color = color;
    }
    function updateCounter(col) {
        const span = palette.querySelector(`.color-btn[data-color="${col}"] .counter`);
        span.textContent = String(left.get(col));
    }
    function removeDot(cell) {
        const r = +cell.dataset.row, c = +cell.dataset.col;
        const idx = dots.findIndex((d) => d.row === r && d.col === c);
        const col = dots[idx].color;
        dots.splice(idx, 1);
        cell.classList.remove("dot");
        cell.style.color = "";
        left.set(col, left.get(col) + 1);
        updateCounter(col);
    }
    grid.addEventListener("click", (e) => {
        const cell = e.target.closest(".cell");
        if (!cell)
            return;
        if (cell.classList.contains("dot")) {
            removeDot(cell);
            return;
        }
        if (!activeColor)
            return;
        if (left.get(activeColor) === 0)
            return;
        const r = +cell.dataset.row, c = +cell.dataset.col;
        dots.push({ row: r, col: c, color: activeColor });
        left.set(activeColor, left.get(activeColor) - 1);
        updateCounter(activeColor);
        placeDot(r, c, activeColor);
        if (left.get(activeColor) === 0)
            setActive(null);
    });
    saveBtn.addEventListener("click", () => {
        nameErr.textContent = "";
        if (!nameInput.value.trim()) {
            nameErr.textContent = "Podaj nazwę";
            nameInput.focus();
            return;
        }
        fetch(cfg.saveUrl, {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": cfg.csrf,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: nameInput.value.trim(),
                rows,
                cols,
                dots,
            }),
        })
            .then((r) => __awaiter(this, void 0, void 0, function* () {
            const data = yield r.json().catch(() => ({}));
            if (!r.ok || data.ok === false)
                throw data;
            return data;
        }))
            .then((data) => {
            if (data.redirect) {
                location.href = data.redirect;
            }
            else {
                nameErr.textContent = "Zapisano ✓";
                setTimeout(() => (nameErr.textContent = ""), 2000);
            }
        })
            .catch((err) => {
            if (err.field === "name") {
                nameErr.textContent = err.msg || "Błąd nazwy";
                nameInput.focus();
            }
            else {
                nameErr.textContent = err.msg || "Błąd zapisu";
            }
        });
    });
    genBtn.addEventListener("click", buildGrid);
    buildGrid();
    if (cfg.initial) {
        nameInput.value = cfg.initial.name;
        rowsInput.value = cfg.initial.rows;
        colsInput.value = cfg.initial.cols;
        dots.push(...cfg.initial.dots);
        cfg.initial.dots.forEach((d) => left.set(d.color, left.get(d.color) - 1));
        buildGrid();
        colors.forEach(updateCounter);
    }
}
//# sourceMappingURL=board_editor.js.map