# Index Standardization Methodology

This document describes how the web application scales drought metric values into standard D0-D4 drought classes for map visualization.

## Rationale
The application aligns visual thresholds to the United States Drought Monitor (USDM) schema. The USDM categorizes drought severity from D0 (Abnormally Dry, 30th percentile) to D4 (Exceptional Drought, 2nd percentile). Where applicable, the application maps continuous variables (Z-scores and percentages) to approximate these severity classifications for visual consistency across all metrics.

## Pre-Standardization of Meteorological Indices
The raw values for PDSI, SPI-3mo, and EDDI-1mo follow different native scales (e.g., PDSI ranges roughly from -10 to +10; SPI and EDDI are Z-scores). The background data pipeline converts each of these indices to a common 0–5 severity scale before the data reaches the front-end application. The conversion uses established percentile-based crosswalk tables that map each index's statistical distribution to the corresponding USDM severity tier. For example, a raw SPI value of -2.0 (approximately the 2nd percentile) maps to a severity of 5.0 (D4), while a raw SPI value of -0.5 (approximately the 30th percentile) maps to a severity of 1.0 (D0). After this conversion, all four meteorological indices (USDM, PDSI, SPI, and EDDI) share the same 0–5 scale and the same threshold logic in the front-end code.

## Threshold Mappings

### 1. USDM, PDSI, SPI (3-mo), and EDDI
These meteorological variables are pre-standardized to the 0–5 severity scale in the data pipeline (see above).
*   **D4 (Extreme):** ≥ 4.5
*   **D3 (Severe):** ≥ 3.5
*   **D2 (Moderate):** ≥ 2.5
*   **D1 (Abnormal):** ≥ 1.5
*   **D0 (Dry):** ≥ 0.5
*   **None/Normal:** < 0.5

### 2. CMI (Crop Moisture Index)
Based on standard Palmer categorical thresholds.
*   **D4 (Extreme):** ≤ -4.0
*   **D3 (Severe):** ≤ -3.0
*   **D2 (Moderate):** ≤ -2.0
*   **D1 (Abnormal):** ≤ -1.0
*   **D0 (Dry):** ≤ 0.0
*   **Wet:** ≥ 1.5
*   **Normal:** > 0.0 to < 1.5

### 3. SPI-1yr and SSMI (Standardized Z-Scores)
Z-scores map to probability percentiles consistent with USDM distribution targets.
*   **D4 (Extreme):** ≤ -2.0
*   **D3 (Severe):** ≤ -1.6
*   **D2 (Moderate):** ≤ -1.3
*   **D1 (Abnormal):** ≤ -0.8
*   **D0 (Dry):** ≤ -0.5
*   **Wet:** ≥ 0.5
*   **Normal:** > -0.5 to < 0.5

### 4. VCI (Vegetation Condition Index) and VHI (Vegetation Health Index)
Expressed as an index from 0 to 100 representing vegetation health.
*   **D4 (Extreme):** ≤ 10
*   **D3 (Severe):** ≤ 20
*   **D2 (Moderate):** ≤ 30
*   **D1 (Abnormal):** ≤ 40
*   **D0 (Dry):** ≤ 50
*   **Wet:** ≥ 80
*   **Normal:** > 50 to < 80

### 5. Streamflow Percentile
Streamflow is expressed as a percentile ranking (0–100) of current discharge relative to the historical record.
*   **D4 (Extreme):** ≤ 2
*   **D3 (Severe):** ≤ 5
*   **D2 (Moderate):** ≤ 10
*   **D1 (Abnormal):** ≤ 20
*   **D0 (Dry):** ≤ 30
*   **Wet:** ≥ 70
*   **Normal:** > 30 to < 70

### 6. SWE % Normal and Forecast % Normal
Snow Water Equivalent and seasonal volume forecasts are expressed as a percentage of the long-term median. Values above 100% indicate above-normal conditions.
*   **D4 (Extreme):** ≤ 5%
*   **D3 (Severe):** ≤ 15%
*   **D2 (Moderate):** ≤ 30%
*   **D1 (Abnormal):** ≤ 50%
*   **D0 (Dry):** ≤ 75%
*   **Wet:** ≥ 110%
*   **Normal:** > 75% to < 110%
