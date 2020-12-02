import React, { FC, useEffect, useState } from "react";
import { Text } from "ink";
import soundcloudKeyFetch from "soundcloud-key-fetch";
// @ts-ignore
import lame from "lame-private-no-maintainence-shrug2";
import got from "got";
import Speaker from "speaker-private-no-maintainence-shrug2";
import useStdoutDimensions from "ink-use-stdout-dimensions";
import Analyser from "audio-analyser";
import InkLink from "ink-link";
import { platform } from "os";
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
      smoothingTimeConstant: 0.4,
      throttle: 1,
    });

    const s = new Speaker({
      // @ts-ignore
      samplesPerFrame: platform() === "darwin" ? 44100 : 1,
    });
    const apiStream = got.stream(response.body.url);

    let start;
    decoder.on("data", (data) => {
      decoder.pause();
      if (!start) start = Date.now();
      let piece = 0;
      const chunkSize = 1024;
      function writeUntilEmpty() {
        const chunk = data.slice(piece * chunkSize, (piece + 1) * chunkSize);

        if (!chunk.length) {
          decoder.resume();
        } else {
          s.write(chunk, () => {
            piece++;
            writeUntilEmpty();
            analyzer._capture(chunk, () => {
              if (!finished) {
                callback(Date.now() - start, (columns: number) =>
                  analyzer.getFrequencyData(columns)
                );
              }
            });
          });
        }
      }
      writeUntilEmpty();
    });
    let finished = false;
    decoder.on("end", () => {
      finished = true;
      callback(Date.now() - start, (columns: number) =>
        Array.apply(null, Array(columns)).map(() => -100)
      );
    });
    apiStream.pipe(decoder);
  }
}

const App: FC = () => {
  const [columns, rows] = useStdoutDimensions();
  const columnsToRender = Math.min(columns * 2, 160);
  const [frameData, setFrameData] = useState({
    time: 0,
    audioDataParser: (num) =>
      Array.apply(null, Array(columnsToRender)).map(() => -100),
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
      {<Spectrum height={Math.min(rows - 1, 20)} width={columnsToRender / 2} spectrum={spec} />}
      <Text>
        <InkLink
          fallback={false}
          url="https://soundcloud.com/thekenwheeler/those-cheeks"
        >
          {artist}
          {spacer}
          <Text italic>{title}</Text>
        </InkLink>
        {" ".repeat(
          Math.max(
            1,
            columnsToRender / 2 -
              (artist.length + spacer.length + title.length + time.length)
          )
        )}
        {time}
      </Text>
    </>
  );
};

export default App;
