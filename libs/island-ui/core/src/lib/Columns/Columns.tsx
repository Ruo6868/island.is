import React, { createContext, ReactElement } from 'react'
import { Box } from '../Box/Box'
import { ColumnProps } from '../Column/Column'
import { Space, ResponsiveSpace } from '../Box/useBoxStyles'
import { useNegativeMarginLeft } from '../../hooks/useNegativeMargin/useNegativeMargin'
import { normaliseResponsiveProp } from '../../utils/responsiveProp'
import {
  resolveCollapsibleAlignmentProps,
  CollapsibleAlignmentProps,
} from '../../utils/collapsibleAlignmentProps'

type CollapsibleAlignmentChildProps = ReturnType<
  typeof resolveCollapsibleAlignmentProps
>['collapsibleAlignmentChildProps']

interface ColumnsContextValue {
  collapseXs: boolean
  collapseSm: boolean
  collapseMd: boolean
  collapseLg: boolean
  xsSpace: Space
  smSpace: Space
  mdSpace: Space
  lgSpace: Space
  xlSpace: Space
  collapsibleAlignmentChildProps: CollapsibleAlignmentChildProps | {}
}

export const ColumnsContext = createContext<ColumnsContextValue>({
  collapseXs: false,
  collapseSm: false,
  collapseMd: false,
  collapseLg: false,
  xsSpace: 'none',
  smSpace: 'none',
  mdSpace: 'none',
  lgSpace: 'none',
  xlSpace: 'none',
  collapsibleAlignmentChildProps: {},
})

export interface ColumnsProps extends CollapsibleAlignmentProps {
  space: ResponsiveSpace
  children:
    | Array<ReactElement<ColumnProps> | null>
    | ReactElement<ColumnProps>
    | null
}

/** Provides spacing between *Column*s */
export const Columns = ({
  children,
  collapseBelow,
  reverse = false,
  space = 'none',
  align,
  alignY,
}: ColumnsProps) => {
  const [xsSpace, smSpace, mdSpace, lgSpace, xlSpace] = normaliseResponsiveProp(
    space,
  )

  const {
    collapsibleAlignmentProps,
    collapsibleAlignmentChildProps,
    collapseXs,
    collapseSm,
    collapseMd,
    collapseLg,
    orderChildren,
  } = resolveCollapsibleAlignmentProps({
    collapseBelow,
    align,
    alignY,
    reverse,
  })

  const negativeMarginLeft = useNegativeMarginLeft([
    collapseXs ? 'none' : xsSpace,
    collapseSm ? 'none' : smSpace,
    collapseMd ? 'none' : mdSpace,
    collapseLg ? 'none' : lgSpace,
    xlSpace,
  ])

  return (
    <Box {...collapsibleAlignmentProps} className={negativeMarginLeft}>
      <ColumnsContext.Provider
        value={{
          collapseXs,
          collapseSm,
          collapseMd,
          collapseLg,
          xsSpace,
          smSpace,
          mdSpace,
          lgSpace,
          xlSpace,
          collapsibleAlignmentChildProps,
        }}
      >
        {orderChildren(children)}
      </ColumnsContext.Provider>
    </Box>
  )
}
