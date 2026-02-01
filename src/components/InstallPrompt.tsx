import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Laptop, Phone, Share, Menu as MenuIcon, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InstallPrompt({ open, onOpenChange }: InstallPromptProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Install App</DialogTitle>
                    <DialogDescription>
                        Add this app to your home screen for the best experience.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="ios" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ios">iOS (iPhone/iPad)</TabsTrigger>
                        <TabsTrigger value="android">Android</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ios" className="space-y-4 pt-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-muted p-2 rounded-lg">
                                <Share className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Step 1</h4>
                                <p className="text-sm text-muted-foreground">Tap the <span className="font-bold">Share</span> button in the bottom navigation bar of Safari.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-muted p-2 rounded-lg">
                                <PlusSquare className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Step 2</h4>
                                <p className="text-sm text-muted-foreground">Scroll down and tap <span className="font-bold">Add to Home Screen</span>.</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="android" className="space-y-4 pt-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-muted p-2 rounded-lg">
                                <MenuIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Step 1</h4>
                                <p className="text-sm text-muted-foreground">Tap the <span className="font-bold">Menu</span> icon (3 dots) in the top right corner of Chrome.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-muted p-2 rounded-lg">
                                <Phone className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Step 2</h4>
                                <p className="text-sm text-muted-foreground">Tap <span className="font-bold">Install App</span> or <span className="font-bold">Add to Home Screen</span>.</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="mt-4 bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                    <Laptop className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                        On Desktop? Click the install icon in your address bar (Chrome/Edge).
                    </p>
                </div>

                <div className="flex justify-end mt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
