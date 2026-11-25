"use strict";

// 수식 토큰 분리
function tokenize(expression)
{
    const source = String(expression).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    if (source.length > 500)
    {
        throw new Error("계산식은 500자 이내로 입력해 주세요.");
    }

    const tokens = [];
    let index = 0;
    while (index < source.length)
    {
        const ch = source[index];
        if (/\s/.test(ch))
        {
            index += 1;
            continue;
        }

        const number = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
        if (number)
        {
            const value = Number(number[0]);
            if (!Number.isFinite(value))
            {
                throw new Error("숫자가 너무 큽니다.");
            }
            tokens.push({ type: "number", value });
            index += number[0].length;
            continue;
        }

        if (source.slice(index, index + 4).toLowerCase() === "sqrt")
        {
            tokens.push({ type: "sqrt" });
            index += 4;
            continue;
        }
        if (ch === "√")
        {
            tokens.push({ type: "sqrt" });
            index += 1;
            continue;
        }
        if ("+-*/^()%".includes(ch))
        {
            tokens.push({ type: ch });
            index += 1;
            continue;
        }
        throw new Error("숫자, 연산 기호와 sqrt만 입력해 주세요.");
    }

    tokens.push({ type: "end" });
    return tokens;
}

// 재귀 하강 방식 수식 해석
function calculateExpression(expression)
{
    const tokens = tokenize(expression);
    let index = 0;
    let depth = 0;

    function match(type)
    {
        if (tokens[index].type !== type)
        {
            return false;
        }
        index += 1;
        return true;
    }

    function finite(value)
    {
        if (!Number.isFinite(value))
        {
            throw new Error("실수 범위에서 계산할 수 없거나 결과가 너무 큽니다.");
        }
        return value;
    }

    function parseExpression()
    {
        depth += 1;
        if (depth > 64)
        {
            throw new Error("괄호와 연산을 조금 줄여 주세요.");
        }
        let value = parseTerm();
        while (true)
        {
            if (match("+"))
            {
                value = finite(value + parseTerm());
            }
            else if (match("-"))
            {
                value = finite(value - parseTerm());
            }
            else
            {
                break;
            }
        }
        depth -= 1;
        return value;
    }

    function parseTerm()
    {
        let value = parseUnary();
        while (true)
        {
            if (match("*"))
            {
                value = finite(value * parseUnary());
            }
            else if (match("/"))
            {
                const divisor = parseUnary();
                if (divisor === 0)
                {
                    throw new Error("0으로 나눌 수 없습니다.");
                }
                value = finite(value / divisor);
            }
            else
            {
                break;
            }
        }
        return value;
    }

    function parseUnary()
    {
        if (match("+"))
        {
            return parseUnary();
        }
        if (match("-"))
        {
            return -parseUnary();
        }
        return parsePower();
    }

    // 거듭제곱은 오른쪽부터 계산
    function parsePower()
    {
        let value = parsePostfix();
        if (match("^"))
        {
            value = finite(Math.pow(value, parseUnary()));
        }
        return value;
    }

    function parsePostfix()
    {
        let value = parsePrimary();
        while (match("%"))
        {
            value /= 100;
        }
        return value;
    }

    function parsePrimary()
    {
        const token = tokens[index];
        if (match("number"))
        {
            return token.value;
        }
        if (match("("))
        {
            const value = parseExpression();
            if (!match(")"))
            {
                throw new Error("닫는 괄호가 필요합니다.");
            }
            return value;
        }
        if (match("sqrt"))
        {
            const value = parsePrimary();
            if (value < 0)
            {
                throw new Error("음수의 제곱근은 실수로 계산할 수 없습니다.");
            }
            return Math.sqrt(value);
        }
        throw new Error("숫자 또는 올바른 괄호 안의 수식을 입력해 주세요.");
    }

    if (tokens[0].type === "end")
    {
        throw new Error("계산식을 입력해 주세요.");
    }

    const result = finite(parseExpression());
    if (tokens[index].type !== "end")
    {
        throw new Error("괄호와 연산 기호의 위치를 확인해 주세요.");
    }
    return Object.is(result, -0) ? 0 : result;
}

// 부동소수점 표시 정리
function formatResult(value)
{
    return String(Number(value.toPrecision(12)));
}

// Node.js 검증용 내보내기
if (typeof module !== "undefined" && module.exports)
{
    module.exports = { tokenize, calculateExpression, formatResult };
}

