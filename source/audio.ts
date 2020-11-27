import { getSpectrum } from './dsp';

export const skipEvery = <T>(skipIndex: number) => (element: T, index: number) =>
  index % skipIndex === 0;

export const getPeaks = (spectrums: number[], prevPeaks?: number[]) => {
  if (!prevPeaks) {
    return spectrums;
  }
  const resultPeaks: number[] = [];
  for (let i = 0; i < spectrums.length; i++) {
    const currValue = spectrums[i];
    const currPrevPeak = prevPeaks[i] || 0;
    resultPeaks.push(
      (currValue > currPrevPeak) ? currValue : currPrevPeak
    );
  }
  return resultPeaks;
};

export const correctPeaks = (spectrums: number[], peaks: number[]) => {
  const resultSpectrum: number[] = [];
  for (let i = 0; i < spectrums.length; i++) {
    const value = spectrums[i];
    const peakValue = peaks[i] || 0;
    if (value < 3) {
      resultSpectrum.push(value / 3);
    } else {
      resultSpectrum.push(value / peakValue);
    }
  }
  return resultSpectrum;
};

export const smoothValues = (spectrums: number[], prevSpectrums?: number[]) => {
  if (!prevSpectrums) {
    return spectrums;
  }
  const resultSpectrum: number[] = [];
  for(let i = 0; i < spectrums.length; i++) {
    const currValue = spectrums[i];
    const currPrevValue = prevSpectrums[i] || 0;
    const avgValue = (currValue + currPrevValue) / 2;
    resultSpectrum.push(avgValue);
  }
  return resultSpectrum;
};

export const createSpectrumsProcessor = (busesCount: number) => {
  let prevAudioDataNormalized: number[] = [];
  let prevPeaks: number[] = [];
  let prevSpectrums: number[] = [];

  return (parseAudioData: () => number[]) => {
    const audioDataNomrmalized = normalizeAudioData(parseAudioData());
    prevAudioDataNormalized = audioDataNomrmalized;

    const spectrum = getSpectrum(audioDataNomrmalized);
    const buses = Array.apply(null, Array(busesCount));
    let average = (array) => array.reduce((a, b) => a + b, 0) / array.length
    const spectrumReduced = buses.map((_, index) => {
      const spectrumGroup = spectrum.slice(index * spectrum.length / busesCount, (index +1) *  spectrum.length / busesCount);
      return average(spectrumGroup);
    });
    const peaks = getPeaks(spectrumReduced, prevPeaks);
    const correctedSpectrum = correctPeaks(spectrumReduced, peaks);
    const smoothSpectrum = smoothValues(correctedSpectrum, prevSpectrums);
    prevSpectrums = smoothSpectrum;
    prevPeaks = peaks;
    return smoothSpectrum;
  };
};

export const bufferToUInt8 = (buffer: Buffer, start: number, end: number) => {
  const numbers = [];
  for (let i = start; i < end; i += 1) {
    numbers.push(buffer.readUInt8(i));
  }
  return numbers;
};

export const normalizeAudioData = (PCMData: number[]) => PCMData.map(num => (num - 128) / 128);

