export interface SearchResultItem {
    value: string;
    label?: string;
    description?: string;
    [key: string]: any;
}

export async function fetchDataBySearch(
    txt: string,
    doctype: string,
    token: string,
    reference_doctype?: string,
    filters?: any,
    search_fields?: string[],
    display_fields?: string[]
): Promise<SearchResultItem[]> {
    try {
        const res = await fetch('/api/search-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${token}`,
            },
            body: JSON.stringify({
                txt,
                module: doctype,
                ...(reference_doctype && { reference_doctype }),
                ...(filters && { filters }),
                ...(search_fields && { search_fields }),
                ...(display_fields && { display_fields }),
            }),
        });

        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error(`Error fetching ${doctype}:`, error);
        return [];
    }
}
