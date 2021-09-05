// origin https://gist.github.com/kmc7468/b07b82929030ca4a5ab8f77de67147d3 
// viral https://blog.naver.com/kmc7468/222494116955 

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
	= getMessageReceiver 
		`x에 대한 일차방정식을 입력하세요: ( 취소 : ESC / Cancel ) ` 

consoleTemplate `
일차방정식 계산 프로그램 
(C) 2021. kmc7468 All rights reserved. 

javascript by killofki 
주의사항: 괄호 앞/뒤에서 곱셈 연산자를 생략할 수 없습니다. 
주의사항: 변수는 x만 가능합니다. 

: error list : 
x*x=1
x*x=0
(x+1)*(x+x+2)=3

` 
	// -- consoleTemplate 

startPoint : while( true ) { 
	let equation = g_InputMessage() 
	consoleTemplate( equation ) 
	
	if ( isBreak( equation ) ) { 
		break startPoint 
		} // -- if isBreak 
	
	let result = ParseEquation( equation )
	if ( ! ( result instanceof Equation ) ) { 
		// maybe was error message 
		continue startPoint 
		} // -- if ! ParseEquation 
	
	let root = SolveEquation( result ) 
	; 
		root === Infinity 
			? 
				( consoleTemplate `해가 무수히 많습니다.` 
				, consoleTemplate `` 
				) 
		: Number .isNaN( root ) 
			? 
				( consoleTemplate `해가 없습니다.` 
				, consoleTemplate `` 
				) 
		
		: 
			( consoleTemplate `해는 x=${ root } 입니다.` 
			, consoleTemplate `` 
			) 
	
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
	let requireOn = RequireCharOn( context ) 
	
	context .Equation = equation 
	
	let lhs = new Equation 
	let rhs = new Equation 
	
	switch( true ) { 
		
		case ! ParseAddSub( context, lhs ) : 
			return false 
		
		case ! requireOn `=` : 
			return ErrorLPAt( context .Offset ) 
				`등호가 없습니다.` 
		
		case ! ParseAddSub( context, rhs ) : 
			return false 
		
		case context .Offset < equation .length : 
			return ErrorLPAt( context .Offset ) 
				`올바른 형식의 일차방정식이 아닙니다.` 
		
		} // -- switch true 
	
	let { Coefficient, Constant } = propMinus( lhs, rhs ) 
	Constant = -1 * Constant // rhs - lhs 
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

function RequireCharsOn( context ) { 
	let requireOn = RequireCharOn( context ) 
	
	return ( ... ar ) => { 
		let Cs = rawValue( ... ar ) 
		
		SkipEmptyChars( context ) 
		
		for ( let c of Cs ) { 
			if ( requireOn( c ) ) { 
				return true 
				} // -- if requireOn 
			} // -- for of Cs 
		return false 
		} // -- () // -- return 
	} // -- RequireCharsOn() 

function RequireCharOn( context ) { 
	return ( ... ar ) => { 
		let c = rawValue( ... ar ) 
		
		SkipEmptyChars( context ) 
		
		let { Offset, Equation } = context 
		
		if 
				(  Offset < Equation .length 
				&& Equation[ Offset ] === c 
				) { 
			context .Required = c 
			context .Offset += 1 
			
			return true 
			} // if < length 
		
		return false 
		} // -- () // -- return 
	} // -- RequireCharOn() 

function ErrorAt( offset ) { 
	let space = ' ' .repeat( offset ) 
	consoleTemplate `${ space }^` 
	} // -- ErrorAt() 

function ErrorLPAt( offset ) { 
	return ( ... ar ) => { 
		let reason = rawValue( ... ar ) 
		ErrorAt( offset ) 
		consoleTemplate `오류: ${ reason }` 
		consoleTemplate `` 
	
		return false 
		} // -- () // -- return 
	} // -- ErrorLPAt() 

function ErrorLP( offset, reason ) { 
	ErrorAt( offset ) 
	consoleTemplate `오류: ${ reason }` 
	consoleTemplate `` 
	
	return false 
	} // -- ErrorLP() 

function ParseAddSub( context, result ) { 
	if ( ! ParseMulDiv( context, result ) ) { 
		return false 
		} // -- if ! ParseMulDiv 
	
	let requiresOn = RequireCharsOn( context ) 
	
	while ( requiresOn `+-` ) { 
		const sign = context .Required === '+' ? 1 : -1 
		let rhs = new Equation 
		if ( ! ParseMulDiv( context, rhs ) ) { 
			return false 
			} // -- if ! ParseMulDiv 
		
		let signRhs = multiplyToProp( rhs, sign ) // lazy 
		let { Coefficient, Constant } = propPlus( signRhs, result ) // calling 
		
		Object .assign( result, { Coefficient, Constant } ) 
		} // -- while RequireCharsOn +- 
	
	return true 
	} // -- ParseAddSub() 

function ParseMulDiv( context, result ) { 
	if ( ! ParseParen( context, result ) ) { 
		return false 
		} // -- if ! ParseParen 
	
	let requiresOn = RequireCharsOn( context ) 
	
	inMultiply : while ( requiresOn `*/` ) { 
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
			return ErrorLPAt( context .Offset - 1 ) 
				`0으로 나눌 수 없습니다.` 
			} // -- else === -1 
		
		if 
				(  rhs .Coefficient != 0 
				&& result .Coefficient != 0 
				) { 
			checkRoot : { 
				const denRoot = - result .Constant / result .Coefficient 
				const numRem = rhs .Coefficient * denRoot + rhs .Constant 
				if ( numRem != 0 ) { 
					return ErrorLPAt( context .Offset - 1 ) 
						`곱셈/나눗셈의 결과가 일차식이 아닙니다.` 
					} // -- if != 0 
				} // -- checkRoot 
			
			let { Coefficient } = propDivide( result, rhs ) // 일차식/일차식 
			result .Constant = Coefficient 
			result .Coefficient = 0 
			continue inMultiply 
			} // -- if === -1 
		
		if 
				(  result .Coefficient === 0 
				&& rhs .Coefficient === 0 
				) { // 상수항*상수항 
			exp > 0 
				? ( result .Constant *= rhs .Constant ) 
				: ( result .Constant /= rhs .Constant ) 
			} // if 0 
		else if ( result .Coefficient === 0 ) { 
			let { Coefficient, Constant } 
				= multiplyToProp( rhs, result .Constant ) 
			Object .assign( result, { Coefficient, Constant } ) 
			} // -- else === 0 
		else { // 일차식*상수항 
			let { Coefficient, Constant } 
				= exp > 0 
					? multiplyToProp( result, rhs .Constant ) 
					: divideToProp( result, rhs .Constant ) 
			Object .assign( result, { Coefficient, Constant } ) 
			} // 0 else 
		
		continue inMultiply 
		} // -- while requiresOn 
	
	return true 
	} // -- ParseMulDiv() 

