// import { TrackingScanItem } from "../types";
import { VMSItem } from "../../VMS/Admin/types";

interface UpdateResult {
  data: VMSItem[];
  found: boolean;
  alreadyScanned: boolean;
}

export const updateScanStatus = (
  items: VMSItem[],
  scannedTrackingId: string,
): UpdateResult => {
  let found = false;
  let alreadyScanned = false;

  const updatedData = items.map((item) => {
    if (item.trackingId !== scannedTrackingId) {
      return item;
    }

    found = true;

    // if (item.scanStatus === "SCANNED") {
    if (item.packingScanStatus === "SCANNED") {
      alreadyScanned = true;
      return item;
    }

    return {
      ...item,
      scanStatus: "SCANNED",
    };
  });

  return {
    data: updatedData,
    found,
    alreadyScanned,
  };
};
