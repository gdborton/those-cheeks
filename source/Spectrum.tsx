import React from "react";
import { Box, Text } from "ink";
import getCharacterFromRemainders from "./getSpectrumCharacter";



export default function Spectrum({
  spectrum,
  height = 10,
  width = 10,
}: {
  spectrum: number[];
  height: number;
  width: number;
}) {
  const lines = [];
  const lowestColor = [5, 255, 250];
  const secondLowestColor = [100, 247,150];
  const secondHighestColor = [255, 200, 100];
  const highestColor = [250, 38, 100];
  while (lines.length < height) {
    let line = [];
    for(let spectrumIndex = 0; spectrumIndex < spectrum.length; spectrumIndex += 2) {
      const leftRemainder = spectrum[spectrumIndex] * height - lines.length;
      const rightRemainder = spectrum[spectrumIndex + 1] * height - lines.length;
      line.push(getCharacterFromRemainders(leftRemainder, rightRemainder, lines.length)); 
    }
    lines.push(line.join(""));
  }
  return (
    <Box flexDirection="column-reverse">
      {lines.map((line, index) => {
        let percent = 0;
        let color1 = lowestColor;
        let color2 = secondLowestColor;
        const percentFilled = index / (height - 1);
        const lowThreshold = 0.33;
        const medThreshold = 0.66;
        if (percentFilled <= lowThreshold) {
          color1 = lowestColor;
          color2 = secondLowestColor;
          percent = percentFilled / lowThreshold;
        } else if (percentFilled <= medThreshold) {
          color1 = secondLowestColor;
          color2 = secondHighestColor;
          percent = (percentFilled - lowThreshold) / (medThreshold - lowThreshold);
        } else {
          color1 = secondHighestColor;
          color2 = highestColor;
          percent = Math.min(1, (percentFilled - medThreshold) / (1 - medThreshold) * 2);
        }
        const red = Math.min(
          Math.ceil(color1[0] + percent * (color2[0] - color1[0])),
          255
        );
        const green = Math.min(
          Math.ceil(color1[1] + percent * (color2[1] - color1[1])),
          255
        );
        const blue = Math.min(
          Math.ceil(color1[2] + percent * (color2[2] - color1[2])),
          255
        );
        return (
          <Text color={`rgb(${red}, ${green}, ${blue})`} key={index}>
            {line}
          </Text>
        );
      })}
    </Box>
  );
}