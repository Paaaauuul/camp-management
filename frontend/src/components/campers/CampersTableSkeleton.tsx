import React from "react";

export function CampersTableSkeleton() {
    const SkeletonBlock = ({ width, height = "h-5", className = "" }: any) => (
        <div
            className={`bg-gray-200 rounded ${height} ${width} ${className}`}
            aria-hidden="true"
        ></div>
    );

    const SkeletonRow = () => (
        <tr className="border-b border-gray-100">
            <td className="py-3 px-4">
                <SkeletonBlock width="w-32" />
            </td>
            <td className="py-3 px-4">
                <SkeletonBlock width="w-48" />
            </td>
            <td className="py-3 px-4">
                <SkeletonBlock width="w-32" />
            </td>
            <td className="py-3 px-4">
                <SkeletonBlock width="w-16" />
            </td>
            <td className="py-3 px-4 text-right">
                <SkeletonBlock width="w-20" />
            </td>
            <td className="py-3 px-4">
                <SkeletonBlock width="w-24" />
            </td>
            <td className="py-3 px-4">
                <SkeletonBlock width="w-5" />
            </td>
        </tr>
    );

    return (
        <div className="bg-white rounded-lg shadow animate-pulse">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            {["", "", "", "", "", "", ""].map((_, i) => (
                                <th key={i} className="text-left py-3 px-4">
                                    <SkeletonBlock
                                        width={`w-${
                                            [20, 24, 24, 32, 20, 28, 5][i]
                                        }`}
                                        height="h-6"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 5 }, (_, i) => (
                            <SkeletonRow key={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
