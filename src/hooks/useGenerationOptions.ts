import { useState, useCallback } from 'react'
import type { QualityTier, SizeTier, OutputFormat } from '@/types/image'
import { aspectRatioMap } from '@/lib/api'

export function useGenerationOptions(defaultFormat: OutputFormat = 'png') {
  const [prompt, setPrompt] = useState<string>('')
  const [quality, setQuality] = useState<QualityTier>('auto')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(defaultFormat)
  const [sizeTier, setSizeTier] = useState<SizeTier>('auto')
  const [aspectRatio, setAspectRatio] = useState<string>('1:1')
  const [batchCount, setBatchCount] = useState<number>(4)
  const [parallelCount, setParallelCount] = useState<number>(2)

  const availableAspectRatios = aspectRatioMap[sizeTier] || aspectRatioMap.auto

  const handleSizeTierChange = useCallback(
    (newTier: SizeTier) => {
      setSizeTier(newTier)
      const ratios = aspectRatioMap[newTier] || aspectRatioMap.auto
      if (!ratios.includes(aspectRatio)) {
        setAspectRatio(ratios[0] || '1:1')
      }
    },
    [aspectRatio]
  )

  return {
    prompt,
    setPrompt,
    quality,
    setQuality,
    outputFormat,
    setOutputFormat,
    sizeTier,
    setSizeTier: handleSizeTierChange,
    aspectRatio,
    setAspectRatio,
    availableAspectRatios,
    batchCount,
    setBatchCount,
    parallelCount,
    setParallelCount,
  }
}
