/*!
 * 装配器
 */

define( function ( require, exports, module ) {

    var CONSTRUCT_MAPPING = {},
        CURSOR_CHAR = "\uF155";

    function Assembly ( container, config ) {
        this.formula = new kf.Formula( container, config );
    }

    Assembly.prototype.generateBy = function ( data ) {

        var tree = data.tree,
            objTree = {},
            selectInfo = {},
            mapping = {};

        if ( typeof tree === "string" ) {

            objTree = new kf.TextExpression( tree );

            this.formula.appendExpression( objTree );

            //TODO return值统一

        } else {

            this.formula.appendExpression( generateExpression( tree, deepCopy( tree ), objTree, mapping, selectInfo ) );

            return {
                select: selectInfo,
                parsedTree: tree,
                tree: objTree,
                mapping: mapping
            };

        }

    };

    Assembly.prototype.regenerateBy = function ( data ) {

        this.formula.clear();
        return this.generateBy( data );

    };

    /**
     * 根据提供的树信息生成表达式
     * @param tree 中间格式的解析树
     * @return {kf.Expression} 生成的表达式
     */
    function generateExpression ( originTree, tree, objTree, mapping, selectInfo ) {

        var currentOperand = null,
            exp = null,
            hasCursor = false,
            operand = tree.operand || [],
            constructor = null,
            constructorProxy;

        objTree.operand = [];

        // 文本表达式已经不需要再处理了
        if ( tree.name.indexOf( "text" ) === -1 ) {

            // 处理操作数
            for ( var i = 0, j= 0, len = operand.length; j < len; j++ ) {

                currentOperand = operand[ j ];

                //TODO 光标定位， 配合编辑器， 后期应该考虑是否有更佳的方案来实现
                if ( currentOperand === CURSOR_CHAR ) {
                    hasCursor = true;
                    selectInfo.index = i;
                    if ( tree.attr && tree.attr.id ) {
                        selectInfo.groupId = tree.attr.id;
                    }
                    originTree.operand.splice( i, 1 );
                    continue;
                }

                if ( !currentOperand ) {

                    operand[ i ] = createObject( 'empty' );
                    objTree.operand.push( operand[ i ] );

                } else if ( typeof currentOperand === "string" ) {

                    operand[ i ] = createObject( 'text', currentOperand );
                    objTree.operand.push( operand[ i ] );

                } else {

                    objTree.operand.push( {} );
                    operand[ i ] = arguments.callee( originTree.operand[ i ], currentOperand, objTree.operand[ objTree.operand.length - 1 ], mapping, selectInfo );

                }

                i++;

            }

            if ( hasCursor ) {
                operand.length = operand.length - 1;
            }

        }

        constructor = getConstructor( tree.name );

        if ( !constructor ) {
            throw new Error( 'operator type error: not found ' + tree.operator );
        }

        constructorProxy = function () {};
        constructorProxy.prototype = constructor.prototype;
        exp = new constructorProxy();
        constructor.apply( exp, operand );

        objTree.func = exp;

        // 调用配置函数
        for ( var fn in tree.callFn ) {

            if ( !tree.callFn.hasOwnProperty( fn ) || !exp[ fn ] ) {
                continue;
            }

            exp[ fn ].apply( exp, tree.callFn[ fn ] );

        }

        if ( tree.attr ) {
            if ( tree.attr.id ) {
                mapping[ tree.attr.id ] = {
                    objGroup: exp,
                    strGroup: originTree
                };
            }
            exp.setAttr( tree.attr );
        }

        return exp;

    }

    function createObject ( type, value ) {

        switch ( type ) {

            case 'empty':
                return new kf.EmptyExpression();
            case 'text':
                return new kf.TextExpression( value );

        }

    }


    /**
     * 根据操作符获取对应的构造器
     */
    function getConstructor ( name ) {
        return CONSTRUCT_MAPPING[ name ] || kf[ name.replace( /^[a-z]/i, function ( match ) {
            return match.toUpperCase();
        } ).replace( /-([a-z])/gi, function ( match, char ) {
            return char.toUpperCase();
        } ) + "Expression" ];
    }

    function deepCopy ( source ) {

        var target = {};

        if ( ({}).toString.call( source ) === "[object Array]" ) {

            target = [];

            for ( var i = 0, len = source.length; i < len; i++ ) {

                target[ i ] = doCopy( source[ i ] );

            }

        } else {

            for ( var key in source ) {

                if ( !source.hasOwnProperty( key ) ) {
                    continue;
                }

                target[ key ] = doCopy( source[ key ] );

            }

        }

        return target;

    }

    function doCopy ( source ) {

        if ( !source ) {
            return source;
        }


        if ( typeof source !== "object" ) {
            return source;
        }

        return deepCopy( source );

    }

    return {
        use: function ( container, config) {
            return new Assembly( container, config );
        }
    };

} );
