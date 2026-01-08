import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Eye, 
  Maximize, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D, 
  Lightbulb, 
  Camera,
  VolumeX,
  Volume2,
  Play,
  Pause,
  Settings,
  Fullscreen,
  Share,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface ARVRPreviewProps {
  assetId: string;
  assetTitle: string;
  assetCategory: string;
  previewData?: {
    modelUrl?: string;
    images?: string[];
    videos?: string[];
    ar_enabled?: boolean;
    vr_enabled?: boolean;
    interactive_features?: string[];
  };
}

interface ViewerSettings {
  lighting: number;
  rotation_speed: number;
  zoom_level: number;
  background: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  auto_rotate: boolean;
  sound_enabled: boolean;
}

export const ARVRPreview = ({ 
  assetId, 
  assetTitle, 
  assetCategory, 
  previewData 
}: ARVRPreviewProps) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'ar' | 'vr'>('2d');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<ViewerSettings>({
    lighting: 50,
    rotation_speed: 30,
    zoom_level: 100,
    background: 'studio',
    quality: 'high',
    auto_rotate: true,
    sound_enabled: true
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    checkDeviceCapabilities();
    initializeViewer();
  }, []);

  const checkDeviceCapabilities = async () => {
    // Check for WebXR AR support
    if ('xr' in navigator) {
      try {
        const arSupport = await (navigator as any).xr?.isSessionSupported('immersive-ar');
        const vrSupport = await (navigator as any).xr?.isSessionSupported('immersive-vr');
        setArSupported(arSupport || false);
        setVrSupported(vrSupport || false);
      } catch (error) {
        console.log('WebXR not supported:', error);
      }
    }

    // Fallback: Check for device orientation (mobile AR indicator)
    if ('DeviceOrientationEvent' in window) {
      setArSupported(true);
    }
  };

  const initializeViewer = () => {
    // Initialize 3D viewer (would integrate with Three.js, A-Frame, or similar)
    console.log('Initializing viewer for asset:', assetId);
  };

  const handleViewModeChange = async (mode: '2d' | '3d' | 'ar' | 'vr') => {
    if ((mode === 'ar' && !arSupported) || (mode === 'vr' && !vrSupported)) {
      toast.error(`${mode.toUpperCase()} not supported on this device`);
      return;
    }

    setIsLoading(true);
    setViewMode(mode);

    try {
      if (mode === 'ar') {
        await startARSession();
      } else if (mode === 'vr') {
        await startVRSession();
      }
    } catch (error) {
      console.error(`Failed to start ${mode} session:`, error);
      toast.error(`Failed to start ${mode.toUpperCase()} preview`);
      setViewMode('2d');
    } finally {
      setIsLoading(false);
    }
  };

  const startARSession = async () => {
    if ('xr' in navigator) {
      try {
        const session = await (navigator as any).xr.requestSession('immersive-ar', {
          requiredFeatures: ['local', 'hit-test']
        });
        
        // Initialize AR scene
        console.log('AR session started');
        toast.success('AR preview activated! Point your camera at a flat surface');
      } catch (error) {
        throw new Error('Failed to start AR session');
      }
    } else {
      // Fallback to device orientation-based AR
      toast.info('Using device orientation for AR preview');
    }
  };

  const startVRSession = async () => {
    if ('xr' in navigator) {
      try {
        const session = await (navigator as any).xr.requestSession('immersive-vr');
        console.log('VR session started');
        toast.success('VR preview activated! Put on your headset');
      } catch (error) {
        throw new Error('Failed to start VR session');
      }
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen && viewerRef.current) {
      if (viewerRef.current.requestFullscreen) {
        viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${assetTitle} - AR/VR Preview`,
          text: `Check out this ${assetCategory} in AR/VR`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDownload = () => {
    // Generate screenshot or download 3D model
    const canvas = viewerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${assetTitle}_preview.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Preview image downloaded');
    }
  };

  const renderViewer = () => {
    switch (viewMode) {
      case '2d':
        return (
          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            {previewData?.images && previewData.images.length > 0 ? (
              <>
                <img
                  src={previewData.images[currentImageIndex]}
                  alt={assetTitle}
                  className="w-full h-full object-cover"
                />
                {previewData.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {previewData.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No preview images available</p>
                </div>
              </div>
            )}
          </div>
        );

      case '3d':
        return (
          <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
            {/* 3D Viewer Canvas - would be replaced with actual 3D library */}
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center text-white">
                <Move3D className="h-16 w-16 mx-auto mb-4 animate-spin" />
                <p className="text-lg font-semibold">3D Model Loading...</p>
                <p className="text-sm text-gray-300 mt-2">
                  Interactive 3D preview of {assetTitle}
                </p>
              </div>
            </div>
            
            {/* 3D Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="sm" variant="secondary" onClick={() => console.log('Reset view')}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => console.log('Zoom in')}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => console.log('Zoom out')}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'ar':
        return (
          <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-blue-500 rounded-lg mx-auto mb-4 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
                <p className="text-lg font-semibold">AR Preview Active</p>
                <p className="text-sm text-gray-300 mt-2">
                  Point your camera at a flat surface to place {assetTitle}
                </p>
              </div>
            </div>
            
            {/* AR Instructions */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Move your device to scan for surfaces</span>
              </div>
            </div>
          </div>
        );

      case 'vr':
        return (
          <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="relative">
                  <div className="w-32 h-20 border-4 border-purple-500 rounded-lg mx-auto mb-4 animate-bounce"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Maximize className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
                <p className="text-lg font-semibold">VR Preview Ready</p>
                <p className="text-sm text-gray-300 mt-2">
                  Put on your VR headset to explore {assetTitle}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Asset Preview
            </CardTitle>
            <CardDescription>
              Interactive preview of {assetTitle}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen}>
              <Fullscreen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* View Mode Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === '2d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('2d')}
            className="flex-1"
          >
            2D Photos
          </Button>
          <Button
            variant={viewMode === '3d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('3d')}
            className="flex-1"
          >
            3D Model
          </Button>
          <Button
            variant={viewMode === 'ar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('ar')}
            disabled={!arSupported}
            className="flex-1"
          >
            AR View
            {!arSupported && <Badge variant="secondary" className="ml-1 text-xs">N/A</Badge>}
          </Button>
          <Button
            variant={viewMode === 'vr' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('vr')}
            disabled={!vrSupported}
            className="flex-1"
          >
            VR View
            {!vrSupported && <Badge variant="secondary" className="ml-1 text-xs">N/A</Badge>}
          </Button>
        </div>

        {/* Main Viewer */}
        <div ref={viewerRef} className="relative">
          {isLoading ? (
            <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading {viewMode.toUpperCase()} preview...</p>
              </div>
            </div>
          ) : (
            renderViewer()
          )}
        </div>

        {/* Settings Panel for 3D/AR/VR modes */}
        {(viewMode === '3d' || viewMode === 'ar' || viewMode === 'vr') && (
          <Tabs defaultValue="display" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="interaction">Interaction</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>

            <TabsContent value="display" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Lighting
                  </label>
                  <Slider
                    value={[settings.lighting]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, lighting: value[0] }))}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Background</label>
                  <Select 
                    value={settings.background} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, background: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="environment">Environment</SelectItem>
                      <SelectItem value="transparent">Transparent</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interaction" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Auto Rotate</label>
                  <Button
                    variant={settings.auto_rotate ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, auto_rotate: !prev.auto_rotate }))}
                  >
                    {settings.auto_rotate ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rotation Speed</label>
                  <Slider
                    value={[settings.rotation_speed]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, rotation_speed: value[0] }))}
                    max={100}
                    step={1}
                    disabled={!settings.auto_rotate}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Sound Effects</label>
                  <Button
                    variant={settings.sound_enabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, sound_enabled: !prev.sound_enabled }))}
                  >
                    {settings.sound_enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Render Quality</label>
                  <Select 
                    value={settings.quality} 
                    onValueChange={(value: any) => setSettings(prev => ({ ...prev, quality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Fast)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground">
                  Higher quality settings may reduce performance on older devices
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Interactive Features */}
        {previewData?.interactive_features && previewData.interactive_features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Interactive Features</h4>
            <div className="flex flex-wrap gap-2">
              {previewData.interactive_features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Device Capabilities */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${arSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
            AR {arSupported ? 'Supported' : 'Not Available'}
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${vrSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
            VR {vrSupported ? 'Supported' : 'Not Available'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
