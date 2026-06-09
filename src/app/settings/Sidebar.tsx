'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

import {
  canonicalGeneralSubtab,
  getSettingsRootIcon,
  parseSettingsSearchParams,
  type SettingsMenuChild
} from './utils/getMenu'
import { groupMenuItems } from './utils/settingsUi'

type SidebarProps = {
  menu: SettingsMenuChild[]
  activeTab: string
  onSelectTab: (key: string) => void
}

function SettingsBrandIcon({ iconClass }: { iconClass?: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'flex',
        height: 36,
        width: 36,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'transparent'
      }}
    >
      {iconClass ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.primary',
            fontSize: '1.35rem',
            lineHeight: 1
          }}
        >
          <i className={iconClass} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Box
            component="span"
            sx={{ height: 16, width: 8, rotate: '12deg', borderRadius: 0.5, bgcolor: 'action.disabledBackground' }}
          />
          <Box
            component="span"
            sx={{ mt: -0.5, height: 20, width: 10, rotate: '-6deg', borderRadius: 0.5, bgcolor: 'action.disabledBackground' }}
          />
          <Box
            component="span"
            sx={{ height: 12, width: 8, rotate: '-12deg', borderRadius: 0.5, bgcolor: 'action.disabledBackground' }}
          />
        </Box>
      )}
    </Box>
  )
}

function itemMatchesSettingsUrl(
  item: SettingsMenuChild,
  tabFromUrl: string | null,
  subtabFromUrl: string | null
): boolean {
  if (item.settingsTab == null || item.settingsSubtab == null) return false
  const t = (tabFromUrl ?? '').trim().toLowerCase()
  if (!t) return false
  const it = item.settingsTab.trim().toLowerCase()
  const is = item.settingsSubtab.trim().toLowerCase()
  if (it !== t) return false
  if (t === 'general') {
    const urlCanon = canonicalGeneralSubtab(subtabFromUrl).toLowerCase()
    const effectiveSub = urlCanon || 'personal-settings'
    return is === effectiveSub
  }
  const s = (subtabFromUrl ?? '').trim().toLowerCase()
  if (!s) return false
  return is === s
}

export default function Sidebar({ menu, activeTab, onSelectTab }: SidebarProps) {
  const searchParams = useSearchParams()
  const safeParams = searchParams ?? new URLSearchParams()
  const searchKey = safeParams.toString()
  const parsedUrl = useMemo(() => parseSettingsSearchParams(safeParams), [searchKey])

  const groups = groupMenuItems(menu)
  /** Settings root `icon` from `menuListData` (e.g. `ri-settings-2-line`); re-read when `menu` refreshes. */
  const settingsRootIcon = useMemo(() => getSettingsRootIcon(), [menu])
  const matchUsersListingHeader =
    activeTab.trim().toLowerCase() === 'user-users' ||
    activeTab.trim().toLowerCase() === 'setup-customization-modules' ||
    activeTab.trim().toLowerCase() === 'setup-customization-home-page' ||
    activeTab.trim().toLowerCase() === 'user-permission' ||
    activeTab.trim().toLowerCase() === 'user-roles'

  return (
    <Box
      component="aside"
      sx={{
        display: 'flex',
        width: { xs: '100%', sm: 280 },
        maxWidth: 300,
        flexShrink: 0,
        flexDirection: 'column',
        alignSelf: 'stretch',
        minHeight: 0,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Box
        sx={{
          borderBottom: '5px solid',
          borderColor: 'divider',
          px: 2,
          pb: '1.224rem',
          pt: '2.4rem',
          // Match Users toolbar stripe (pt + title/total stack + controls row + pb)
          ...(matchUsersListingHeader && {
            minHeight: { xs: 'auto', sm: theme => theme.spacing(26) }
          })
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <SettingsBrandIcon iconClass={settingsRootIcon} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.25, color: 'text.primary' }}>
              Settings
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>
              Control and customise your workspace.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box component="nav" sx={{ flex: 1, overflowY: 'auto', px: 1, pt: 2, pb: 0 }}>
        {groups.map(({ title, items, groupIcon }) => (
          <Accordion
            key={title}
            defaultExpanded
            disableGutters
            elevation={0}
            sx={{
              mb: 2,
              bgcolor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              filter: 'none',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0, boxShadow: 'none' },
              '&:focus-within': { boxShadow: 'none' },
              '&:last-of-type': { mb: 0 },
              '& .MuiCollapse-root': { margin: 0, boxShadow: 'none' },
              '& .MuiAccordion-region': { marginTop: 0 },
              '& .MuiAccordionSummary-root': {
                boxShadow: 'none',
                '&:focus, &:focus-visible': { boxShadow: 'none' }
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />}
              sx={{
                px: 1.5,
                minHeight: 40,
                border: 'none',
                boxShadow: 'none',
                filter: 'none',
                '&:focus, &:focus-visible': { boxShadow: 'none' },
                '& .MuiAccordionSummary-content': {
                  my: 1,
                  alignItems: 'center'
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  minWidth: 0
                }}
              >
                {groupIcon ? (
                  <Box
                    aria-hidden
                    component="i"
                    className={groupIcon}
                    sx={{
                      flexShrink: 0,
                      fontSize: '1.35rem',
                      lineHeight: 1,
                      color: 'text.secondary'
                    }}
                  />
                ) : null}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'text.secondary'
                  }}
                >
                  {title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, py: 0, border: 'none', boxShadow: 'none' }}>
              <Box sx={{ bgcolor: 'background.paper' }}>
                <List disablePadding>
                  {items.map(item => {
                    const active =
                      activeTab === item.key ||
                      itemMatchesSettingsUrl(item, parsedUrl.tab, parsedUrl.subtab)
                    const leafIcon = item.icon?.trim()
                    return (
                      <ListItemButton
                        key={item.key}
                        selected={active}
                        onClick={() => onSelectTab(item.key)}
                        alignItems="center"
                        sx={{
                          py: 1.25,
                          px: 1.5,
                          gap: 1,
                          borderRadius: 0,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          color: 'text.primary',
                          '&.Mui-selected': {
                            bgcolor: 'action.selected',
                            '&:hover': { bgcolor: 'action.selected' }
                          }
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            height: 32,
                            width: 32,
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'transparent',
                            color: 'text.primary'
                          }}
                        >
                          {leafIcon ? (
                            <Box
                              aria-hidden
                              component="i"
                              className={leafIcon}
                              sx={{
                                flexShrink: 0,
                                fontSize: '0.875rem',
                                lineHeight: 1
                              }}
                            />
                          ) : null}
                        </Box>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 600,
                            color: 'text.primary'
                          }}
                        />
                      </ListItemButton>
                    )
                  })}
                </List>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  )
}
