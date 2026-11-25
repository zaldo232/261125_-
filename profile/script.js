"use strict";

// 첫 화면에 저장된 테마 적용
let profileTheme = "light";
try
{
    const saved = localStorage.getItem("hsh-profile-theme");
    profileTheme = saved === "dark" || saved === "light"
        ? saved : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
catch (err)
{
    profileTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
document.documentElement.dataset.theme = profileTheme;

document.addEventListener("DOMContentLoaded", function ()
{
    const themeButton = document.getElementById("theme-toggle");

    // 테마 버튼 표시와 브라우저 색상 갱신
    function updateTheme()
    {
        document.documentElement.dataset.theme = profileTheme;
        themeButton.textContent = profileTheme === "dark" ? "☀ 라이트 모드" : "☾ 다크 모드";
        themeButton.setAttribute("aria-pressed", String(profileTheme === "dark"));
        document.querySelector('meta[name="theme-color"]').content = profileTheme === "dark" ? "#111926" : "#f4f6fa";
    }

    themeButton.addEventListener("click", function ()
    {
        profileTheme = profileTheme === "dark" ? "light" : "dark";
        try
        {
            localStorage.setItem("hsh-profile-theme", profileTheme);
        }
        catch (err)
        {
            // 저장이 제한되어도 테마 전환 유지
        }
        updateTheme();
    });
    updateTheme();

    // 인사말을 한 글자씩 표시
    const greeting = "안녕하세요,\n황성호입니다.";
    const typed = document.getElementById("typed-greeting");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    {
        let index = 0;
        typed.textContent = "";
        function typeNext()
        {
            typed.textContent = greeting.slice(0, index);
            index += 1;
            if (index <= greeting.length)
            {
                window.setTimeout(typeNext, 85);
            }
        }
        typeNext();
    }

    // 목표 체크 상태 복원과 저장
    const goals = document.querySelectorAll("[data-goal]");
    try
    {
        const saved = JSON.parse(localStorage.getItem("hsh-profile-goals") || "[]");
        if (Array.isArray(saved))
        {
            goals.forEach(function (goal, index) { goal.checked = saved[index] === true; });
        }
    }
    catch (err)
    {
        // 잘못된 저장값은 기본 체크 상태 사용
    }
    goals.forEach(function (goal)
    {
        goal.addEventListener("change", function ()
        {
            try
            {
                localStorage.setItem("hsh-profile-goals", JSON.stringify(Array.from(goals, function (item) { return item.checked; })));
            }
            catch (err)
            {
                // 저장이 제한되어도 체크 동작 유지
            }
        });
    });
});
