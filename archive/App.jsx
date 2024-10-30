import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Box, TrendingUp, Plus, X, Hash, ArrowUp, ArrowDown, SigmaSquare } from 'lucide-react';

const CalculationBuilder = () => {
  const [formula, setFormula] = useState([]);
  const [constants, setConstants] = useState([]);
  const [showConstantForm, setShowConstantForm] = useState(false);
  const [constantInput, setConstantInput] = useState({ name: '', value: '' });

  // Predefined data moved outside component for better performance
  const marketData = [
    { id: 'actual_volume', name: 'Actual Volume', type: 'volume', Icon: Box },
    { id: 'actual_price', name: 'Actual Price', type: 'price', Icon: DollarSign },
    { id: 'forecast_volume', name: 'Forecast Volume', type: 'volume', Icon: Box },
    { id: 'forecast_price', name: 'Forecast Price', type: 'price', Icon: DollarSign }
  ];

  const indexData = [
    { id: 'inflation_index', name: 'Inflation Index', type: 'index', Icon: TrendingUp }
  ];

  const operations = [
    { id: 'multiply', symbol: '×', Icon: Plus, maxInputs: 2 },
    { id: 'add', symbol: '+', Icon: Plus, maxInputs: 2 },
    { id: 'subtract', symbol: '-', Icon: TrendingUp, maxInputs: 2 },
    { id: 'sum', symbol: 'Σ', Icon: SigmaSquare, maxInputs: 4 },
    { id: 'max', symbol: 'max', Icon: ArrowUp, maxInputs: 2 },
    { id: 'min', symbol: 'min', Icon: ArrowDown, maxInputs: 2 }
  ];

  const iconMap = {
    Plus, TrendingUp, Hash, ArrowUp, ArrowDown, SigmaSquare, Box, DollarSign
  };

  const createConstant = () => {
    if (!constantInput.name || !constantInput.value) return;
    
    const newConstant = {
      id: `const_${Date.now()}`,
      name: constantInput.name,
      value: Number(constantInput.value),
      type: 'constant',
      Icon: Hash
    };
    setConstants(prev => [...prev, newConstant]);
    setConstantInput({ name: '', value: '' });
    setShowConstantForm(false);
  };

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

  const renderIcon = (IconComponent) => 
    IconComponent ? <IconComponent className="w-4 h-4 mr-2" /> : null;

  const DataSourceItem = ({ item, onDragStart }) => (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className={`flex items-center p-2 rounded cursor-move ${
        item.type === 'constant' 
          ? 'bg-green-50 hover:bg-green-100 border border-green-200'
          : item.type === 'index'
          ? 'bg-purple-50 hover:bg-purple-100'
          : 'bg-blue-50 hover:bg-blue-100'
      }`}
    >
      {renderIcon(item.Icon)}
      <span className="font-medium">{item.name}</span>
      {item.type === 'constant' && (
        <>
          <span className="ml-2 text-sm text-gray-600">({item.value})</span>
          <button
            onClick={() => setConstants(prev => prev.filter(c => c.id !== item.id))}
            className="ml-auto text-red-600 hover:text-red-800 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </>
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
            <span>{input.name}</span>
            {input.type === 'constant' && ` (${input.value})`}
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

  const ConstantForm = () => (
    <div className="mb-2 p-2 bg-gray-50 rounded shadow">
      <input
        type="text"
        placeholder="Label"
        value={constantInput.name}
        onChange={(e) => setConstantInput(prev => ({ ...prev, name: e.target.value }))}
        className="w-full mb-2 p-1 border rounded"
      />
      <input
        type="number"
        placeholder="Value"
        value={constantInput.value}
        onChange={(e) => setConstantInput(prev => ({ ...prev, value: e.target.value }))}
        className="w-full mb-2 p-1 border rounded"
      />
      <button
        onClick={createConstant}
        className="w-full px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
      >
        Create Constant
      </button>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl">
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Data Sources Panel */}
          <div className="border rounded p-4">
            {/* Market Data Section */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Market Data</h4>
              <div className="space-y-2">
                {marketData.map(source => (
                  <DataSourceItem key={source.id} item={source} onDragStart={onDragStart} />
                ))}
              </div>
            </div>

            {/* Index Series Section */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Index Series</h4>
              <div className="space-y-2">
                {indexData.map(index => (
                  <DataSourceItem key={index.id} item={index} onDragStart={onDragStart} />
                ))}
              </div>
            </div>

            {/* Constants Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Constants</h4>
                <button
                  onClick={() => setShowConstantForm(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {showConstantForm && <ConstantForm />}

              <div className="space-y-2">
                {constants.map(constant => (
                  <DataSourceItem key={constant.id} item={constant} onDragStart={onDragStart} />
                ))}
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
          <div 
            className="border rounded p-4 min-h-48 bg-gray-50"
            onDrop={onDropOperation}
            onDragOver={(e) => e.preventDefault()}
          >
            <h3 className="font-bold mb-4">Current Formula</h3>
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
      </CardContent>
    </Card>
  );
};

export default CalculationBuilder;