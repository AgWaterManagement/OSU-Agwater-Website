export const calVol = (pct, normal_volume) => Math.round((pct / 100.0) * normal_volume).toLocaleString();

export const formatPeriod = (str) => {
    if (!str) return "";
    const names = {
        "04-01-09-30": "Summer ",
        "01-01-09-30": "Water Year ",
        "10-01-09-30": "Water Year "
    };
    const prefix = names[str] || "";
    const mths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = str.split('-');
    if (parts.length === 4) {
        const m1 = parseInt(parts[0], 10) - 1;
        const m2 = parseInt(parts[2], 10) - 1;
        if (m1 >= 0 && m1 < 12 && m2 >= 0 && m2 < 12) {
            return `${prefix}(${mths[m1]}-${mths[m2]})`;
        }
    }
    return str;
};

// Defines color categories based on standard drought index rulesets.
export const DROUGHT_COLORS = {
    "D4": "#730000",
    "D3": "#E60000",
    "D2": "#FFAA00",
    "D1": "#FCD37F",
    "D0": "#FFFF00", 
    "None": "#5a6673",
    "Missing": "#222222",
    "Wet": "#3182ce"
};

export function getMapColor(layer, val) {
    if (val === null || val === undefined) return DROUGHT_COLORS.Missing;
    
    switch (layer) {
        case 'usdm':
        case 'pdsi':
        case 'spi':
        case 'eddi':
            if (val >= 4.5) return DROUGHT_COLORS.D4;
            if (val >= 3.5) return DROUGHT_COLORS.D3;
            if (val >= 2.5) return DROUGHT_COLORS.D2;
            if (val >= 1.5) return DROUGHT_COLORS.D1;
            if (val >= 0.5) return DROUGHT_COLORS.D0;
            return DROUGHT_COLORS.None;
            
        case 'cmi_raw':
            if (val <= -4) return DROUGHT_COLORS.D4;
            if (val <= -3) return DROUGHT_COLORS.D3;
            if (val <= -2) return DROUGHT_COLORS.D2;
            if (val <= -1) return DROUGHT_COLORS.D1;
            if (val <= 0) return DROUGHT_COLORS.D0;
            if (val >= 1.5) return DROUGHT_COLORS.Wet;
            return DROUGHT_COLORS.None;
            
        case 'spi_1yr':
        case 'ssmi_raw':
            if (val <= -2.0) return DROUGHT_COLORS.D4;
            if (val <= -1.6) return DROUGHT_COLORS.D3;
            if (val <= -1.3) return DROUGHT_COLORS.D2;
            if (val <= -0.8) return DROUGHT_COLORS.D1;
            if (val <= -0.5) return DROUGHT_COLORS.D0;
            if (val >= 0.5) return DROUGHT_COLORS.Wet;
            return DROUGHT_COLORS.None;
            
        case 'vci_raw':
        case 'vhi_raw':
            if (val <= 10) return DROUGHT_COLORS.D4;
            if (val <= 20) return DROUGHT_COLORS.D3;
            if (val <= 30) return DROUGHT_COLORS.D2;
            if (val <= 40) return DROUGHT_COLORS.D1;
            if (val <= 50) return DROUGHT_COLORS.D0;
            if (val >= 80) return DROUGHT_COLORS.Wet;
            return DROUGHT_COLORS.None;
            
        case 'streamflow_pctile':
            if (val <= 2) return DROUGHT_COLORS.D4;
            if (val <= 5) return DROUGHT_COLORS.D3;
            if (val <= 10) return DROUGHT_COLORS.D2;
            if (val <= 20) return DROUGHT_COLORS.D1;
            if (val <= 30) return DROUGHT_COLORS.D0;
            if (val >= 70) return DROUGHT_COLORS.Wet;
            return DROUGHT_COLORS.None;

        case 'swe_pct_normal':
        case 'forecast_pct_normal':
            if (val <= 5) return DROUGHT_COLORS.D4;
            if (val <= 15) return DROUGHT_COLORS.D3;
            if (val <= 30) return DROUGHT_COLORS.D2;
            if (val <= 50) return DROUGHT_COLORS.D1;
            if (val <= 75) return DROUGHT_COLORS.D0;
            if (val >= 110) return DROUGHT_COLORS.Wet;
            return DROUGHT_COLORS.None;

        default:
            return DROUGHT_COLORS.None;
    }
}

export function getLegendLabels(layer) {
    switch (layer) {
        case 'usdm':
        case 'pdsi':
        case 'spi':
        case 'eddi':
            return { d4: 'Extreme (≥ 4.5)', d3: 'Severe (≥ 3.5)', d2: 'Moderate (≥ 2.5)', d1: 'Abnormal (≥ 1.5)', d0: 'Dry (≥ 0.5)', wet: 'Wet', normal: 'Normal' };
        case 'cmi_raw':
            return { d4: 'Extreme (≤ -4.0)', d3: 'Severe (≤ -3.0)', d2: 'Moderate (≤ -2.0)', d1: 'Abnormal (≤ -1.0)', d0: 'Dry (≤ 0.0)', wet: 'Wet (≥ 1.5)', normal: 'Normal (> 0)' };
        case 'spi_1yr':
        case 'ssmi_raw':
            return { d4: 'Extreme (≤ -2.0)', d3: 'Severe (≤ -1.6)', d2: 'Moderate (≤ -1.3)', d1: 'Abnormal (≤ -0.8)', d0: 'Dry (≤ -0.5)', wet: 'Wet (≥ 0.5)', normal: 'Normal (> -0.5)' };
        case 'vci_raw':
        case 'vhi_raw':
            return { d4: 'Extreme (≤ 10)', d3: 'Severe (≤ 20)', d2: 'Moderate (≤ 30)', d1: 'Abnormal (≤ 40)', d0: 'Dry (≤ 50)', wet: 'Wet (≥ 80)', normal: 'Normal (> 50)' };
        case 'streamflow_pctile':
            return { d4: 'Extreme (≤ 2)', d3: 'Severe (≤ 5)', d2: 'Moderate (≤ 10)', d1: 'Abnormal (≤ 20)', d0: 'Dry (≤ 30)', wet: 'Wet (≥ 70)', normal: 'Normal (> 30)' };
        case 'swe_pct_normal':
        case 'forecast_pct_normal':
            return { d4: 'Extreme (≤ 5%)', d3: 'Severe (≤ 15%)', d2: 'Moderate (≤ 30%)', d1: 'Abnormal (≤ 50%)', d0: 'Dry (≤ 75%)', wet: 'Wet (≥ 110%)', normal: 'Normal (> 75%)' };
        default:
            return { d4: 'Extreme', d3: 'Severe', d2: 'Moderate', d1: 'Abnormal', d0: 'Dry', wet: 'Wet', normal: 'Normal' };
    }
}

export const getForecastColor = (pct) => {
    if (pct === null || pct === undefined) return '#a0aec0';
    if (pct < 50) return '#e53e3e';      // Red
    if (pct < 75) return '#dd6b20';      // Orange
    if (pct < 90) return '#d69e2e';      // Yellow
    if (pct <= 110) return '#48bb78';    // Green (Normal range)
    if (pct <= 150) return '#4299e1';    // Light blue
    return '#2b6cb0';                    // Dark blue
};
