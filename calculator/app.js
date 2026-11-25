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
