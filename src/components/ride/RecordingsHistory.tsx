import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Video, 
  Play, 
  Download, 
  Share2, 
  Trash2, 
  HardDrive,
  Clock,
  User,
  Calendar,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useVideoRecordings, VideoRecording } from "@/hooks/useVideoRecordings";

export function RecordingsHistory() {
  const { 
    recordings, 
    isLoading, 
    getRecordingWithBlob,
    deleteRecording,
    downloadRecording,
    shareRecording,
    getTotalStorageUsed,
    formatBytes 
  } = useVideoRecordings();

  const [playingVideo, setPlayingVideo] = useState<{ url: string; recording: VideoRecording } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async (recording: VideoRecording) => {
    setIsLoadingVideo(true);
    const fullRecording = await getRecordingWithBlob(recording.id);
    setIsLoadingVideo(false);

    if (fullRecording?.blob) {
      const url = URL.createObjectURL(fullRecording.blob);
      setPlayingVideo({ url, recording });
    } else {
      toast.error("Não foi possível carregar o vídeo");
    }
  };

  const handleCloseVideo = () => {
    if (playingVideo) {
      URL.revokeObjectURL(playingVideo.url);
      setPlayingVideo(null);
    }
  };

  const handleDownload = async (id: string) => {
    const success = await downloadRecording(id);
    if (success) {
      toast.success("Download iniciado");
    } else {
      toast.error("Erro ao fazer download");
    }
  };

  const handleShare = async (id: string) => {
    const success = await shareRecording(id);
    if (success) {
      toast.success("Compartilhado com sucesso");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteRecording(id);
    if (success) {
      toast.success("Gravação excluída");
    } else {
      toast.error("Erro ao excluir gravação");
    }
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Gravações</h3>
              <Badge variant="secondary">{recordings.length}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              <span>{formatBytes(getTotalStorageUsed())}</span>
            </div>
          </div>
        </div>

        {/* Recordings List */}
        {recordings.length === 0 ? (
          <div className="p-8 text-center">
            <Video className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma gravação encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">
              As gravações feitas durante as corridas aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y divide-border">
              {recordings.map((recording) => (
                <div 
                  key={recording.id} 
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail placeholder */}
                    <button
                      onClick={() => handlePlay(recording)}
                      disabled={isLoadingVideo}
                      className="relative w-16 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0 hover:bg-muted/80 transition-colors"
                    >
                      <Play className="w-5 h-5 text-primary" />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                        {formatDuration(recording.duration)}
                      </div>
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">
                          {recording.passengerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(recording.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatBytes(recording.size)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handlePlay(recording)}
                        disabled={isLoadingVideo}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleShare(recording.id)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDownload(recording.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(recording.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Video Player Dialog */}
      <Dialog open={!!playingVideo} onOpenChange={() => handleCloseVideo()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {playingVideo?.recording.passengerName}
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="px-4 pb-4">
            <div className="rounded-lg overflow-hidden bg-black aspect-video">
              {playingVideo && (
                <video
                  src={playingVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>
            
            {playingVideo && (
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(playingVideo.recording.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(playingVideo.recording.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(playingVideo.recording.id)}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Compartilhar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(playingVideo.recording.id)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir gravação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo será permanentemente excluído do seu dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
