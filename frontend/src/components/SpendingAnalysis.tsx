import React, { useState } from 'react';
import { Select, Progress, List, Tag } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SpendingData {
  category: string;
  amount: number;
  color: string;
  percentage: number;
  budget?: number;
}

const SpendingAnalysis: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('month');
  
  const spendingData: SpendingData[] = [
    { category: "Groceries", amount: 450, color: "#FF6B6B", percentage: 30, budget: 500 },
    { category: "Transport", amount: 200, color: "#4ECDC4", percentage: 13, budget: 250 },
    { category: "Entertainment", amount: 300, color: "#45B7D1", percentage: 20, budget: 300 },
    { category: "Bills", amount: 550, color: "#96CEB4", percentage: 37, budget: 600 }
  ];

  const totalSpent = spendingData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Spending Analysis</h2>
        <Select
          defaultValue={timeFrame}
          onChange={setTimeFrame}
          options={[
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' }
          ]}
          className="w-32"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spendingData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                label
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category List */}
        <div className="overflow-auto max-h-64">
          <List
            size="small"
            dataSource={spendingData}
            renderItem={(item) => (
              <List.Item className="flex flex-col w-full py-2">
                <div className="flex justify-between w-full items-center mb-1">
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">${item.amount}</span>
                    <Tag color={item.amount <= (item.budget || 0) ? 'green' : 'red'} className="text-xs">
                      {item.percentage}%
                    </Tag>
                  </div>
                </div>
                <Progress
                  percent={(item.amount / (item.budget || item.amount)) * 100}
                  showInfo={false}
                  strokeColor={item.amount <= (item.budget || 0) ? '#52c41a' : '#ff4d4f'}
                  size="small"
                  className="w-full"
                />
              </List.Item>
            )}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-base">Total Spent</span>
          <span className="text-lg font-bold">${totalSpent}</span>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalysis;