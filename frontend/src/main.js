import "./styles/main.css";

import { initializeApp } from "./app/app.js";
import { observeState, renderApp } from "./ui/render.js";

async function main() {
    observeState();

    renderApp();

    await initializeApp();
}

document.addEventListener("DOMContentLoaded", main);