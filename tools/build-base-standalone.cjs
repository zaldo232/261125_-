"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

// 기본 실습을 단일 HTML로 묶기
for (const config of [
    { folder: "profile", script: "script.js", replacements: [["../todo/index.html", "todo.html"]] },
    { folder: "todo", script: "app.js", replacements: [["../profile/index.html", "profile.html"], ["../calculator/index.html", "index.html"], ["./index.html", "todo.html"]] }
])
{
    const source = path.join(root, config.folder);
    const css = fs.readFileSync(path.join(source, "style.css"), "utf8");
    const js = fs.readFileSync(path.join(source, config.script), "utf8");
    let html = fs.readFileSync(path.join(source, "index.html"), "utf8")
        .replace('    <link rel="stylesheet" href="style.css">', () => "    <style>\n" + css + "\n    </style>")
        .replace(new RegExp('    <script src="' + config.script.replace(".", "\\.") + '"(?: defer)?></script>\\n'), "");
    for (const [from, to] of config.replacements)
    {
        html = html.replaceAll(from, to);
    }
    // 프로필 스크립트는 첫 화면의 테마를 먼저 설정
    html = config.folder === "profile"
        ? html.replace("</head>", () => "    <script>\n" + js + "\n    </script>\n</head>")
        : html.replace("</body>", () => "    <script>\n" + js + "\n    </script>\n</body>");
    fs.writeFileSync(path.join(root, config.folder + ".html"), html, "utf8");
    console.log(config.folder + ".html 생성 완료");
}
