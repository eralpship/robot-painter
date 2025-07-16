import { useCallback } from 'react'

export function useCanvasSync(overlayCanvas: HTMLCanvasElement | null, onSync?: () => void) {
  const syncToOverlayCanvas = useCallback((stageRef: React.RefObject<any>) => {
    try {
      const stage = stageRef.current
      if (!stage || !overlayCanvas) return
      
      // Check if stage has a layer and it's properly initialized
      const layer = stage.getLayer()
      if (!layer) {
        console.warn('Stage layer not yet initialized, skipping sync')
        return
      }
      
      const ctx = overlayCanvas.getContext('2d')!
      ctx.clearRect(0, 0, 4096, 4096)
      
      // Scale context to match full resolution
      ctx.save()
      ctx.scale(4096 / 512, 4096 / 512)
      
      // Draw stage content directly to context
      layer.draw({ ctx })
      
      ctx.restore()
      
      console.log('Canvas sync completed - calling texture update')
      // Trigger texture update callback
      if (onSync) {
        onSync()
      }
    } catch (error) {
      console.error('Failed to sync to overlay canvas:', error)
    }
  }, [overlayCanvas, onSync])

  return { syncToOverlayCanvas }
}