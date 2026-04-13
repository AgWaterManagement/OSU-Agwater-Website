import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';


const WeatherChart = ({ forecast, chartType }) => {
  if (!forecast) {
    return null; // Return null if no forecast is provided
  }

  // Prepare data for the chart
  const chartData = forecast.periods.map(period => ({
    name: new Date(period.startTime).toLocaleDateString(),
    temperature: period.temperature,
    precipitation: period.probabilityOfPrecipitation.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke='white' />
        <YAxis stroke='white' />
        <Tooltip />
        <Legend />
        {chartType === "temperature" && (
          <Line type="monotone" dataKey="temperature" stroke="red" activeDot={{ r: 8 }} />
        )}
        {chartType === "precipitation" && (
          <Line type="monotone" dataKey="precipitation" stroke="lightblue" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

WeatherChart.propTypes = {
  forecast: PropTypes.object,
  chartType: PropTypes.string,
};

export default WeatherChart;