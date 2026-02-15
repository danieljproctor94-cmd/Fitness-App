import { useState, useMemo, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Trash2, Maximize2, AlertCircle } from "lucide-react";
import { useData } from "@/features/data/DataContext";
import { format, parseISO, isAfter } from "date-fns";
import { uploadProgressPhoto } from "@/lib/storage-utils";
import { toast } from "sonner";
export function ProgressGallery() {
    const { measurements, addMeasurement, updateMeasurement, deleteMeasurement, userProfile } = useData();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadDate, setUploadDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [viewPhoto, setViewPhoto] = useState<string | null>(null);

    const photos = useMemo(() => {
        return measurements
            .filter(m => m.photo_url)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [measurements]);

    const showPrompt = useMemo(() => {
        if (photos.length === 0) return true;
        const lastPhotoDate = parseISO(photos[0].date);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        return isAfter(twoMonthsAgo, lastPhotoDate);
    }, [photos]);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !userProfile?.id) return;
        setIsUploading(true);
        try {
            const { url, error } = await uploadProgressPhoto(selectedFile, userProfile.id);
            if (error || !url) throw error || new Error("Upload failed");
            const existing = measurements.find(m => m.date === uploadDate);
            if (existing) {
                if (updateMeasurement) {
                   await updateMeasurement(existing.id, { photo_url: url });
                } else {
                    toast.error("Update feature pending.");
                }
            } else {
                await addMeasurement({ date: uploadDate, weight: 0, photo_url: url });
            }
            setIsUploadOpen(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            toast.success("Photo added!");
        } catch (err) {
            console.error(err);
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Progress Photos</CardTitle>
                        <CardDescription>Visual timeline of your journey.</CardDescription>
                    </div>
                    <Button onClick={() => setIsUploadOpen(true)} size="sm" className="gap-2"><Upload className="h-4 w-4" /> Add Photo</Button>
                </CardHeader>
                <CardContent>
                    {showPrompt && (
                        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-blue-500">Update your progress!</h4>
                                <p className="text-sm text-muted-foreground">It's been over 2 months since your last photo.</p>
                            </div>
                        </div>
                    )}
                    {photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {photos.map((item) => (
                                <div key={item.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-muted border">
                                    <img src={item.photo_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                        <p className="text-xs font-medium text-white">{format(parseISO(item.date), "MMM d, yyyy")}</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => setViewPhoto(item.photo_url || null)}><Maximize2 className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => deleteMeasurement(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <Button onClick={() => setIsUploadOpen(true)} variant="outline">Upload First Photo</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Upload Progress Photo</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label>Date</Label><Input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Photo</Label><Input type="file" accept="image/*" onChange={handleFileSelect} /></div>
                        {previewUrl && <div className="relative aspect-square w-32 rounded-lg overflow-hidden border mx-auto"><img src={previewUrl} className="w-full h-full object-cover" /></div>}
                    </div>
                    <DialogFooter><Button onClick={handleUpload} disabled={isUploading || !selectedFile}>{isUploading ? "Uploading..." : "Save Photo"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewPhoto} onOpenChange={(open) => !open && setViewPhoto(null)}>
                 <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-0">
                    {viewPhoto && <div className="relative w-full h-full flex items-center justify-center"><img src={viewPhoto} className="max-h-[85vh] w-auto object-contain" /></div>}
                 </DialogContent>
            </Dialog>
        </div>
    );
}
