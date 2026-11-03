import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface SignaturePadHandle {
    clear: () => void
    isEmpty: () => boolean
    getDataUrl: () => string
}

/** Bảng ký tên điện tử — vẽ bằng chuột hoặc cảm ứng, xuất ra dataURL PNG. */
export const SignaturePad = forwardRef<SignaturePadHandle>((_props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const drawingRef = useRef(false)
    const lastRef = useRef<{ x: number; y: number } | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const ratio = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * ratio
            canvas.height = rect.height * ratio
            ctx.scale(ratio, ratio)
            ctx.lineWidth = 2.2
            ctx.lineCap = 'round'
            ctx.strokeStyle = '#111'
        }
        resize()

        const pos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect()
            const t = 'touches' in e ? e.touches[0] : e
            return { x: t.clientX - rect.left, y: t.clientY - rect.top }
        }
        const start = (e: MouseEvent | TouchEvent) => { drawingRef.current = true; lastRef.current = pos(e); e.preventDefault() }
        const move = (e: MouseEvent | TouchEvent) => {
            if (!drawingRef.current || !lastRef.current) return
            const p = pos(e)
            ctx.beginPath()
            ctx.moveTo(lastRef.current.x, lastRef.current.y)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
            lastRef.current = p
            e.preventDefault()
        }
        const end = () => { drawingRef.current = false }

        canvas.addEventListener('mousedown', start)
        canvas.addEventListener('mousemove', move)
        window.addEventListener('mouseup', end)
        canvas.addEventListener('touchstart', start, { passive: false })
        canvas.addEventListener('touchmove', move, { passive: false })
        canvas.addEventListener('touchend', end)
        return () => {
            canvas.removeEventListener('mousedown', start)
            canvas.removeEventListener('mousemove', move)
            window.removeEventListener('mouseup', end)
            canvas.removeEventListener('touchstart', start)
            canvas.removeEventListener('touchmove', move)
            canvas.removeEventListener('touchend', end)
        }
    }, [])

    useImperativeHandle(ref, () => ({
        clear: () => {
            const canvas = canvasRef.current
            const ctx = canvas?.getContext('2d')
            if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        },
        isEmpty: () => {
            const canvas = canvasRef.current
            if (!canvas) return true
            const blank = document.createElement('canvas')
            blank.width = canvas.width
            blank.height = canvas.height
            return canvas.toDataURL() === blank.toDataURL()
        },
        getDataUrl: () => canvasRef.current?.toDataURL('image/png') || '',
    }))

    return (
        <canvas ref={canvasRef} className="w-full bg-white rounded-lg" style={{ height: 150, touchAction: 'none', display: 'block' }} />
    )
})
SignaturePad.displayName = 'SignaturePad'
