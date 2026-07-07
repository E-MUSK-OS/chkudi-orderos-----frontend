"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Info } from "lucide-react";
import type { useCamera } from "../hooks/useCamera";
import type { useRecorder } from "../hooks/useRecorder";
import type { useScanner } from "../hooks/useScanner";
import Input from "@/components/ui/Input";

interface ScannerInputProps {
  camera: ReturnType<typeof useCamera>;
  recorder: ReturnType<typeof useRecorder>;
  scanner: ReturnType<typeof useScanner>;
}

const ScannerInput = ({ camera, recorder, scanner }: ScannerInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    processScan,
    processKeyboardInput,
    lastScan,
    scanHistory,
    scannerStatus,
    isProcessing,
  } = scanner;
  const { stream } = camera;
  const { isRecording, startRecording, stopRecording } = recorder;
  const [trackingId, setTrackingId] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTrackingId = (id: string) => {
    console.log(id);
    // setTrackingId("");

    if (!stream) {
      console.warn("Camera not ready");
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    startRecording(stream, id);
  };

  const handleSubmit = async (value?: string) => {
    const id = (value ?? trackingId).trim();

    if (!id || isProcessing) return;

    // setIsProcessing(true);

    try {
      const result = await processScan(id);

      if (!result?.success) return;

      handleTrackingId(result.trackingId);

      // setTrackingId("");
    } finally {
      // setIsProcessing(false);

      inputRef.current?.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingId(e.target.value);
  };

  const focusAndSelectInput = () => {
    const input = inputRef.current;

    if (!input) return;

    input.focus();

    input.setSelectionRange(0, input.value.length);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;

      // processKeyboardInput(event.key, (id) => {
      //   setTrackingId(id);

      //   setTimeout(() => {
      //     focusAndSelectInput();

      //     void handleSubmit(id);
      //   }, 0);
      // });

      processKeyboardInput(event.key, (id) => {
        setTrackingId(id);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            focusAndSelectInput();
            void handleSubmit(id);
          });
        });
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [processKeyboardInput]);

  return (
    <div className="pt-5">
      <div className="space-y-3">
        <label className="block text-lg font-medium text-gray-700">
          Tracking ID
        </label>

        <div className="flex gap-3">
          <div className="w-[85%]">
            <Input
              ref={inputRef}
              type="text"
              value={trackingId}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              disabled={isProcessing}
              autoComplete="off"
              spellCheck={false}
              placeholder="Scan barcode or enter tracking ID manually..."
              className="flex-1 px-4 py-3 w-full bg-transparent outline-none"
            />
          </div>

          <div className="w-[15%]">
            <button
              onClick={() => handleSubmit()}
              disabled={isProcessing || !trackingId.trim()}
              className="w-full h-full flex gap-5 justify-center items-center bg-[#0A0E1A] px-6 py-3 font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isProcessing && (
          <p className="text-sm text-blue-600">Processing scan...</p>
        )}
      </div>
    </div>
  );
};

export default ScannerInput;
