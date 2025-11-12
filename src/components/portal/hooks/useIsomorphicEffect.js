import { useLayoutEffect, useEffect } from 'react'
import { isServer } from '@/components/portal/utils/isServer'

const useIsomorphicEffect = isServer ? useEffect : useLayoutEffect

export { useIsomorphicEffect }
