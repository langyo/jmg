const compareObject = (obj, template) => {
    for (let i of Object.keys(template)) {
        if (template[i] instanceof RegExp) {
            if (!template[i].test(obj[i])) return false;
        } else if (template[i] instanceof Object) {
            if (!compareObject(obj[i], template[i])) return false;
        } else {
            if (template[i] !== obj[i]) return false;
        }
    }
    return true;
};

/**
 * 自定义标签列表：
 * 
 * MCSelector
 * MCSelectorArguments
 * MCIfStatement
 * MCUnlessStatement
 * MCWhileStatement
 * MCDoWhileStatement
 * MCForStatement
 * MCBinaryExpression               // 二元运算
 * MCNBTPath
 * MCAssignmentExpression           // 赋值
 * MCVariableDeclaration            // 定义、初始化
 * MCPosition
 * MCRound
 * MCInitialization                 // 在文件最外围的 "init" 或 "ticks"，分别用于表示初始化时执行的函数与随游戏刻循环运行的函数
 * MCCommandCall
 * MCScoreboardVariant
 * MCScoreboardVariantTransfrom     // 用在 data 指令的 byte, int 这些类型，以及放缩常量 scale
 */

const template = {
    selectors: {
        blockFromTo: {
            "type": "ExpressionStatement",
            "expression": {
                "type": "CallExpression",
                "callee": {
                    "type": "MemberExpression",
                    "object": {
                        "type": "CallExpression",
                        "callee": {
                            "type": "Identifier",
                            "name": "$from"
                        }
                    },
                    "computed": false,
                    "property": {
                        "type": "Identifier",
                        "name": "to"
                    }
                }
            }
        },
        blockAt: {
            "type": "ExpressionStatement",
            "expression": {
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "$at"
                }
            }
        }
    }
};

const templateEvaluator = ({
    selectors: {
        blockFromTo: n => ({
            type: "MCSelector",
            kind: 'fromTo',
            from: {
                x: dfs(n.expression.callee.arguments[0]),
                y: dfs(n.expression.callee.arguments[1]),
                z: dfs(n.expression.callee.arguments[2])
            },
            to: {
                x: dfs(n.arguments[0]),
                y: dfs(n.arguments[1]),
                z: dfs(n.arguments[2])
            }
        }),
        blockAt: n => ({
            type: "MCSelector",
            kind: 'at',
            at: {
                x: dfs(n.arguments[0]),
                y: dfs(n.arguments[1]),
                z: dfs(n.arguments[2])
            }
        })
    }
}).map(n => n.map(n => Object.assign(n, { fromMC: true })));

var dfs = n => {
    for (let i of Object.keys(template))
        for (let j of Object.keys(template[i]))
            if (compareObject(n, template[i][j])) return templateEvaluator[i][j](n);
    switch (n.type) {
        // ES5

        case 'Program':
        case 'BlockStatement':
        case 'FunctionBody':
        case 'LabeledStatement':
            n.body.map(n => dfs(n));
            return n;
        case 'Function':
            n.params.map(n => dfs(n));
            n.body = dfs(n.body);
            return n;
        case 'ExpressionStatement':
            n.expression = dfs(n.expression);
            return n;
        case 'WithStatement':
            n.object = dfs(n.object);
            n.body = dfs(n.body);
            return n;
        case 'ReturnStatement':
            n.arguments= dfs(n.arguments);
            return n;
        case 'VariableDeclaration':
            n.declarations = dfs(n.declarations);
            return n;
        case 'VariableDeclarator':
            n.init = dfs(n.init);
            n.id = dfs(n.id);
            return n;
        case 'ArrayExpression':
            n.elements.map(n => dfs(n));
            return n;
        case 'ObjectExpression':
            n.properties.map(n => dfs(n));
            return n;
        case 'Property':
            n.value = dfs(n.value);
            return n;
        case 'UnaryExpression':
        case 'UpdateExpression':
            n.argument = dfs(n.argument);
            return n;
        case 'BinaryExpression':
        case 'AssignmentExpression':
        case 'LogicalExpression':
            n.left = dfs(n.left);
            n.right = dfs(n.right);
            return n;
        case 'MemberExpression':
            n.object = dfs(n.object);
            n.property = dfs(n.property);
            return n;
        case 'ConditionalExpression':
            n.test = dfs(n.test);
            n.alternate = dfs(n.alternate);
            n.consequent = dfs(n.consequent);
            return n;
        case 'CallExpression':
        case 'NewExpression':
            n.callee = dfs(n.callee);
            n.arguments.map(n => dfs(n));
            return n;
        case 'SequenceExpression':
            n.expressions.map(n => dfs(n));
            return n;

        // ES2015

        case 'ArrowFunctionExpression':
            n.body = dfs(n.body);
            return n;
        case 'YieldExpression':
            n.argument = dfs(n.argument);
            return n;
        case 'TemplateLiteral':
            n.quasis.map(n => dfs(n));
            n.expressions.map(n => dfs(n));
            return n;
        case 'TaggedTemplateExpression':
            n.tag = dfs(n.tag);
            n.quasi = dfs(n.quasi);
            return n;
        case 'AssignmentProperty':
            n.value = dfs(n.value);
            return n;
        case 'ObjectPattern':
            n.properties.map(n => dfs(n));
            return n;
        case 'ArrayPattern':
            n.elements.map(n => dfs(n));
            return n;
        case 'RestElement':
            n.argument = dfs(n.argument);
            return n;
        case 'AssignmentPattern':
            n.left = dfs(n.left);
            n.right = dfs(n.right);
            return n;
        case 'ClassBody':
            n.body.map(n => dfs(n));
            return n;
        case 'MethodDefinition':
            n.key = dfs(n.key);
            n.value = dfs(n.value);
            return n;
    }
}