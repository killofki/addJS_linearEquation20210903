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

let debugging // = true 

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
	
	let result 
	try { result = ParseEquation( equation ) } 
	catch( err ) { 
		console .error( err ) 
		} // -- catch 
	
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
			ErrorAt( context .Offset ) 
			throw `등호가 없습니다.` 
		
		case ! ParseAddSub( context, rhs ) : 
			return false 
		
		case context .Offset < equation .length : 
			ErrorAt( context .Offset ) 
			throw `올바른 형식의 일차방정식이 아닙니다.` 
		
		} // -- switch true 
	
	// equaling 
	let { Coefficient, Constant } = propMinus( lhs, rhs ) 
	Constant = -1 * Constant // rhs - lhs 
	let result = new Equation({ Coefficient, Constant }) 
	
	debugging 
		&& consoleTemplate `${ Coefficient }x = ${ Constant } // ParseEquation` 
	
	return result 
	} // -- ParseEquation() 

function SolveEquation( equation ) { 
	let { Coefficient, Constant } = equation 
	debugging 
		&& consoleTemplate `${ Coefficient }x = ${ Constant } // SolveEquation` 
	
	return ( 
		Coefficient === 0 
			? Constant === 0 ? Infinity : NaN 
			: Constant / Coefficient 
		) // -- return 
	} // -- SolveEquation() 

