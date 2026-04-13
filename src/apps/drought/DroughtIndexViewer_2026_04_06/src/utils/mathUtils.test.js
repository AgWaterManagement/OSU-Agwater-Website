import { describe, it, expect } from 'vitest';
import { calVol, formatPeriod, getMapColor, getForecastColor, DROUGHT_COLORS } from './mathUtils';

describe('mathUtils', () => {

  describe('calVol', () => {
    it('calculates the correct scaled KAF equivalent from percentage strings', () => {
      // 50% of 10,000 should be 5,000
      expect(calVol(50, 10000)).toBe('5,000');
    });

    it('handles floating point math naturally', () => {
      // 10% of 15,400 should be 1,540
      expect(calVol(10, 15400)).toBe('1,540');
    });
  });

  describe('formatPeriod', () => {
    it('returns the empty string on undefined input', () => {
      expect(formatPeriod(undefined)).toBe('');
    });
    
    it('maps known seasonal strings to expected month integers', () => {
      expect(formatPeriod('04-01-09-30')).toBe('Summer (Apr-Sep)');
    });

    it('returns the raw string if the format breaches exactly 4 split bounds', () => {
      expect(formatPeriod('Weird-String')).toBe('Weird-String');
    });
  });

  describe('getMapColor', () => {
    it('evaluates USDM values based on step logic thresholds', () => {
      expect(getMapColor('usdm', 4.8)).toBe(DROUGHT_COLORS.D4);
      expect(getMapColor('usdm', 0.2)).toBe(DROUGHT_COLORS.None);
    });

    it('handles inverse scales like Streamflow Percentile', () => {
      expect(getMapColor('streamflow_pctile', 1)).toBe(DROUGHT_COLORS.D4);
      expect(getMapColor('streamflow_pctile', 99)).toBe(DROUGHT_COLORS.Wet);
    });

    it('returns Missing properly if payload val is undefined', () => {
      expect(getMapColor('usdm', null)).toBe(DROUGHT_COLORS.Missing);
    });
  });

  describe('getForecastColor', () => {
    it('allocates strictly red below 50', () => {
      expect(getForecastColor(45)).toBe('#e53e3e');
    });
    it('allocates strictly light blue between 110 and 150', () => {
      expect(getForecastColor(120)).toBe('#4299e1');
    });
  });

});
