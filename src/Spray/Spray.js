import React, { useState, useEffect } from "react";
import axios from 'axios';
import Sidebar from "../Sidebar";
import { useAuth } from "../AuthProvider"; // To get the selected device
import API_BASE_URL from "../config"; // Your API base URL
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; 
import WeatherTimeline from "../timeline";

// --- Helper Functions for Spray Calculation ---

const chartData = [];
async function getData() {
  const url = "https://api.openweathermap.org/data/2.5/forecast?lat=30.34&lon=78.02&cnt=10&appid=371b716c25a9e70d9b96b6dc52443a7a&units=metric";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const result = await response.json();
  const formattedData = result.list.map(forecast => {
    const date = new Date(forecast.dt * 1000);
    const readableDate = date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', hour12: true });
    return {
      date: readableDate,
      temperature: forecast.main.temp,
      humidity: forecast.main.humidity,
    };
  });
  return formattedData;
}

// This is the correct way to call the function
getData()
  .then(chartData => {
    // NOW 'chartData' is the actual array
    console.log("Data received:", chartData);
  })
  .catch(error => {
    console.error("An error occurred:", error);
  });


/**
 * Calculates risk for Apple Scab.
 * (This function is from your Fungus.js component)
 */
function calculateAppleScab(temp, wetnessHours) {
  if (temp < 6) return { value: 0, status: "No Risk" };
  let requiredHours;
  if (temp >= 18 && temp <= 24) requiredHours = 9;
  else if (temp === 17) requiredHours = 10;
  else if (temp === 16) requiredHours = 11;
  else if (temp === 15) requiredHours = 12;
  else if (temp >= 13 && temp <= 14) requiredHours = 14;
  else if (temp === 12) requiredHours = 15;
  else if (temp >= 10 && temp <= 11) requiredHours = 20;
  if (!requiredHours) return { value: 0, status: "No Risk" };
  const risk = Math.min((wetnessHours / requiredHours) * 100, 100);
  return { value: Math.round(risk) };
}

getData()

/**
 * Processes recent raw data to get inputs for the Apple Scab model.
 * (This logic is from your Fungus.js component)
 */
function processSensorData(rawData) {
    const WETNESS_THRESHOLD = 0.3;
    const wetIntervals = rawData.filter(d => d.leaf_wetness_factor > WETNESS_THRESHOLD);
    const totalWetnessHours = wetIntervals.length * 0.5;
    const sumOfWetTemperatures = wetIntervals.reduce((sum, interval) => sum + parseFloat(interval.temp), 0);
    const avgTempDuringWetness = wetIntervals.length > 0 ? sumOfWetTemperatures / wetIntervals.length : 0;
    return { totalWetnessHours, avgTempDuringWetness };
}


/**
 * Core decision-making logic for spray recommendations.
 * Evaluates disease risk and weather conditions to determine if it's safe to spray.
 */
function calculateSprayWindow(diseaseRisk, currentWeather, forecast) {
    const DISEASE_RISK_THRESHOLD = 70;
    const MAX_WIND_SPEED_KMH = 15;
    const MAX_TEMP_CELSIUS = 30;
    const RAIN_FORECAST_HOURS = 6;

    if (diseaseRisk < DISEASE_RISK_THRESHOLD) {
        return { recommendation: "DO NOT SPRAY", reason: `Disease risk (${diseaseRisk}%) is below the threshold.` };
    }
    if (currentWeather.wind_speed_kmh > MAX_WIND_SPEED_KMH) {
        return { recommendation: "DO NOT SPRAY", reason: `High wind speed (${currentWeather.wind_speed_kmh} km/h). Risk of spray drift.` };
    }
    if (currentWeather.temp > MAX_TEMP_CELSIUS) {
        return { recommendation: "DO NOT SPRAY", reason: `Temperature is too high (${currentWeather.temp}°C). Risk of phytotoxicity.` };
    }
    // NOTE: This assumes you have a weather forecast API. We will simulate this for now.
    if (forecast.rain_in_next_hours <= RAIN_FORECAST_HOURS && forecast.chance_of_rain_percent > 40) {
        return { recommendation: "DO NOT SPRAY", reason: `Rain is forecast within ${RAIN_FORECAST_HOURS} hours. Product may wash off.` };
    }
    return { recommendation: "SPRAY NOW", reason: "Disease risk is high and weather conditions are favorable." };
}


