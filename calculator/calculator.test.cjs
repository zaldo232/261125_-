"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateExpression, formatResult } = require("./app.js");

// 정상 수식과 연산 우선순위 검증
const validCases = [
    ["2*(3+4)^2", 98],
    ["2+3*4", 14],
    ["(2+3)*4", 20],
    ["18/3/2", 3],
    ["10-3-2", 5],
    ["2^3^2", 512],
    ["(2^3)^2", 64],
    ["2^-3", 0.125],
    ["-2^2", -4],
    ["(-2)^2", 4],
    ["--3", 3],
    ["2*-3", -6],
    ["sqrt(81)", 9],
    ["sqrt(9+7)", 4],
    ["sqrt(sqrt(81))", 3],
    ["√(49)", 7],
    ["sqrt(9)^2", 9],
    ["Sqrt(25)", 5],
    ["10%", 0.1],
    ["200*10%", 20],
    ["(50+50)%", 1],
    [".5+1.5", 2],
    [" 2 × (3 + 4) ÷ 2 ", 7],
    ["1e3+2.5e-1", 1000.25],
    ["-0", 0],
    ["5.", 5]
];

for (const [expression, expected] of validCases)
{
    test(expression + " = " + expected, function ()
    {
        assert.equal(calculateExpression(expression), expected);
    });
}

// 입력 오류와 실행 코드 차단 검증
const invalidCases = [
    "", " ", "1/0", "0/0", "sqrt(-1)", "(-2)^.5", "(1+2", "1+2)",
    "2+", "2**3", "2(3+4)", "1 2", "1..2", "sqrt()", "1e999", "1e308*1e308",
    "alert(1)", "globalThis.process.exit()", "constructor", "<script>",
    "(".repeat(65) + "1" + ")".repeat(65), "1".repeat(501)
];

for (const expression of invalidCases)
{
    test("invalid: " + expression.slice(0, 35), function ()
    {
        assert.throws(function () { calculateExpression(expression); }, Error);
    });
}

test("소수 표시 정리", function ()
{
    assert.equal(formatResult(calculateExpression("0.1+0.2")), "0.3");
    assert.equal(formatResult(calculateExpression("1/3")), "0.333333333333");
});

test("표시 결과를 다음 수식에서 재사용", function ()
{
    const result = formatResult(calculateExpression("1e30"));
    assert.equal(calculateExpression(result + "/1e30"), 1);
});