function ParseParen( context, result ) { 
	let requireOn = RequireCharOn( context ) 
	
	return ( 
		requireOn `(` 
			?  ParseAddSub( context, result ) 
			&& requireOn `)` 
		: ParseTerm( context, result ) 
		) // -- return 
	} // -- ParseParen() 

function ParseTerm( context, result ) { 
	let sign = 1 
	let requiresOn = RequireCharsOn( context ) 
	
	while ( requiresOn `+-` ) { 
		sign *= context .Required === '+' ? 1 : -1 
		} // -- while requiresOn +- 
	
	let { Equation } = context // here Equation is string 
	
	SkipEmptyChars( context ) 
	if ( context .Offset >= Equation .length ) { 
		return ErrorLPAt( context .Offset ) 
			`올바른 형식의 일차방정식이 아닙니다.` 
		} // -- if === length 
	
	let headChar = Equation[ context .Offset ] 
	if ( /\d/ .test( headChar ) ) { 
		let matching = /\d+(\.\d+)?/g 
		matching .lastIndex = context .Offset 
		
		let [ numberString ] = matching .exec( Equation ) 
		let number = sign * numberString 
		let distance = matching .lastIndex 
		context .Offset = distance 
		
		if 
				(  distance < Equation .length 
				&& Equation[ distance ] === 'x' 
				) { 
			result .Coefficient = number 
			context .Offset += 1 
			} // -- if === x 
		else { 
			result .Constant = number 
			} // -- x else 
		
		return true 
		} // -- if \d 
	
	if ( Equation[ context .Offset ] === 'x' ) { 
		result .Coefficient = sign 
		context .Offset += 1 
		
		return true 
		} // -- else if x 
	
	return ErrorLPAt( context .Offset ) 
		`올바른 형식의 일차방정식이 아닙니다.` 
	} // -- ParseTerm() 

function propPlus( left, right ) { 
	let get = ( t, prop ) => left[ prop ] + right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propPlus() 

function propMinus( left, right ) { 
	let get = ( t, prop ) => left[ prop ] - right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propMinus() 

function propMultiply( left, right ) { 
	let get = ( t, prop ) => left[ prop ] * right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propMultiply() 

function propDivide( left, right ) { 
	let get = ( t, prop ) => left[ prop ] / right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propDivide() 

function multiplyToProp( obj, multTime ) { 
	let get = ( t, prop ) => obj[ prop ] * multTime 
	
	return new Proxy( {}, { get } ) 
	} // -- multiplyToProp() 

function divideToProp( obj, multTime ) { 
	let get = ( t, prop ) => obj[ prop ] / multTime 
	
	return new Proxy( {}, { get } ) 
	} // -- divideToProp() 

function escapeC( c ) { 
	return escape( c ) 
		.replace( /[+*]/g, c => `%${ c .codePointAt() .toString `16` }` ) 
	} // -- escapeC() 

function searcherC( c ) { 
	let searchOrder = escapeC( c ) 
		.replace( /%(u?)/g, ( m, isU ) => isU ? `\\u` : `\\x` ) 
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
