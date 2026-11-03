// <select> nhẹ cho bảng dài: khi chưa chạm vào chỉ render 1 <option> (giá trị đang chọn), chạm/hover/focus mới
// render đủ danh sách. Bảng /tasks trước đây có ~300 ô chọn x 25 người = hàng nghìn phần tử, đơ trên điện thoại (PERF-02).
import { Children, isValidElement, useState, type ReactNode, type SelectHTMLAttributes } from 'react'

function pickCurrent(children: ReactNode, value: unknown): ReactNode {
    const all = Children.toArray(children).filter(isValidElement) as any[]
    const cur = all.find(o => String(o.props?.value ?? '') === String(value ?? ''))
    return cur || all[0] || null
}

export function LazySelect({ children, value, onFocus, onMouseDown, onPointerEnter, onTouchStart, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
    const [on, setOn] = useState(false)
    const wake = () => { if (!on) setOn(true) }
    return (
        <select
            {...rest}
            value={value}
            onFocus={e => { wake(); onFocus?.(e) }}
            onMouseDown={e => { wake(); onMouseDown?.(e) }}
            onPointerEnter={e => { wake(); onPointerEnter?.(e) }}
            onTouchStart={e => { wake(); onTouchStart?.(e) }}
        >
            {on ? children : pickCurrent(children, value)}
        </select>
    )
}
