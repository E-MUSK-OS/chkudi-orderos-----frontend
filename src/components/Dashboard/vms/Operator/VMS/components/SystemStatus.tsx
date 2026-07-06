"use client";

import {
  Camera,
  ScanLine,
  Wifi,
  Server,
  CloudUpload,
  Database,
} from "lucide-react";

const systems = [
  {
    label: "Camera",
    value: "Connected",
    icon: Camera,
  },
  {
    label: "Scanner",
    value: "Ready",
    icon: ScanLine,
  },
  {
    label: "Internet",
    value: "Online",
    icon: Wifi,
  },
  {
    label: "Server",
    value: "Connected",
    icon: Server,
  },
  {
    label: "Upload Queue",
    value: "Running",
    icon: CloudUpload,
  },
  {
    label: "Local Storage",
    value: "Healthy",
    icon: Database,
  },
];

const SystemStatus = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          System Status
        </h2>

        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          All Systems OK
        </span>
      </div>

      {/* Content */}
      <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
        {systems.map((system) => {
          const Icon = system.icon;

          return (
            <div
              key={system.label}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <Icon className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {system.label}
                  </p>

                  <p className="font-semibold text-gray-800">
                    {system.value}
                  </p>
                </div>
              </div>

              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemStatus;