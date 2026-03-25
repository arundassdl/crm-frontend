import MultiFileUpload from "@/components/Common/Upload/MultiFileUpload";
import { Card, CardContent, CircularProgress, Grid, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

const LeadAttachment: any = (slug) => {
    
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState<any>(() => {
      const initialValue = JSON.parse(localStorage.getItem('AccessTokenData') || '{}');
      return initialValue || "";
  });    
  let [dealData, setDealData] = useState<any>(slug?.slug?.record);

   const theme = useTheme();

  let userData: any;
  let userAddress: any;
  if (typeof window !== 'undefined') {
    if (localStorage.getItem('userProfileData') != 'undefined') {
        // alert(localStorage.getItem('userData'))
        userData = JSON.parse(localStorage.getItem('userProfileData') || '[]')
    }

  }
  useEffect(() => {
      setDealData(slug?.slug?.record)
      setLoading(false)
  }, [slug]); 
    
    return (
        <>
            <Grid container spacing={5} className="px-5"  style={{ paddingLeft: '0px' }}>
                <Grid item xs={24} sm={12}>
                    <Grid container spacing={6}>
                        <Grid item xs={24} sm={12}>
                            <Card sx={{boxShadow:'none'}}  className="border">
                                <CardContent>
                                    <Grid container spacing={6}>
                                        <Grid item xs={24} sm={12}>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Typography></Typography>
                                                </div>
                                            </div>
                                            {loading && <CircularProgress /> }                                          
                                            {dealData?.name && (
                                            <MultiFileUpload
                                                attachedToDoctype="CRM Lead"
                                                attachedToName={dealData?.name}
                                                //   attachedToField="attachment"  //pass this if we nee to attach to doctype
                                                allowedTypes={["image/*", "application/pdf"]}
                                                // multiple={false} // pass false if single file upload
                                                folder="Home/Attachments" // pass if specific folder path
                                                maxFiles={5} // ← limit upload count by default 10
                                                heading={"Attachments"}
                                                btnHeading={"Add Attachment"}
                                                onUploadComplete={(files) => console.log('Uploaded for item:', files)}
                                            />
                                            )}
                                            
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};

export default LeadAttachment;
