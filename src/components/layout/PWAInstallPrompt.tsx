import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone === true;
        if (isStandalone) return;

        // Check if dismissed recently (don't show again for 7 days)
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
        }

        // Detect iOS
        const ua = navigator.userAgent;
        const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isiOS);

        if (isiOS) {
            // On iOS, show guide after 3 seconds
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }

        // Android / Desktop: listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShowPrompt(true), 2000);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        } else if (isIOS) {
            setShowIOSGuide(true);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSGuide(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <>
            {/* Install Banner */}
            <div className="fixed bottom-20 left-3 right-3 z-[100] md:hidden animate-slide-up">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-2xl shadow-indigo-500/30 p-4 flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                        <Download size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm">Cài đặt ứng dụng</div>
                        <div className="text-indigo-200 text-[11px] mt-0.5">Thêm vào màn hình chính để truy cập nhanh hơn</div>
                    </div>
                    <button 
                        onClick={handleInstall}
                        className="bg-white text-indigo-600 font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors shrink-0"
                    >
                        {isIOS ? 'Hướng dẫn' : 'Cài đặt'}
                    </button>
                    <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* iOS Guide Modal */}
            {showIOSGuide && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm md:hidden" onClick={handleDismiss}>
                    <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-800">Cài đặt trên iPhone</h3>
                            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Nhấn nút Chia sẻ</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Biểu tượng <span className="inline-block w-5 h-5 border border-slate-300 rounded text-center leading-5 text-[10px]">⬆</span> ở thanh dưới Safari</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Cuộn xuống, chọn "Thêm vào MH chính"</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Add to Home Screen</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Nhấn "Thêm"</div>
                                    <div className="text-xs text-slate-500 mt-0.5">App sẽ xuất hiện trên màn hình chính như app bình thường</div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleDismiss} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                            Đã hiểu
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>
        </>
    );
};
