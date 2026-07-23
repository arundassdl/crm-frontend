// Third-party Imports
import styled from '@emotion/styled'

// Config Imports
import themeConfig from '@configs/themeConfig'

type StyledMainProps = {
  isContentCompact: boolean
  /** Per-route override for the content padding. Falls back to the themeConfig default (15px). */
  layoutPadding?: number
}

const StyledMain = styled.main<StyledMainProps>`
  padding: ${({ layoutPadding }) => layoutPadding ?? themeConfig.layoutPadding}px;
  ${({ isContentCompact }) =>
    isContentCompact &&
    `
    margin-inline: auto;
    max-inline-size: ${themeConfig.compactContentWidth}px;
    /* Sticky header lives in layout flow — no fixed-header offset */
  `}
`

export default StyledMain
