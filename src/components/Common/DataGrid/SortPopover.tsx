"use client";
import React, { useState, useEffect } from "react";
import Popover from "@mui/material/Popover";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { ArrowUp, ArrowDown, Plus, Trash, SortAscending } from "@phosphor-icons/react";
import { useTheme } from "@mui/material/styles";

export interface SortRow {
  id: string;
  column: string;
  dir: "asc" | "desc";
}

interface Props {
  anchor: HTMLElement | null;
  onClose: () => void;
  sorts: SortRow[];
  onChange: (sorts: SortRow[]) => void;
  columns: { value: string; label: string }[];
}

const uid = () => Math.random().toString(36).slice(2, 8);

export default function SortPopover({ anchor, onClose, sorts, onChange, columns }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const SELECT_SX = {
    fontSize: "14px",
    ...(isDark ? {} : { bgcolor: "#EFF6FF" }),
    borderRadius: "8px",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "#3F3F46" : "#E3ECFC", borderWidth: 1.5 },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "#52525B" : "#E3ECFC" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "#71717A" : "#E3ECFC", borderWidth: 2 },
    "&.Mui-focused": { boxShadow: "none" },
    "& .MuiSelect-select": { py: "6px", px: "10px" },
  };

  const SORT_COLUMNS = columns;
  const defaultColumn = SORT_COLUMNS[0]?.value ?? "";

  const [local, setLocal] = useState<SortRow[]>([]);

  useEffect(() => {
    if (Boolean(anchor)) {
      setLocal(sorts.length ? sorts : [{ id: uid(), column: defaultColumn, dir: "asc" }]);
    }
  }, [anchor, sorts, defaultColumn]);

  const update = (id: string, patch: Partial<SortRow>) =>
    setLocal(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const add = () => setLocal(prev => [...prev, { id: uid(), column: defaultColumn, dir: "desc" }]);
  const remove = (id: string) => setLocal(prev => prev.filter(r => r.id !== id));

  const handleApply = () => {
    onChange(local);
    onClose();
  };

  const handleClear = () => {
    setLocal([{ id: uid(), column: defaultColumn, dir: "asc" }]);
    onChange([]);
    onClose();
  };

  return (
    <Popover
      open={Boolean(anchor)} anchorEl={anchor} onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{ zIndex: 1300 }}
      PaperProps={{
        sx: {
          borderRadius: "14px",
          border: `1.5px solid ${isDark ? "#27272A" : "#E3ECFC"}`,
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(12,36,114,0.14)",
          mt: 0.5,
          overflow: "hidden",
          bgcolor: isDark ? "#18181B" : "#fff",
        },
      }}
    >
      <div className="w-[380px]">
        {/* Popover header */}
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[#EFF6FF] border-[#E3ECFC]"}`}>
          <SortAscending size={16} color={isDark ? "#E4E4E7" : "#1D4ED8"} weight="duotone" />
          <p className={`m-0 font-sans text-[14px] font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-800"}`}>Sort Records</p>
          <span className={`ml-auto text-[12px] ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>{local.length} sort{local.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Sort rows */}
        <div className="p-3 space-y-2">
          {local.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-2">
              {/* Priority label */}
              <span className={`font-sans text-[11px] font-bold uppercase tracking-wider w-10 flex-shrink-0 ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>
                {idx === 0 ? "By" : "Then"}
              </span>

              {/* Column */}
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select value={row.column} onChange={e => update(row.id, { column: e.target.value })} sx={SELECT_SX}>
                  {SORT_COLUMNS.map(c => (
                    <MenuItem key={c.value} value={c.value} sx={{ fontSize: "14px" }}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Direction toggle */}
              <div className={`flex items-center rounded-lg border p-0.5 gap-0.5 ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[#EFF6FF] border-[#E3ECFC]"}`}>
                {(["asc", "desc"] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => update(row.id, { dir })}
                    title={dir === "asc" ? "Ascending A→Z / 0→9" : "Descending Z→A / 9→0"}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      row.dir === dir
                        ? isDark ? "bg-[#3F3F46] text-[#F4F4F5] shadow-sm" : "bg-[#1D4ED8] text-white shadow-sm"
                        : isDark ? "text-[#71717A] hover:text-[#A1A1AA]" : "text-slate-400 hover:text-slate-600"
                    }`}>
                    {dir === "asc"
                      ? <ArrowUp size={12} weight="duotone" />
                      : <ArrowDown size={12} weight="duotone" />
                    }
                    {dir === "asc" ? "Asc" : "Desc"}
                  </button>
                ))}
              </div>

              {/* Remove */}
              {local.length > 1 && (
                <IconButton size="small" onClick={() => remove(row.id)}
                  sx={{ borderRadius: "6px", p: 0.5, "&:hover": { bgcolor: isDark ? "#27272A" : "#FEF2F2" } }}>
                  <Trash size={13} color="#EF4444" weight="duotone" />
                </IconButton>
              )}
            </div>
          ))}

          {/* Add sort */}
          {local.length < 3 && (
            <button onClick={add}
              className={`flex items-center gap-1.5 text-[13px] font-medium py-1.5 px-2 rounded-lg transition-colors w-full ${
                isDark
                  ? "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#27272A]"
                  : "text-[#1D4ED8] hover:text-[#0C2472] hover:bg-[#EFF6FF]"
              }`}>
              <Plus size={12} weight="bold" />
              Add sort
            </button>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[#f9fbff] border-[#EFF6FF]"}`}>
          <button onClick={handleClear}
            className={`text-[13px] font-medium px-2 py-1 rounded-lg transition-colors ${isDark ? "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#27272A]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}>
            Clear
          </button>
          <Button variant="contained" size="small" onClick={handleApply}
            sx={{
              bgcolor: isDark ? "#3F3F46" : "#1D4ED8",
              color: "#fff",
              borderRadius: "8px", textTransform: "none", fontWeight: 500, fontSize: "13px", px: 2,
              boxShadow: isDark ? "none" : undefined,
              "&:hover": { bgcolor: isDark ? "#52525B" : "#1640B8", boxShadow: isDark ? "none" : undefined },
            }}>
            Apply Sort
          </Button>
        </div>
      </div>
    </Popover>
  );
}
