import React from "react";
import { Box, render, Text, Transform } from "ink";

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
  const lowestColor = [5, 223, 215];
  const secondLowestColor = [163, 247, 191];
  const secondHighestColor = [255, 245, 145];
  const highestColor = [250, 38, 160];
  while (lines.length < height) {
    const line = spectrum.map((val) => {
      const remainder = val * height - lines.length; 
      if (remainder > 0) {
        // blocks...
        // https://en.wikipedia.org/wiki/Block_Elements
        // return '█'; // full
        if (remainder > 1) {
          return "█"; // full height
        } else if (remainder > 3/4) {
          return "▆" // 7/8
        } else if (remainder > 5/8) {
          return "▆" // 3/4
        }else if (remainder > 1/2) {
          return '▅' // 5/8
        } else if (remainder > 3/8) {
          return "▄" // 1/2
        } else if (remainder > 1/4) {
          return "▃" // 3/8
        } else if (remainder > 1/8){
          return "▂" // 1 / 4
        } else if (remainder > 0) {
          return "▁" // lower 1/8 block
        }
      }
      return " ";
    });
    const lineString = line.join("");
    if (lineString.length > width) {
      // console.log('bugger off', lineString.length, width, spectrum.length);
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
        if (percentFilled < 0.4) {
          color1 = lowestColor;
          color2 = secondLowestColor;
          percent = percentFilled / 0.4;
        } else if (percentFilled < 0.9) {
          color1 = secondLowestColor;
          color2 = secondHighestColor;
          percent = (percentFilled - 0.4) / 0.5;
        } else {
          color1 = secondHighestColor;
          color2 = highestColor;
          percent = (percentFilled - 0.9) / 0.1;
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