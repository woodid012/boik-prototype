import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Box, TrendingUp, Plus, X, Hash, ArrowUp, ArrowDown, SigmaSquare, Calculator } from 'lucide-react';

const CalculationBuilder = () => {
  //---------------------------------------------------
  // State Management
  //---------------------------------------------------
  const [formula, setFormula] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);
  const [expandedSeries, setExpandedSeries] = useState({});
  const [constants, setConstants] = useState([]);
  const [newConstant, setNewConstant] = useState({ label: '', value: '' });

  //---------------------------------------------------
  // Data Configuration
  //---------------------------------------------------
  // Time Series Data
  const timeSeriesData = [
    { 
      id: 'series_a', 
      name: 'A', 
      type: 'timeseries', 
      Icon: Box,
      values: {
        '01/01/23': 23,
        '01/04/23': 24,
        '01/07/23': 25,
        '01/10/23': 26,
        '01/01/24': 27,
        '01/04/24': 28,
        '01/07/24': 29,
        '01/10/24': 30
      }
    },
    { 
      id: 'series_b', 
      name: 'B', 
      type: 'timeseries', 
      Icon: Box,
      values: {
        '01/01/23': 45,
        '01/04/23': 46,
        '01/07/23': 47,
        '01/10/23': 48,
        '01/01/24': 49,
        '01/04/24': 50,
        '01/07/24': 51,
        '01/10/24': 52
      }
    }
  ];

  // Available Operations Configuration
  const operations = [
    { id: 'multiply', symbol: '×', Icon: Plus, maxInputs: 2 },
    { id: 'add', symbol: '+', Icon: Plus, maxInputs: 2 },
    { id: 'subtract', symbol: '-', Icon: TrendingUp, maxInputs: 2 },
    { id: 'sum', symbol: 'Σ', Icon: SigmaSquare, maxInputs: 4 },
    { id: 'max', symbol: 'max', Icon: ArrowUp, maxInputs: 2 },
    { id: 'min', symbol: 'min', Icon: ArrowDown, maxInputs: 2 }
  ];

  // Icon Mapping for UI Components
  const iconMap = {
    Plus, TrendingUp, Hash, ArrowUp, ArrowDown, SigmaSquare, Box, DollarSign
  };

  //---------------------------------------------------
  // UI Event Handlers
  //---------------------------------------------------
  const toggleSeriesExpansion = (seriesId) => {
    setExpandedSeries(prev => ({
      ...prev,
      [seriesId]: !prev[seriesId]
    }));
  };

  //---------------------------------------------------
  // Calculation Logic
  //---------------------------------------------------
  const calculateFormulaForYear = (operation, date) => {
    if (!operation) return null;
    if (!operation.inputs || operation.inputs.length === 0) return null;

    // Get values from inputs for the specific date
    const values = operation.inputs.map(input => {
      if (!input) return null;
      if (input.type === 'timeseries') return input.values[date];
      if (input.type === 'constant') return input.value;
      if (input.symbol) return calculateFormulaForYear(input, date);
      return null;
    }).filter(val => val !== null);

    // Perform calculation based on operation type
    switch (operation.symbol) {
      case '+':
        return values.reduce((a, b) => a + b, 0);
      case '×':
        return values.reduce((a, b) => a * b, 1);
      case '-':
        return values[0] - (values[1] || 0);
      case 'Σ':
        return values.reduce((a, b) => a + b, 0);
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return null;
    }
  };

  const handleCalculate = () => {
    if (formula.length === 0) {
      setCalculationResult('No formula to calculate');
      return;
    }

    const dates = [
      '01/01/23', '01/04/23', '01/07/23', '01/10/23',
      '01/01/24', '01/04/24', '01/07/24', '01/10/24'
    ];

    const results = dates.reduce((acc, date) => {
      acc[date] = calculateFormulaForYear(formula[0], date);
      return acc;
    }, {});

    setCalculationResult(results);
  };

  //---------------------------------------------------
  // Drag and Drop Handlers
  //---------------------------------------------------
  const onDragStart = (e, item) => {
    e.dataTransfer.setData('item', JSON.stringify({
      ...item,
      Icon: item.Icon.name
    }));
  };

  const onDropOperation = (e) => {
    e.preventDefault();
    const itemData = JSON.parse(e.dataTransfer.getData('item'));
    if (itemData.symbol) {
      const operation = {
        ...itemData,
        Icon: iconMap[itemData.Icon],
        inputs: [],
        id: `op_${Date.now()}`
      };
      setFormula(prev => [...prev, operation]);
    }
  };

  const onDropInput = (e, operationId, inputIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const itemData = JSON.parse(e.dataTransfer.getData('item'));
    
    const input = itemData.symbol ? {
      ...itemData,
      Icon: iconMap[itemData.Icon],
      inputs: [],
      id: `op_${Date.now()}`
    } : {
      ...itemData,
      Icon: iconMap[itemData.Icon]
    };

    const updateOperationInputs = (operations) => 
      operations.map(op => {
        if (op.id === operationId) {
          const newInputs = [...op.inputs];
          newInputs[inputIndex] = input;
          return { ...op, inputs: newInputs };
        }
        if (op.inputs) {
          return { ...op, inputs: updateOperationInputs(op.inputs) };
        }
        return op;
      });

    setFormula(updateOperationInputs(formula));
  };

  //---------------------------------------------------
  // Formula Modification Handlers
  //---------------------------------------------------
  const removeInput = (operationId, inputIndex) => {
    setFormula(prev => 
      prev.map(op => {
        if (op.id === operationId) {
          const newInputs = [...op.inputs];
          newInputs[inputIndex] = null;
          return { ...op, inputs: newInputs };
        }
        if (op.inputs) {
          return { ...op, inputs: op.inputs.map(input => 
            input?.inputs ? { ...input, inputs: removeInput(input.inputs) } : input
          )};
        }
        return op;
      })
    );
  };

  const removeOperation = (operationId) => {
    setFormula(prev => 
      prev.filter(op => op.id !== operationId)
        .map(op => ({
          ...op,
          inputs: op.inputs ? op.inputs.map(input => 
            input?.inputs ? { ...input, inputs: removeOperation(input.inputs) } : input
          ) : []
        }))
    );
  };

  //---------------------------------------------------
  // UI Helper Components & Functions
  //---------------------------------------------------
  const renderIcon = (IconComponent) => 
    IconComponent ? <IconComponent className="w-4 h-4 mr-2" /> : null;

  const DataSourceItem = ({ item, onDragStart }) => (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDoubleClick={() => toggleSeriesExpansion(item.id)}
      className="flex items-center p-2 rounded cursor-move bg-yellow-50 hover:bg-yellow-100 border border-yellow-200"
    >
      {renderIcon(item.Icon)}
      <span className="font-medium">Series {item.name}</span>
      {expandedSeries[item.id] && (
        <div className="ml-2 text-sm text-gray-600">
          {Object.entries(item.values).map(([date, value]) => (
            <div key={date}>{date}: {value}</div>
          ))}
        </div>
      )}
    </div>
  );

  const OperationBox = ({ operation, onDropInput, onRemoveInput, onRemoveOperation }) => {
    const renderInput = (input, index) => {
      if (!input) {
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            Drop input here
          </div>
        );
      }

      return input.symbol ? (
        <OperationBox
          operation={input}
          onDropInput={onDropInput}
          onRemoveInput={onRemoveInput}
          onRemoveOperation={() => onRemoveInput(operation.id, index)}
        />
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {renderIcon(input.Icon)}
            <span>Series {input.name}</span>
          </div>
          <button
            onClick={() => onRemoveInput(operation.id, index)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    };

    return (
      <div className="relative p-4 bg-white rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-between mb-2 pb-2 border-b">
          <div className="flex items-center">
            {renderIcon(operation.Icon)}
            <span className="font-semibold">{operation.symbol}</span>
          </div>
          <button
            onClick={() => onRemoveOperation(operation.id)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: operation.maxInputs }).map((_, index) => (
            <div
              key={index}
              onDrop={(e) => onDropInput(e, operation.id, index)}
              onDragOver={(e) => e.preventDefault()}
              className={`p-2 rounded border-2 border-dashed
                ${operation.inputs[index] ? 'border-gray-300 bg-gray-50' : 'border-gray-300 bg-gray-100'}
                ${operation.inputs[index]?.symbol ? 'p-0 border-0' : ''}`}
            >
              {renderInput(operation.inputs[index], index)}
            </div>
          ))}
        </div>
      </div>
    );
  };
  // (keeping all the existing functions and data)

  return (
    <Card className="w-full max-w-6xl">
      <CardContent className="pt-6">
        <div className="grid grid-cols-5 gap-4">
          {/* Time Series and Constants Panel */}
          <div className="border rounded p-4">
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Time Series</h4>
              <div className="space-y-2">
                {timeSeriesData.map(series => (
                  <DataSourceItem key={series.id} item={series} onDragStart={onDragStart} />
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Double-click a series to view values
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Constants</h4>
              <div className="space-y-2 mb-4">
                {constants.map((constant, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => onDragStart(e, {
                      id: `constant_${index}`,
                      name: constant.label,
                      type: 'constant',
                      Icon: Hash,
                      value: parseFloat(constant.value)
                    })}
                    className="flex items-center p-2 rounded cursor-move bg-green-50 hover:bg-green-100 border border-green-200"
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    <span className="font-medium">{constant.label}</span>
                    <span className="ml-2 text-sm text-gray-600">{constant.value}</span>
                  </div>
                ))}
              </div>
              
              {/* Add New Constant Form */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Label"
                  value={newConstant.label}
                  onChange={(e) => setNewConstant(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Value"
                  value={newConstant.value}
                  onChange={(e) => setNewConstant(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={() => {
                    if (newConstant.label && newConstant.value) {
                      setConstants(prev => [...prev, { ...newConstant }]);
                      setNewConstant({ label: '', value: '' });
                    }
                  }}
                  className="w-full px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Add Constant
                </button>
              </div>
            </div>
          </div>

          {/* Operations Panel */}
          <div className="border rounded p-4">
            <h3 className="font-bold mb-4">Operations</h3>
            <div className="space-y-2">
              {operations.map(op => (
                <div
                  key={op.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, op)}
                  className="flex items-center p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100"
                >
                  {renderIcon(op.Icon)}
                  {op.symbol}
                </div>
              ))}
            </div>
          </div>

          {/* Formula Building Area */}
          <div className="border rounded p-4 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Current Formula</h3>
              <button
                onClick={handleCalculate}
                className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Calculator className="w-4 h-4 mr-1" />
                Calculate
              </button>
            </div>
            
            <div 
              className="min-h-48 bg-gray-50 rounded p-4"
              onDrop={onDropOperation}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="space-y-4">
                {formula.map((op) => (
                  <OperationBox
                    key={op.id}
                    operation={op}
                    onDropInput={onDropInput}
                    onRemoveInput={removeInput}
                    onRemoveOperation={removeOperation}
                  />
                ))}
                {formula.length === 0 && (
                  <div className="text-gray-400 italic text-center">
                    Drag operations here to start building your formula
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="border rounded p-4">
            <h3 className="font-bold mb-4">Results</h3>
            <div className="bg-gray-50 rounded p-4">
              {calculationResult ? (
                typeof calculationResult === 'string' ? (
                  <div className="text-center">{calculationResult}</div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(calculationResult).map(([date, value]) => (
                      <div key={date} className="flex justify-between">
                        <span className="font-medium">{date}:</span>
                        <span>{value && value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-gray-400 italic text-center">
                  Calculate a formula to see results
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalculationBuilder;