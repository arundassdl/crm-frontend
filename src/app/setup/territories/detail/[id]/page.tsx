import React from "react";
import TerritoryDetail from '@/components/territory/TerritoryDetail';

export default async function TerritoryDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise
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
