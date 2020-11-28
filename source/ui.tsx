import React, { FC, useEffect, useState } from "react";
import { Text } from "ink";
import soundcloudKeyFetch from "soundcloud-key-fetch";
import lame from "@suldashi/lame";
import got from "got";
import Speaker from "speaker";
import useStdoutDimensions from "ink-use-stdout-dimensions";
import Analyser from "audio-analyser";
import InkLink from "ink-link";

import normalizeAudioData from "./normalizeAudioData";
import Spectrum from "./Spectrum";

type UserStreamsResponse = {
  collection: {
    type: "track" | string;
    track?: {
      id: number;
      media: {
        transcodings: {
          url: string;
          format: {
            protocol: "progressive" | string;
          };
        }[];
      };
    };
  }[];
};

type TranscodingUrlResponse = {
  url: string;
};

async function sideEffects(
  callback: (
    frame: number,
    audioDataParser: (columns: number) => number[]
  ) => void
) {
  const key = await soundcloudKeyFetch.fetchKey();
  const response = await got<UserStreamsResponse>(
    `https://api-v2.soundcloud.com/stream/users/2173404?limit=40&client_id=${key}&app_version=1606403857&app_locale=en`,
    {
      responseType: "json",
    }
  );
  const item = response.body.collection.find((item) => {
    if (!item.track) return false;
    return item.type === "track" && item.track.id === 691418836;
  });
  if (!item) return;
  const transcoding = item.track?.media.transcodings.find(
    (transcoding) => transcoding.format.protocol === "progressive"
  );
  if (transcoding) {
    const response = await got<TranscodingUrlResponse>(
      `${transcoding.url}?client_id=${key}`,
      {
        responseType: "json",
      }
    );
    const decoder = lame.Decoder();
    const analyzer = new Analyser({
      minDecibels: -100,
      maxDecibels: 0,
      throttle: 10,
      smoothingTimeConstant: 0.1,
    });
    // @ts-ignore
    const s = new Speaker({ samplesPerFrame: 1 });
    const apiStream = got.stream(response.body.url);

    let start;
    decoder.on("data", (data) => {
      decoder.pause();
      if (!start) start = Date.now();
      let piece = 0;
      function writeUntilEmpty() {
        const chunkSize = 1024 * 2 * 2;
        const chunk = data.slice(piece * chunkSize, (piece + 1) * chunkSize);

        analyzer.write(chunk);
        if (!chunk.length) {
          decoder.resume();
        } else if (s.write(chunk)) {
          // hmm... doesn't seem to me that speaker is ever ready for two writes in a row.
        } else {
          callback(Date.now() - start, (columns: number) =>
            analyzer.getFrequencyData(columns)
          );
          s.once("drain", () => {
            if (finished) {
              callback(Date.now() - start, (columns: number) =>
                Array.apply(null, Array(columns)).map(() => -100)
              );
            }
            piece++;
            writeUntilEmpty();
          });
        }
      }
      writeUntilEmpty();
    });
    let finished = false;
    decoder.on("end", () => {
      finished = true;
    });
    apiStream.pipe(decoder);
  }
}

const App: FC = () => {
  const [columns, rows] = useStdoutDimensions();
  const columnsToRender = Math.min(columns * 2, 160);
  const baseSpectrum = Array.apply(null, Array(columnsToRender)).map(
    () => -100
  );
  const [frameData, setFrameData] = useState({
    time: 0,
    audioDataParser: (num) => baseSpectrum,
  });
  useEffect(() => {
    sideEffects((time, audioDataParser) => {
      setFrameData({
        time,
        audioDataParser,
      });
    });
  }, []);
  const seconds = Math.floor(frameData.time / 1000);
  const spec = normalizeAudioData(frameData.audioDataParser(columnsToRender));
  const title = "Those Cheeks";
  const artist = "Ken Wheeler";
  const spacer = " - ";
  const time = `${Math.floor(seconds / 60)}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
  return (
    <>
      <Spectrum
        height={rows - 1}
        width={columnsToRender / 2}
        spectrum={spec}
      />
      <Text>
        <InkLink
          fallback={false}
          url="https://soundcloud.com/thekenwheeler/those-cheeks"
        >
          {artist}
          {spacer}
          <Text italic>{title}</Text>
        </InkLink>
        {" ".repeat(Math.max(1, columnsToRender / 2 -
            (artist.length + spacer.length + title.length + time.length))
        )}
        {time}
      </Text>
    </>
  );
};

export default App;
