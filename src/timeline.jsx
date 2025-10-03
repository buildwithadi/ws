import React, { useState, useEffect } from 'react';

// --- Reusable WeatherTimeline Component ---
// This component is now self-contained. It fetches its own data and renders the timeline.
function WeatherTimeline() {
  // State to store the weather forecast data, loading status, and errors
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect hook to fetch data when the component first mounts
  useEffect(() => {
    // This function now uses your provided logic to fetch and process data
    async function getWeatherData() {
      // API URL for the next 10 forecast entries (every 3 hours)
      const apiKey = "371b716c25a9e70d9b96b6dc52443a7a"; // Your OpenWeatherMap API key
      const lat = 30.34;
      const lon = 78.02;
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=10&appid=${apiKey}&units=metric`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        // Process the API data to fit our timeline structure
        const processedData = result.list.map((forecast, index) => {
          const date = new Date(forecast.dt * 1000);
          // Using your desired date format
          const readableDate = date.toLocaleString('en-IN', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });
          
          // --- Recommendation Logic for EACH interval ---
          // This check is now performed for every item in the list.
          const isGoodForSpraying = 
            !forecast.weather[0].description.toLowerCase().includes('rain') && 
            forecast.wind.speed < 2; // Check for no rain and wind speed < 3 m/s
          
          return {
            id: index,
            date: readableDate,
            title: `${Math.round(forecast.main.temp)}°C with ${forecast.weather[0].description}`,
            description: `Humidity: ${forecast.main.humidity}%. Wind: ${forecast.wind.speed} m/s.`,
            // Add a new property to the object to store the result of the check
            isIdeal: isGoodForSpraying,
          };
        });
        
        setWeatherData(processedData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    getWeatherData();
  }, []); // The empty dependency array [] ensures this effect runs only once

  // --- Render logic for the component ---
  if (loading) {
    return (
      <div className="text-center p-10">
        <h1 className="text-3xl">Loading Weather Forecast...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10">
        <h1 className="text-3xl text-red-500">Error: {error}</h1>
      </div>
    );
  }

  return (
    <div className="relative wrap p-4 md:p-10">
      {/* --- Vertical Line (Single column layout) --- */}
      <div className="absolute border border-black h-full border ml-7" style={{left: '26px'}}></div>

      {/* --- Timeline Items (Mapping over weather data) --- */}
      {weatherData.map((item) => (
         <div key={item.id} className="mb-8 flex items-center w-full">
            {/* Dot */}
            <div className="z-10 flex items-center order-1 bg-green-700 shadow-xl w-8 h-8 rounded-full">
                <div 
                    className="w-4 h-4 m-2 rounded-full group-hover:scale-125 transition-transform duration-300 bg-white"
                ></div>
            </div>
            {/* Content Card (Category Tag removed from here) */}
            <div className="order-1 bg-green-800 rounded-lg shadow-xl ml-4 md:ml-8 px-6 py-4 group-hover:scale-105 transition-transform duration-300 w-1/2 md:w-full">
                <h3 className="font-bold text-lg text-white mb-1">{item.title}</h3>
                <p className="text-sm font-medium text-white mb-2">{item.date}</p>
                <p className="text-sm leading-snug tracking-wide text-white">
                    {item.description}
                </p>
                {item.isIdeal && (
                  <p className="mt-3 text-sm font-semibold text-green-300 bg-green-900/50 p-2 rounded-md">
                      Ideal conditions for spraying.
                  </p>
                )}
                {/* This will render if item.isIdeal is false */}
                {!item.isIdeal && (
                  <p className="mt-3 text-sm font-semibold text-amber-300 bg-amber-900/50 p-2 rounded-md">
                      Conditions not ideal for spraying.
                  </p>
                )}
            </div>
        </div>
      ))}
    </div>
  );
}

export default WeatherTimeline;