function SkipEmptyChars( context ) { 
	SkipEmptyChars 
		= matcherRail( /\s+/gy ) // lazy 
	
	return SkipEmptyChars( context ) // call 
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

function ParseAddSub( context, result ) { 
	if ( ! ParseMulDiv( context, result ) ) { 
		return false 
		} // -- if ! ParseMulDiv 
	
	let requiresOn = RequireCharsOn( context ) 
	
	inSumSub : while ( requiresOn `+-` ) { 
		const sign = context .Required === '+' ? 1 : -1 
		let rhs = new Equation 
		if ( ! ParseMulDiv( context, rhs ) ) { 
			return false 
			} // -- if ! ParseMulDiv 
		
		let signRhs = multiplyToProp( rhs, sign ) // lazy 
		let { Coefficient, Constant } = propPlus( signRhs, result ) // calling 
		
		debugging 
			&& consoleTemplate 
				`${ Coefficient }x + ${ Constant } // ParseAddSub` 
		
		Object .assign( result, { Coefficient, Constant } ) 
		} // -- while RequireCharsOn +- // -- inSumSub 
	
	return true 
	} // -- ParseAddSub() 

function ParseMulDiv( context, result ) { 
	if ( ! ParseParen( context, result ) ) { 
		return false 
		} // -- if ! ParseParen 
	
	let requiresOn = RequireCharsOn( context ) 
	
	inMultiply : while ( requiresOn `*/` ) { 
		const mulTo 
			= context .Required === '*' ? multiplyToProp 
			: divideToProp 
		
		let rhs = new Equation 
		if ( ! ParseParen( context, rhs ) ) { 
			return false 
			} // -- if ! ParseParen 
		
		checkDivide({ mulTo, rhs, context }) 
		checkMulDiv({ result, rhs, context }) 
		
		let resultNoCoefficient 
			=  result .Coefficient === 0 
			&& mulTo === multiplyToProp 
		
		let [ singleOrder, constOrder ] 
			=  resultNoCoefficient ? [ rhs, result ] 
			: [ result, rhs ] 
				// rhs have no Coefficient when mulTo <- divideToProp 
				// by checkDivide 
		
		let { Coefficient, Constant } 
			= mulTo( singleOrder, constOrder .Constant ) 
		
		debugging 
			&& consoleTemplate 
				`${ Coefficient }x + ${ Constant } // continue < ParseMulDiv` 
		
		Object .assign( result, { Coefficient, Constant } ) 
		
		continue inMultiply 
		} // -- while requiresOn 
	
	return true 
	} // -- ParseMulDiv() 

function ParseParen( context, result ) { 
	let requireOn = RequireCharOn( context ) 
	
	let getSigned = RequireCharsOn( context ) `+-` // receive just single sign 
	let preSign = getSigned ? context .Required : '' 
	
	let parenReceived 
		= requireOn `(` 
			?  ParseAddSub( context, result ) 
			&& requireOn `)` 
		: ParseTerm( context, result ) 
	
	if ( preSign === '-' ) { 
		let { Coefficient, Constant } = multiplyToProp( result, -1 ) 
		debugging 
			&& consoleTemplate 
				`${ Coefficient }x + ${ Constant } // ParseAddSub` 
		
		Object .assign( result, { Coefficient, Constant } ) 
		} // -- preOperator 
	
	return parenReceived 
	} // -- ParseParen() 

function checkDivide({ mulTo, rhs, context }) { 
	if ( mulTo !== divideToProp ) 
		{ return } 
	
	if ( rhs .Coefficient !== 0 ) { 
		ErrorAt( context .Offset - 1 ) 
		throw `일차식으로 나눌 수 없습니다.`  
		} // -- if !== 0 
		
	if ( rhs .Constant === 0 ) { 
		ErrorAt( context .Offset - 1 ) 
		throw `0으로 나눌 수 없습니다.` 
		} // -- if === 0 
	} // -- checkDivide() 

function checkMulDiv({ rhs, result, context }) { 
	let isNotSingleMul 
		=  rhs .Coefficient != 0 
		&& result .Coefficient != 0 
	if ( isNotSingleMul ) { 
		ErrorAt( context .Offset - 1 ) 
		throw `곱셈/나눗셈의 결과가 일차식이 아닙니다.` 
		} // -- if != 0 
	} // -- checkMulDiv() 

function ParseTerm( context, result ) { 
	let { X, number } = matchingNumberXAt( context ) 
	
	if ( X ) { 
		debugging 
			&& consoleTemplate `${ number }x // ParseTerm` 
		
		result .Coefficient = number 
		
		return true 
		} // -- if X 
	
	debugging 
		&& consoleTemplate `${ number } // ParseTerm` 
	
	result .Constant = number 
	
	return true 
	} // -- ParseTerm() 

function matchingNumberXAt( context ) { 
	let { Offset } = context 
	
	let matchingSign 
		= matcherRail( /\s*(?<signChars>[+-]+)/gy ) 
	let matchingNumberString 
		= matcherRail( /\s*(?<numberString>\d+(\.\d+)?)/gy ) 
	let matchingX 
		= matcherRail( /\s*(?<X>x)/gy ) 
	
	let { signChars = '' } = matchingSign( context ) ?.groups ?? {} 
	let { numberString } = matchingNumberString( context ) ?.groups ?? {} 
	let { X } = matchingX( context ) ?. groups ?? {} 
	
	let foundNumberX = numberString ?? X 
	if ( ! foundNumberX ) { 
		ErrorAt( Offset ) 
		throw `올바른 형식의 일차방정식이 아닙니다.` 
		} // -- if ! foundNumberX 
	
	numberString ??= '1' 
	
	let sign = 1 
	for ( let signChar of signChars ) { 
		sign *= `${ signChar }1` 
		} // -- for of signs 
	
	let number = sign * numberString 
	
	return { X, number } 
	} // -- matchingNumberXAt() 

function matcherRail( matcher ) { // must /()/gy 
	let railBody = 
		function getNext( context ) { 
			let { Offset, Equation } = context 
			
			matcher .lastIndex = Offset 
			let matched = matcher .exec( Equation ) 
			
			if ( matched ?.index === Offset ) { 
				context .Offset = matcher .lastIndex 
				
				return matched 
				} // -- if matched 
			} // -- getNext() 
	
	return railBody 
	} // -- matcherRail() 

function propPlus( left, right ) { 
	let get = ( t, prop ) => left[ prop ] + right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propPlus() 

function propMinus( left, right ) { 
	let get = ( t, prop ) => left[ prop ] - right[ prop ] 
	
	return new Proxy( {}, { get } ) 
	} // -- propMinus() 

function multiplyToProp( obj, multTime ) { 
	let get = ( t, prop ) => obj[ prop ] * multTime 
	
	return new Proxy( {}, { get } ) 
	} // -- multiplyToProp() 

function divideToProp( obj, multTime ) { 
	let get = ( t, prop ) => obj[ prop ] / multTime 
	
	return new Proxy( {}, { get } ) 
	} // -- divideToProp() 

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
