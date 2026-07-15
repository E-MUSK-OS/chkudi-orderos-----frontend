"use client";

interface Props {
  trackingIds: string[];
}

export default function MissingTrackingList({
  trackingIds,
}: Props) {
  if (trackingIds.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-500/20 px-5 py-4">
        <div>
          <h2 className="text-xl text-[#111827]">
            Missing VMS Records
          </h2>

          <p className="mt-1 text-md text-gray-400">
            These Tracking IDs were scanned but no VMS record was found.
          </p>
        </div>

        <div className="rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
          {trackingIds.length}
        </div>
      </div>

      {/* Body */}
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full">
          <thead className="border-b border-slate-700 bg-[#111827]">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-300">
                NO.
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-300">
                Tracking ID
              </th>
            </tr>
          </thead>

          <tbody>
            {trackingIds.map((id, index) => (
              <tr
                key={id}
                className="border-b border-slate-800 "
              >
                <td className="px-5 py-3 text-[#111827]">
                  {index + 1}
                </td>

                <td className="px-5 py-3 font-medium text-[#111827]">
                  {id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}