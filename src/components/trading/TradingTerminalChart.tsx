"use client";

import { PriceUpdate } from "@/library/hooks/useMockTradingEngine";
import { createChart, ColorType } from "lightweight-charts";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const TradingTerminalChart = React.forwardRef(({ ...props }: any, ref) => {
  const {
    colors: {
      backgroundColor = "white",
      lineColor = "#2962FF",
      textColor = "black",
      areaTopColor = "#2962FF",
      areaBottomColor = "rgba(41, 98, 255, 0.28)",
    } = {},
  } = props;

  const seriesRef = useRef<any>(null);

  const [lastUpdate, setLastUpdate] = useState<PriceUpdate | null>(null);

  const updatePriceFeed = useCallback(
    (update: PriceUpdate) => {
      if (lastUpdate && lastUpdate.time > update.time) {
        return;
      }

      if (seriesRef) {
        seriesRef.current.update({
          time: update.time,
          open: update.open,
          high: update.high,
          low: update.low,
          close: update.close,
        });
      }
      setLastUpdate(update);
    },
    [seriesRef, lastUpdate, setLastUpdate]
  );

  // Exponer la función updatePriceFeed usando useImperativeHandle
  useImperativeHandle(ref, () => ({
    updatePriceFeed,
  }));

  const chartContainerRef = useRef<any>();

  useEffect(() => {
    if (chartContainerRef.current) {
      // chartContainerRef.current.remove();
    }
    if (seriesRef.current) {
      // seriesRef.current.remove();
    }

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      timeScale: {
        timeVisible: true, // Asegura que la escala de tiempo sea visible
        secondsVisible: false, // Oculta los segundos (opcional, si no necesitas verlos)
        tickMarkFormatter: (time: any, tickMarkType: any, locale: any) => {
          const date = new Date(time * 1000); // Convierte el timestamp en una fecha
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          return `${hours}:${minutes}`;
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    chart.timeScale().fitContent();

    const cSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    window.addEventListener("resize", handleResize);

    seriesRef.current = cSeries;

    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, [backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  return <div ref={chartContainerRef} />;
});

export default TradingTerminalChart;
