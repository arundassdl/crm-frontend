'use client';
import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

type Stage = {
  label: string;
  index:number;
};

type PipelineStageBarProps = {
  doctype: string;
  name: string;
  fieldname: string;
  currentLabel: string;
  onSubmit?: (payload: any) => void; // optional external handler
};

const stages: Stage[] = [
  { label: 'Qualification',index:0 },
  { label: 'Demo/Making',index:1 },
  { label: 'Proposal/Quotation',index:2 },
  { label: 'Negotiation' ,index:3},
  { label: 'Ready to Close',index:4 },
  { label: 'Won' ,index:5},
  { label: 'Lost' ,index:6},
];

export default function PipelineStageBar({
  doctype,
  name,
  fieldname,
  currentLabel,
  onSubmit,
}: PipelineStageBarProps) {

  // const [activeIndex, setActiveIndex] = useState(3);
const [activeIndex, setActiveIndex] = useState(() => {
  const found = stages.find((s) => s.label === currentLabel);
  return found ? found.index : 0;  // fallback to 0 if not found
});

React.useEffect(() => {
  const found = stages.find((s) => s.label === currentLabel);
  console.log("found",currentLabel);  
  if (found) {
    setActiveIndex(found.index);
  }
  
}, [currentLabel]);

 const [loading, setLoading] = useState(false);
const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const handleStageClick = async (index: number, label: string) => {
    setLoading(true);
    setActiveIndex(index);
     const payload = {
      doctype,
      name,
      fieldname,
      value: label,
    };
    try {
      // Example API call
       const res = await fetch("/api/set-value", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${userToken?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
       
      console.log("resresres",res);
      console.log("payload res",payload);
      
      if (!res.ok) throw new Error('Failed to update stage');
      
      // Optionally handle response
      const data = await res.json();
      console.log('Stage updated:', data);
    } catch (err) {
      console.error('API error:', err);
      alert('Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1, // space between stage bar and buttons
        width: '100%',
        maxWidth: 1100,
        mx: 'auto',
        my: 2,
      
      }}
    >
      {/* Stage bar */}
      <Box
        sx={{
          display: 'flex',
          borderRadius: 999,
          // border: '1px solid #eee',
          overflow: 'hidden',
          flexGrow: 1,
          mr:10
        }}
      >
        {stages.map((stage, index) => {
          let bgColor = '#e0e0e0';
          let textColor = 'var(--mui-palette-secondary-dark)';
          let showCheck = false;

          if (index < activeIndex) {
            bgColor = '#fef0c8';
            textColor = 'var(--mui-palette-secondary-dark)';
            showCheck = true;
          } else if (index === activeIndex) {
            // bgColor = '#d2fae1';            
            // textColor = '#649176';
            bgColor = 'var(--mui-palette-primary-main)'
            textColor = '#fff';
            showCheck = true;
          }
          if(activeIndex=== 5 && index === activeIndex){
            bgColor = 'var(--mui-palette-success-main)'; // dark green active
            textColor = '#fff';  // <-- ensure white font for selected
            showCheck = true;
          }
          if(activeIndex=== 6 && index === activeIndex){
            bgColor = 'var(--mui-palette-error-main)'; // dark red active
            textColor = '#fff';  // <-- ensure white font for selected
            showCheck = true;
          }

          return (
            <Box
              key={stage.label}
              onClick={() => handleStageClick(index, stage.label)}
              sx={{
                position: 'relative',
                px: 3,
                py: 2,
                bgcolor: bgColor,
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                minWidth: 110,
                justifyContent: 'center',
                clipPath:
                  'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
                transition: 'background-color 0.4s ease, color 0.4s ease',
                '&:hover': {
                  opacity: 0.85,
                },
              }}
            >
              {showCheck && (
                <CheckIcon
                  sx={{
                    fontSize: 16,
                    mr: 0.5,
                    transition: 'color 0.4s ease',
                    color: textColor,
                  }}
                />
              )}
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ transition: 'color 0.4s ease',color:(index === activeIndex)?textColor:textColor }}
              >
                {stage.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Right-side buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          onClick={() => handleStageClick(5, 'Won')}
          sx={{
            bgcolor: activeIndex === 5 ? 'var(--mui-palette-success-main)' : '#d1f7d6',
            color: activeIndex === 5 ? '#fff' : 'var(--mui-palette-success-main)',
            px: 2,
            py: 1,
            minWidth: 80,
            textTransform: 'none',
            transition: 'background-color 0.4s ease, color 0.4s ease',
            '&:hover': {
              bgcolor: activeIndex === 5 ? 'var(--mui-palette-success-main)' : '#b2dfdb',
            },
          }}
        >
          Won
        </Button>
        <Button
          onClick={() =>  handleStageClick(6, 'Lost')}
          sx={{
            bgcolor: activeIndex === 6 ? 'var(--mui-palette-error-main)' : '#f8d7da',
            color: activeIndex === 6 ? '#fff' : 'var(--mui-palette-error-main)',
            px: 2,
            py: 1,
            minWidth: 80,
            textTransform: 'none',
            transition: 'background-color 0.4s ease, color 0.4s ease',
            '&:hover': {
              bgcolor: activeIndex === 6 ? 'var(--mui-palette-error-main)' : '#f5c6cb',
            },
          }}
        >
          Lost
        </Button>
      </Box>
    </Box>
  );
}
