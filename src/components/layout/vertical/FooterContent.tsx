'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import themeConfig from '@/configs/themeConfig'
import { useTheme } from '@mui/material/styles'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <div
      className={classnames(
        verticalLayoutClasses.footerContent,
        'flex items-center justify-end flex-wrap gap-4 py-5 pr-4'
      )}
      style={{ backgroundColor: isDark ? "#121212" : "#EFF6FF" }}
    >
      <p>
        <span>{`© ${new Date().getFullYear()}, ${themeConfig.footerText} - All rights reserved `}</span>
        {/* <span>{`❤️`}</span>
        <span>{` by `}</span>
       <Link href='https://socialdnalabs.com' target='_blank' className='text-primary'>
          SDL
        </Link> */}
      </p>
      {/* {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          <Link href='https://themeselection.com/license' target='_blank' className='text-primary'>
            License
          </Link>
          <Link href='https://themeselection.com' target='_blank' className='text-primary'>
            More Themes
          </Link>
          <Link href={process.env.NEXT_PUBLIC_DOCS_URL as string} target='_blank' className='text-primary'>
            Documentation
          </Link>
          <Link
            href={`https://github.com/themeselection/${process.env.NEXT_PUBLIC_REPO_NAME}/issues`}
            target='_blank'
            className='text-primary'
          >
            Support
          </Link>
        </div>
      )} */}
    </div>
  )
}

export default FooterContent
