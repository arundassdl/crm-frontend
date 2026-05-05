import React from "react";
import TerritoryDetail from '@/components/territory/TerritoryDetail';

export default function TerritoryDetailPage({ params }: { params: { id: string } }) {
    const territoryName = params.id // Using id as name per route [id]
    const decodedName = decodeURIComponent(territoryName);

    return (
        <>
            <div>
                <TerritoryDetail territory_name={decodedName} />
            </div>
        </>
    );
}
