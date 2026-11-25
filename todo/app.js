"use strict";

const STORAGE_KEY = "hsh-todo-v1";
let todos = [];
let currentFilter = "all";

const input = document.getElementById("todo-input");
const inputError = document.getElementById("input-error");
const storageStatus = document.getElementById("storage-status");
const list = document.getElementById("todo-list");

// 저장 목록 복원과 데이터 형식 확인
function loadTodos()
{
    try
    {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (!Array.isArray(saved))
        {
            throw new Error("잘못된 목록 형식");
        }
        const ids = new Set();
        todos = saved.filter(function (todo)
        {
            if (!todo || typeof todo.id !== "string" || typeof todo.text !== "string" || !todo.text.trim() || typeof todo.completed !== "boolean" || ids.has(todo.id))
            {
                return false;
            }
            ids.add(todo.id);
            return true;
        }).map(function (todo)
        {
            return { id: todo.id, text: todo.text, completed: todo.completed };
        });
    }
    catch (err)
    {
        todos = [];
        storageStatus.textContent = "저장한 목록을 불러오지 못했습니다. 브라우저 저장 설정을 확인해 주세요.";
    }
}

// 완료 상태를 포함한 전체 목록 저장
function saveTodos()
{
    try
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        storageStatus.textContent = "";
    }
    catch (err)
    {
        storageStatus.textContent = "목록을 저장하지 못했습니다. 브라우저 저장 설정을 확인해 주세요.";
    }
}

// 공백 입력을 제외하고 할 일 추가
function addTodo(event)
{
    if (event)
    {
        event.preventDefault();
    }
    const text = input.value.trim();
    if (!text)
    {
        inputError.textContent = "할 일을 입력해 주세요. 공백만 입력할 수는 없습니다.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
    }
    const id = window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    todos.push({ id: id, text: text, completed: false });
    input.value = "";
    inputError.textContent = "";
    input.removeAttribute("aria-invalid");
    saveTodos();
    render();
    input.focus({ preventScroll: true });
}

// 고유 ID로 완료 상태 변경
function toggleTodo(id)
{
    const todo = todos.find(function (item) { return item.id === id; });
    if (!todo)
    {
        return;
    }
    todo.completed = !todo.completed;
    saveTodos();
    render();
}

// 필터 목록의 순번 대신 고유 ID로 삭제
function deleteTodo(id)
{
    todos = todos.filter(function (todo) { return todo.id !== id; });
    saveTodos();
    render();
    input.focus({ preventScroll: true });
}

// 조회 필터 변경
function setFilter(filterType)
{
    if (!["all", "active", "completed"].includes(filterType))
    {
        return;
    }
    currentFilter = filterType;
    render();
}

// 상태 배열을 기준으로 목록과 현황 갱신
function render()
{
    const focusedId = document.activeElement && document.activeElement.id;
    const activeCount = todos.filter(function (todo) { return !todo.completed; }).length;
    const completedCount = todos.length - activeCount;
    const percentage = todos.length ? Math.round(completedCount / todos.length * 100) : 0;
    document.getElementById("total-count").textContent = todos.length;
    document.getElementById("active-count").textContent = activeCount;
    document.getElementById("completed-count").textContent = completedCount;
    document.getElementById("remaining-count").textContent = "남은 할 일 " + activeCount + "개";
    document.getElementById("completion-progress").value = percentage;
    document.getElementById("completion-progress").textContent = percentage + "%";
    document.getElementById("progress-label").textContent = percentage + "%";
    document.querySelectorAll("[data-filter]").forEach(function (button)
    {
        button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
    });

    const filtered = todos.filter(function (todo)
    {
        return currentFilter === "all" || (currentFilter === "completed" ? todo.completed : !todo.completed);
    });
    list.replaceChildren();
    filtered.forEach(function (todo)
    {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        const label = document.createElement("label");
        const button = document.createElement("button");
        li.className = "todo-item" + (todo.completed ? " completed" : "");
        checkbox.type = "checkbox";
        checkbox.id = "check-" + todo.id;
        checkbox.className = "todo-check";
        checkbox.checked = todo.completed;
        checkbox.addEventListener("change", function () { toggleTodo(todo.id); });
        label.className = "todo-text";
        label.htmlFor = checkbox.id;
        label.textContent = todo.text;
        button.type = "button";
        button.className = "delete-button";
        button.textContent = "삭제";
        button.setAttribute("aria-label", todo.text + " 삭제");
        button.addEventListener("click", function () { deleteTodo(todo.id); });
        li.append(checkbox, label, button);
        list.append(li);
    });

    document.getElementById("empty-state").hidden = filtered.length > 0;
    document.getElementById("empty-heading").textContent = currentFilter === "all"
        ? "첫 번째 할 일을 적어보세요." : (currentFilter === "active" ? "진행중인 할 일이 없어요." : "아직 완료한 할 일이 없어요.");
    document.getElementById("empty-description").textContent = currentFilter === "active"
        ? "완료한 일은 완료 탭에서 다시 볼 수 있어요." : "작은 일부터 시작해도 괜찮아요.";
    if (focusedId && focusedId.startsWith("check-"))
    {
        const checkbox = document.getElementById(focusedId);
        if (checkbox)
        {
            checkbox.focus({ preventScroll: true });
        }
        else
        {
            document.querySelector('[data-filter="' + currentFilter + '"]').focus({ preventScroll: true });
        }
    }
}

// 입력과 필터 이벤트 연결
document.getElementById("todo-form").addEventListener("submit", addTodo);
input.addEventListener("input", function ()
{
    inputError.textContent = "";
    input.removeAttribute("aria-invalid");
});
document.querySelectorAll("[data-filter]").forEach(function (button)
{
    button.addEventListener("click", function () { setFilter(button.dataset.filter); });
});
document.getElementById("today-date").textContent = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long", timeZone: "Asia/Seoul"
}).format(new Date());

loadTodos();
render();
