import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import getSubscriber from '../services/api/general_apis/newsletter-subscription-api';
import { useDispatch, useSelector } from 'react-redux';
import { SelectedFilterLangDataFromStore } from '../store/slices/general_slices/selected-multilanguage-slice';
import { showToast } from './ToastNotificationNew';
import themeConfig from '@/configs/themeConfig';

const Footer = () => {
  const navbarData: any = [];
  const [subScription, setSubscriptions] = useState<any>('');

  const handleSubscriptionInput = (e: any) => {
    setSubscriptions(e?.target?.value);
  };

  const handleSubscription = async (event: any) => {
    event?.preventDefault();
    let subScriptionRes = await getSubscriber(subScription);
    if (subScriptionRes?.data?.message?.msg === 'success') {
      showToast('subscribed successfully', 'success');
      setSubscriptions('');
    }
  };

  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );

  const [selectLangData, setLangData] = useState<any>();

  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
  }, [SelectedLangDataFromStore?.selectedLanguageData]);

  let isLoggedIn: any;
  if (typeof window !== 'undefined') {
    isLoggedIn = localStorage.getItem('isLoggedIn');
  }

  
  return (
    <>
      <footer className="footer footer-light footer-section">
        <div className="container ">
           
            <div className="row justify-content-center align-items-center footer-upper-wrapper-mob">
              <div 
                className="col-xl-12 col-lg-2 log-img-mr-mob text-center pt-3 pb-3"
                
              >
                <span className='copy-text'>Copyright {(new Date().getFullYear())} {themeConfig.footerText} - All rights reserved</span>
                {/* <Link href="" legacyBehavior>
                  <Image
                    src="/assets/images/nuetechLogo.png"
                    alt="logo-footer"
                    width={250}
                    height={55}
                  />
                </Link> */}
              </div>
              
              
              
            </div> 
          
        </div>
      </footer>
    </>
  );
};

export default Footer;
