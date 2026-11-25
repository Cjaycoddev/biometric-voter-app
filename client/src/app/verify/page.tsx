'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Camera, Fingerprint, ShieldCheck, Loader2, User, MapPin, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';

const WEBAUTHN_RP_ID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost';

function bufferToBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlToBuffer(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const raw = atob(base64);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

function coerceToArrayBuffer(arg: any): ArrayBuffer {
  if (arg instanceof ArrayBuffer) return arg;
  if (arg && arg.buffer instanceof ArrayBuffer) return arg.buffer;
  if (arg && typeof arg === 'object') {
    if (arg.type === 'Buffer' && Array.isArray(arg.data)) {
      return new Uint8Array(arg.data).buffer;
    }
    if (Array.isArray(arg)) {
      return new Uint8Array(arg).buffer;
    }
  }
  throw new TypeError('Could not coerce to ArrayBuffer');
}

export default function VerifyPage() {
  const [method, setMethod] = useState<'face' | 'fingerprint'>('face');
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [fingerprintEnrolled, setFingerprintEnrolled] = useState(false);
  const [faceResult, setFaceResult] = useState<{ verified: boolean; score: number; message: string } | null>(null);
  const [fingerprintResult, setFingerprintResult] = useState<{ verified: boolean; score: number; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showVoterDetails, setShowVoterDetails] = useState(false);
  const [pollingStation, setPollingStation] = useState<any>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(u));
    checkEnrolledTemplates();
  }, [router]);

  const checkEnrolledTemplates = async () => {
    try {
      const data = await apiRequest('/biometric/my-templates');
      const templates = data.templates || [];
      setFaceEnrolled(templates.some((t: any) => t.template_type === 'face'));
      setFingerprintEnrolled(templates.some((t: any) => t.template_type === 'fingerprint'));
    } catch (err) {
      console.error('Failed to check templates:', err);
    }
  };

  // Camera setup
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required for face verification. Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  const captureFaceImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    // Return base64 without data URL prefix
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  const handleFaceEnroll = async () => {
    const imageBase64 = captureFaceImage();
    if (!imageBase64) return alert('Please start camera first');
    setLoading(true);
    try {
      await apiRequest('/biometric/enroll-face', {
        method: 'POST',
        body: JSON.stringify({ image_base64: imageBase64, device_id: 'phone-camera' }),
      });
      setFaceEnrolled(true);
      alert('Face enrolled successfully!');
    } catch (err: any) {
      alert(err.data?.error || 'Face enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceVerify = async () => {
    const imageBase64 = captureFaceImage();
    if (!imageBase64) return alert('Please start camera first');
    setLoading(true);
    try {
      const data = await apiRequest('/biometric/verify-face', {
        method: 'POST',
        body: JSON.stringify({ image_base64: imageBase64, device_id: 'phone-camera' }),
      });
      setFaceResult({
        verified: true,
        score: data.score,
        message: data.message,
      });
      checkVerificationComplete();
    } catch (err: any) {
      setFaceResult({
        verified: false,
        score: err.data?.score ?? 0,
        message: err.data?.error || 'Face verification failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintEnroll = async () => {
    if (!window.PublicKeyCredential) {
      return alert('WebAuthn not supported in this browser. Use a modern browser on your phone.');
    }
    setLoading(true);
    try {
      // Start registration
      const startRes = await apiRequest('/biometric/webauthn/register/start', {
        method: 'POST',
      });
      const options = startRes.options;
      options.challenge = base64urlToBuffer(options.challenge);
      options.user.id = base64urlToBuffer(options.user.id);

      // Call WebAuthn
      const credential = await navigator.credentials.create({ publicKey: options as any });

      // Convert to JSON-serializable format
      const credentialJSON = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64url(coerceToArrayBuffer((credential.response as any).clientDataJSON)),
          attestationObject: bufferToBase64url(coerceToArrayBuffer((credential.response as any).attestationObject)),
          transports: (credential.response as any).transports || [],
        },
      };

      // Finish registration
      const finishRes = await apiRequest('/biometric/webauthn/register/finish', {
        method: 'POST',
        body: JSON.stringify({ credential: credentialJSON }),
      });

      setFingerprintEnrolled(true);
      alert('Fingerprint enrolled successfully!');
    } catch (err: any) {
      console.error('Fingerprint enroll error:', err);
      alert(err.data?.error || 'Fingerprint enrollment failed. Make sure to use your phone\'s fingerprint sensor.');
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintVerify = async () => {
    if (!window.PublicKeyCredential) {
      return alert('WebAuthn not supported in this browser. Use a modern browser on your phone.');
    }
    setLoading(true);
    try {
      // Start authentication
      const startRes = await apiRequest('/biometric/webauthn/auth/start', {
        method: 'POST',
      });
      const options = startRes.options;
      options.challenge = base64urlToBuffer(options.challenge);
      options.allowCredentials = options.allowCredentials.map((c: any) => ({
        ...c,
        id: base64urlToBuffer(c.id),
      }));

      // Call WebAuthn - this triggers the phone's fingerprint sensor!
      const credential = await navigator.credentials.get({ publicKey: options as any });

      // Convert to JSON-serializable format
      const credentialJSON = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64url(coerceToArrayBuffer((credential.response as any).clientDataJSON)),
          authenticatorData: bufferToBase64url(coerceToArrayBuffer((credential.response as any).authenticatorData)),
          signature: bufferToBase64url(coerceToArrayBuffer((credential.response as any).signature)),
          userHandle: (credential.response as any).userHandle ? bufferToBase64url(coerceToArrayBuffer((credential.response as any).userHandle)) : null,
        },
      };

      // Finish authentication
      const finishRes = await apiRequest('/biometric/webauthn/auth/finish', {
        method: 'POST',
        body: JSON.stringify({ credential: credentialJSON }),
      });

      setFingerprintResult({
        verified: true,
        score: 1.0,
        message: finishRes.message,
      });
      checkVerificationComplete();
    } catch (err: any) {
      console.error('Fingerprint verify error:', err);
      setFingerprintResult({
        verified: false,
        score: 0,
        message: err.data?.error || 'Fingerprint verification failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationComplete = async () => {
    if (faceResult?.verified || fingerprintResult?.verified) {
      setShowVoterDetails(true);
      // Fetch polling station info
      try {
        // In a real app, this would come from a dedicated endpoint or the user object
        // For now, we'll construct it from user data or use mock data
        if (user?.polling_station) {
          setPollingStation(user.polling_station);
        } else {
          // Mock polling station data based on user location/ID
          setPollingStation({
            name: 'Kasarani Primary School',
            code: 'PS-047-123',
            ward: 'Kasarani',
            constituency: 'Kasarani',
            county: 'Nairobi',
            address: 'Kasarani Primary School Grounds, Thika Road',
            gps: '-1.2197, 36.8881',
          });
        }
      } catch (err) {
        console.error('Failed to fetch polling station:', err);
      }
    }
  };

  useEffect(() => {
    if (method === 'face') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [method]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Please log in first.</p>
          <button onClick={() => router.push('/login')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Voter Verification</h1>
            <p className="text-sm text-gray-500">
              Verify identity as {user.full_name} ({user.id_number})
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            (faceResult?.verified || fingerprintResult?.verified) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {(faceResult?.verified || fingerprintResult?.verified) ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">
              {(faceResult?.verified || fingerprintResult?.verified) ? 'VERIFIED' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Method Selector */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => { setMethod('face'); setFaceResult(null); setFingerprintResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                method === 'face' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-5 h-5" /> Face ID
            </button>
            <button
              onClick={() => { setMethod('fingerprint'); setFaceResult(null); setFingerprintResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                method === 'fingerprint' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Fingerprint className="w-5 h-5" /> Fingerprint ID
            </button>
          </div>
        </div>

        {/* Face Verification Panel */}
        {method === 'face' && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" /> Face Verification
            </h2>

            {/* Camera Preview */}
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video bg-black rounded-lg"
              />
              {!cameraStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera not started</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!faceEnrolled ? (
                <button
                  onClick={handleFaceEnroll}
                  disabled={loading || !cameraStream}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
                >
                  {loading ? 'Enrolling...' : 'Enroll Face'}
                </button>
              ) : (
                <button
                  onClick={handleFaceVerify}
                  disabled={loading || !cameraStream}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
                >
                  {loading ? 'Verifying...' : 'Verify Face'}
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Switch Camera
                </button>
              </div>
            </div>

            {faceResult && (
              <div className={`mt-4 p-4 rounded-lg text-center ${faceResult.verified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className={`text-xl font-bold mb-2 ${faceResult.verified ? 'text-green-600' : 'text-red-600'}`}>
                  {faceResult.verified ? '✓ FACE VERIFIED' : '✗ FACE DECLINED'}
                </div>
                <p className="text-sm">{faceResult.message}</p>
                <p className="text-xs text-gray-500">Match score: {(faceResult.score * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}

        {/* Fingerprint Verification Panel */}
        {method === 'fingerprint' && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-600" /> Fingerprint Verification
            </h2>

            <div className="text-center py-8">
              {!fingerprintEnrolled ? (
                <div className="space-y-4">
                  <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Enroll your fingerprint using your phone's built-in sensor.
                    This uses WebAuthn (platform authenticator) to securely register
                    your fingerprint with the system.
                  </p>
                  <button
                    onClick={handleFingerprintEnroll}
                    disabled={loading}
                    className="w-full max-w-xs mx-auto py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
                  >
                    {loading ? 'Enrolling...' : 'Enroll Fingerprint'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Fingerprint className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Place your registered finger on the sensor to verify your identity.
                    The system will prompt for your fingerprint.
                  </p>
                  <button
                    onClick={handleFingerprintVerify}
                    disabled={loading}
                    className="w-full max-w-xs mx-auto py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
                  >
                    {loading ? 'Verifying...' : 'Verify Fingerprint'}
                  </button>
                </div>
              )}
            </div>

            {fingerprintResult && (
              <div className={`mt-4 p-4 rounded-lg text-center ${fingerprintResult.verified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className={`text-xl font-bold mb-2 ${fingerprintResult.verified ? 'text-green-600' : 'text-red-600'}`}>
                  {fingerprintResult.verified ? '✓ FINGERPRINT VERIFIED' : '✗ FINGERPRINT DECLINED'}
                </div>
                <p className="text-sm">{fingerprintResult.message}</p>
                <p className="text-xs text-gray-500">Match score: {(fingerprintResult.score * 100).toFixed(1)}%</p>
              </div>
            )}

            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <p>This uses <strong>WebAuthn (Platform Authenticator)</strong> — your phone's built-in fingerprint sensor (or Face ID on iOS). When you click "Verify", the browser securely communicates with your device's secure enclave. No fingerprint image leaves your device.</p>
            </div>
          </div>
        )}

        {/* Voter Details & Polling Station - shown after successful verification */}
        {showVoterDetails && pollingStation && (
          <div className="bg-white p-6 rounded-xl shadow mb-6 border-2 border-green-300 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" /> Verification Successful
              </h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">ACCESS GRANTED</span>
            </div>

            {/* Voter Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-semibold">{user.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">ID Number</p>
                <p className="font-semibold">{user.id_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-semibold">{user.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Verified By</p>
                <p className="font-semibold capitalize">{faceResult?.verified ? 'Face' : 'Fingerprint'}</p>
              </div>
            </div>

            {/* Polling Station */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Polling Station
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700"><strong>Station:</strong> {pollingStation.name}</p>
                  <p className="text-sm text-blue-700"><strong>Code:</strong> {pollingStation.code}</p>
                  <p className="text-sm text-blue-700"><strong>Ward:</strong> {pollingStation.ward}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700"><strong>Constituency:</strong> {pollingStation.constituency}</p>
                  <p className="text-sm text-blue-700"><strong>County:</strong> {pollingStation.county}</p>
                  <p className="text-sm text-blue-700"><strong>Address:</strong> {pollingStation.address}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded border border-blue-100">
                <p className="text-xs text-blue-600"><strong>GPS:</strong> {pollingStation.gps}</p>
                <p className="text-xs text-blue-500 mt-1">Open in maps: <a href={`https://maps.google.com/?q=${pollingStation.gps}`} target="_blank" rel="noopener noreferrer" className="underline">Google Maps</a></p>
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">About this verification</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Face ID:</strong> Uses your phone's front camera to capture a live image, matched against your enrolled face template (simulated matching).</li>
            <li>• <strong>Fingerprint ID:</strong> Uses <strong>WebAuthn Platform Authenticator</strong> — your phone's actual fingerprint sensor (Android) or Face ID/Touch ID (iOS). This is the same tech used by banks and password managers.</li>
            <li>• Both methods are secure: biometric data never leaves your device (WebAuthn) or is encrypted at rest (face templates).</li>
            <li>• After successful verification, your voter details and assigned polling station are displayed.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}