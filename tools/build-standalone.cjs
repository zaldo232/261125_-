"use strict";

const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "calculator");
const css = fs.readFileSync(path.join(source, "style.css"), "utf8");
const js = fs.readFileSync(path.join(source, "app.js"), "utf8");

// 스타일과 동작을 단일 HTML로 묶기
const html = fs.readFileSync(path.join(source, "index.html"), "utf8")
    .replace('    <link rel="stylesheet" href="style.css">', "    <style>\n" + css + "\n    </style>")
    .replace('    <script src="app.js" defer></script>\n', "")
    .replace('href="./index.html"', 'href="#page-title"')
    .replace("</body>", "    <script>\n" + js + "\n    </script>\n</body>");

fs.writeFileSync(path.join(root, "index.html"), html, "utf8");
console.log("index.html 생성 완료");
