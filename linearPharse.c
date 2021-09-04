// origin https://gist.github.com/kmc7468/b07b82929030ca4a5ab8f77de67147d3 

/*
 * MIT License
 *
 * Copyright (c) 2021 kmc7468
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include <algorithm>
#include <cctype>
#include <cmath>
#include <cstddef>
#include <iostream>
#include <iterator>
#include <string>
#include <string_view>
#include <utility>

struct Equation {
	double Coefficient = 0;
	double Constant = 0;
};

bool ParseEquation(Equation& result, const std::string& equation);
double SolveEquation(Equation& equation);

struct ParseContext {
	std::string_view Equation;
	std::size_t Offset = 0;

	char Required = 0;
};

void SkipEmptyChars(ParseContext& context);
bool RequireChar(ParseContext& context, char c);
bool Error(std::size_t offset, const std::string_view& reason);

bool ParseAddSub(ParseContext& context, Equation& result);
bool ParseMulDiv(ParseContext& context, Equation& result);
bool ParseParen(ParseContext& context, Equation& result);
bool ParseTerm(ParseContext& context, Equation& result);

constexpr std::string_view g_InputMessage = "x에 대한 일차방정식을 입력하세요: ";

int main() {
	std::cout << "일차방정식 계산 프로그램\n"
		"(C) 2021. kmc7468 All rights reserved.\n"
		"주의사항: 괄호 앞/뒤에서 곱셈 연산자를 생략할 수 없습니다.\n\n";

startPoint:
	std::string equation;
	std::cout << g_InputMessage;
	std::getline(std::cin, equation);

	Equation result;
	if (!ParseEquation(result, equation)) goto startPoint;

	double root = SolveEquation(result);
	if (std::isinf(root)) {
		std::cout << "해가 무수히 많습니다.\n\n";
	} else if (std::isnan(root)) {
		std::cout << "해가 없습니다.\n\n";
	} else {
		std::cout << "해는 x=" << root << " 입니다.\n\n";
	}

	goto startPoint;
}

bool ParseEquation(Equation& result, const std::string& equation) {
	ParseContext context;
	context.Equation = equation;

	Equation lhs, rhs;
	if (!ParseAddSub(context, lhs)) return false;
	else if (!RequireChar(context, '=')) return Error(context.Offset, "등호가 없습니다.");
	else if (!ParseAddSub(context, rhs)) return false;
	else if (context.Offset < equation.size()) return Error(context.Offset, "올바른 형식의 일차방정식이 아닙니다.");

	result.Coefficient = lhs.Coefficient - rhs.Coefficient;
	result.Constant = rhs.Constant - lhs.Constant;

	return true;
}
double SolveEquation(Equation& equation) {
	if (equation.Coefficient == 0)
		if (equation.Constant == 0) return INFINITY;
		else return NAN;
	else return equation.Constant / equation.Coefficient;
}

void SkipEmptyChars(ParseContext& context) {
	while (context.Offset < context.Equation.size() && std::isspace(context.Equation[context.Offset])) {
		++context.Offset;
	}
}
bool RequireChar(ParseContext& context, char c) {
	SkipEmptyChars(context);

	if (context.Offset < context.Equation.size() && context.Equation[context.Offset] == c) {
		++context.Offset;
		context.Required = c;

		return true;
	} else return false;
}
bool Error(std::size_t offset, const std::string_view& reason) {
	std::cout << std::string(g_InputMessage.size() + offset, ' ') << "^\n";
	std::cout << "오류: " << reason << "\n\n";

	return false;
}

bool ParseAddSub(ParseContext& context, Equation& result) {
	if (!ParseMulDiv(context, result)) return false;

	while (RequireChar(context, '+') || RequireChar(context, '-')) {
		const double sign = context.Required == '+' ? 1 : -1;
		Equation rhs;
		if (!ParseMulDiv(context, rhs)) return false;

		result.Coefficient += sign * rhs.Coefficient;
		result.Constant += sign * rhs.Constant;
	}

	return true;
}
bool ParseMulDiv(ParseContext& context, Equation& result) {
	if (!ParseParen(context, result)) return false;

	while (RequireChar(context, '*') || RequireChar(context, '/')) {
		const double exp = context.Required == '*' ? 1 : -1;
		Equation rhs;
		if (!ParseParen(context, rhs)) return false;
		else if (exp == -1 && rhs.Coefficient == 0 && rhs.Constant == 0) return Error(context.Offset - 1, "0으로 나눌 수 없습니다.");

		if (exp == -1 && rhs.Coefficient != 0) {
			const double denRoot = -result.Constant / result.Coefficient;
			const double numRem = rhs.Coefficient * denRoot + rhs.Constant;
			if (numRem != 0) return Error(context.Offset - 1, "나눗셈의 결과가 일차식이 아닙니다.");

			result.Constant = result.Coefficient / rhs.Coefficient; // 일차식/일차식
			result.Coefficient = 0;
			continue;
		}

		if (result.Coefficient == 0 && rhs.Coefficient == 0) { // 상수항*상수항
			result.Constant *= std::pow(rhs.Constant, exp);
		} else if (result.Coefficient == 0) {
			result.Coefficient = result.Constant * rhs.Coefficient; // 상수항*일차식
			result.Constant *= std::pow(rhs.Constant, exp);
		} else { // 일차식*상수항
			result.Coefficient *= std::pow(rhs.Constant, exp);
			result.Constant *= std::pow(rhs.Constant, exp);
		}
	}

	return true;
}
bool ParseParen(ParseContext& context, Equation& result) {
	if (!RequireChar(context, '(')) return ParseTerm(context, result);
	else return ParseAddSub(context, result) && RequireChar(context, ')');
}
bool ParseTerm(ParseContext& context, Equation& result) {
	double sign = 1;
	while (RequireChar(context, '+') || RequireChar(context, '-')) {
		sign *= context.Required == '+' ? 1 : -1;
	}

	SkipEmptyChars(context);
	if (context.Offset == context.Equation.size()) return Error(context.Offset, "올바른 형식의 일차방정식이 아닙니다.");

	if (std::isdigit(context.Equation[context.Offset])) {
		auto end = std::find_if_not(context.Equation.begin() + context.Offset, context.Equation.end(), [](char c) { return std::isdigit(c); });
		if (end < context.Equation.end() && *end == '.') {
			end = std::find_if_not(end + 1, context.Equation.end(), [](char c) { return std::isdigit(c); });
		}

		const auto distance = static_cast<std::size_t>(std::distance(context.Equation.begin(), end));
		const double number = sign * std::stod(std::string(
			context.Equation.substr(context.Offset, distance - context.Offset)));
		context.Offset = distance;

		if (distance < context.Equation.size() && context.Equation[distance] == 'x') {
			result.Coefficient = number;
			++context.Offset;
		} else {
			result.Constant = number;
		}

		return true;
	} else if (context.Equation[context.Offset] == 'x') {
		result.Coefficient = sign;
		++context.Offset;

		return true;
	} else return Error(context.Offset, "올바른 형식의 일차방정식이 아닙니다.");
}