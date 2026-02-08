import React from 'react';

interface AdPlaceholderProps {
    className?: string;
    slotName?: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ className, slotName = "Ad Space" }) => {
    return (
        <div className={`w-full bg-muted/30 border border-border border-dashed rounded-lg flex items-center justify-center p-4 min-h-[100px] ${className}`}>
            <div className="text-center">
                <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">Advertisement</span>
                <div className="w-full h-full min-h-[60px] bg-card/50 rounded flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">{slotName}</span>
                </div>
                {/* 
                TODO: Replace this entire div with your Google AdSense code.
                Example:
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                     data-ad-slot="XXXXXXXXXX"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script>
                     (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            */}
            </div>
        </div>
    );
};

export default AdPlaceholder;
