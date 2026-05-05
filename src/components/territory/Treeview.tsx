"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    IconButton,
    Collapse,
    Box,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { get_full_territory_tree } from "@/services/api/territory/territory-api";

interface Territory {
    name: string;
    territory_name: string;
    parent_crm_territory: string | null;
    children: Territory[];
}

export default function TerritoryTreeView() {
    const [expandedTerritories, setExpandedTerritories] = useState<Set<string>>(new Set());
    const [treeData, setTreeData] = useState<Territory[]>([]);
    const [err, setErr] = useState<boolean>(false);

    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            readAccessTokenDataRaw()
        );
        return initialValue || "";
    });

    useEffect(() => {
        const getTerritoryTree = async () => {
            if (!userToken?.access_token) return;

            const data = await get_full_territory_tree(userToken.access_token);
            console.log(data, 'territoryTreeData');

            if (Array.isArray(data) && data.length > 0) {
                setTreeData(data);
                // Expand all territories by default
                setExpandedTerritories(new Set(getAllTerritoryNames(data)));
            } else {
                setErr(true);
            }
        };

        getTerritoryTree();
    }, [userToken?.access_token]);

    const getAllTerritoryNames = (territories: Territory[]): string[] => {
        let names: string[] = [];
        for (const territory of territories) {
            names.push(territory.name);
            if (territory.children && territory.children.length > 0) {
                names = names.concat(getAllTerritoryNames(territory.children));
            }
        }
        return names;
    };

    const toggleExpanded = (name: string) => {
        const newExpanded = new Set(expandedTerritories);
        newExpanded.has(name) ? newExpanded.delete(name) : newExpanded.add(name);
        setExpandedTerritories(newExpanded);
    };

    const renderTerritory = (territory: Territory, depth = 0) => {
        const isExpanded = expandedTerritories.has(territory.name);
        const hasChildren = territory.children && territory.children.length > 0;

        return (
            <Box key={territory.name} sx={{ ml: depth * 3, mt: 1 }}>
                <Box
                    display="flex"
                    alignItems="center"
                    p={1}
                    border={1}
                    borderColor="divider"
                    borderRadius={1}
                >
                    {hasChildren && (
                        <IconButton size="small" onClick={() => toggleExpanded(territory.name)}>
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    )}
                    {!hasChildren && <Box width={32} />}
                    <Box display="flex" alignItems="center" sx={{ mr: 1 }}>
                        <Typography
                            component="a"
                            href={`/setup/territories/detail/${territory.name}`}
                            variant="body2"
                            sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                        >
                            {territory.territory_name}
                        </Typography>
                    </Box>
                </Box>
                {hasChildren && (
                    <Collapse in={isExpanded}>
                        {territory.children.map((child) => renderTerritory(child, depth + 1))}
                    </Collapse>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="grid" gap={3}>
                <Card>
                    <CardContent>
                        {treeData.length > 0 ? (
                            treeData.map((territory) => renderTerritory(territory))
                        ) : (
                            <Typography variant="body2" color="textSecondary">
                                {err ? "Failed to load territory tree." : "Loading..."}
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
