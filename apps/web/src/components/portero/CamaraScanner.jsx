'use client'

import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function CamaraScanner({ onScan }) {
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 220, height: 220 }, supportedScanTypes: [0] },
      false,
    )

    scanner.render(
      (token) => {
        scanner.clear()
        onScan(token)
      },
      () => {},
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [onScan])

  return (
    <div
      id="qr-reader"
      className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl [&_select]:hidden [&_#qr-reader__dashboard_span]:hidden"
    />
  )
}
