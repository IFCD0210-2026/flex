'use client'

import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function CamaraScanner({ onScan }) {
  const scannerRef = useRef(null)
  const scannedRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    const iniciarScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (token) => {
            // Evita múltiples lecturas del mismo QR
            if (scannedRef.current) return

            scannedRef.current = true

            if (mountedRef.current) {
              onScan(token)
            }
          },
          () => {
            // Ignorar errores de lectura
          },
        )
      }catch (error) {
  if (error?.message?.includes('Requested device not found')) {
    console.warn('No hay ninguna cámara disponible en este dispositivo')
  } else {
    console.error('Error al iniciar el escáner QR:', error)
  }
}
    }

    iniciarScanner()

    return () => {
      mountedRef.current = false

      const currentScanner = scannerRef.current

      if (currentScanner) {
        currentScanner
          .stop()
          .catch(() => {
            // Ignorar error:
            // "Cannot stop, scanner is not running or paused"
          })
          .finally(() => {
            currentScanner
              .clear()
              .catch(() => {})
          })
      }
    }
  }, [onScan])

  return (
    <div
      id="qr-reader"
      className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl"
    />
  )
}