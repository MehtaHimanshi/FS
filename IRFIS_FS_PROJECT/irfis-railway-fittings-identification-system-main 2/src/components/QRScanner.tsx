import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Camera, Package, Factory, Calendar, Shield, AlertCircle, Search } from 'lucide-react';
import apiService from '@/services/api';
import jsQR from 'jsqr';

interface LotInfo {
  _id: string;
  id: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  supplyDate: string;
  manufacturingDate: string;
  warrantyPeriod: string;
  status: 'pending' | 'verified' | 'rejected' | 'accepted' | 'held';
  vendorId: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

interface QRScannerProps {
  onLotFound?: (lot: LotInfo) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onLotFound }) => {
  const { toast } = useToast();

  // UI / data state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [lotInfo, setLotInfo] = useState<LotInfo | null>(null);
  const [showLotModal, setShowLotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualLotId, setManualLotId] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // refs to avoid stale closures / state-after-unmount
  const mountedRef = useRef(true);
  const isScanningRef = useRef(false);

  // sync ref when state changes
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    verified: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground',
    accepted: 'bg-success text-success-foreground',
    held: 'bg-secondary text-secondary-foreground'
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    verified: 'Verified',
    rejected: 'Rejected',
    accepted: 'Accepted',
    held: 'Held'
  };

  // Helper: wait for videoRef.current to be non-null (polling)
  const waitForVideoElement = async (timeoutMs = 3000, intervalMs = 100) => {
    const start = performance.now();
    return new Promise<HTMLVideoElement>((resolve, reject) => {
      const check = () => {
        if (!mountedRef.current) {
          reject(new Error('Component unmounted while waiting for video element'));
          return;
        }
        if (videoRef.current) {
          resolve(videoRef.current);
          return;
        }
        if (performance.now() - start > timeoutMs) {
          reject(new Error('Timed out waiting for video element to mount'));
          return;
        }
        setTimeout(check, intervalMs);
      };
      check();
    });
  };

  // Helper: check camera permissions
  const checkCameraPermissions = async () => {
    try {
      if (!navigator.permissions) {
        console.log('Permissions API not supported');
        return 'unknown';
      }
      
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('Camera permission status:', permission.state);
      return permission.state;
    } catch (error) {
      console.log('Could not check camera permissions:', error);
      return 'unknown';
    }
  };

  /**
   * Start camera + scanning
   * - Guard re-entry
   * - Ensure <video> is rendered by setting isScanning/cameraLoading early
   * - Wait for video DOM node to mount (poll)
   * - Attach stream, wait for canplay/loadedmetadata, play, then start scan loop
   */
  const startScanning = async () => {
    if (isScanningRef.current || cameraLoading) {
      console.log('startScanning: already running or loading, ignoring duplicate call');
      return;
    }

    let localStream: MediaStream | null = null;
    try {
      console.log('🎥 startScanning: begin');
      console.log('🔍 Browser info:', {
        userAgent: navigator.userAgent,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        protocol: window.location.protocol,
        hostname: window.location.hostname
      });
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Check camera permissions first
      const permissionStatus = await checkCameraPermissions();
      console.log('📷 Camera permission status:', permissionStatus);
      
      if (permissionStatus === 'denied') {
        throw new Error('Camera access denied. Please enable camera permissions in your browser settings.');
      }

      // Ensure the UI renders <video> so videoRef.current can become available.
      if (mountedRef.current) {
        setCameraLoading(true);
        setIsScanning(true);
        isScanningRef.current = true;
      }

      // Wait for the video element to mount in DOM (race protection).
      // This avoids the "Video element not available" error when getUserMedia resolves too fast.
      try {
        await waitForVideoElement(3000, 80);
      } catch (err) {
        console.warn('Video element did not mount in time, continuing but will check later:', err);
        // We'll still proceed to request camera, but we will check again before attaching stream.
      }

      // Request camera (prefer back camera)
      try {
        console.log('📷 requesting environment-facing camera...');
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        console.log('✅ environment camera granted');
      } catch (err) {
        console.warn('⚠️ environment camera failed, trying user-facing', err);
        // fallback to front camera
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        console.log('✅ user camera granted');
      }

      // If component unmounted during permission prompt
      if (!mountedRef.current) {
        localStream.getTracks().forEach(t => t.stop());
        return;
      }

      // Wait a short moment for videoRef to exist if it doesn't yet
      if (!videoRef.current) {
        console.log('videoRef not present after getUserMedia, waiting up to 2s for DOM to mount...');
        try {
          await waitForVideoElement(2000, 80);
        } catch (err) {
          // failed to get video element in time => stop stream & throw
          console.error('Video element still not available after waiting:', err);
          localStream.getTracks().forEach(t => t.stop());
          throw new Error('Video element not available');
        }
      }

      // attach stream to video
      streamRef.current = localStream;
      const video = videoRef.current!;
      video.srcObject = localStream;

      // Wait for canplay/loadedmetadata and try to play
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const onCanPlay = async () => {
          if (settled) return;
          settled = true;
          cleanup();
          try {
            await video.play().catch(e => {
              // some browsers may reject play(), but canvas can still be used
              console.warn('video.play() rejected:', e);
            });
          } finally {
            resolve();
          }
        };
        const onError = (ev?: any) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error('Video element encountered an error while initializing'));
        };
        const cleanup = () => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('loadedmetadata', onCanPlay);
          video.removeEventListener('error', onError);
          if (timeoutId) clearTimeout(timeoutId);
        };
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('loadedmetadata', onCanPlay);
        video.addEventListener('error', onError);

        const timeoutId = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          if (video.readyState >= 2) {
            resolve();
          } else {
            reject(new Error('Video initialization timeout'));
          }
        }, 5000);
      });

      // configure canvas
      if (videoRef.current && canvasRef.current) {
        const vw = videoRef.current.videoWidth || 640;
        const vh = videoRef.current.videoHeight || 480;
        canvasRef.current.width = vw;
        canvasRef.current.height = vh;
      }

      if (mountedRef.current) {
        setCameraLoading(false);
        setVideoPlaying(true);
        setIsScanning(true);
        isScanningRef.current = true;
      }

      // kick off scanning
      scanQRCode();
      console.log('🔍 startScanning: scan loop started');
    } catch (error: any) {
      console.error('❌ startScanning error:', error);
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (mountedRef.current) {
        setCameraLoading(false);
        setIsScanning(false);
        isScanningRef.current = false;
        setVideoPlaying(false);
      }

       console.error('❌ Detailed camera error:', {
         name: error?.name,
         message: error?.message,
         stack: error?.stack,
         constraint: error?.constraint
       });

       let message = 'Could not access camera. ';
       if (error?.name === 'NotAllowedError') {
         message += 'Please allow camera permissions and try again. Make sure you click "Allow" when prompted.';
       } else if (error?.name === 'NotFoundError') {
         message += 'No camera found on this device. Please connect a camera and try again.';
       } else if (error?.name === 'NotReadableError') {
         message += 'Camera is already in use by another application. Please close other camera apps and try again.';
       } else if (error?.name === 'OverconstrainedError') {
         message += 'Camera constraints cannot be satisfied. Trying with different settings...';
       } else if (String(error).toLowerCase().includes('timeout')) {
         message += 'Camera initialization timed out. Please try again.';
       } else if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
         message += 'Camera access requires HTTPS. Please use HTTPS or localhost.';
       } else {
         message += error?.message || 'Please check your camera settings and permissions.';
       }

       toast({
         title: 'Camera Error',
         description: message,
         variant: 'destructive'
       });
    }
  };

  const stopScanning = () => {
    try {
      console.log('🛑 stopScanning: stopping camera and loop');
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (mountedRef.current) {
        setIsScanning(false);
        isScanningRef.current = false;
        setCameraLoading(false);
        setVideoPlaying(false);
      }
    } catch (err) {
      console.warn('stopScanning error:', err);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn('scanQRCode: video or canvas not ready', { video: !!videoRef.current, canvas: !!canvasRef.current });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('scanQRCode: canvas 2d context not available');
      return;
    }

    const frame = () => {
      if (!mountedRef.current) return;
      if (!isScanningRef.current) {
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

          if (code && code.data) {
            console.log('✅ QR detected:', code.data);
            setScannedData(code.data);
            stopScanning();
            handleScannedData(code.data);
            return;
          }
        } catch (err) {
          console.error('Error while scanning frame:', err);
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
  };

  const handleScannedData = async (data: string) => {
    console.log('handleScannedData:', data);
    setLoading(true);
    try {
      let lotId: string | undefined;
      try {
        const parsed = JSON.parse(data);
        if (parsed.id) lotId = parsed.id;
        else if (parsed.lotId) lotId = parsed.lotId;
        else if (parsed.type === 'lot' && parsed.id) lotId = parsed.id;
        else if (parsed.type === 'lot' && parsed.lotId) lotId = parsed.lotId;
        else lotId = undefined;
      } catch {
        lotId = data;
      }

      if (!lotId) {
        throw new Error('Scanned QR does not contain a valid lot ID');
      }

      const response = await apiService.getLotById(lotId);

      if (response?.success && response?.data) {
        const lot = response.data as LotInfo;
        if (mountedRef.current) {
          setLotInfo(lot);
          setShowLotModal(true);
        }
        if (onLotFound) onLotFound(lot);
        toast({
          title: 'Lot Found',
          description: `Successfully retrieved information for lot ${lot.id}`
        });
      } else {
        throw new Error(response?.message || 'Lot not found');
      }
    } catch (err: any) {
      console.error('handleScannedData error:', err);
      toast({
        title: 'Scan Error',
        description: err?.message || 'Could not retrieve lot information',
        variant: 'destructive'
      });

      setTimeout(() => {
        if (mountedRef.current) setShowManualInput(true);
      }, 800);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // manual input handlers
  const handleManualInput = () => setShowManualInput(true);
  const handleManualCancel = () => {
    setManualLotId('');
    setShowManualInput(false);
  };
  const handleManualSubmit = () => {
    const id = manualLotId.trim();
    if (!id) {
      toast({
        title: 'Input Required',
        description: 'Please enter a lot ID or QR payload',
        variant: 'destructive'
      });
      return;
    }
    handleScannedData(id);
    setManualLotId('');
    setShowManualInput(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isScanning && !cameraLoading ? (
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">Scan a QR code to retrieve lot information</div>

              <div className="flex gap-2 justify-center">
                <Button onClick={startScanning} className="flex items-center gap-2" disabled={loading}>
                  <Camera className="h-4 w-4" />
                  Start Scanning
                </Button>

                <Button onClick={handleManualInput} variant="outline" disabled={loading}>
                  Enter Manually
                </Button>
              </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-2">💡 How to Use the Scanner:</div>
                    <div className="space-y-1 text-left">
                      <div>• Click "Start Scanning" and allow camera permissions when prompted</div>
                      <div>• If camera fails, use manual input (e.g. <code className="bg-blue-100 px-1 rounded">LOT1758383628581</code>)</div>
                      <div>• Point your camera at a QR code and hold steady</div>
                      <div>• Make sure you're using HTTPS or localhost for camera access</div>
                    </div>
                  </div>
                </div>

            </div>

          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                  style={{ minHeight: '256px' }}
                />

                <canvas ref={canvasRef} className="hidden" />

                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-white text-center">
                      <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full mx-auto mb-2" />
                      <div>Initializing camera...</div>
                    </div>
                  </div>
                )}

                {!cameraLoading && (
                  <>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-500 rounded-tl-lg"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-500 rounded-br-lg"></div>
                      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-green-500 animate-pulse" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-green-500/50 rounded-lg" />
                    </div>

                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          {videoPlaying ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span>Scanning for QR code...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                              <span>Starting camera...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2">
                      <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                        {videoRef.current ? (
                          <div>{videoRef.current.videoWidth}x{videoRef.current.videoHeight}</div>
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Point your camera at a QR code</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={stopScanning} variant="outline">Stop Scanning</Button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Retrieving lot information...
              </div>
            </div>
          )}

          {showManualInput && (
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manualLotId">Enter Lot ID Manually</Label>
                <div className="flex gap-2">
                  <Input
                    id="manualLotId"
                    placeholder="Enter lot ID (e.g., LOT1758383628581)"
                    value={manualLotId}
                    onChange={(e) => setManualLotId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualSubmit();
                      if (e.key === 'Escape') handleManualCancel();
                    }}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button onClick={() => setManualLotId('LOT1758383628581')} variant="outline" size="sm" disabled={loading} title="Fill with test lot ID">Test</Button>
                  <Button onClick={handleManualSubmit} disabled={loading || !manualLotId.trim()} size="sm"><Search className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleManualCancel} variant="outline" size="sm" disabled={loading}>Cancel</Button>
                <Button onClick={handleManualSubmit} disabled={loading || !manualLotId.trim()} size="sm">Search</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showLotModal} onOpenChange={setShowLotModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lot Information
            </DialogTitle>
          </DialogHeader>

          {lotInfo && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge className={statusColors[lotInfo.status]}>{statusLabels[lotInfo.status]}</Badge>
                <div className="text-sm text-muted-foreground">Scanned on {new Date().toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Lot ID</div>
                          <div className="font-medium">{lotInfo.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Part Name</div>
                          <div className="font-medium">{lotInfo.partName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Lot Number</div>
                          <div className="font-medium">{lotInfo.lotNumber}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Factory</div>
                          <div className="font-medium">{lotInfo.factoryName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Manufacturing Date</div>
                          <div className="font-medium">{new Date(lotInfo.manufacturingDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Supply Date</div>
                          <div className="font-medium">{new Date(lotInfo.supplyDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Warranty Period</div>
                        <div className="font-medium">{lotInfo.warrantyPeriod}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Created</div>
                        <div className="font-medium">{new Date(lotInfo.createdAt).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="font-medium">{new Date(lotInfo.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowLotModal(false)} variant="outline">Close</Button>
                <Button onClick={() => { setShowLotModal(false); startScanning(); }}>Scan Another</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRScanner;
