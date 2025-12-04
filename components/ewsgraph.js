// Time range filter & multi-station line charts
import { Button } from "@/components/ui/button"; // adjust import if needed

const stationColors = {
  ghastoli: "#8884d8",
  khirao: "#82ca9d",
  mana: "#ffc658",
  vasudhara: "#ff7300",
  lambagad: "#00c49f",
};

const dummyTimeSeries = [
  { time: "11:00", waterLevel: 3.2, waterVelocity: 1.8, waterDischarge: 220 },
  { time: "11:10", waterLevel: 3.3, waterVelocity: 1.9, waterDischarge: 225 },
  { time: "11:20", waterLevel: 3.4, waterVelocity: 2.0, waterDischarge: 230 },
  { time: "11:30", waterLevel: 3.5, waterVelocity: 2.1, waterDischarge: 235 },
  { time: "11:40", waterLevel: 3.6, waterVelocity: 2.2, waterDischarge: 240 },
  { time: "11:50", waterLevel: 3.7, waterVelocity: 2.3, waterDischarge: 245 },
];

// Mock multi-station data by time range
const stationGraphData = {
  today: {
    ghastoli: dummyTimeSeries,
    khirao: dummyTimeSeries,
    mana: dummyTimeSeries,
    vasudhara: dummyTimeSeries,
    lambagad: dummyTimeSeries,
  },
  // Add other ranges similarly
};

const timeRanges = ["Today", "Yesterday", "3 days", "7 days", "15 days", "30 days"];

function MultiStationGraphSection({ dataKey, title }) {
  const [selectedRange, setSelectedRange] = useState("Today");
  const currentData = stationGraphData[selectedRange.toLowerCase().replace(" ", "")] || {};

  return (
    <div className="bg-white/80 backdrop-blur rounded-xl mt-16 mb-10 mx-6 px-6 py-6 shadow-md">
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {timeRanges.map((range) => (
          <Button
            key={range}
            variant={selectedRange === range ? "default" : "outline"}
            className={selectedRange === range ? "bg-[#2563eb] text-white" : ""}
            onClick={() => setSelectedRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          {Object.entries(currentData).map(([station, stationData]) => (
            <Line
              key={station}
              type="monotone"
              data={stationData}
              dataKey={dataKey}
              name={station.charAt(0).toUpperCase() + station.slice(1)}
              stroke={stationColors[station]}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
