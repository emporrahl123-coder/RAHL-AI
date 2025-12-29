// capabilities/calculator.js
const math = require('mathjs');

class Calculator {
    constructor() {
        this.name = "calculator";
        this.description = "Perform mathematical calculations";
    }
    
    execute(expression) {
        try {
            // Clean the expression
            const cleanExpression = expression.replace(/[^0-9+\-*/().^√πe!%]/g, '');
            
            // Calculate
            const result = math.evaluate(cleanExpression);
            
            return {
                success: true,
                expression: expression,
                result: result.toString(),
                formatted: this.formatResult(result),
                source: 'calculator'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                expression: expression
            };
        }
    }
    
    formatResult(result) {
        if (typeof result === 'number') {
            // Format large/small numbers
            if (Math.abs(result) > 1000000 || Math.abs(result) < 0.0001) {
                return result.toExponential(4);
            }
            // Format with appropriate decimal places
            return Number(result.toFixed(6)).toString();
        }
        return result.toString();
    }
    
    // Additional math functions
    calculateStatistics(data) {
        const mean = math.mean(data);
        const median = math.median(data);
        const std = math.std(data);
        
        return {
            mean,
            median,
            standardDeviation: std,
            min: math.min(data),
            max: math.max(data)
        };
    }
    
    solveEquation(equation) {
        try {
            const solutions = math.solve(equation);
            return {
                success: true,
                equation,
                solutions
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = Calculator;
