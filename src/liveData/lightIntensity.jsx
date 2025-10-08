import React from 'react';

// --- Helper function to get details based on Lux value ---
const getLuxDetails = (lux) => {
    const MAX_LUX = 65000; // The top of our gauge's scale
    const percentage = Math.min((lux / MAX_LUX) * 100, 100);
    
    // Returns different UI properties based on the lux level
    if (lux < 1000) return { percentage, description: 'Very Dim', color: '#a7f3d0', bg: 'from-slate-800 to-sky-900', textColor: 'text-green-200' };
    if (lux < 25000) return { percentage, description: 'Overcast', color: '#fde047', bg: 'from-sky-400 to-gray-500', textColor: 'text-yellow-300' };
    if (lux < 50000) return { percentage, description: 'Bright Daylight', color: '#fb923c', bg: 'from-sky-500 to-blue-600', textColor: 'text-orange-300' };
    return { percentage, description: 'Full Sun', color: '#f87171', bg: 'from-yellow-400 to-orange-500', textColor: 'text-red-300' };
};

// --- Starfield Component for the night sky effect ---
const Starfield = ({ starCount = 50 }) => {
    const [stars, setStars] = React.useState([]);

    React.useEffect(() => {
        const newStars = Array.from({ length: starCount }, (_, i) => {
            const size = Math.random() * 1.5 + 0.5;
            return {
                id: i,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${Math.random() * 4}s`,
            };
        });
        setStars(newStars);
    }, [starCount]);

    return (
        <div className="absolute inset-0 z-0">
            {stars.map(star => (
                <div key={star.id} className="star" style={star} />
            ))}
        </div>
    );
};

// --- The Main Light Intensity Gauge Component ---
const LightIntensityGauge = ({ luxValue }) => {
    // Default to 0 if luxValue is null or undefined
    const displayLux = Math.round(luxValue || 0);
    const details = getLuxDetails(displayLux);

    return (
        <div className={`relative w-full h-full bg-gradient-to-br ${details.bg} rounded-xl shadow-lg shadow-inner p-4 flex flex-col items-center justify-center text-white transition-all duration-1000 overflow-hidden`}>
            {/* Conditionally render stars for the "Very Dim" state */}
            {displayLux < 1000 && <Starfield />}
            
            <div className="relative z-10 flex flex-col items-center w-full">
                <h3 className="text-lg font-bold opacity-80 mb-2">Light Intensity</h3>
                
                <div className="relative w-48 h-24 mb-2">
                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                        <path d="M 10 50 A 40 40 0 0 1 90 50" stroke={details.color} strokeWidth="8" fill="none"
                            strokeDasharray="125.6"
                            strokeDashoffset={125.6 * (1 - details.percentage / 100)}
                            style={{ transition: 'stroke-dashoffset 1.5s ease-out', filter: `drop-shadow(0 0 5px ${details.color})` }}
                            strokeLinecap="round"
                        />
                    </svg>
                    
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        <p className="text-3xl font-bold pt-2">{displayLux}</p>
                        <p className="text-xs opacity-70">LUX</p>
                    </div>
                </div>
                
                <div className="text-center">
                    <p className={`font-bold ${details.textColor}`}>{details.description}</p>
                </div>
            </div>
        </div>
    );
};

export default LightIntensityGauge;

