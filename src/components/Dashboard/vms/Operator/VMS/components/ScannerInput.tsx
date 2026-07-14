"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Info } from "lucide-react";
import type { useCamera } from "../hooks/useCamera";
import type { useRecorder } from "../hooks/useRecorder";
import type { useScanner } from "../hooks/useScanner";
import Input from "@/components/ui/Input";
import { useVMSStore } from "../store/vmsStore";

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
  // const { stream } = camera;
  const { streamRef } = camera;
  const {
    isRecording,
    startRecording,
    stopRecording,
    isRecorderRunning,
    queueNextRecording,
    clearNextRecording,
    stoppingRef,
  } = recorder;
  const [trackingId, setTrackingId] = useState("");
  const session = useVMSStore((state) => state.session);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // const handleTrackingId = (id: string) => {
  //   console.log("SCAN =", id);
  //   console.log("NEW SCAN =", id);
  //   console.log("CURRENT RECORDING =", recorder.isRecording);
  //   console.log("START RECORDING =>", id);
  //   const stream = streamRef.current;

  //   if (!stream) {
  //     console.warn("Camera not ready");
  //     return;
  //   }

  //   if (stoppingRef.current) {
  //     queueNextRecording(stream, id);

  //     return;
  //   }

  //   if (isRecorderRunning()) {
  //     queueNextRecording(stream, id);

  //     stopRecording();

  //     return;
  //   }

  //   startRecording(stream, id);
  // };

  const handleTrackingId = (id: string, fromScanner: boolean) => {
    const stream = streamRef.current;

    if (!stream) {
      console.warn("Camera not ready");
      return;
    }

    if (stoppingRef.current) {
      if (fromScanner) {
        queueNextRecording(stream, id);
      } else {
        clearNextRecording();
      }

      return;
    }

    if (isRecorderRunning()) {
      if (fromScanner) {
        queueNextRecording(stream, id);
      } else {
        clearNextRecording();
      }

      stopRecording();

      return;
    }

    if (fromScanner) {
      startRecording(stream, id);
    }
  };

  const handleSubmit = async (value?: string) => {
    const id = (value ?? trackingId).trim();

    console.log("SUBMIT =>", id);

    if (!id || isProcessing) return;

    // setIsProcessing(true);

    try {
      const result = await processScan(id);

      if (!result?.success) return;

      // handleTrackingId(result.trackingId);
      handleTrackingId(result.trackingId, false);
      requestAnimationFrame(() => {
        focusAndSelectInput();
      });

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
    // const handleKeyDown = (event: KeyboardEvent) => {
    //   if (document.activeElement === inputRef.current) return;

    // processKeyboardInput(event.key, (id) => {
    //   setTrackingId(id);

    //   setTimeout(() => {
    //     focusAndSelectInput();

    //     void handleSubmit(id);
    //   }, 0);
    // });

    // processKeyboardInput(event.key, (id) => {
    //   setTrackingId(id);

    //   requestAnimationFrame(() => {
    //     requestAnimationFrame(() => {
    //       focusAndSelectInput();
    //       void handleSubmit(id);
    //     });
    //   });
    // });
    // };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) {
        event.preventDefault();
      }

      // processKeyboardInput(event.key, (id) => {
      //   setTrackingId(id);

      //   void handleSubmit(id);
      // });

      processKeyboardInput(event.key, async (id) => {
        setTrackingId(id);

        const result = await processScan(id);

        if (!result?.success) return;

        handleTrackingId(result.trackingId, true);

        requestAnimationFrame(() => {
          focusAndSelectInput();
        });
      });
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [processKeyboardInput]);

  return (
    <div className="">
      <div className="space-y-3">
        {/* <label className="block text-lg font-medium text-gray-700">
          Tracking ID
        </label> */}

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
