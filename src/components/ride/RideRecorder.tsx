import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Circle, 
  Square, 
  Camera,
  Minimize2,
  Maximize2,
  X,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { useVideoRecordings } from "@/hooks/useVideoRecordings";
import { RecordingsHistory } from "./RecordingsHistory";

interface RideRecorderProps {
  rideId: string;
  passengerName: string;
}

export function RideRecorder({ rideId, passengerName }: RideRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const { saveRecording, recordings } = useVideoRecordings();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start camera preview
  const startPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute preview to avoid feedback
      }
      
      setIsPreviewing(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  // Stop camera preview
  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsPreviewing(false);
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      toast.error("Inicie a câmera primeiro");
      return;
    }

    chunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      
      try {
        await saveRecording(blob, rideId, passengerName, duration);
        toast.success("Gravação salva!", {
          description: "Disponível na lista de gravações"
        });
      } catch (error) {
        toast.error("Erro ao salvar gravação");
      }
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // Collect data every second
    
    setIsRecording(true);
    setRecordingTime(0);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    toast.success("Gravação iniciada");
  }, [rideId, passengerName, saveRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopPreview]);

  // Show history view
  if (showHistory) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(false)}
          >
            ← Voltar
          </Button>
        </div>
        <RecordingsHistory />
      </div>
    );
  }

  // Minimized view (floating)
  if (isMinimized && isPreviewing) {
    return (
      <div className="fixed bottom-24 right-4 z-50 animate-fade-in">
        <Card className="overflow-hidden shadow-xl border-2 border-primary/30">
          <div className="relative w-32 h-24">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-1 left-1 flex items-center gap-1">
                <Circle className="w-2 h-2 fill-destructive text-destructive animate-pulse" />
                <span className="text-[10px] font-mono text-white drop-shadow-lg">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
            
            {/* Controls */}
            <div className="absolute bottom-1 right-1 flex gap-1">
              <Button
                size="icon"
                variant="secondary"
                className="w-6 h-6"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Gravar Corrida</h3>
          {recordings.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recordings.length}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setShowHistory(true)}
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
          {isPreviewing && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Camera Preview */}
      {isPreviewing ? (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Circle className="w-3 h-3 fill-destructive text-destructive animate-pulse" />
              <Badge variant="destructive" className="font-mono">
                {formatTime(recordingTime)}
              </Badge>
            </div>
          )}
          
          {/* Close preview button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 h-8 w-8 opacity-80"
            onClick={() => {
              if (isRecording) {
                stopRecording();
              }
              stopPreview();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-muted aspect-video flex flex-col items-center justify-center gap-3">
          <Camera className="w-12 h-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Grave sua corrida para segurança.<br />
            O vídeo será salvo no seu dispositivo.
          </p>
        </div>
      )}

      {/* Permission denied message */}
      {hasPermission === false && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            Acesso à câmera negado. Verifique as permissões do navegador.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isPreviewing ? (
          <Button
            onClick={startPreview}
            className="flex-1 gap-2"
            variant="outline"
          >
            <Camera className="w-4 h-4" />
            Abrir Câmera
          </Button>
        ) : !isRecording ? (
          <>
            <Button
              onClick={startRecording}
              className="flex-1 gap-2 bg-destructive hover:bg-destructive/90"
            >
              <Circle className="w-4 h-4 fill-current" />
              Iniciar Gravação
            </Button>
          </>
        ) : (
          <Button
            onClick={stopRecording}
            className="flex-1 gap-2"
            variant="destructive"
          >
            <Square className="w-4 h-4 fill-current" />
            Parar e Salvar
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        📱 Vídeos salvos no app • Toque em <FolderOpen className="w-3 h-3 inline" /> para ver gravações
      </p>
    </Card>
  );
}
