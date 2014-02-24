/*!
 * 求和函数处理器
 */

define( function ( require, exports, module ) {

    return function ( operatorName, unprocessedUnits, processedUnits ) {

        var sup = unprocessedUnits.shift(),
            sub = unprocessedUnits.shift(),
            exp = unprocessedUnits.shift();

        return {
            operator: operatorName,
            operand: [ exp, sup, sub ]
        };

    };

} );