// 계산기 화면 이벤트 연결
function initializeCalculator()
{
    const input = document.getElementById("expression");
    const output = document.getElementById("result");
    const error = document.getElementById("error-message");
    const historyList = document.getElementById("history-list");
    const historyEmpty = document.getElementById("history-empty");
    const clearHistoryButton = document.getElementById("clear-history");
    let justCalculated = false;
    let lastResult = "0";
    let history = [];

    function focusInput(position)
    {
        input.focus({ preventScroll: true });
        const cursor = position === undefined ? input.value.length : position;
        input.setSelectionRange(cursor, cursor);
    }

    function clearError()
    {
        error.textContent = "";
        input.removeAttribute("aria-invalid");
    }

    function markEditing()
    {
        justCalculated = false;
        clearError();
        output.textContent = input.value.trim() ? "…" : "0";
    }

    function insertText(text)
    {
        let value = input.value;
        let start = input.selectionStart === null ? value.length : input.selectionStart;
        let end = input.selectionEnd === null ? value.length : input.selectionEnd;
        if (justCalculated)
        {
            value = /^(?:[\d.(]|sqrt)/.test(text) ? "" : lastResult;
            start = value.length;
            end = start;
        }
        const nextValue = value.slice(0, start) + text + value.slice(end);
        if (nextValue.length > input.maxLength)
        {
            error.textContent = "계산식은 500자 이내로 입력해 주세요.";
            return;
        }
        input.value = nextValue;
        markEditing();
        focusInput(start + text.length);
    }

    function clearInput()
    {
        input.value = "";
        justCalculated = false;
        lastResult = "0";
        output.textContent = "0";
        clearError();
        focusInput();
    }

    function backspace()
    {
        const start = input.selectionStart === null ? input.value.length : input.selectionStart;
        const end = input.selectionEnd === null ? input.value.length : input.selectionEnd;
        const from = start === end ? Math.max(0, start - 1) : start;
        input.value = input.value.slice(0, from) + input.value.slice(end);
        markEditing();
        focusInput(from);
    }

    // 기록은 수식 텍스트로 안전하게 표시
    function renderHistory()
    {
        historyList.replaceChildren();
        historyEmpty.hidden = history.length > 0;
        clearHistoryButton.disabled = history.length === 0;
        history.forEach(function (item)
        {
            const li = document.createElement("li");
            const button = document.createElement("button");
            const expression = document.createElement("span");
            const result = document.createElement("strong");
            button.type = "button";
            button.className = "history-item";
            button.setAttribute("aria-label", item.expression + " = " + item.result + " 다시 불러오기");
            expression.textContent = item.expression;
            result.textContent = "= " + item.result;
            button.append(expression, result);
            button.addEventListener("click", function ()
            {
                input.value = item.expression;
                output.textContent = item.result;
                lastResult = item.result;
                justCalculated = true;
                clearError();
                focusInput();
            });
            li.append(button);
            historyList.append(li);
        });
    }

    function calculate()
    {
        try
        {
            const expression = input.value.trim();
            const result = formatResult(calculateExpression(expression));
            output.textContent = result;
            lastResult = result;
            justCalculated = true;
            clearError();
            if (!history[0] || history[0].expression !== expression || history[0].result !== result)
            {
                history.unshift({ expression, result });
                history = history.slice(0, 5);
                renderHistory();
            }
        }
        catch (err)
        {
            output.textContent = "—";
            error.textContent = err.message;
            input.setAttribute("aria-invalid", "true");
            justCalculated = false;
        }
    }

    input.addEventListener("input", markEditing);
    document.getElementById("keypad").addEventListener("click", function (event)
    {
        const button = event.target.closest("button");
        if (!button)
        {
            return;
        }
        if (button.dataset.value !== undefined)
        {
            insertText(button.dataset.value);
            return;
        }
        switch (button.dataset.action)
        {
            case "clear":
                clearInput();
                break;
            case "backspace":
                backspace();
                break;
            case "square":
            case "negate":
            {
                const value = justCalculated ? lastResult : input.value;
                const nextValue = value
                    ? (button.dataset.action === "square" ? "(" + value + ")^2" : "-(" + value + ")")
                    : (button.dataset.action === "square" ? "" : "-");
                if (nextValue.length > input.maxLength)
                {
                    error.textContent = "계산식은 500자 이내로 입력해 주세요.";
                    return;
                }
                input.value = nextValue;
                markEditing();
                focusInput();
                break;
            }
            case "calculate":
                calculate();
                break;
        }
    });

    // 입력 위치와 관계없이 키보드 계산 지원
    document.addEventListener("keydown", function (event)
    {
        if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey)
        {
            return;
        }
        if (event.key === "Escape")
        {
            event.preventDefault();
            clearInput();
            return;
        }
        if (event.key === "=" || (event.key === "Enter" && (event.target === input || event.target === document.body)))
        {
            event.preventDefault();
            calculate();
            return;
        }
        if (event.target === input)
        {
            if (justCalculated && /^[0-9.+\-*/^()%]$/.test(event.key))
            {
                event.preventDefault();
                insertText(event.key);
            }
            return;
        }
        if (/^[0-9.+\-*/^()%]$/.test(event.key))
        {
            event.preventDefault();
            insertText(event.key);
        }
        else if (event.key === "Backspace")
        {
            event.preventDefault();
            backspace();
        }
    });

    document.getElementById("example-button").addEventListener("click", function ()
    {
        input.value = "2*(3+4)^2";
        markEditing();
        focusInput();
    });

    clearHistoryButton.addEventListener("click", function ()
    {
        history = [];
        renderHistory();
    });
}

if (typeof document !== "undefined")
{
    initializeCalculator();
}