// --- Main Spray Component ---
export default function Spray() {
    const { devices, devicesLoading } = useAuth();
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recommendation, setRecommendation] = useState(null);
    const [conditions, setConditions] = useState(null);

    // Automatically select the first device
    useEffect(() => {
        if (!devicesLoading && devices.length > 0 && !selectedDevice) {
            setSelectedDevice(devices[0]);
        }
    }, [devicesLoading, devices, selectedDevice]);

    // Fetch data and calculate recommendation when a device is selected
    useEffect(() => {
        if (!selectedDevice) return;

        const getRecommendation = async () => {
            setLoading(true);
            try {
                // 1. Fetch the last 24 hours of data to calculate disease risk
                const historyRes = await axios.get(`${API_BASE_URL}/devices/${selectedDevice.d_id}/history?range=daily_raw`, { withCredentials: true });
                const rawHistory = historyRes.data.data || [];

                // 2. Fetch the absolute latest reading for current conditions
                const liveRes = await axios.get(`${API_BASE_URL}/live-data/${selectedDevice.d_id}`, { withCredentials: true });
                const liveData = liveRes.data.data[0];

                // --- DATA PROCESSING ---
                // We'll use a simulated forecast for this example
                const forecast = { rain_in_next_hours: 12, chance_of_rain_percent: 10 };

                // Calculate disease risk from historical data
                const { totalWetnessHours, avgTempDuringWetness } = processSensorData(rawHistory);
                const { value: diseaseRisk } = calculateAppleScab(avgTempDuringWetness, totalWetnessHours);
                
                // Get current weather from live data
                const currentWeather = {
                    temp: parseFloat(liveData.temp),
                    wind_speed_kmh: parseFloat(liveData.wind_speed) * 3.6 // Convert m/s to km/h
                };

                // --- DECISION LOGIC ---
                const result = calculateSprayWindow(diseaseRisk, currentWeather, forecast);
                setRecommendation(result);
                setConditions({
                    diseaseRisk,
                    wind: currentWeather.wind_speed_kmh.toFixed(1),
                    temp: currentWeather.temp.toFixed(1),
                    rain: forecast.rain_in_next_hours
                });

            } catch (err) {
                console.error("Failed to calculate spray recommendation:", err);
                setRecommendation({ recommendation: "ERROR", reason: "Could not fetch the required data." });
            } finally {
                setLoading(false);
            }
        };

        getRecommendation();
    }, [selectedDevice]);


    const isSprayRecommended = recommendation?.recommendation === "SPRAY NOW";

  const [chartData, setChartData] = useState([]);

  // 2. Use useEffect to fetch data when the component first mounts
  useEffect(() => {
    // Call your getData function
    getData()
      .then(data => {
        // 3. Update the state with the fetched data, triggering a re-render
        setChartData(data);
      })
      .catch(error => {
        console.error("Failed to fetch weather data:", error);
      });
  }, []); 

    return (
        <div className="flex bg-gray-50 text-gray-800 h-full">
            {/* Sidebar */}
            <div className="hidden md:block w-64 flex-shrink-0 bg-white border-r shadow">
              <Sidebar />
            </div>

            <div className="flex-1 p-6">
                {/* Mobile Responsive Sidebar */}
                <div className="-mx-6 -mt-6 md:hidden mb-4">
                  <Sidebar />
                </div>
                <h1 className="text-3xl font-bold text-green-900 mb-2">Spray Decision Support</h1>
                <p className="text-gray-600 mb-6">
                    Real-time spray recommendations for Apple Scab based on live field conditions.
                </p>

                <div className="w-1/2 item-center">
                  <WeatherTimeline></WeatherTimeline>
                </div>

            </div>
        </div>
    );
}

