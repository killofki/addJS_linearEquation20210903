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

{ /// 

class Equation { 
	Coefficient = 0 
	Constant = 0 
	constructor( ... ar ) { Object .assign( this, ... ar ) } 
	} // -- Equation{} 

class ParseContext { 
	Equation 
	Offset = 0 
	
	Required 
	} // -- ParseContext{} 

let g_InputMessage 
	= getMessageReceiver `x에 대한 일차방정식을 입력하세요: ( 취소 : ESC / Cancel ) ` 

consoleTemplate `
일차방정식 계산 프로그램 
(C) 2021. kmc7468 All rights reserved. 
주의사항: 괄호 앞/뒤에서 곱셈 연산자를 생략할 수 없습니다. 
주의사항: 변수는 x만 가능합니다. 

` 
	// -- consoleTemplate 

startPoint : while( true ) { 
	let equation = g_InputMessage() 
	console .log( equation ) 
	
	if ( isBreak( equation ) ) { 
		break startPoint 
		} // -- if isBreak 
	
	let result = ParseEquation( equation )
	if ( ! ( result instanceof Equation ) ) { 
		continue startPoint 
		} // -- if ! ParseEquation 
	
	let root = SolveEquation( result ) 
	; 
		root === Infinity 
			? consoleTemplate `해가 무수히 많습니다.

` 
				// -- consoleTemplate 
		: Number .isNaN( root ) 
			? consoleTemplate `해가 없습니다.

` 
				// -- consoleTemplate 
		
		: consoleTemplate `해는 x=${ root } 입니다.

` 
			// -- consoleTemplate 
	
	continue startPoint 
	} // -- while true // -- startPoint 

// .. functions .. 

function isBreak( equation ) { 
	return ( 
		equation == null 
		|| equation .toUpperCase() === 'ESC' 
		|| equation === '취소' 
		|| equation .toLowerCase() === 'cancel' 
		) // -- return 
	} // -- isBreak() 

function ParseEquation( equation ) { 
	let context = new ParseContext 
	
	context .Equation = equation 
	
	let lhs = new Equation 
	let rhs = new Equation 
	
	switch( true ) { 
		
		case ! ParseAddSub( context, lhs ) : 
			return false 
		
		case ! RequireChar( context, '=' ) : 
			return ErrorLP( context .Offset, "등호가 없습니다." ) 
		
		case ! ParseAddSub( context, rhs ) : 
			return false 
		
		case context .Offset < equation .length : 
			return ErrorLP( context .Offset, "올바른 형식의 일차방정식이 아닙니다." ) 
		
		} // -- switch true 
	
	let { Coefficient, Constant } = propMinus( lhs, rhs ) 
	Constant = -Constant // rhs - lhs 
	let result = new Equation({ Coefficient, Constant }) 
	
	return result 
	} // -- ParseEquation() 

function SolveEquation( equation ) { 
	let { Coefficient, Constant } = equation 
	return ( 
		Coefficient === 0 
			? Constant === 0 ? Infinity : NaN 
			: Constant / Coefficient 
		) // -- return 
	} // -- SolveEquation() 

function SkipEmptyChars( context ) { 
	let matcher = /\s+/g 
	let { Offset, Equation } = context 
	
	matcher .lastIndex = Offset 
	let matched = matcher .exec( Equation ) 
	
	if ( matched ?.index === Offset ) { 
		context .Offset = matcher .lastIndex 
		} // -- if matched 
	} // -- SkipEmptyChars() 

function RequireChars( context, Cs ) { 
	SkipEmptyChars( context ) 
	
	for ( let c of Cs ) { 
		if ( RequireChar( context, c ) ) { 
			return true 
			} // -- if RequireChar 
		} // -- for of Cs 
	return false 
	} // -- RequireChars() 

function RequireChar( context, c ) { 
	SkipEmptyChars( context ) 
	
	let { Offset, Equation } = context 
	
	if 
			(  Offset < Equation .length 
			&& Equation[ Offset ] === c 
			) { 
		context .Offset += 1 
		context .Required = c 
		
		return true 
		} // if < length 
	
	return false 
	} // -- RequireChar() 

function ErrorLP( offset, reason ) { 
	let space = ' ' .repeat( offset ) 
	consoleTemplate `${ space }^` 
	consoleTemplate `오류: ${ reason }

` 
		// -- consoleTemplate 
	
	return false 
	} // -- ErrorLP() 

function ParseAddSub( context, result ) { 
	if ( ! ParseMulDiv( context, result ) ) { 
		return false 
		} // -- if ! ParseMulDiv 
	
	while ( RequireChars( context, '+-' ) ) { 
		const sign = context .Required === '+' ? 1 : -1 
		let rhs = new Equation 
		if ( ! ParseMulDiv( context, rhs ) ) { 
			return false 
			} // -- if ! ParseMulDiv 
		
		result .Coefficient += sign * rhs .Coefficient 
		result .Constant += sign * rhs .Constant 
		} // -- while RequireChars +- 
	
	return true; 
	} // -- ParseAddSub() 

function ParseMulDiv( context, result ) { 
	if ( ! ParseParen( context, result ) ) { 
		return false 
		} // -- if ! ParseParen 
	
	while ( RequireChars( context, '*/' ) ) { 
		const exp = context .Required === '*' ? 1 : -1 
		let rhs = new Equation 
		if ( ! ParseParen( context, rhs ) ) { 
			return false 
			} // -- if ! ParseParen 
		if 
				(  exp === -1 
				&& rhs .Coefficient === 0 
				&& rhs .Constant === 0 
				) { 
			return ErrorLP( context .Offset - 1, "0으로 나눌 수 없습니다." ) 
			} // -- else === -1 
		
		if 
				(  exp === -1 
				&& rhs .Coefficient != 0 
				) { 
			const denRoot = - result .Constant / result .Coefficient 
			const numRem = rhs .Coefficient * denRoot + rhs .Constant 
			if ( numRem != 0 ) { 
				return ErrorLP( context .Offset - 1, "나눗셈의 결과가 일차식이 아닙니다." ) 
				} // -- if != 0 
			
			let { Coefficient } = propDivide( result, rhs ) // 일차식/일차식 
			result .Constant = Coefficient 
			result .Coefficient = 0 
			continue 
			} // -- if === -1 
		
		if 
				(  result .Coefficient === 0 
				&& rhs .Coefficient === 0 
				) { // 상수항*상수항 
			result .Constant *= rhs .Constant ** exp 
			} // if 0 
		else if ( result .Coefficient === 0 ) { 
			let { Coefficient, Constant } = multToProp( rhs, result .Constant ) 
			Object .assign( result, { Coefficient, Constant } ) 
			} // -- else === 0 
		else { // 일차식*상수항 
			let { Coefficient, Constant } = multToProp( result, rhs .Constant ** exp ) 
			Object .assign( result, { Coefficient, Constant } ) 
			} // 0 else 
		} // -- while RequireChars 
	
	return true 
	} // -- ParseMulDiv() 

function ParseParen( context, result ) { 
	return ! RequireChar( context, '(' ) ? ParseTerm( context, result ) 
		: ParseAddSub( context, result ) && RequireChar( context, ')' ) 
	} // -- ParseParen() 

function ParseTerm( context, result ) { 
	let sign = 1 
	while ( RequireChars( context, '+-' ) ) { 
		sign *= context .Required === '+' ? 1 : -1 
		} // -- while RequireChar +- 
	
	SkipEmptyChars( context ) 
	if ( context .Offset >= context .Equation .length ) { 
		return ErrorLP( context .Offset, "올바른 형식의 일차방정식이 아닙니다." ) 
		} // -- if === length 
	
	if ( /\d/ .test( context .Equation[ context .Offset ] ) ) { 
		let matching = /\d+(\.\d+)?/g 
		matching .lastIndex = context .Offset 
		
		let [ numberString ] = matching .exec( context .Equation ) 
		let number = sign * numberString 
		let distance = matching .lastIndex 
		context .Offset = distance 
		
		if 
				(  distance < context .Equation .length 
				&& context .Equation[ distance ] === 'x' 
				) { 
			result .Coefficient = number 
			context .Offset += 1 
			} // -- if === x 
		else { 
			result .Constant = number 
			} // -- x else 
		
		return true 
		} // -- if \d 
	
	if ( context .Equation[ context .Offset ] === 'x' ) { 
		result .Coefficient = sign 
		context .Offset += 1 
		
		return true 
		} // -- else if x 
	
	return ErrorLP( context .Offset, "올바른 형식의 일차방정식이 아닙니다." ) 
	} // -- ParseTerm() 

function propMinus( left, right ) { 
	let get = ( t, prop ) => left[ prop ] - right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propMinus() 

function propDivide( left, right ) { 
	let get = ( t, prop ) => left[ prop ] - right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propDivide() 

function multToProp( obj, multTime ) { 
	let get = ( t, prop ) => obj[ prop ] * multTime 
	
	return new Proxy( {}, { get } ) 
	} // -- multedProp() 

function escapeC( c ) { 
	return escape( c ) .replace( /[+*]/g, c => `%${ c .codePointAt() .toString `16` }` ) 
	} // -- escapeC() 

function searcherC( c ) { 
	let searchOrder = escapeC( c ) .replace( /%(u?)/g, ( m, isU ) => isU ? `\\u` : `\\x` ) 
	let searcher = RegExp( searchOrder, 'g' ) 
	
	return searcher 
	} // -- searcherC() 

function getMessageReceiver( ... ar ) { 
	let order = rawValue( ... ar ) 
	return q => { 
		consoleTemplate( order ) 
		
		return prompt( order ) 
		} // -- () // -- return 
	} // -- getMessageReceiver()  

function consoleTemplate( ... ar ) { 
	let t = rawValue( ... ar ) 
	
	console .log( t ) 
	} // -- consoleTemplate() 

function rawValue( ... ar ) { 
	let [ rawo ] = ar 
	
	return rawo ?.raw ? String .raw( ... ar ) 
		: rawo 
	} // -- rawValue() 

} /// 
