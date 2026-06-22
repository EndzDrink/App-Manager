import React, { useState, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Camera, Mail, Fingerprint, ShieldCheck, 
  User, Building2, CheckCircle2, AlertTriangle, ArrowRight, Lock
} from "lucide-react";

export const Register = () => {
  // Form States
  const [email, setEmail] = useState('');
  const [saId, setSaId] = useState('');
  const [popiaConsent, setPopiaConsent] = useState(false);
  
  // Auto-populated data from Active Directory mock
  const [basicInfo, setBasicInfo] = useState<{name: string, department: string} | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  // Camera & Biometric States
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // 1. Triggered when the user finishes typing their email (onBlur)
  const handleEmailLookup = async () => {
    if (!email || !email.includes('@')) return;
    setIsFetchingInfo(true);
    
    // MOCK: Ping corporate directory to pre-fill non-sensitive data
    // In production, this hits your backend which queries Active Directory/Entra ID
    setTimeout(() => {
      if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('mthembu')) {
         setBasicInfo({ name: 'Andy Mthembu', department: 'Enterprise Architecture (EA)' });
      } else {
         setBasicInfo({ name: 'Municipal Employee', department: 'Unassigned Department' });
      }
      setIsFetchingInfo(false);
    }, 1200);
  };

  // 2. Camera Controls for Biometric Face Scan
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      alert("Camera access is required for biometric verification.");
    }
  };

  const captureFaceScan = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // 3. Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popiaConsent) return alert("You must consent to POPIA data processing.");
    if (!capturedImage) return alert("A biometric face scan is required.");
    if (saId.length !== 13) return alert("Please enter a valid 13-digit SA ID Number.");

    setIsSubmitting(true);

    try {
      // In production, this payload is sent to your POST /api/register route
      const payload = {
        email,
        sa_id: saId,
        biometric_hash: capturedImage, // In production, send to an AWS/Azure Face API
        department: basicInfo?.department,
        name: basicInfo?.name
      };
      
      console.log("Secure Payload Prepared:", payload);
      
      // Simulate network request
      setTimeout(() => {
        setIsSubmitting(false);
        setRegistrationSuccess(true);
      }, 2000);

    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white border-green-200 shadow-xl rounded-2xl animate-in zoom-in duration-500">
          <ShieldCheck className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Identity Locked & Submitted</h2>
          <p className="text-sm text-gray-600 mb-6">
            Your biometric profile and SA ID have been securely encrypted and submitted to Enterprise Architecture. Your account is currently in a <strong>Pending Clearance</strong> state.
          </p>
          <Button onClick={() => window.location.href = '/login'} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold">
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* LEFT COLUMN: The Context & Information */}
        <div className="flex flex-col justify-center space-y-6 lg:pr-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-blue-900 tracking-tight">SEAM Security Gate</h1>
            </div>
            <p className="text-gray-600 font-medium">
              Enterprise capability procurement requires high-assurance identity verification. Please complete the biometric onboarding process to establish your digital municipal identity.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-4 border border-blue-100 bg-blue-50/50 flex items-start">
              <Lock className="h-5 w-5 text-blue-600 mr-3 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">POPIA Compliance Notice</h4>
                <p className="text-xs text-blue-800/80 mt-1">
                  Your South African ID number and biometric data are heavily encrypted in transit and at rest. This data is used strictly for internal municipal audit tracking and non-repudiation of IT expenditure.
                </p>
              </div>
            </Card>
            
            <Card className="p-4 border border-gray-200 bg-white flex items-start">
              <Building2 className="h-5 w-5 text-gray-400 mr-3 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">Zero-Touch Provisioning</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Entering your municipal email will securely ping the corporate directory to associate your profile with the correct cost center and department.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: The Registration Form */}
        <Card className="p-6 md:p-8 bg-white border border-gray-200 shadow-2xl rounded-2xl relative overflow-hidden">
          {/* Top Decorative bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-sky-400"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            {/* STEP 1: EMAIL & ACTIVE DIRECTORY PING */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest">1. Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900 outline-none"
                  placeholder="name.surname@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailLookup}
                  required
                />
              </div>
              {isFetchingInfo && <p className="text-xs text-blue-500 font-bold animate-pulse">Ping directory for profile...</p>}
            </div>

            {/* AUTO-POPULATED DATA READOUT */}
            {basicInfo && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div>
                  <p className="text-xs font-black text-green-800 uppercase">Directory Match Found</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{basicInfo.name}</p>
                  <p className="text-xs text-gray-600 font-medium flex items-center mt-0.5">
                    <Building2 className="h-3 w-3 mr-1" /> {basicInfo.department}
                  </p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            )}

            {/* STEP 2: SA ID NUMBER */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest">2. National Identity</label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  maxLength={13}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900 outline-none tracking-widest"
                  placeholder="13-Digit SA ID Number"
                  value={saId}
                  onChange={(e) => setSaId(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                  required
                />
              </div>
            </div>

            {/* STEP 3: BIOMETRIC SCAN */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest">3. Biometric Verification</label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center min-h-[240px]">
                {!isCameraActive && !capturedImage ? (
                  <div className="text-center p-6">
                    <Camera className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600 mb-4">A live facial scan is required to bind this identity.</p>
                    <Button type="button" onClick={startCamera} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                      Initialize Camera
                    </Button>
                  </div>
                ) : isCameraActive ? (
                  <div className="w-full relative rounded-lg overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto object-cover transform scale-x-[-1]" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <Button type="button" onClick={captureFaceScan} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg">
                        <div className="h-8 w-8 border-2 border-white rounded-full"></div>
                      </Button>
                    </div>
                  </div>
                ) : capturedImage ? (
                  <div className="w-full relative rounded-lg overflow-hidden">
                    <img src={capturedImage} alt="Captured biometric" className="w-full h-auto object-cover transform scale-x-[-1]" />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow">
                      Scan Captured
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <Button type="button" onClick={retakePhoto} size="sm" variant="secondary" className="font-bold text-xs shadow-md">
                        Retake Scan
                      </Button>
                    </div>
                  </div>
                ) : null}
                
                {/* Hidden canvas for capturing the video frame */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            {/* STEP 4: CONSENT & SUBMIT */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <div className="flex items-center h-5">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    checked={popiaConsent}
                    onChange={(e) => setPopiaConsent(e.target.checked)}
                  />
                </div>
                <div className="text-xs text-gray-500 font-medium leading-relaxed group-hover:text-gray-700 transition-colors">
                  I explicitly consent to the collection and processing of my SA ID and biometric data in accordance with the Protection of Personal Information Act (POPIA) for the sole purpose of secure enterprise authentication.
                </div>
              </label>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !popiaConsent || !capturedImage || saId.length !== 13}
              className="w-full bg-blue-900 hover:bg-black text-white font-black h-12 text-sm shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Encrypting & Transmitting Payload...' : 'Submit Enterprise Identity'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};