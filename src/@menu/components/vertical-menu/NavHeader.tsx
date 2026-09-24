// Third-party Imports
import styled from '@emotion/styled'

// Type Imports
import type { ChildrenType } from '../../types'

// Util Imports
import { verticalNavClasses } from '../../utils/menuClasses'

const StyledNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  flex-shrink: 0;
  height: var(--header-height);
  min-block-size: var(--header-height);
  max-block-size: var(--header-height);
  box-sizing: border-box;
`

const NavHeader = ({ children }: ChildrenType) => {
  return <StyledNavHeader className={verticalNavClasses.header}>{children}</StyledNavHeader>
}

export default NavHeader
