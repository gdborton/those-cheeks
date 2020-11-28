export default function normalizeAudioData(PCMData: number[]) {
  return PCMData.map(num => (num + 100) / 100);
};

