import React from 'react';

// --- Helper function to get details based on wind data ---
const getWindDetails = (speed, direction) => {
    let description = 'Calm';
    let color = 'bg-sky-500';
    if (speed > 1 && speed <= 5) { description = 'Light Air'; color = 'bg-sky-500'; }
    if (speed > 5 && speed <= 11) { description = 'Light Breeze'; color = 'bg-green-500'; }
    if (speed > 11 && speed <= 19) { description = 'Gentle Breeze'; color = 'bg-yellow-500'; }
    if (speed > 19 && speed <= 28) { description = 'Moderate Breeze'; color = 'bg-orange-500'; }
    if (speed > 28) { description = 'Strong Wind'; color = 'bg-red-500'; }

    const directions = {
        'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
        'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
        'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
        'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    const rotation = directions[direction] || 0;

    return { description, rotation, color };
};

// --- The Main Wind Compass Component ---
const WindCompass = ({ windSpeed, windDirection }) => {
    const { description, rotation, color } = getWindDetails(windSpeed, windDirection);

    return (
        <div className="bg-white backdrop-blur-xl border border-2 rounded-xl shadow-lg p-6 flex flex-col items-center text-white">
            <h3 className="text-lg font-semibold text-gray-500 mb-4">Wind</h3>
            
            {/* Full Circle Dial */}
            <div className="relative w-56 h-56">

                {/* Dial background and tick marks */}
                <div className="absolute inset-0 bg-slate-700/30 rounded-full border-4 border-slate-600 flex items-center justify-center">
                     {[...Array(12)].map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute left-1/2 top-0 w-0.5 h-full"
                            style={{ transform: `rotate(${i * 30}deg)`}}
                        >
                            <div className={`bg-slate-500 ${i % 3 === 0 ? 'w-0.5 h-4' : 'w-px h-2'}`}></div>
                        </div>
                    ))}
                </div>

                {/* Arrow Needle */}
                <div 
                    className="absolute inset-0 transition-transform duration-1000 ease-in-out"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                            <polygon 
                                points="50,12 56,50 44,50" 
                                style={{fill: '#ef4444', filter: 'drop-shadow(0 0 5px #ef4444)'}} 
                            />
                            <polygon 
                                points="50,88 56,50 44,50" 
                                style={{fill: '#d1d5db', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))'}} 
                            />
                        </svg>
                    </div>
                </div>

                 {/* Center Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-700 flex flex-col items-center justify-center">
                         <p className="text-4xl font-black text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                            {Math.round(windSpeed)}
                        </p>
                        <p className="text-xs text-slate-300">km/h</p>
                    </div>
                </div>

                 {/* Compass Markings */}
                <div className="absolute w-full h-full text-gray-700 font-bold text-lg">
                    <span className="absolute top-3 left-1/2 -translate-x-1/2">N</span>
                    <span className="absolute bottom-3.5 left-1/2 -translate-x-1/2">S</span>
                    <span className="absolute left-5 top-1/2 -translate-y-1/2">W</span>
                    <span className="absolute right-5 top-1/2 -translate-y-1/2">E</span>
                </div>
            </div>
            
             {/* Data Display */}
            <div className="text-center mt-6 z-10">
                <p className="text-md font-black text-gray-700">
                   From the {windDirection} ({Math.round(rotation)}°)
                </p>
            </div>
        </div>
    );
};

export default WindCompass;
