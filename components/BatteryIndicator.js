import React from 'react';

const Battery = ({ level, voltage }) => (
  <div className="flex flex-col items-center space-y-1 sm:space-y-2">
    {/* Battery Shape */}
    <div className="w-6 h-7 sm:w-10 sm:h-11 border-2 border-gray-500 rounded bg-green-500 flex items-center justify-center text-[10px] sm:text-sm font-bold text-white">
      {level}%
    </div>
    {/* Voltage Label */}
    <div className="text-[10px] sm:text-sm text-gray-700">{voltage}V</div>
  </div>
);

const BatteryIndicator = () => {
  const batteries = [
    { level: 100, voltage: 50 },
    { level: 100, voltage: 50 },
    { level: 100, voltage: 50 },
    { level: 100, voltage: 50 },
    { level: 100, voltage: 50 },
  ];

  return (
    <div className="flex justify-center items-end space-x-2 sm:space-x-4">
      {batteries.map((batt, idx) => (
        <Battery key={idx} level={batt.level} voltage={batt.voltage} />
      ))}
    </div>
  );
};

export default BatteryIndicator;
